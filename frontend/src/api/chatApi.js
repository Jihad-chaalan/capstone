// frontend/src/api/chatApi.js
import api from "./client"; // Use your existing API client with interceptor

export const chatApi = {
  // Send message to chatbot
  sendMessage: async (message, history = []) => {
    try {
      const response = await api.post("/chatbot/chat", {
        message,
        history,
      });
      return response.data;
    } catch (error) {
      console.error("Chat error:", error);
      throw error;
    }
  },

  // Get statistics (optional)
  getStatistics: async () => {
    try {
      const response = await api.get("/chatbot/statistics");
      return response.data;
    } catch (error) {
      console.error("Statistics error:", error);
      throw error;
    }
  },
};
