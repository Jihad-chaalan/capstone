import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
import json
import os

class RAGSystem:
    """Semantic search using ChromaDB + embeddings for posts and seekers."""

    def __init__(self, persist_directory: Optional[str] = None):
        """Initialize ChromaDB client and embedding model.
        
        Args:
            persist_directory: Where to store ChromaDB files. 
                              Defaults to ./chroma_db in current directory.
        """
        if persist_directory is None:
            persist_directory = os.path.join(os.path.dirname(__file__), "chroma_db")

        # Initialize ChromaDB with persistence
        self.client = chromadb.Client(
            Settings(
                persist_directory=persist_directory,
                anonymized_telemetry=False,
            )
        )

        # Initialize embedding model (384-dim, lightweight)
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

        # Create or get collections
        self.posts_collection = self._get_or_create_collection(
            "internship_posts",
            "Internship posts indexed for seeker search",
        )
        self.seekers_collection = self._get_or_create_collection(
            "seekers_profiles", "Seeker profiles indexed for company search"
        )

    def _get_or_create_collection(self, name: str, description: str):
        """Get existing collection or create new one."""
        try:
            return self.client.get_collection(name)
        except Exception:
            return self.client.create_collection(
                name=name, metadata={"description": description}
            )

    # ================== POSTS INDEXING (for seekers) ==================
    def index_posts(self, posts: List[Dict]) -> int:
        """Index all posts for seeker discovery.
        
        Args:
            posts: List of post dicts with id, position, technology, 
                   company_name, company_location, description, etc.
        
        Returns:
            Number of posts indexed.
        """
        if not posts:
            print("  No posts to index")
            return 0

        documents = []
        metadatas = []
        ids = []

        for post in posts:
            # Create rich text for embedding
            doc_text = f"""
Position: {post.get("position", "N/A")}
Technology: {post.get("technology", "N/A")}
Company: {post.get("company_name", "N/A")}
Location: {post.get("company_location", "N/A")}
Description: {post.get("description", "N/A")}
Company Info: {post.get("company_description", "N/A")}
            """.strip()

            documents.append(doc_text)
            metadatas.append(
                {
                    "post_id": str(post.get("id", "unknown")),
                    "position": post.get("position", "") or "",
                    "technology": post.get("technology", "") or "",
                    "company_name": post.get("company_name", "") or "",
                    "company_location": post.get("company_location", "") or "",
                }
            )
            ids.append(f"post_{post.get('id', 'unknown')}")

        # Add to ChromaDB
        try:
            self.posts_collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f" Indexed {len(documents)} posts")
            return len(documents)
        except Exception as e:
            print(f" Error indexing posts: {e}")
            return 0

    def query_posts(
        self,
        query_text: str,
        n_results: int = 5,
        technology_filter: Optional[str] = None,
    ) -> Dict:
        """Query posts by semantic similarity.
        
        Args:
            query_text: User question or search query.
            n_results: Max results to return.
            technology_filter: Optional tech to filter by.
        
        Returns:
            Dict with 'documents', 'metadatas', 'distances'.
        """
        where_clause = None
        if technology_filter:
            where_clause = {"technology": technology_filter}

        try:
            results = self.posts_collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where_clause,
            )
            return {
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
            }
        except Exception as e:
            print(f" Error querying posts: {e}")
            return {"documents": [], "metadatas": [], "distances": []}

    # ================== SEEKERS INDEXING (for companies) ==================
    def index_seekers(self, seekers: List[Dict]) -> int:
        """Index seeker profiles for company talent search.
        
        Args:
            seekers: List of seeker dicts with id, seeker_name, 
                     email, skills, description.
        
        Returns:
            Number of seekers indexed.
        """
        if not seekers:
            print("  No seekers to index")
            return 0

        documents = []
        metadatas = []
        ids = []

        for seeker in seekers:
            # Create rich text for embedding
            doc_text = f"""
Name: {seeker.get("seeker_name", "N/A")}
Skills: {seeker.get("skills", "N/A")}
Description: {seeker.get("description", "N/A")}
            """.strip()

            documents.append(doc_text)
            metadatas.append(
                {
                    "seeker_id": str(seeker.get("id", "unknown")),
                    "seeker_name": seeker.get("seeker_name", "") or "",
                    "skills": seeker.get("skills", "") or "",
                    "email": seeker.get("email", "") or "",
                }
            )
            ids.append(f"seeker_{seeker.get('id', 'unknown')}")

        # Add to ChromaDB
        try:
            self.seekers_collection.add(
                documents=documents, metadatas=metadatas, ids=ids
            )
            print(f" Indexed {len(documents)} seekers")
            return len(documents)
        except Exception as e:
            print(f" Error indexing seekers: {e}")
            return 0

    def query_seekers(self, query_text: str, n_results: int = 10) -> Dict:
        """Query seekers by semantic similarity (skills/description).
        
        Args:
            query_text: Search query (e.g., "React developers").
            n_results: Max results.
        
        Returns:
            Dict with 'documents', 'metadatas', 'distances'.
        """
        try:
            results = self.seekers_collection.query(
                query_texts=[query_text], n_results=n_results
            )
            return {
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
            }
        except Exception as e:
            print(f" Error querying seekers: {e}")
            return {"documents": [], "metadatas": [], "distances": []}

    # ================== UTILITY ==================
    def get_posts_count(self) -> int:
        """Total indexed posts."""
        try:
            return self.posts_collection.count()
        except Exception:
            return 0

    def get_seekers_count(self) -> int:
        """Total indexed seekers."""
        try:
            return self.seekers_collection.count()
        except Exception:
            return 0

    def get_statistics(self) -> Dict:
        """Returns counts and status."""
        return {
            "posts": self.get_posts_count(),
            "seekers": self.get_seekers_count(),
        }

    def clear_all_data(self):
        """Clear all indexed data from ChromaDB."""
        try:
            self.client.delete_collection("internship_posts")
            self.client.delete_collection("seekers_profiles")
            print(" All ChromaDB collections cleared")
        except Exception as e:
            print(f"  Error clearing data: {e}")

    def reinitialize(self):
        """Reinitialize collections (drops and recreates)."""
        self.clear_all_data()
        self.posts_collection = self._get_or_create_collection(
            "internship_posts", "Internship posts indexed for seeker search"
        )
        self.seekers_collection = self._get_or_create_collection(
            "seekers_profiles", "Seeker profiles indexed for company search"
        )
        print(" RAG system reinitialized")


__all__ = ["RAGSystem"]
