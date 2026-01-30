import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminPages.css";

const AdminApplicationsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get("/admin/applications");
        const appsData = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.data || [];
        setApplications(Array.isArray(appsData) ? appsData : []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading applications:", error);
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const handleViewApplication = (app) => {
    setSelectedApplication(app);
    setShowApplicationModal(true);
  };

  if (loading) {
    return <div className="admin-loading">Loading applications...</div>;
  }

  return (
    <div className="admin-page">
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h2 className="admin-navbar-title">All Applications</h2>
          <div className="admin-navbar-actions">
            <button
              onClick={() => navigate("/admin")}
              className="admin-nav-back-btn"
            >
              ← Back to Dashboard
            </button>
            <div className="admin-menu-container" ref={menuRef}>
              <button onClick={toggleMenu} className="admin-menu-button">
                ⋮
              </button>
              {showMenu && (
                <div className="admin-dropdown">
                  <button
                    onClick={handleLogout}
                    className="admin-dropdown-item"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="admin-container">
        <div className="admin-section">
          <h2 className="admin-section-title">
            All Applications ({applications.length})
          </h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Seeker</th>
                  <th>Post</th>
                  <th>Company</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.seeker?.user?.name || "N/A"}</td>
                    <td>{app.post?.position || "N/A"}</td>
                    <td>{app.post?.company?.user?.name || "N/A"}</td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleViewApplication(app)}
                        className="admin-btn-view"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowApplicationModal(false)}
        >
          <div
            className="admin-modal-content admin-modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Application Details</h2>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Application ID:</span>
                  <span className="admin-detail-value">
                    {selectedApplication.id}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Seeker Name:</span>
                  <span className="admin-detail-value">
                    {selectedApplication.seeker?.user?.name || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Seeker Email:</span>
                  <span className="admin-detail-value">
                    {selectedApplication.seeker?.user?.email || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Seeker Phone:</span>
                  <span className="admin-detail-value">
                    {selectedApplication.seeker?.user?.phone_number || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Position Applied:</span>
                  <span className="admin-detail-value">
                    {selectedApplication.post?.position || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Company:</span>
                  <span className="admin-detail-value">
                    {selectedApplication.post?.company?.user?.name || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Applied Date:</span>
                  <span className="admin-detail-value">
                    {new Date(
                      selectedApplication.created_at,
                    ).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(
                      selectedApplication.created_at,
                    ).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {selectedApplication.seeker?.skills && (
                <div className="admin-detail-description">
                  <span className="admin-detail-label">Seeker Skills:</span>
                  <p className="admin-detail-text">
                    {selectedApplication.seeker.skills}
                  </p>
                </div>
              )}
              {selectedApplication.seeker?.description && (
                <div className="admin-detail-description">
                  <span className="admin-detail-label">
                    Seeker Description:
                  </span>
                  <p className="admin-detail-text">
                    {selectedApplication.seeker.description}
                  </p>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="admin-btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplicationsPage;
