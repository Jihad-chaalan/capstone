import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminPages.css";

const AdminPostsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts");
        const postsData = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.data || [];
        setPosts(Array.isArray(postsData) ? postsData : []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading posts:", error);
        setLoading(false);
      }
    };

    fetchPosts();
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

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    try {
      await api.delete(`/admin/posts/${selectedPost.id}`);
      setPosts(posts.filter((p) => p.id !== selectedPost.id));
      setShowDeletePostModal(false);
      setShowPostModal(false);
      setSelectedPost(null);
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error.response?.data?.message || "Failed to delete post");
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading posts...</div>;
  }

  return (
    <div className="admin-page">
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h2 className="admin-navbar-title">Manage Posts</h2>
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
            All Internship Posts ({posts.length})
          </h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Position</th>
                  <th>Technology</th>
                  <th>Company</th>
                  <th>Applications</th>
                  <th>Posted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.id}</td>
                    <td>
                      <button
                        onClick={() => handleViewPost(post)}
                        className="admin-link-button"
                      >
                        {post.position}
                      </button>
                    </td>
                    <td>{post.technology}</td>
                    <td>{post.company?.user?.name || "N/A"}</td>
                    <td>{post.applications_count || 0}</td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleViewPost(post)}
                        className="admin-btn-view"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posts.length === 0 && (
              <p className="admin-empty-message">No posts available</p>
            )}
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowPostModal(false)}
        >
          <div
            className="admin-modal-content admin-modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Post Details</h2>
              <button
                onClick={() => setShowPostModal(false)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              {selectedPost.photo && (
                <div className="admin-post-photo">
                  <img
                    src={
                      selectedPost.photo.startsWith("http")
                        ? selectedPost.photo
                        : `${import.meta.env.VITE_API_URL}/storage/${
                            selectedPost.photo
                          }`
                    }
                    alt={selectedPost.position}
                  />
                </div>
              )}
              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <span className="admin-detail-label">ID:</span>
                  <span className="admin-detail-value">{selectedPost.id}</span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Position:</span>
                  <span className="admin-detail-value">
                    {selectedPost.position}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Technology:</span>
                  <span className="admin-detail-value">
                    {selectedPost.technology}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Company:</span>
                  <span className="admin-detail-value">
                    {selectedPost.company?.user?.name || "N/A"}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Applications:</span>
                  <span className="admin-detail-value">
                    {selectedPost.applications_count || 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Posted:</span>
                  <span className="admin-detail-value">
                    {new Date(selectedPost.created_at).toLocaleDateString()} at{" "}
                    {new Date(selectedPost.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {selectedPost.description && (
                <div className="admin-detail-description">
                  <span className="admin-detail-label">Description:</span>
                  <p className="admin-detail-text">
                    {selectedPost.description}
                  </p>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setShowDeletePostModal(true);
                }}
                className="admin-btn-danger"
              >
                Delete Post
              </button>
              <button
                onClick={() => setShowPostModal(false)}
                className="admin-btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeletePostModal && selectedPost && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowDeletePostModal(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-title">Confirm Delete Post</h2>
            <p className="admin-modal-text">
              Are you sure you want to delete the post{" "}
              <strong>{selectedPost.position}</strong> by{" "}
              <strong>{selectedPost.company?.user?.name}</strong>? This action
              cannot be undone and will also delete all related applications.
            </p>
            <div className="admin-modal-actions">
              <button onClick={handleDeletePost} className="admin-btn-danger">
                Delete Post
              </button>
              <button
                onClick={() => {
                  setShowDeletePostModal(false);
                  setSelectedPost(null);
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

export default AdminPostsPage;
