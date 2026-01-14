import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class RoleBasedAgent:
    """Unified intent-based agent with LLM formatting of verified data.
    
    Key principle: LLM only formats provided data. If no data, LLM says so explicitly.
    """

    def __init__(self):
        """Initialize LLM clients."""
        # Fast classifier for intent detection
        self.classifier_llm = ChatOpenAI(
            model="deepseek-chat",
            temperature=0.2,
            max_tokens=30,
            timeout=30,
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url=os.getenv("DEEPSEEK_API_BASE"),
        )

        # Response generator for natural formatting
        self.response_llm = ChatOpenAI(
            model="deepseek-chat",
            temperature=0.6,
            max_tokens=250,
            timeout=30,
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url=os.getenv("DEEPSEEK_API_BASE"),
        )

        self.all_intents = [
            "top_technologies",
            "technology_details",
            "company_hiring",
            "talent_search",
            "skill_availability",
            "skill_distribution",
            "demand_supply_gap",
            "partnership_intel",
            "learning_path",
            "general",
        ]

    # ================== INTENT CLASSIFICATION ==================
    def classify_intent(
        self, query: str, history: Optional[List[dict]] = None
    ) -> str:
        """Classify query into one of the unified intents.
        
        Args:
            query: User question
            history: Conversation history for context
            
        Returns:
            Intent name (str)
        """
        context = ""
        if history and len(history) > 0:
            recent = history[-2:]  # Last 2 messages
            context = "\nRecent conversation:\n"
            for msg in recent:
                context += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"

        system_prompt = f"""You are an intent classifier. Classify the query into ONE category:
{', '.join(self.all_intents)}

Intent definitions:
- top_technologies: User asks about trending, popular, or most-used technologies/skills (general list)
- technology_details: User asks specifically about ONE technology: "How many posts for React?", "How much company use React?"
- company_hiring: User asks about companies hiring for a specific tech/skill, job opportunities
- talent_search: User asks to find or see developers/seekers with specific skills
- skill_availability: User asks "how many" or "count" of developers/seekers with a skill
- skill_distribution: User asks what skills seekers have or skill distribution
- demand_supply_gap: User asks about industry needs vs available talent, skills gap
- partnership_intel: User asks about companies to partner with, partnership opportunities
- learning_path: User asks how to learn something, roadmap, curriculum
- general: Unclear or other questions

Rules:
- Output ONLY the intent name (no quotes, no explanation)
- Use conversation context for follow-ups
- Default to "general" if unsure{context}"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Query: {query}"),
        ]

        response = self.classifier_llm.invoke(messages)
        intent = response.content.strip().lower().replace('"', "").replace("'", "")

        # Validate intent
        if intent not in self.all_intents:
            intent = "general"

        return intent

    # ================== HANDLERS ==================
    def _format_with_llm(
        self, data_text: str, query: str, role: str, context_msg: str = ""
    ) -> str:
        """Format data with LLM - strict rule: ONLY use provided data.
        
        If data is empty or "NO DATA", LLM will explicitly say it has no information.
        
        Args:
            data_text: Structured data representation (or "NO DATA")
            query: Original user query
            role: seeker/company/university
            context_msg: Extra context for the LLM
            
        Returns:
            Natural language response from LLM using only provided data
        """
        system_prompt = f"""You are a helpful assistant answering {role} questions about internships and talent.

CRITICAL RULES:
1. ONLY use the data provided in the "Data provided:" section
2. If data says "NO DATA" or is empty, respond: "I don't have this information yet. Please try asking about something else."
3. DO NOT make up names, numbers, companies, or skills
4. DO NOT guess or infer beyond the provided data
5. Be concise (2-3 sentences max)
6. Be friendly and conversational
7. {context_msg}

