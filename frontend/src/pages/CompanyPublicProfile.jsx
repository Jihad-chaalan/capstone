import "../styles/CompanyPublicProfilePage.css";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

const CompanyPublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingPostId, setApplyingPostId] = useState(null);
  const [appliedPosts, setAppliedPosts] = useState(new Set());
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/companies/${id}`);
        if (response.data.success) {
          setCompany(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Failed to load company profile");
      } finally {
        setLoading(false);
      }
    };

    const fetchApplications = async () => {
      try {
        const response = await api.get("/seeker/applications");
        const applications =
          response.data.data.data || response.data.data || [];
        const postIds = new Set(
          applications.map((app) => app.internship_post_id),
        );
        setAppliedPosts(postIds);
      } catch (err) {
        console.error("Failed to load applications:", err);
      }
    };

    fetchCompanyProfile();
    fetchApplications();
  }, [id]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Company profile link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="company-public-page">
        <div className="company-public-loading">
          <div className="loading-spinner"></div>
          <p>Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="company-public-page">
        <div className="company-public-empty">
          <svg
            className="empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2>Company Not Found</h2>
          <p>
            {error || "The company profile you're looking for doesn't exist."}
          </p>
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const logo = company.photo
    ? `http://localhost:8000/storage/${company.photo}`
    : "";
  const posts = [...(company.posts || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  ); // Newest first
  const isVerified = company.verification_status === "verified";

  return (
    <div className="company-public-page">
      {/* Banner with Back Button */}
      <div className="company-banner">
        <div className="banner-gradient"></div>
        <button onClick={() => navigate(-1)} className="btn-back-arrow">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {/* Back */}
        </button>
      </div>

      <div className="company-public-container">
        {/* Sidebar */}
        <aside className="company-public-aside">
          <div className="company-card">
            {/* Logo */}
            <div className="company-logo-wrap">
              {logo ? (
                <img
                  src={logo}
                  alt={company.user?.name}
                  className="company-logo"
                />
              ) : (
                <div className="company-logo-placeholder">
                  {(company.user?.name || "C").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Company Name */}
            <h1 className="company-name">{company.user?.name || "Company"}</h1>

            {/* Verification Badge */}
            {isVerified && (
              <div className="verification-badge">
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Company
              </div>
            )}

            {/* Contact Info */}
            <div className="company-contact-section">
              {company.address && (
                <div className="contact-item">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{company.address}</span>
                </div>
              )}

              {company.website_link && (
                <a
                  className="contact-item"
                  href={company.website_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <span>Visit Website</span>
                </a>
              )}

              {company.user?.email && (
                <a
                  className="contact-item"
                  href={`mailto:${company.user.email}`}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{company.user.email}</span>
                </a>
              )}
            </div>

            {/* Contact Button */}
            <button
              onClick={() => setShowContactModal(true)}
              className="btn-contact-company"
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
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Contact Company
            </button>

            {/* Stats */}
            <div className="company-stats">
              <div className="stat-item">
                <span className="stat-value">{posts.length}</span>
                <span className="stat-label">Open Positions</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="company-public-main">
          {/* About Section */}
          {company.description && (
            <section className="content-card company-about">
              <div className="card-header">
                <h2 className="card-title">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  About the Company
                </h2>
              </div>
              <div className="card-content">
                <p className="company-description">{company.description}</p>
              </div>
            </section>
          )}

          {/* Open Positions Section */}
          <section className="content-card company-positions">
            <div className="card-header">
              <h2 className="card-title">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Open Positions
                <span className="count-badge">{posts.length}</span>
              </h2>
            </div>
            <div className="card-content">
              {posts.length === 0 ? (
                <div className="empty-state">
                  <svg
                    className="empty-icon-small"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p>No open positions at the moment.</p>
                </div>
              ) : (
                <div className="positions-grid">
                  {posts.map((post) => {
                    const hasApplied = appliedPosts.has(post.id);
                    const isApplying = applyingPostId === post.id;

                    return (
                      <div key={post.id} className="position-card">
                        {post.photo && (
                          <div className="position-image">
                            <img
                              src={`http://localhost:8000/storage/${post.photo}`}
                              alt={post.position}
                            />
                          </div>
                        )}
                        <div className="position-content">
                          <h3 className="position-title">{post.position}</h3>
                          {post.technology && (
                            <div className="position-tech">
                              <span className="tech-badge">
                                {post.technology}
                              </span>
                            </div>
                          )}
                          {post.description && (
                            <p className="position-description">
                              {post.description}
                            </p>
                          )}
                          <div className="position-footer">
                            {hasApplied ? (
                              <button className="btn-applied" disabled>
                                <svg
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Applied
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApply(post.id)}
                                disabled={isApplying}
                                className="btn-apply"
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
          </section>
        </main>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowContactModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Contact {company.user?.name}</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="contact-info-list">
                {company.user?.email && (
                  <div className="contact-info-item">
                    <span className="info-label">Email</span>
                    <a
                      href={`mailto:${company.user.email}`}
                      className="info-value"
                    >
                      {company.user.email}
                    </a>
                  </div>
                )}
                {company.website_link && (
                  <div className="contact-info-item">
                    <span className="info-label">Website</span>
                    <a
                      href={company.website_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="info-value"
                    >
                      {company.website_link}
                    </a>
                  </div>
                )}
                {company.address && (
                  <div className="contact-info-item">
                    <span className="info-label">Address</span>
                    <span className="info-value-text">{company.address}</span>
                  </div>
                )}
                <div className="contact-info-item">
                  <span className="info-label">Profile Link</span>
                  <div className="copy-link-group">
                    <input
                      type="text"
                      value={window.location.href}
                      readOnly
                      className="link-input"
                    />
                    <button onClick={handleCopyLink} className="copy-btn">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPublicProfilePage;
