import "../styles/SeekerPublicProfile.css";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

const SeekerPublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seeker, setSeeker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchSeeker = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/seekers/${id}`);
        setSeeker(res.data.data);
      } catch (err) {
        console.error("Error fetching seeker:", err);
        setError("Seeker not found");
      } finally {
        setLoading(false);
      }
    };
    fetchSeeker();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="seeker-public-page">
        <div className="seeker-public-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !seeker) {
    return (
      <div className="seeker-public-page">
        <div className="seeker-public-empty">
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
          <h2>Profile Not Found</h2>
          <p>
            {error || "The seeker profile you're looking for doesn't exist."}
          </p>
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const user = seeker.user || {};
  const photo =
    seeker.photo && seeker.photo.startsWith("http")
      ? seeker.photo
      : seeker.photo
        ? `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
        : "";

  const skills = seeker.skillsList || seeker.skills_list || seeker.skills || [];
  const projects = seeker.projects || [];
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  // Calculate profile completeness
  const completenessFactors = [
    !!seeker.photo,
    !!seeker.description,
    skills.length > 0,
    projects.length > 0,
    !!user.phone_number,
  ];
  const completeness = Math.round(
    (completenessFactors.filter(Boolean).length / completenessFactors.length) *
      100,
  );

  return (
    <div className="seeker-public-page">
      {/* Profile Header Banner */}
      <div className="profile-banner">
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
          Back
        </button>
      </div>

      <div className="seeker-public-container">
        {/* Sidebar */}
        <aside className="seeker-public-aside">
          <div className="profile-card">
            <div className="seeker-photo-wrap">
              {photo ? (
                <img
                  src={photo}
                  alt={user.name || "Seeker"}
                  className="seeker-photo"
                />
              ) : (
                <div className="seeker-photo-placeholder">
                  {(user.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-completeness">
                <svg className="progress-ring" width="60" height="60">
                  <circle
                    className="progress-ring-circle"
                    stroke="#E5E0D8"
                    strokeWidth="4"
                    fill="transparent"
                    r="26"
                    cx="30"
                    cy="30"
                  />
                  <circle
                    className="progress-ring-circle progress"
                    stroke="#D97757"
                    strokeWidth="4"
                    fill="transparent"
                    r="26"
                    cx="30"
                    cy="30"
                    strokeDasharray={`${completeness * 1.63} 163`}
                    strokeDashoffset="0"
                  />
                </svg>
                <span className="completeness-text">{completeness}%</span>
              </div>
            </div>

            <h1 className="seeker-name">
              {user.name || seeker.name || "Unknown"}
            </h1>

            <div className="member-since">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Member since {memberSince}
            </div>

            {/* Contact Info */}
            <div className="contact-section">
              {user.email && (
                <a className="contact-item" href={`mailto:${user.email}`}>
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
                  {user.email}
                </a>
              )}
              {user.phone_number && (
                <a className="contact-item" href={`tel:${user.phone_number}`}>
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {user.phone_number}
                </a>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowContactModal(true)}
              className="btn-contact-primary"
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
              Contact Candidate
            </button>

            {/* Stats */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{projects.length}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">{skills.length}</span>
                <span className="stat-label">Skills</span>
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="seeker-skills-section">
                <h3 className="section-title">
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Skills & Technologies
                </h3>
                <div className="skills-list">
                  {skills.map((s, index) => (
                    <span key={s.id || index} className="skill-badge">
                      {s.name || s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="seeker-public-main">
          {/* About Section */}
          <section className="content-card seeker-about">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                About
              </h2>
            </div>
            <div className="card-content">
              {seeker.description ? (
                <p className="seeker-description">{seeker.description}</p>
              ) : (
                <div className="empty-state-inline">
                  <p>No description provided yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Ratings Section */}
          {seeker.ratings && seeker.ratings.length > 0 && (
            <section className="content-card seeker-ratings">
              <div className="card-header">
                <h2 className="card-title">
                  <svg
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Reviews & Ratings
                  <span className="count-badge">{seeker.ratings.length}</span>
                </h2>
                {seeker.average_rating > 0 && (
                  <div className="rating-summary">
                    <span className="rating-avg">
                      {Number(seeker.average_rating).toFixed(1)}
                    </span>
                    <span className="rating-stars">★</span>
                    <span className="rating-count">
                      ({seeker.rating_count}{" "}
                      {seeker.rating_count === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>
              <div className="card-content">
                <div className="ratings-list">
                  {seeker.ratings.map((rating) => (
                    <div key={rating.id} className="rating-item">
                      <div className="rating-header">
                        <div className="company-info">
                          <strong>
                            {rating.company?.user?.name || "Company"}
                          </strong>
                          <div className="rating-stars-display">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < rating.score
                                    ? "star-filled"
                                    : "star-empty"
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="rating-date">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="rating-comment">{rating.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Projects Section */}
          <section className="content-card seeker-projects">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Projects
                <span className="count-badge">{projects.length}</span>
              </h2>
            </div>
            <div className="card-content">
              {projects.length === 0 ? (
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p>No projects listed yet.</p>
                </div>
              ) : (
                <div className="projects-grid">
                  {projects.map((p) => (
                    <div key={p.id} className="project-card">
                      <div className="project-header">
                        <h3 className="project-title">{p.title}</h3>
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link-btn"
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
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            View Project
                          </a>
                        )}
                      </div>
                      {p.description && (
                        <p className="project-description">{p.description}</p>
                      )}
                    </div>
                  ))}
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
              <h2 className="modal-title">Contact {user.name}</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="contact-info-list">
                {user.email && (
                  <div className="contact-info-item">
                    <span className="info-label">Email</span>
                    <a href={`mailto:${user.email}`} className="info-value">
                      {user.email}
                    </a>
                  </div>
                )}
                {user.phone_number && (
                  <div className="contact-info-item">
                    <span className="info-label">Phone</span>
                    <a href={`tel:${user.phone_number}`} className="info-value">
                      {user.phone_number}
                    </a>
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

export default SeekerPublicProfilePage;
