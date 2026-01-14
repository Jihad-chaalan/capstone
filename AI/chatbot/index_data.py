"""
Indexing script: Load data from MySQL database into ChromaDB.
Run this whenever you want to refresh the RAG embeddings.

Usage:
    python index_data.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db_loader import DatabaseLoader
from rag_system import RAGSystem

def main():
    print("\n" + "="*70)
    print(" STARTING DATA INDEXING INTO CHROMADB")
    print("="*70)
    
    try:
        # Initialize
        print("\n Initializing database connection...")
        db = DatabaseLoader()
        print(" Database connected")
        
        print("\n  Initializing ChromaDB...")
        rag = RAGSystem(persist_directory=os.path.join(os.path.dirname(__file__), "chroma_db"))
        print(" ChromaDB initialized")
        
        # Clear old data (optional - comment out to keep old data)
        print("\n Clearing old ChromaDB data...")
        rag.clear_all_data()
        rag.reinitialize()
        print(" Old data cleared")
        
        # ========== INDEX POSTS ==========
        print("\n" + "-"*70)
        print(" INDEXING POSTS (for seeker search)")
        print("-"*70)
        
        print(" Loading posts from database...")
        posts = db.get_all_posts()
        print(f"   Found {len(posts)} posts")
        
        if posts:
            print(" Indexing posts into ChromaDB...")
            indexed_count = rag.index_posts(posts)
            print(f" Indexed {indexed_count} posts")
        else:
            print("  No posts found in database")
        
        # ========== INDEX SEEKERS ==========
        print("\n" + "-"*70)
        print(" INDEXING SEEKERS (for company search)")
        print("-"*70)
        
        print(" Loading seekers from database...")
        try:
            with db.connection.cursor() as cursor:
                seekers_query = """
                    SELECT 
                        s.id,
                        u.name as seeker_name,
                        u.email,
                        s.description,
                        s.skills,
                        GROUP_CONCAT(sk.name SEPARATOR ', ') as skill_names
                    FROM seekers s
                    JOIN users u ON s.user_id = u.id
                    LEFT JOIN seeker_skill ss ON s.id = ss.seeker_id
                    LEFT JOIN skills sk ON ss.skill_id = sk.id
                    GROUP BY s.id, u.name, u.email, s.description, s.skills
                """
                cursor.execute(seekers_query)
                seekers = cursor.fetchall()
            
            print(f"   Found {len(seekers)} seekers")
            
            if seekers:
                # Merge skill sources
                for seeker in seekers:
                    pivot_skills = seeker.get("skill_names") or ""
                    free_text_skills = seeker.get("skills") or ""
                    all_skills = f"{pivot_skills}, {free_text_skills}".strip(", ")
                    seeker["skills"] = all_skills or "No skills listed"
                
                print(" Indexing seekers into ChromaDB...")
                indexed_count = rag.index_seekers(seekers)
                print(f" Indexed {indexed_count} seekers")
            else:
                print("  No seekers found in database")
        
        except Exception as e:
            print(f" Error indexing seekers: {e}")
        
        # ========== SUMMARY ==========
        print("\n" + "="*70)
        stats = rag.get_statistics()
        print(" INDEXING COMPLETE")
        print("="*70)
        print(f" Total posts indexed:   {stats['posts']}")
        print(f" Total seekers indexed: {stats['seekers']}")
        print(f"\n ChromaDB location: {os.path.join(os.path.dirname(__file__), 'chroma_db')}")
        print("="*70 + "\n")
        
        # Cleanup
        db.close()
        
    except Exception as e:
        print(f"\n ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
