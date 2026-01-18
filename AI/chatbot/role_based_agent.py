import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from langchain.agents import create_agent

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class InternHubAgent:
    """Chatbot agent using LangChain tools for internship platform.
    
    Uses @tool decorators and create_agent for clean architecture.
    """

    def __init__(self, db=None, rag=None):
        """Initialize agent with DB and RAG systems."""
        self.db = db
        self.rag = rag
        
        # Get LLM with fallback (DeepSeek -> Gemini)
        self.llm = self._get_llm_with_fallback()
        
        # Define all tools
        self.tools = self._create_tools()
        
        # Create the agent
        self.agent = self._create_chatbot_agent()

    def _get_deepseek_model(self):
        """Initialize DeepSeek LLM."""
        return ChatOpenAI(
            model="deepseek-chat",
            temperature=0.6,
            max_tokens=250,
            timeout=30,
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url=os.getenv("DEEPSEEK_API_BASE"),
        )

    def _get_gemini_model(self):
        """Initialize Gemini LLM as fallback."""
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.6,
            max_tokens=250,
            timeout=30,
            google_api_key=os.getenv("GEMINI_API_KEY"),
        )

    def _get_llm_with_fallback(self):
        """Get LLM with DeepSeek primary and Gemini fallback."""
        try:
            # Try DeepSeek first
            deepseek = self._get_deepseek_model()
            # Test with a simple call
            deepseek.invoke("test")
            print(" Using DeepSeek as primary LLM")
            return deepseek
        except Exception as e:
            print(f" DeepSeek failed: {str(e)}")
            print(" Falling back to Gemini...")
            try:
                gemini = self._get_gemini_model()
                print(" Using Gemini as fallback LLM")
                return gemini
            except Exception as ge:
                print(f" Gemini also failed: {str(ge)}")
                # Return DeepSeek anyway, let errors happen at runtime
                return self._get_deepseek_model()

    def _create_tools(self):
        """Create all tools for the agent."""
        
        @tool
        def get_top_technologies(limit: int = 10) -> str:
            """Get top technologies by demand with percentages.
            Use when user asks: trending, popular, most-used technologies."""
            try:
                techs = self.db.get_top_technologies(limit=limit)
                if not techs:
                    return "No technology data available."
                
                total_posts = sum(t['post_count'] for t in techs)
                
                result = "Top technologies by demand:\n"
                for i, t in enumerate(techs[:5], 1):
                    pct = (t['post_count'] / total_posts * 100) if total_posts > 0 else 0
                    result += f"{i}. {t['technology']}: {t['post_count']} jobs ({pct:.1f}%), {t['company_count']} companies\n"
                
                return result
            except Exception as e:
                return f"Error getting technologies: {str(e)}"

        @tool
        def get_technology_details(tech: str) -> str:
            """Get detailed statistics for ONE specific technology with percentages.
            Use when user asks about counts, numbers, or statistics: 
            - 'How many React posts?'
            - 'How many companies use React?'
            - 'React demand statistics?'
            - 'React percentage?'
            
            Returns: post count, post %, company count, company %
            
            Args:
                tech: Technology name (e.g., 'React', 'Python', 'Java')
            """
            try:
                tech_posts = self.db.get_posts_by_technology(tech, limit=1000)
                post_count = len(tech_posts) if tech_posts else 0
                
                company_count = self.db.get_company_count_by_technology(tech) or 0
                
                all_techs = self.db.get_top_technologies(limit=100)
                total_posts = sum(t['post_count'] for t in all_techs) if all_techs else 1
                total_companies = sum(t['company_count'] for t in all_techs) if all_techs else 1
                
                if post_count == 0:
                    return f"No data found for {tech}."
                
                post_pct = (post_count / total_posts * 100) if total_posts > 0 else 0
                company_pct = (company_count / total_companies * 100) if total_companies > 0 else 0
                
                return f"{tech} statistics:\n" \
                       f"- {post_count} job posts ({post_pct:.1f}% of all jobs)\n" \
                       f"- {company_count} companies ({company_pct:.1f}% of all companies)\n" \
                       f"Total market: {total_posts} jobs across {total_companies} companies"
            except Exception as e:
                return f"Error getting {tech} details: {str(e)}"

        @tool
        def get_companies_hiring(tech: str) -> str:
            """Get LIST of company NAMES hiring for a specific technology.
            Use ONLY when user wants to see company names/details:
            - 'Show me companies hiring React'
            - 'Which companies need Python developers?'
            - 'List companies with React jobs'
            
            DO NOT use for counting or statistics - use get_technology_details instead.
            
            Args:
                tech: Technology name (e.g., 'React', 'Python')
            """
            try:
                posts = self.db.get_posts_by_technology(tech, limit=10)
                if not posts:
                    return f"No companies found hiring for {tech}."
                
                result = f"Companies hiring for {tech}:\n"
                for i, p in enumerate(posts[:5], 1):
                    result += f"{i}. {p['company_name']} - {p['position']}\n"
                    result += f"   Email: {p.get('company_email', 'N/A')}, Website: {p.get('website_link', 'N/A')}\n"
                
                return result
            except Exception as e:
                return f"Error finding companies: {str(e)}"

        @tool
        def search_developers(query: str) -> str:
            """Search for developers/seekers with specific skills.
            Use when user asks: 'Find React developers', 'Show me Python devs'
            
            Args:
                query: Search query describing desired skills
            """
            try:
                # RAG search
                seekers = self.rag.query_seekers(query, n_results=10)
                seekers_list = seekers.get("metadatas", [])
                
                # Fallback to DB
                if not seekers_list:
                    skill = self._extract_skill(query)
                    if skill:
                        seekers_list = self.db.get_seekers_by_skill(skill, limit=10)
                
                if not seekers_list:
                    return "No developers found matching your criteria."
                
                result = "Matching developers:\n"
                for i, s in enumerate(seekers_list[:5], 1):
                    name = s.get("seeker_name") or s.get("name") or "N/A"
                    skills = s.get("skills") or s.get("skill") or "N/A"
                    email = s.get("email") or "N/A"
                    result += f"{i}. {name}\n   Skills: {skills}, Email: {email}\n"
                
                return result
            except Exception as e:
                return f"Error searching developers: {str(e)}"

        @tool
        def count_developers_with_skill(skill: str) -> str:
            """Count developers with a specific skill and show percentage of talent pool.
            Use when user asks: 'How many Python developers?', 'React developer count?'
            
            Args:
                skill: Skill name (e.g., 'React', 'Python')
            """
            try:
                count = self.db.count_available_seekers_with_skill(skill)
                
                # Get total for percentage
                all_skills = self.db.get_skill_distribution(limit=100)
                total_seekers = sum(s['seeker_count'] for s in all_skills) if all_skills else 1
                
                if count == 0:
                    return f"No developers found with {skill} skill."
                
                pct = (count / total_seekers * 100) if total_seekers > 0 else 0
                
                return f"Developers with {skill}:\n" \
                       f"- {count} available developers ({pct:.1f}% of talent pool)\n" \
                       f"- Total talent pool: {total_seekers} seekers"
            except Exception as e:
                return f"Error counting developers: {str(e)}"

        @tool
        def get_skill_distribution() -> str:
            """Get distribution of skills across all developers with percentages.
            Use when user asks: 'What skills do developers have?', 'Skill breakdown?'
            """
            try:
                skills = self.db.get_skill_distribution(limit=10)
                
                if not skills:
                    return "No skill data available."
                
                total_seekers = sum(s['seeker_count'] for s in skills)
                
                result = "Top skills among developers:\n"
                for i, s in enumerate(skills[:7], 1):
                    pct = (s['seeker_count'] / total_seekers * 100) if total_seekers > 0 else 0
                    result += f"{i}. {s['skill']}: {s['seeker_count']} developers ({pct:.1f}%)\n"
                
                result += f"\nTotal developers: {total_seekers}"
                return result
            except Exception as e:
                return f"Error getting skill distribution: {str(e)}"

        @tool
        def get_demand_supply_gap() -> str:
            """Get industry demand vs talent supply gap analysis.
            Use when user asks: 'Skills gap?', 'Industry needs vs talent?'
            """
            try:
                gap = self.db.get_demand_supply_gap(limit=10)
                
                if not gap:
                    return "No gap analysis data available."
                
                result = "Industry demand vs talent supply:\n"
                for g in gap[:8]:
                    result += f"- {g['technology']}: {g['demand']} demand, {g['supply']} supply (gap: {g['gap']:+d})\n"
                
                return result
            except Exception as e:
                return f"Error analyzing gap: {str(e)}"

        @tool
        def get_partnership_companies() -> str:
            """Get companies suitable for partnerships (for universities).
            Use when user asks: 'Partnership opportunities?', 'Companies to partner with?'
            """
            try:
                partners = self.db.get_partnership_candidates(limit=15)
                
                if not partners:
                    return "No partnership data available."
                
                result = "Companies for partnership:\n"
                for i, p in enumerate(partners[:5], 1):
                    result += f"{i}. {p['company_name']}\n"
                    result += f"   Posts: {p['active_posts']}, Tech: {p['technologies']}\n"
                    result += f"   Email: {p.get('company_email', 'N/A')}\n"
                
                return result
            except Exception as e:
                return f"Error finding partnerships: {str(e)}"

        @tool
        def get_learning_roadmap(topic: str) -> str:
            """Get learning roadmap for a technology or career path.
            Use when user asks: 'How to learn React?', 'Backend roadmap?'
            
            Args:
                topic: Technology or path to learn (e.g., 'React', 'Backend', 'Python')
            """
            roadmaps = {
                "react": "https://roadmap.sh/react",
                "python": "https://roadmap.sh/python",
                "javascript": "https://roadmap.sh/javascript",
                "java": "https://roadmap.sh/java",
                "backend": "https://roadmap.sh/backend",
                "frontend": "https://roadmap.sh/frontend",
                "fullstack": "https://roadmap.sh/full-stack",
                "nodejs": "https://roadmap.sh/nodejs",
                "devops": "https://roadmap.sh/devops",
                "docker": "https://roadmap.sh/docker",
            }
            
            topic_lower = topic.lower()
            link = roadmaps.get(topic_lower, "https://roadmap.sh")
            
            return f"To learn {topic}, I recommend following this roadmap: {link}\n\n" \
                   f"Steps:\n" \
                   f"1. Start with basics and fundamentals\n" \
                   f"2. Build small projects to practice\n" \
                   f"3. Work on real-world applications\n" \
                   f"4. Join communities and contribute to open source"

        return [
            get_top_technologies,
            get_technology_details,
            get_companies_hiring,
            search_developers,
            count_developers_with_skill,
            get_skill_distribution,
            get_demand_supply_gap,
            get_partnership_companies,
            get_learning_roadmap,
        ]

    def _create_chatbot_agent(self):
        """Create the LangChain agent with tools."""
        return create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt="""You are InternHub Assistant, a helpful chatbot for an internship platform.

Your role:
- Help seekers find jobs and learn new skills
- Help companies find talent and understand market trends
- Help universities with industry alignment and partnerships

CRITICAL RULES:
1. Use the provided tools to get real data
2. If tools return "No data" or errors, say you don\'t have that information
3. DO NOT make up numbers, names, or companies
4. Be concise (2-3 sentences) and friendly
5. When showing statistics, always mention percentages from tool results
6. If user asks about learning, use get_learning_roadmap tool
7. ANSWER THE QUESTION DIRECTLY - DO NOT ask follow-up questions or offer additional searches
8. DO NOT end responses with questions like "Would you like me to..." or "Should I..."

Available data through tools:
- Technology trends and statistics
- Company hiring information
- Developer skills and availability
- Industry demand vs supply gaps
- Partnership opportunities
- Learning roadmaps

Be helpful, professional, and data-driven."""
        )

    def _extract_skill(self, query: str) -> Optional[str]:
        """Extract skill from query."""
        skills = ["react", "python", "javascript", "java", "nodejs", "typescript", 
                  "css", "html", "sql", "mongodb", "docker", "kubernetes", "aws"]
        query_lower = query.lower()
        for skill in skills:
            if skill in query_lower:
                return skill.capitalize()
        return None

    def get_response(self, query: str, role: str, history: Optional[List[dict]] = None) -> Dict:
        """Process user query and return response.
        
        Args:
            query: User question
            role: seeker/company/university
            history: Conversation history
            
        Returns:
            Dict with 'response' and 'intent'
        """
        try:
            # Build messages with role context
            role_context = {
                "seeker": "The user is a job seeker looking for internships.",
                "company": "The user is a company looking to hire interns.",
                "university": "The user is from a university looking for partnerships.",
            }
            
            context_msg = role_context.get(role, "")
            
            # Add history if available
            messages = []
            if history:
                for msg in history[-5:]:  # Last 5 messages
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current query with context
            user_message = f"{context_msg}\n\nUser question: {query}" if context_msg else query
            messages.append({"role": "user", "content": user_message})
            
            # Invoke agent
            result = self.agent.invoke({"messages": messages})
            
            # Extract response - result is AIMessage object
            if hasattr(result, 'content'):
                response_content = result.content
            elif isinstance(result, dict):
                msgs = result.get("messages", [])
                if msgs:
                    last_msg = msgs[-1]
                    response_content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)
                else:
                    response_content = "No response generated."
            else:
                response_content = str(result)
            
            return {
                "response": response_content,
                "intent": "tool_based",  # Agent automatically selects tools
            }
        
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"ERROR in get_response: {str(e)}")
            print(error_trace)
            return {
                "response": f"Error: {str(e)}",
                "intent": "error",
            }


__all__ = ["InternHubAgent"]











