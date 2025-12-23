import "../styles/SeekerPostPage.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const SeekerPostsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // State management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingPostId, setApplyingPostId] = useState(null);
  const [appliedPosts, setAppliedPosts] = useState(new Set());
  const [filters, setFilters] = useState({
    technology: "",
    position: "",
  });

  useEffect(() => {
    fetchPosts();
    fetchApplications();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.technology.trim()) {
        params.append("technology", filters.technology.trim());
      }
      if (filters.position.trim()) {
        params.append("position", filters.position.trim());
      }

      const response = await api.get(`/posts?${params.toString()}`);
      const postsData = response.data.data.data || response.data.data || [];
      setPosts(postsData);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load internship posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get("/seeker/applications");
      const applications = response.data.data.data || response.data.data || [];
      const postIds = new Set(
        applications.map((app) => app.internship_post_id)
      );
      setAppliedPosts(postIds);
    } catch (err) {
      console.error("Failed to load applications:", err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleApply = async (postId) => {
    if (applyingPostId) return;

    try {
      setApplyingPostId(postId);
      await api.post("/applications", { post_id: postId });

      setAppliedPosts(new Set([...appliedPosts, postId]));
      alert("Application submitted successfully! 🎉");
    } catch (err) {
      console.error("Application error:", err);
      const message =
        err.response?.data?.message || "Failed to submit application.";
      alert(message);
    } finally {
      setApplyingPostId(null);
    }
  };

  const handleViewCompany = (companyId) => {
    if (companyId) {
      navigate(`/seeker/companies/${companyId}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="seeker-posts-loading">Loading internship posts...</div>
    );
  }

  return (
    <div className="seeker-posts-page">
      {/* Navbar */}
      <nav className="seeker-posts-navbar">
        <div className="seeker-posts-navbar-container">
          <div className="seeker-posts-navbar-content">
            <h1 className="seeker-posts-navbar-brand">Int Leb Web</h1>
            <div className="seeker-posts-navbar-actions">
              <button
                onClick={() => navigate("/profile")}
                className="seeker-posts-nav-button"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {/* My Profile */}
              </button>
              <button
                onClick={() => navigate("/my-applications")}
                className="seeker-posts-nav-button"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {/* My Applications */}
              </button>
              <button
                onClick={handleLogout}
                className="seeker-posts-nav-logout"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {/* Sign Out */}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="seeker-posts-container">
        {/* Header */}
        <div className="seeker-posts-header">
          <h1 className="seeker-posts-title">Browse Internships</h1>
          <p className="seeker-posts-subtitle">
            Find your next opportunity from top companies
          </p>
        </div>

        {/* Search/Filter Bar */}
        <div className="seeker-posts-filter-card">
          <form onSubmit={handleSearch} className="seeker-posts-filter-form">
            <div className="seeker-posts-filter-group">
              <label htmlFor="position" className="seeker-posts-filter-label">
                Position
              </label>
              <input
                id="position"
                type="text"
                name="position"
                value={filters.position}
                onChange={handleFilterChange}
                placeholder="e.g. Full Stack Developer"
                className="seeker-posts-filter-input"
              />
            </div>
            <div className="seeker-posts-filter-group">
              <label htmlFor="technology" className="seeker-posts-filter-label">
                Technology
              </label>
              <input
                id="technology"
                type="text"
                name="technology"
                value={filters.technology}
                onChange={handleFilterChange}
                placeholder="e.g. React, Node.js"
                className="seeker-posts-filter-input"
              />
            </div>
            <button type="submit" className="seeker-posts-filter-button">
              Search
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && <div className="seeker-posts-error">{error}</div>}

        {/* Empty State */}
        {!error && posts.length === 0 && (
          <div className="seeker-posts-empty">
            <svg
              className="seeker-posts-empty-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="seeker-posts-empty-title">No posts found</h3>
            <p className="seeker-posts-empty-text">
              Try adjusting your search filters
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {!error && posts.length > 0 && (
          <div className="seeker-posts-grid">
            {posts.map((post) => {
              const hasApplied = appliedPosts.has(post.id);
              const isApplying = applyingPostId === post.id;

              return (
                <div key={post.id} className="seeker-post-card">
                  {post.photo && (
                    <img
                      src={
                        post.photo.startsWith("http")
                          ? post.photo
                          : `http://localhost:8000/storage/${post.photo}`
                      }
                      alt={post.position}
                      className="seeker-post-photo"
                    />
                  )}
                  <div className="seeker-post-content">
                    <div
                      className="seeker-post-company"
                      onClick={() => handleViewCompany(post.company?.id)}
                      style={{
                        cursor: post.company?.id ? "pointer" : "default",
                      }}
                    >
                      {post.company?.user?.name || "Company"}
                    </div>
                    <h3 className="seeker-post-position">{post.position}</h3>
                    <div className="seeker-post-technology">
                      {post.technology}
                    </div>
                    {post.description && (
                      <p className="seeker-post-description">
                        {post.description}
                      </p>
                    )}
                    <div className="seeker-post-footer">
                      <span className="seeker-post-date">
                        Posted {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {hasApplied ? (
                        <button className="seeker-post-button-applied" disabled>
                          Applied ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(post.id)}
                          disabled={isApplying}
                          className="seeker-post-button"
                        >
                          {isApplying ? "Applying..." : "Apply Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeekerPostsPage;
