import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminPages.css";

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        const usersData = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
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

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/users/${selectedUser.id}`);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setShowUserModal(false);
      setSelectedUser(null);
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: "admin-badge-admin",
      company: "admin-badge-company",
      seeker: "admin-badge-seeker",
      university: "admin-badge-university",
    };
    return classes[role] || "admin-badge-default";
  };

  if (loading) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <div className="admin-page">
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h2 className="admin-navbar-title">Manage Users</h2>
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
          <h2 className="admin-section-title">All Users ({users.length})</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((usr) => (
                  <tr key={usr.id}>
                    <td>{usr.id}</td>
                    <td>
                      <button
                        onClick={() => handleViewUser(usr)}
                        className="admin-link-button"
                      >
                        {usr.name}
                      </button>
                    </td>
                    <td>{usr.email}</td>
                    <td>
                      <span
                        className={`admin-badge ${getRoleBadgeClass(usr.role)}`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td>{usr.phone_number || "N/A"}</td>
                    <td>{new Date(usr.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleViewUser(usr)}
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

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="admin-modal-content admin-modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">User Details</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <span className="admin-detail-label">ID:</span>
                  <span className="admin-detail-value">{selectedUser.id}</span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Name:</span>
                  <span className="admin-detail-value">
                    {selectedUser.name}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Email:</span>
                  <span className="admin-detail-value">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Role:</span>
                  <span
                    className={`admin-badge ${getRoleBadgeClass(
                      selectedUser.role
                    )}`}
                  >
                    {selectedUser.role}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Phone:</span>
                  <span className="admin-detail-value">
                    {selectedUser.phone_number || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Registered:</span>
                  <span className="admin-detail-value">
                    {new Date(selectedUser.created_at).toLocaleDateString()} at{" "}
                    {new Date(selectedUser.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              {selectedUser.role !== "admin" && (
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="admin-btn-danger"
                >
                  Delete User
                </button>
              )}
              <button
                onClick={() => setShowUserModal(false)}
                className="admin-btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title">Confirm Delete User</h2>
            <p className="admin-modal-text">
              Are you sure you want to delete user{" "}
              <strong>{selectedUser.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="admin-modal-actions">
              <button onClick={handleDeleteUser} className="admin-btn-danger">
                Delete User
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="admin-btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
