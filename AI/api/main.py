"""
FastAPI server for chatbot.

Receives requests from Laravel backend and returns chat responses.
Uses: db_loader, rag_system, role_based_agent

Port: 8001
Endpoints:
  - POST /chat
  - GET /health
  - GET /statistics/technologies
"""

import sys
import os
from typing import List, Optional

# Add parent directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import our modules
from chatbot.db_loader import DatabaseLoader
from chatbot.rag_system import RAGSystem
from chatbot.role_based_agent import RoleBasedAgent

# ==================== FASTAPI APP ====================
app = FastAPI(
    title="Internship Chatbot API",
    version="1.0.0",
    description="Chat API for internship platform"
)

# Enable CORS for Laravel backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:8000", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== GLOBAL INSTANCES ====================
try:
    db = DatabaseLoader()
    rag = RAGSystem(persist_directory=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 
        "..", 
        "chatbot", 
        "chroma_db"
    ))
    agent = RoleBasedAgent()
    print(" All modules initialized successfully")
except Exception as e:
    print(f" Error initializing modules: {e}")
    db = None
    rag = None
    agent = None

# ==================== REQUEST/RESPONSE MODELS ====================
class ChatRequest(BaseModel):
    """Chat request from frontend/Laravel."""
    message: str
    user_role: str  # seeker, company, university
    user_id: Optional[int] = None
    conversation_history: Optional[List[dict]] = []

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What technologies are trending?",
                "user_role": "seeker",
                "user_id": 123,
                "conversation_history": []
            }
        }


class ChatResponse(BaseModel):
    """Chat response to frontend/Laravel."""
    response: str
    intent: str
    user_id: Optional[int] = None
    timestamp: Optional[str] = None


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check and info."""
    return {
        "status": "ok",
        "service": "Internship Chatbot API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health status."""
    try:
        posts_count = rag.get_posts_count() if rag else 0
        seekers_count = rag.get_seekers_count() if rag else 0
        
        return {
            "status": "healthy",
            "database": "connected" if db else "disconnected",
            "rag": "ready" if rag else "not_ready",
            "agent": "ready" if agent else "not_ready",
            "posts_indexed": posts_count,
            "seekers_indexed": seekers_count,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    
    Receives:
      - message: User query
      - user_role: seeker/company/university
      - user_id: Optional user ID for logging
      - conversation_history: Optional previous messages
    
    Returns:
      - response: Natural language response
      - intent: Classified intent (top_technologies, company_hiring, etc.)
    """
    try:
        # Validate inputs
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if request.user_role not in ["seeker", "company", "university"]:
            raise HTTPException(status_code=400, detail="Invalid user_role. Must be: seeker, company, or university")
        
        if not agent or not db or not rag:
            raise HTTPException(status_code=503, detail="Chatbot service not initialized")
        
        # Get response from agent
        result = agent.get_response(
            query=request.message.strip(),
            role=request.user_role,
            db=db,
            rag=rag,
            history=request.conversation_history or []
        )
        
        # Format response
        from datetime import datetime
        response = ChatResponse(
            response=result.get("response", ""),
            intent=result.get("intent", "general"),
            user_id=request.user_id,
            timestamp=datetime.now().isoformat()
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f" Error in /chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/statistics/technologies")
async def get_technology_stats():
    """Get top technologies by demand."""
    try:
        if not db:
            raise HTTPException(status_code=503, detail="Database not available")
        
        stats = db.get_top_technologies(limit=10)
        return {
            "technologies": stats,
            "total": len(stats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/statistics/skills")
async def get_skill_stats():
    """Get top skills by seeker count."""
    try:
        if not db:
            raise HTTPException(status_code=503, detail="Database not available")
        
        stats = db.get_skill_distribution(limit=15)
        return {
            "skills": stats,
            "total": len(stats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rag/stats")
async def rag_stats():
    """RAG system statistics."""
    try:
        if not rag:
            raise HTTPException(status_code=503, detail="RAG system not available")
        
        stats = rag.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STARTUP/SHUTDOWN ====================
@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    try:
        if db:
            db.close()
            print(" Database connection closed")
    except Exception as e:
        print(f"  Error during shutdown: {e}")


# ==================== RUN ====================
if __name__ == "__main__":
    print("\n" + "="*70)
    print(" Starting Internship Chatbot API")
    print("="*70)
    print(" Server: http://localhost:8001")
    print(" Docs: http://localhost:8001/docs")
    print("="*70 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
