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
import SeekerProfilePage from "../pages/SeekerProfilePage";
import CompanyProfilePage from "../pages/CompanyProfilePage";
import UniversityProfilePage from "../pages/UniversityProfilePage";
import SeekerPostsPage from "../pages/SeekerPostPage";
import UniversityRequestsPage from "../pages/UniversityRequestPage";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminPostsPage from "../pages/AdminPosts";
import AdminApplicationsPage from "../pages/AdminApplicationsPage";
import AdminCompaniesPage from "../pages/AdminCompaniesPage";
import AdminSkillsPage from "../pages/AdminSkillsPage";
import CompanyPublicProfilePage from "../pages/CompanyPublicProfile";
import SeekerPublicProfilePage from "../pages/SeekerPublicProfile";

const ProtectedRoute = () => {
  const { token, user, fetchUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !user) fetchUser();
  }, [token, user, fetchUser]);

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
        <Route path="/seekers/:id" element={<SeekerPublicProfilePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/posts" element={<SeekerPostsPage />} />
          <Route path="/profile" element={<SeekerProfilePage />} />
          <Route path="/company/profile" element={<CompanyProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route
            path="/admin/applications"
            element={<AdminApplicationsPage />}
          />
          <Route path="/admin/skills" element={<AdminSkillsPage />} />
          <Route
            path="/university/profile"
            element={<UniversityProfilePage />}
          />
          <Route
            path="/university/requests"
            element={<UniversityRequestsPage />}
          />
        </Route>
        <Route
          path="/seeker/companies/:id"
          element={<CompanyPublicProfilePage />}
        />
        <Route path="/seekers/:id" element={<SeekerPublicProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
};
