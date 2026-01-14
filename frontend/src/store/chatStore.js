// frontend/src/store/chatStore.js
import { create } from "zustand";

export const useChatStore = create((set) => ({
  messages: [],
  isOpen: false,
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          timestamp: new Date(),
        },
      ],
    })),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),

  resetChat: () =>
    set({
      messages: [],
      isOpen: false,
      isLoading: false,
    }),
}));
