import os
import pymysql
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load .env from project root (one level up from this folder)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

class DatabaseLoader:
    """DB helper focused on chatbot needs (counts, stats, and lookups)."""

    def __init__(self):
        self.connection = pymysql.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USERNAME", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_DATABASE", "capstone"),
            cursorclass=pymysql.cursors.DictCursor,
        )

    # -------------------- Generic helpers --------------------
    def _fetchall(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        with self.connection.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchall()

    def _fetchone(self, query: str, params: Optional[tuple] = None) -> Optional[Dict]:
        with self.connection.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchone()

    # -------------------- Content for RAG indexing --------------------
    def get_all_posts(self) -> List[Dict]:
        """Fetch all posts with company info for indexing."""
        query = """
            SELECT 
                p.id,
                p.position,
                p.technology,
                p.description,
                u.name AS company_name,
                c.address AS company_location,
                c.description AS company_description
            FROM posts p
            JOIN companies c ON p.company_id = c.id
            JOIN users u ON c.user_id = u.id
        """
        return self._fetchall(query)

    # -------------------- Technology demand --------------------
    def get_top_technologies(self, limit: int = 10) -> List[Dict]:
        """Most required technologies ranked by post count."""
        query = """
            SELECT 
                technology,
                COUNT(*) AS post_count,
                COUNT(DISTINCT company_id) AS company_count
            FROM posts
            WHERE technology IS NOT NULL AND technology != ''
            GROUP BY technology
            ORDER BY post_count DESC
            LIMIT %s
        """
        return self._fetchall(query, (limit,))

    def get_company_count_by_technology(self, technology: str) -> int:
        """Number of distinct companies posting for a technology."""
        row = self._fetchone(
            """
            SELECT COUNT(DISTINCT company_id) AS companies
            FROM posts
            WHERE technology LIKE %s
            """,
            (f"%{technology}%",),
        )
        return int(row["companies"] if row else 0)

    def get_posts_by_technology(self, technology: str, limit: int = 20) -> List[Dict]:
        """Posts for a given technology with company context."""
        query = """
            SELECT 
                p.id AS post_id,
                p.position,
                p.technology,
                p.description,
                u.name AS company_name,
                u.email AS company_email,
                c.address,
                c.website_link,
                c.verification_status,
                p.created_at
            FROM posts p
            JOIN companies c ON p.company_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE p.technology LIKE %s
            ORDER BY p.created_at DESC
            LIMIT %s
        """
        return self._fetchall(query, (f"%{technology}%", limit))

    # -------------------- Seeker supply --------------------
    def get_seekers_by_skill(self, skill_name: str, limit: int = 25) -> List[Dict]:
        """Seekers whose skills include the given term (pivot + free-text)."""
        # Pivot table match
        pivot_query = """
            SELECT DISTINCT 
                s.id,
                u.name AS seeker_name,
                u.email,
                s.description,
                GROUP_CONCAT(DISTINCT sk.name SEPARATOR ', ') AS skills
            FROM seekers s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN seeker_skill ss ON s.id = ss.seeker_id
            LEFT JOIN skills sk ON ss.skill_id = sk.id
            WHERE sk.name LIKE %s
            GROUP BY s.id, u.name, u.email, s.description
            LIMIT %s
        """
        pivot_rows = self._fetchall(pivot_query, (f"%{skill_name}%", limit))

        # Free-text field match
        text_query = """
            SELECT DISTINCT 
                s.id,
                u.name AS seeker_name,
                u.email,
                s.description,
                s.skills AS skills
            FROM seekers s
            JOIN users u ON s.user_id = u.id
            WHERE s.skills LIKE %s
            LIMIT %s
        """
        text_rows = self._fetchall(text_query, (f"%{skill_name}%", limit))

        # Merge unique seekers by id
        seen = set()
        merged = []
        for row in pivot_rows + text_rows:
            if row["id"] in seen:
                continue
            seen.add(row["id"])
            merged.append(row)
        return merged[:limit]

    def count_available_seekers_with_skill(self, skill_name: str) -> int:
        """Count seekers with a skill who are not in accepted applications."""
        query = """
            SELECT COUNT(DISTINCT s.id) AS available
            FROM seekers s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN seeker_skill ss ON s.id = ss.seeker_id
            LEFT JOIN skills sk ON ss.skill_id = sk.id
            LEFT JOIN applications a 
              ON a.internship_seeker_id = s.id AND a.status = 'accepted'
            WHERE (sk.name LIKE %s OR s.skills LIKE %s)
              AND a.id IS NULL
        """
        row = self._fetchone(query, (f"%{skill_name}%", f"%{skill_name}%"))
        return int(row["available"] if row else 0)

    def get_skill_distribution(self, limit: int = 15) -> List[Dict]:
        """Top skills by seeker count (active skills only)."""
        query = """
            SELECT 
                sk.name AS skill,
                COUNT(DISTINCT ss.seeker_id) AS seeker_count
            FROM skills sk
            LEFT JOIN seeker_skill ss ON sk.id = ss.skill_id
            WHERE sk.is_active = 1
            GROUP BY sk.id, sk.name
            ORDER BY seeker_count DESC
            LIMIT %s
        """
        return self._fetchall(query, (limit,))

    # -------------------- Demand vs supply for universities --------------------
    def get_demand_supply_gap(self, limit: int = 15) -> List[Dict]:
        """Compare company demand (posts) vs seeker supply (skills)."""
        demand_query = """
            SELECT technology AS name, COUNT(*) AS demand
            FROM posts
            WHERE technology IS NOT NULL AND technology != ''
            GROUP BY technology
        """
        supply_query = """
            SELECT sk.name AS name, COUNT(DISTINCT ss.seeker_id) AS supply
            FROM skills sk
            LEFT JOIN seeker_skill ss ON sk.id = ss.skill_id
            WHERE sk.is_active = 1
            GROUP BY sk.id, sk.name
        """
        demand_rows = {row["name"].lower(): row["demand"] for row in self._fetchall(demand_query)}
        supply_rows = {row["name"].lower(): row["supply"] for row in self._fetchall(supply_query)}

        combined_keys = set(demand_rows.keys()) | set(supply_rows.keys())
        combined = []
        for key in combined_keys:
            combined.append(
                {
                    "technology": key,
                    "demand": demand_rows.get(key, 0),
                    "supply": supply_rows.get(key, 0),
                    "gap": demand_rows.get(key, 0) - supply_rows.get(key, 0),
                }
            )
        combined.sort(key=lambda x: x["gap"], reverse=True)
        return combined[:limit]

    # -------------------- Partnership candidates for universities --------------------
    def get_partnership_candidates(self, limit: int = 20) -> List[Dict]:
        """Verified companies with active posts and their tech/position coverage."""
        query = """
            SELECT 
                u.name AS company_name,
                u.email AS company_email,
                c.address,
                c.website_link,
                c.verification_status,
                COUNT(p.id) AS active_posts,
                GROUP_CONCAT(DISTINCT p.technology SEPARATOR ', ') AS technologies,
                GROUP_CONCAT(DISTINCT p.position SEPARATOR ', ') AS positions
            FROM companies c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN posts p ON c.id = p.company_id
            WHERE c.verification_status = 'verified'
            GROUP BY c.id, u.name, u.email, c.address, c.website_link, c.verification_status
            HAVING active_posts > 0
            ORDER BY active_posts DESC
            LIMIT %s
        """
        return self._fetchall(query, (limit,))

    # -------------------- Technology statistics helpers --------------------
    def get_technology_usage_counts(self) -> List[Dict]:
        """Counts of posts per technology with company coverage."""
        query = """
            SELECT technology, COUNT(*) AS post_count, COUNT(DISTINCT company_id) AS company_count
            FROM posts
            WHERE technology IS NOT NULL AND technology != ''
            GROUP BY technology
            ORDER BY post_count DESC
        """
        return self._fetchall(query)

    def get_statistics_snapshot(self) -> Dict:
        """High-level snapshot for health endpoints."""
        posts_count = self._fetchone("SELECT COUNT(*) AS n FROM posts")
        seekers_count = self._fetchone("SELECT COUNT(*) AS n FROM seekers")
        companies_count = self._fetchone("SELECT COUNT(*) AS n FROM companies")
        skills_count = self._fetchone("SELECT COUNT(*) AS n FROM skills")
        return {
            "posts": int(posts_count["n"]) if posts_count else 0,
            "seekers": int(seekers_count["n"]) if seekers_count else 0,
            "companies": int(companies_count["n"]) if companies_count else 0,
            "skills": int(skills_count["n"]) if skills_count else 0,
        }

    def close(self):
        self.connection.close()

__all__ = ["DatabaseLoader"]