Data provided:
{data_text}"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Question: {query}"),
        ]

        response = self.response_llm.invoke(messages)
        return response.content.strip()

    # ---- top_technologies ----
    def handle_top_technologies(self, query: str, role: str, db) -> str:
        """Most required/trending technologies ranked by demand WITH PERCENTAGES."""
        try:
            techs = db.get_top_technologies(limit=10)

            if not techs or len(techs) == 0:
                data_text = "NO DATA"
            else:
                # Calculate total posts for percentage
                total_posts = sum(t['post_count'] for t in techs)
                
                data_text = "Top technologies by demand:\n"
                for i, t in enumerate(techs[:5], 1):
                    percentage = (t['post_count'] / total_posts * 100) if total_posts > 0 else 0
                    data_text += f"{i}. {t['technology']}: {t['post_count']} job posts ({percentage:.1f}% of all jobs), {t['company_count']} companies\n"

            context = f"You are speaking to a {role}. "
            if role == "seeker":
                context += "Highlight trending skills with percentages they should learn."
            elif role == "company":
                context += "Highlight market competition with percentages."
            elif role == "university":
                context += "Highlight what industry needs with percentages."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error retrieving technologies: {str(e)}"

    # ---- technology_details ----
    def handle_technology_details(self, query: str, role: str, db) -> str:
        """Count posts and companies for a SPECIFIC technology with PERCENTAGES."""
        try:
            # Extract the technology name from query
            tech = self._extract_tech_from_query(query)
            if not tech:
                return "Please specify a technology (e.g., 'React', 'Python', 'Java')."

            # Get count of posts for this tech
            tech_posts = db.get_posts_by_technology(tech, limit=1000)
            post_count = len(tech_posts) if tech_posts else 0
            
            # Get count of companies using this tech
            company_count = db.get_company_count_by_technology(tech)
            if not company_count:
                company_count = 0

            # Get total posts and companies for percentage context
            all_techs = db.get_top_technologies(limit=100)
            total_posts = sum(t['post_count'] for t in all_techs) if all_techs else 1
            total_companies = sum(t['company_count'] for t in all_techs) if all_techs else 1
            
            if post_count == 0:
                data_text = "NO DATA"
            else:
                post_percentage = (post_count / total_posts * 100) if total_posts > 0 else 0
                company_percentage = (company_count / total_companies * 100) if total_companies > 0 else 0
                data_text = f"{tech} technology stats:\n"
                data_text += f"- {post_count} job posts ({post_percentage:.1f}% of all jobs)\n"
                data_text += f"- {company_count} companies hiring for {tech} ({company_percentage:.1f}% of all companies)\n"
                data_text += f"(Total market: {total_posts} jobs across {total_companies} company postings)"

            context = f"You are speaking to a {role}. "
            if role == "seeker":
                context += f"Help them understand {tech} market demand with percentages."
            elif role == "company":
                context += f"Help them understand {tech} market position."
            elif role == "university":
                context += f"Help them understand industry {tech} demand."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error retrieving {tech if 'tech' in locals() else 'technology'} details: {str(e)}"

    # ---- company_hiring ----
    def handle_company_hiring(self, query: str, role: str, db) -> str:
        """Companies hiring for a specific technology."""
        try:
            # Extract tech from query (simple heuristic)
            tech = self._extract_tech_from_query(query)
            if not tech:
                return "Please specify a technology (e.g., 'React', 'Python', 'Java')."

            posts = db.get_posts_by_technology(tech, limit=10)

            if not posts or len(posts) == 0:
                data_text = "NO DATA"
            else:
                data_text = f"Companies hiring for {tech}:\n"
                for i, p in enumerate(posts[:5], 1):
                    data_text += f"{i}. {p['company_name']} - {p['position']}\n"
                    email = p.get('company_email') or 'N/A'
                    website = p.get('website_link') or 'N/A'
                    data_text += f"   Email: {email}, Website: {website}\n"

            context = f"You are speaking to a {role}. "
            if role == "seeker":
                context += "Show opportunities and encourage applications."
            elif role == "company":
                context += "Show market competition."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error retrieving company listings: {str(e)}"

    # ---- talent_search ----
    def handle_talent_search(self, query: str, role: str, db, rag) -> str:
        """Find seekers/developers with specific skills."""
        try:
            # Try skill extraction
            skill = self._extract_skill_from_query(query)

            # Use RAG for semantic search
            seekers = rag.query_seekers(query, n_results=10)
            seekers_list = seekers.get("metadatas", [])

            if not seekers_list or len(seekers_list) == 0:
                # Fallback to DB search
                seekers_list = db.get_seekers_by_skill(skill, limit=10) if skill else []

            if not seekers_list or len(seekers_list) == 0:
                data_text = "NO DATA"
            else:
                data_text = f"Candidates matching '{skill or 'your query'}':\n"
                for i, s in enumerate(seekers_list[:5], 1):
                    name = s.get("seeker_name") or s.get("name") or "N/A"
                    skills = s.get("skills") or s.get("skill") or "N/A"
                    email = s.get("email") or "N/A"
                    data_text += f"{i}. {name}\n"
                    data_text += f"   Skills: {skills}, Email: {email}\n"

            context = f"You are speaking to a {role}. "
            if role == "seeker":
                context += "Show these as peers/collaborators."
            elif role == "company":
                context += "Frame as hiring candidates."
            elif role == "university":
                context += "Frame as potential partners/mentors."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error searching talent: {str(e)}"

    # ---- skill_availability ----
    def handle_skill_availability(self, query: str, role: str, db) -> str:
        """Count of developers with a specific skill."""
        try:
            skill = self._extract_skill_from_query(query)
            if not skill:
                return "Please specify a skill (e.g., 'React', 'Python')."

            count = db.count_available_seekers_with_skill(skill)

            if count == 0:
                data_text = "NO DATA"
            else:
                data_text = f"Skill availability for '{skill}':\n"
                data_text += f"Available developers: {count}\n"

            context = f"You are speaking to a {role}. "
            if role == "company":
                context += "Help them understand talent pool size."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error checking skill availability: {str(e)}"

    # ---- skill_distribution ----
    def handle_skill_distribution(self, query: str, role: str, db) -> str:
        """Distribution of skills across all seekers."""
        try:
            skills = db.get_skill_distribution(limit=10)

            if not skills or len(skills) == 0:
                data_text = "NO DATA"
            else:
                data_text = "Top skills among developers:\n"
                for i, s in enumerate(skills[:7], 1):
                    data_text += f"{i}. {s['skill']}: {s['seeker_count']} developers\n"

            context = f"You are speaking to a {role}. "
            if role == "company":
                context += "Help them understand talent pool capabilities."
            elif role == "university":
                context += "Help curriculum planning."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error retrieving skill distribution: {str(e)}"

    # ---- demand_supply_gap ----
    def handle_demand_supply_gap(self, query: str, role: str, db) -> str:
        """Compare industry demand vs available talent."""
        try:
            gap = db.get_demand_supply_gap(limit=10)

            if not gap or len(gap) == 0:
                data_text = "NO DATA"
            else:
                data_text = "Industry demand vs talent supply:\n"
                for g in gap[:8]:
                    tech = g["technology"]
                    demand = g["demand"]
                    supply = g["supply"]
                    gap_val = g["gap"]
                    data_text += f"- {tech}: {demand} demand, {supply} supply (gap: {gap_val:+d})\n"

            context = f"You are speaking to a {role}. "
            if role == "university":
                context += "Focus on skills gap and curriculum alignment."
            elif role == "company":
                context += "Focus on talent scarcity."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error analyzing gap: {str(e)}"

    # ---- partnership_intel ----
    def handle_partnership_intel(self, query: str, role: str, db) -> str:
        """Companies suitable for partnerships (universities)."""
        try:
            partners = db.get_partnership_candidates(limit=15)

            if not partners or len(partners) == 0:
                data_text = "NO DATA"
            else:
                data_text = "Companies for partnership:\n"
                for i, p in enumerate(partners[:5], 1):
                    data_text += f"{i}. {p['company_name']}\n"
                    data_text += f"   Posts: {p['active_posts']}, Tech: {p['technologies']}\n"
                    email = p.get('company_email') or 'N/A'
                    data_text += f"   Email: {email}\n"

            context = f"You are speaking to a {role}. "
            if role == "university":
                context += "Highlight partnership potential and industry alignment."

            return self._format_with_llm(data_text, query, role, context)

        except Exception as e:
            return f"Error retrieving partnership intel: {str(e)}"

    # ---- learning_path ----
    def handle_learning_path(self, query: str, role: str) -> str:
        """Learning roadmaps and educational guidance."""
        roadmap_base = "https://roadmap.sh"
        roadmaps = {
            "frontend": f"{roadmap_base}/frontend",
            "backend": f"{roadmap_base}/backend",
            "fullstack": f"{roadmap_base}/full-stack",
            "react": f"{roadmap_base}/react",
            "python": f"{roadmap_base}/python",
            "java": f"{roadmap_base}/java",
            "javascript": f"{roadmap_base}/javascript",
            "nodejs": f"{roadmap_base}/nodejs",
            "devops": f"{roadmap_base}/devops",
            "android": f"{roadmap_base}/android",
            "ios": f"{roadmap_base}/ios",
            "vue": f"{roadmap_base}/vue",
            "angular": f"{roadmap_base}/angular",
            "sql": f"{roadmap_base}/sql",
            "mongodb": f"{roadmap_base}/mongodb",
            "docker": f"{roadmap_base}/docker",
            "kubernetes": f"{roadmap_base}/kubernetes",
        }

        system_prompt = f"""You are a learning advisor. Give helpful, encouraging advice for learning.

Available roadmaps to suggest: {', '.join(list(roadmaps.keys()))}

When answering:
1. Suggest 1-2 relevant roadmap.sh paths
2. Give practical learning steps
3. Be encouraging and motivating
4. Keep it to 2-3 sentences max

Roadmap links:
{json.dumps(roadmaps, indent=2)}"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Question: {query}"),
        ]

        response = self.response_llm.invoke(messages)
        return response.content.strip()

    # ---- general ----
    def handle_general(self, query: str, role: str) -> str:
        """Fallback for unclear queries."""
        system_prompt = f"""You are a helpful assistant for a {role}. 
