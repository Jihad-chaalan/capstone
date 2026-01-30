import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/SeekerApplicationsPage.css";

const SeekerApplicationsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/seeker/applications");
      setApplications(response.data.data.data || response.data.data || []);
    } catch (err) {
      setError(`Failed to load applications. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="my-applications-page">
      <nav className="seeker-posts-navbar">
        <div className="seeker-posts-navbar-container">
          <div className="seeker-posts-navbar-content">
            <h1
              className="seeker-posts-navbar-brand"
              onClick={() => navigate("/")}
            >
              InternLeb
            </h1>
            <div className="seeker-posts-navbar-actions">
              <button
                onClick={() => navigate("/profile")}
                className="seeker-posts-nav-button"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="seeker-posts-nav-logout"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="my-applications-container">
        <h2>My Applications</h2>
        {loading && <div>Loading...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && applications.length === 0 && (
          <div>No applications found.</div>
        )}
        {!loading && !error && applications.length > 0 && (
          <ul className="applications-list">
            {applications.map((app) => (
              <li key={app.id} className="application-card">
                <div>
                  <strong>Position:</strong> {app.post?.position || "N/A"}
                </div>
                <div>
                  <strong>Company:</strong>{" "}
                  {app.post?.company?.user?.name || "N/A"}
                </div>
                <div>
                  <strong>Applied on:</strong>{" "}
                  {app.created_at
                    ? new Date(app.created_at).toLocaleDateString()
                    : "N/A"}
                </div>
                <div>
                  <strong>Status:</strong> {app.status || "Pending"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SeekerApplicationsPage;
