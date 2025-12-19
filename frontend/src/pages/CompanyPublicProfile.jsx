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

  // useEffect(() => {
  //   fetchCompanyProfile();
  //   fetchApplications();
  // }, [id]);

  // const fetchCompanyProfile = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await api.get(`/companies/${id}`);
  //     if (response.data.success) {
  //       setCompany(response.data.data);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching company:", err);
  //     setError("Failed to load company profile");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchApplications = async () => {
  //   try {
  //     const response = await api.get("/seeker/applications");
  //     const applications = response.data.data.data || response.data.data || [];
  //     const postIds = new Set(
  //       applications.map((app) => app.internship_post_id)
  //     );
  //     setAppliedPosts(postIds);
  //   } catch (err) {
  //     console.error("Failed to load applications:", err);
  //   }
  // };
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
          applications.map((app) => app.internship_post_id)
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

  if (loading) {
    return (
      <div className="company-public-profile-page">
        <div className="loading-state">Loading company profile...</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="company-public-profile-page">
        <div className="error-state">
          <p>{error || "Company not found"}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="company-public-profile-page">
      <div className="company-public-container">
        {/* Header */}
        <div className="company-public-header">
          <button onClick={() => navigate(-1)} className="btn-back-arrow">
            ← Back
          </button>
        </div>

        {/* Company Info */}
        <div className="company-public-info">
          <div className="company-public-logo">
            {company.user?.photo ? (
              <img
                src={`http://localhost:8000/storage/${company.user.photo}`}
                alt={company.user?.name}
              />
            ) : (
              <div className="company-public-logo-placeholder">
                {company.user?.name?.charAt(0) || "C"}
              </div>
            )}
          </div>

          <div className="company-public-details">
            <h1>{company.user?.name}</h1>

            {company.verification_status === "verified" && (
              <span className="badge-verified">✓ Verified Company</span>
            )}

            {company.address && (
              <div className="company-info-item">
                <span className="icon">📍</span>
                <span>{company.address}</span>
              </div>
            )}

            {company.website_link && (
              <div className="company-info-item">
                <span className="icon">🌐</span>
                <a
                  href={company.website_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {company.website_link}
                </a>
              </div>
            )}

            {company.user?.email && (
              <div className="company-info-item">
                <span className="icon">✉️</span>
                <span>{company.user.email}</span>
              </div>
            )}

            {company.description && (
              <div className="company-description">
                <h3>About Us</h3>
                <p>{company.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Company Posts */}
        <div className="company-posts-section">
          <h2>Open Positions</h2>
          {company.posts && company.posts.length > 0 ? (
            <div className="posts-grid">
              {company.posts.map((post) => {
                const hasApplied = appliedPosts.has(post.id);
                const isApplying = applyingPostId === post.id;

                return (
                  <div key={post.id} className="post-card">
                    {post.photo && (
                      <div className="post-image">
                        <img
                          src={`http://localhost:8000/storage/${post.photo}`}
                          alt={post.position}
                        />
                      </div>
                    )}
                    <div className="post-content">
                      <h3>{post.position}</h3>
                      {post.technology && (
                        <div className="post-technology">
                          <span className="tech-badge">{post.technology}</span>
                        </div>
                      )}
                      <p className="post-description">{post.description}</p>
                      <div className="post-actions">
                        {hasApplied ? (
                          <button className="btn-applied" disabled>
                            ✓ Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(post.id)}
                            disabled={isApplying}
                            className="btn-view-post"
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
          ) : (
            <p className="no-posts">No open positions at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyPublicProfilePage;
