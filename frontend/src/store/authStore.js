import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/client";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      validationErrors: null, // ADD THIS

      register: async (userData) => {
        set({ isLoading: true, error: null, validationErrors: null });
        try {
          const response = await api.post("/register", userData);
          const { user, token } = response.data.data;

          set({ user, token, isLoading: false });
          localStorage.setItem("auth_token", token);
          return { success: true };
        } catch (error) {
          // Capture validation errors
          const validationErrors = error.response?.data?.errors;
          const message =
            error.response?.data?.message || "Registration failed";

          set({
            error: message,
            validationErrors, // Store field errors
            isLoading: false,
          });
          return { success: false, validationErrors };
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null, validationErrors: null });
        try {
          const response = await api.post("/login", credentials);
          const { user, token } = response.data.data;

          set({ user, token, isLoading: false });
          localStorage.setItem("auth_token", token);
          return { success: true };
        } catch (error) {
          set({
            error: error.response?.data?.message || "Login failed",
            isLoading: false,
          });
          return { success: false };
        }
      },

      logout: async () => {
        try {
          await api.post("/logout");
        } finally {
          set({ user: null, token: null, validationErrors: null });
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth-storage");
        }
      },

      clearError: () => set({ error: null, validationErrors: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
    }
  )
);
