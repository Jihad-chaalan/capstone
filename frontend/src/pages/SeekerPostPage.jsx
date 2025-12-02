import "../styles/SeekerPostPage.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const SeekerPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    technology: "",
    position: "",
  });
  const [applyingPostId, setApplyingPostId] = useState(null);
  const [appliedPosts, setAppliedPosts] = useState(new Set());
  const { logout } = useAuthStore(); // Removed unused 'user'
  const navigate = useNavigate();

  useEffect(() => {
    // Load posts
    const fetchPosts = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.technology) params.append("technology", filters.technology);
      if (filters.position) params.append("position", filters.position);

      try {
        const res = await api.get(`/posts?${params.toString()}`);
        setPosts(res.data.data.data || res.data.data);
      } catch (err) {
        setError("Failed to load posts.");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    // Load applications
    const fetchApplications = async () => {
      try {
        const res = await api.get("/seeker/applications");
        const applications = res.data.data.data || res.data.data;
        const postIds = new Set(
          applications.map((app) => app.internship_post_id)
        );
        setAppliedPosts(postIds);
      } catch (err) {
        console.error("Failed to load applications:", err);
      }
    };

    fetchPosts();
    fetchApplications();
  }, [filters.technology, filters.position]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Triggers useEffect by updating filters
    setFilters({ ...filters });
  };

  const handleApply = (postId) => {
    setApplyingPostId(postId);
    api
      .post("/applications", { post_id: postId })
      .then(() => {
        setAppliedPosts(new Set([...appliedPosts, postId]));
        setApplyingPostId(null);
        alert("Application submitted successfully!");
      })
      .catch((err) => {
        setApplyingPostId(null);
        const message =
          err.response?.data?.message || "Failed to submit application.";
        alert(message);
      });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading)
    return (
      <div className="seeker-posts-loading">Loading internship posts...</div>
    );

  return (
    <div className="seeker-posts-page">
      {/* Navbar */}
      <nav className="seeker-posts-navbar">
        <div className="seeker-posts-navbar-container">
          <div className="seeker-posts-navbar-content">
            <h1 className="seeker-posts-navbar-brand">Internship Portal</h1>
            <div className="seeker-posts-navbar-actions">
              <button
                onClick={() => navigate("/profile")}
                className="seeker-posts-nav-button"
              >
                My Profile
              </button>
              <button
                onClick={() => navigate("/my-applications")}
                className="seeker-posts-nav-button"
              >
                My Applications
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

      {/* Main Content */}
      <div className="seeker-posts-container">
        {/* Header */}
        <div className="seeker-posts-header">
          <div>
            <h1 className="seeker-posts-title">Browse Internships</h1>
            <p className="seeker-posts-subtitle">
              Find your next opportunity from top companies
            </p>
          </div>
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

        {/* Posts Grid */}
        {error ? (
          <div className="seeker-posts-error">{error}</div>
        ) : posts.length === 0 ? (
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
        ) : (
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
                          : `${import.meta.env.VITE_API_URL}/storage/${
                              post.photo
                            }`
                      }
                      alt={post.position}
                      className="seeker-post-photo"
                    />
                  )}
                  <div className="seeker-post-content">
                    <div className="seeker-post-company">
                      {post.company?.user?.name || "Company"}
                    </div>
                    <h3 className="seeker-post-position">{post.position}</h3>
                    <div className="seeker-post-technology">
                      {post.technology}
                    </div>
                    {post.description && (
                      <p className="seeker-post-description">
                        {post.description.length > 150
                          ? `${post.description.substring(0, 150)}...`
                          : post.description}
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
