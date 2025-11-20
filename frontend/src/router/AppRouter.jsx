import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";

const ProtectedRoute = () => {
  const { token, user, fetchUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !user) fetchUser();
  }, [token, user]);

  if (isLoading)
    return (
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );

  if (!token || !user) return <Navigate to="/login" />;

  return <Outlet />;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