Answer in 2-3 friendly sentences.
If you don't recognize the question, suggest relevant topics they could ask about."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Question: {query}"),
        ]

        response = self.response_llm.invoke(messages)
        return response.content.strip()

    # ================== UTILITIES ==================
    def _extract_tech_from_query(self, query: str) -> Optional[str]:
        """Simple extraction of technology keyword from query."""
        techs = [
            "react",
            "python",
            "javascript",
            "java",
            "nodejs",
            "vue",
            "angular",
            "sql",
            "mongodb",
            "docker",
            "kubernetes",
            "devops",
            "android",
            "ios",
            "backend",
            "frontend",
            "fullstack",
        ]
        query_lower = query.lower()
        for tech in techs:
            if tech in query_lower:
                return tech.capitalize()
        return None

    def _extract_skill_from_query(self, query: str) -> Optional[str]:
        """Simple extraction of skill keyword from query."""
        skills = [
            "react",
            "python",
            "javascript",
            "java",
            "nodejs",
            "typescript",
            "css",
            "html",
            "sql",
            "mongodb",
            "docker",
            "kubernetes",
            "aws",
            "azure",
            "git",
            "devops",
        ]
        query_lower = query.lower()
        for skill in skills:
            if skill in query_lower:
                return skill.capitalize()
        return None

    # ================== MAIN ENTRY POINT ==================
    def get_response(
        self, query: str, role: str, db, rag, history: Optional[List[dict]] = None
    ) -> Dict:
        """Process user query and return response.
        
        Args:
            query: User question
            role: seeker/company/university
            db: DatabaseLoader instance
            rag: RAGSystem instance
            history: Conversation history
            
        Returns:
            Dict with 'response' and 'intent'
        """
        try:
            # 1. Classify intent
            intent = self.classify_intent(query, history)

            # 2. Route to handler
            handler = getattr(self, f"handle_{intent}", self.handle_general)
            
            # 3. Call handler with appropriate params
            if intent == "learning_path":
                response = handler(query, role)
            elif intent == "general":
                response = handler(query, role)
            elif intent in ["talent_search"]:
                response = handler(query, role, db, rag)
            else:
                response = handler(query, role, db)

            return {
                "response": response,
                "intent": intent,
            }

        except Exception as e:
            return {
                "response": f"Error processing your question: {str(e)}",
                "intent": "error",
            }


__all__ = ["RoleBasedAgent"]





