// frontend/src/pages/Chatbot.jsx
import { useState, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { chatApi } from "../api/chatApi";
import "../styles/chatbot.css";

const Chatbot = () => {
  const { messages, isOpen, isLoading, addMessage, toggleChat, setLoading } =
    useChatStore();
  const { user } = useAuthStore();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
    };

    addMessage(userMessage);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(inputMessage, messages);

      const botMessage = {
        role: "assistant",
        content: response.response,
        intent: response.intent,
      };

      addMessage(botMessage);
    } catch (error) {
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        error: true + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ADD THIS FUNCTION - Role-based suggestions
  const getRoleSuggestions = () => {
    const role = user?.role || "seeker";

    const suggestions = {
      seeker: [
        { emoji: "📊", text: "What are the most used technologies?" },
        { emoji: "🏢", text: "Show me companies hiring React developers" },
        { emoji: "🗺️", text: "I want to learn backend development" },
      ],
      company: [
        { emoji: "👥", text: "How many Python developers are available?" },
        { emoji: "📊", text: "What skills do most seekers have?" },
        { emoji: "🔍", text: "how many company used React?" },
      ],
      university: [
        { emoji: "📈", text: "Show me companies use React?" },
        { emoji: "🤝", text: "Which companies should we partner with?" },
        { emoji: "📚", text: "What technologies should we teach students?" },
      ],
    };

    return suggestions[role] || suggestions.seeker;
  };

  // ADD THIS FUNCTION - Role-based greeting
  const getRoleGreeting = () => {
    const role = user?.role || "seeker";

    const greetings = {
      seeker:
        "I can help you find jobs, learn new skills, and discover market trends!",
      company:
        "I can help you find talent, analyze market trends, and understand skill availability!",
      university:
        "I can help you with industry alignment, partnership opportunities, and curriculum insights!",
    };

    return greetings[role] || greetings.seeker;
  };

  // Only show chatbot for authenticated users
  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        className="chatbot-toggle"
        onClick={toggleChat}
        aria-label="Toggle chatbot"
      >
        {isOpen ? "✕" : "💭"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>💼 InternHub Assistant</h3>
              <p className="user-role">{user.role}</p>
            </div>
            <button onClick={toggleChat} className="close-btn">
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>👋 Hello {user.name}!</p>
                <p>
                  {getRoleGreeting()}
                  📊 All data provided by InternHub is from our platform - no
                  external sources.
                </p>
                <div className="suggestions">
                  {getRoleSuggestions().map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(suggestion.text)}
                    >
                      {suggestion.emoji} {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${
                  msg.role === "user" ? "user-message" : "bot-message"
                } ${msg.error ? "error-message" : ""}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {msg.timestamp?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows="2"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="send-btn"
            >
              {isLoading ? "⏳" : "➤"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
