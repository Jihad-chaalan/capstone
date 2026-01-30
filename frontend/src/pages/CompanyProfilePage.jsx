import "../styles/CompanyProfilePage.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const FullStar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const HalfStar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="half">
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#ccc" />
      </linearGradient>
    </defs>
    <path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill="url(#half)"
    />
  </svg>
);

const EmptyStar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#ccc">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const RatingForm = ({ initialScore = 5, onSubmit, onCancel }) => {
  const [score, setScore] = useState(initialScore);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getStarType = (index) => {
    const value = hover !== null ? hover : score;
    if (value >= index + 1) return "full";
    if (value >= index + 0.5) return "half";
    return "empty";
  };

  const handleClick = (index, e) => {
    const { left, width } = e.target.getBoundingClientRect();
    setScore(e.clientX - left < width / 2 ? index + 0.5 : index + 1);
  };

  const handleMouseMove = (index, e) => {
    const { left, width } = e.target.getBoundingClientRect();
    setHover(e.clientX - left < width / 2 ? index + 0.5 : index + 1);
  };

  const handleMouseLeave = () => setHover(null);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ score, comment });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <label style={{ display: "block", marginBottom: 6 }}>Rating</label>
      <div style={{ marginBottom: 12, display: "flex" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const type = getStarType(i);
          return (
            <span
              key={i}
              style={{ cursor: "pointer", marginRight: 4 }}
              onClick={(e) => handleClick(i, e)}
              onMouseMove={(e) => handleMouseMove(i, e)}
              onMouseLeave={handleMouseLeave}
              aria-label={`${i + 1} star`}
              role="button"
            >
              {type === "full" ? (
                <FullStar />
              ) : type === "half" ? (
                <HalfStar />
              ) : (
                <EmptyStar />
              )}
            </span>
          );
        })}
      </div>
      <label style={{ display: "block", marginTop: 12, marginBottom: 6 }}>
        Comment (optional)
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
      />
      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Rating"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

const CompanyProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const fileInputRef = useRef(null);
  const postFileInputRef = useRef(null);

  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    website: "",
    description: "",
    logo: "",
    posts: [],
    verification_status: "pending",
    rejection_reason: null,
  });
  const [form, setForm] = useState({
    address: "",
    website_link: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState({
    position: "",
    technology: "",
    description: "",
  });
  const [postPhotoFile, setPostPhotoFile] = useState(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [postSaving, setPostSaving] = useState(false);
  const [postError, setPostError] = useState(null);
  const [postSuccess, setPostSuccess] = useState(false);

  const [applications, setApplications] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingApplicationId, setRatingApplicationId] = useState(null);

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 10000);
  };

  // Smooth scroll helper function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const normalizeList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  async function loadProfile() {
    try {
      const res = await api.get("/company/me");
      const company = res.data.data;
      const logoUrl = company.photo
        ? company.photo.startsWith("http")
          ? company.photo
          : `${import.meta.env.VITE_API_URL}/storage/${company.photo}`
        : "";

      setForm({
        address: company.address || "",
        website_link: company.website_link || "",
        description: company.description || "",
      });
      setCompanyData({
        name: company.user?.name || "Company Name",
        address: company.address || "Address not provided",
        website: company.website_link || "Website not provided",
        description: company.description || "No description available",
        logo: logoUrl,
        posts: company.posts || [],
        verification_status: company.verification_status || "pending",
        rejection_reason: company.rejection_reason || null,
      });
      setPosts(company.posts || []);
      setPhotoPreview(logoUrl);
      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile.");
      setLoading(false);
    }
  }

  async function fetchApplications() {
    try {
      const res = await api.get("/company/applications");
      const list = normalizeList(res.data?.data);
      setApplications(list);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setApplications([]);
    }
  }

  async function fetchIncomingRequests() {
    try {
      const res = await api.get("/company/requests");
      setIncomingRequests(res.data.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
      fetchApplications();
      fetchIncomingRequests();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("address", form.address || "");
    formData.append("website_link", form.website_link || "");
    formData.append("description", form.description || "");
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      const res = await api.post("/company/update?_method=PUT", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const company = res.data.data;
      const logoUrl = company.photo
        ? company.photo.startsWith("http")
          ? company.photo
          : `${import.meta.env.VITE_API_URL}/storage/${company.photo}`
        : "";

      setForm({
        address: company.address || "",
        website_link: company.website_link || "",
        description: company.description || "",
      });
      setCompanyData({
        name: company.user?.name || "Company Name",
        address: company.address || "Address not provided",
        website: company.website_link || "Website not provided",
        description: company.description || "No description available",
        logo: logoUrl,
        posts: company.posts || [],
        verification_status: company.verification_status || "pending",
        rejection_reason: company.rejection_reason || null,
      });
      setPhotoPreview(logoUrl);
      setSuccess(true);
      setSaving(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile.");
      setSaving(false);
    }
  };

  const handlePostInputChange = (e) => {
    setPostForm({ ...postForm, [e.target.name]: e.target.value });
    setPostSuccess(false);
    setPostError(null);
  };

  const handlePostPhotoChange = (e) => {
    const file = e.target.files[0];
    setPostPhotoFile(file);
    if (file) {
      setPostPhotoPreview(URL.createObjectURL(file));
    }
    setPostSuccess(false);
    setPostError(null);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setPostSaving(true);
    setPostError(null);
    setPostSuccess(false);

    const formData = new FormData();
    formData.append("position", postForm.position);
    formData.append("technology", postForm.technology);
    formData.append("description", postForm.description || "");
    if (postPhotoFile) {
      formData.append("photo", postPhotoFile);
    }

    try {
      if (editingPostId) {
        await api.post(`/posts/${editingPostId}?_method=PUT`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setPostSuccess(true);
      setPostSaving(false);
      setPostForm({ position: "", technology: "", description: "" });
      setPostPhotoFile(null);
      setPostPhotoPreview("");
      setEditingPostId(null);
      await loadProfile();
    } catch (err) {
      console.error("Error saving post:", err);
      setPostError("Failed to save post.");
      setPostSaving(false);
    }
  };

  const handleEditPost = (post) => {
    setPostForm({
      position: post.position,
      technology: post.technology,
      description: post.description || "",
    });
    setPostPhotoPreview(
      post.photo
        ? post.photo.startsWith("http")
          ? post.photo
          : `${import.meta.env.VITE_API_URL}/storage/${post.photo}`
        : "",
    );
    setEditingPostId(post.id);
    setPostSuccess(false);
    setPostError(null);

    // Scroll to add post section when editing
    setTimeout(() => scrollToSection("add-post-section"), 100);
  };

  const handleCancelEdit = () => {
    setPostForm({ position: "", technology: "", description: "" });
    setPostPhotoFile(null);
    setPostPhotoPreview("");
    setEditingPostId(null);
    setPostError(null);
    setPostSuccess(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    try {
      await api.delete(`/posts/${postId}`);
      await loadProfile();
    } catch (err) {
      console.error("Error deleting post:", err);
      setPostError("Failed to delete post.");
    }
  };

  const handleViewApplicants = async (post) => {
    setSelectedPost(post);
    setLoadingApplicants(true);
    setShowApplicantsModal(true);

    try {
      const res = await api.get(`/posts/${post.id}/applications`);
      setApplicants(normalizeList(res.data.data));
      setLoadingApplicants(false);
    } catch (err) {
      console.error("Error loading applicants:", err);
      setLoadingApplicants(false);
      showToast("Failed to load applicants", "error");
    }
  };

  const closeApplicantsModal = () => {
    setShowApplicantsModal(false);
    setSelectedPost(null);
    setApplicants([]);
  };

  const acceptApplication = async (applicationId) => {
    try {
      await api.post(`/applications/${applicationId}/accept`);

      const acceptedApp = applicants.find((app) => app.id === applicationId);

      if (acceptedApp && acceptedApp.seeker) {
        const seekerName =
          acceptedApp.seeker.user?.name ||
          acceptedApp.seeker.name ||
          "the seeker";
        const seekerEmail = acceptedApp.seeker.user?.email || "Not provided";
        const seekerPhone =
          acceptedApp.seeker.user?.phone_number || "Not provided";

        showToast(
          `✅ Accepted ${seekerName}! Contact: ${seekerEmail} | ${seekerPhone}`,
          "success",
        );
      } else {
        showToast("Application accepted successfully!", "success");
      }

      await fetchApplications();
      if (selectedPost) await handleViewApplicants(selectedPost);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to accept", "error");
    }
  };

  const rejectApplication = async (applicationId) => {
    if (!window.confirm("Reject this applicant?")) return;
    try {
      await api.post(`/applications/${applicationId}/reject`);
      await fetchApplications();
      if (selectedPost) await handleViewApplicants(selectedPost);
      showToast("Application rejected", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to reject", "error");
    }
  };

  const completeApplication = async (applicationId) => {
    if (!window.confirm("Mark this internship as finished?")) return;
    try {
      await api.post(`/applications/${applicationId}/complete`);
      await fetchApplications();
      if (selectedPost) await handleViewApplicants(selectedPost);

      setRatingApplicationId(applicationId);
      setRatingModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to mark finished",
        "error",
      );
    }
  };

  const submitRating = async ({ score, comment }) => {
    try {
      await api.post(`/applications/${ratingApplicationId}/rating`, {
        score,
        comment,
      });
      setRatingModalOpen(false);
      setRatingApplicationId(null);
      await fetchApplications();
      if (selectedPost) await handleViewApplicants(selectedPost);
      showToast("Rating saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to save rating",
        "error",
      );
    }
  };

  const safeApplications = Array.isArray(applications) ? applications : [];
  const acceptedInterns = safeApplications.filter((a) =>
    ["accepted", "in_progress"].includes(a.status),
  );

  if (loading) {
    return (
      <div className="company-profile-loading">Loading your profile...</div>
    );
  }

  return (
    <div className="company-profile-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <nav className="company-profile-navbar">
        <div className="company-profile-navbar-container">
          <div className="company-profile-navbar-content">
            <h1 className="company-profile-navbar-brand">InternLeb</h1>
            <div className="company-profile-navbar-actions">
              <button
                onClick={() => navigate("/company/requests")}
                className="company-profile-nav-button"
                title="University Requests"
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
                {incomingRequests.filter((r) => r.status === "pending").length >
                  0 && (
                  <span className="notification-badge">
                    {
                      incomingRequests.filter((r) => r.status === "pending")
                        .length
                    }
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="company-profile-nav-logout"
                title="Sign Out"
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
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* QUICK ACTIONS FLOATING BUTTONS */}
      <div className="company-quick-actions">
        <button
          onClick={() => scrollToSection("add-post-section")}
          className="quick-action-btn quick-action-primary"
          title="Add Post"
        >
          +{/* + Add Post */}
        </button>
        <button
          onClick={() => scrollToSection("edit-profile-section")}
          className="quick-action-btn"
          title="Edit Profile"
        >
          ✏️
          {/* Edit Profile */}
        </button>
      </div>

      <div className="company-profile-container">
        {companyData.verification_status === "pending" && (
          <div className="verification-alert pending">
            <div className="verification-alert-content">
              <h4>Account Pending Verification</h4>
              <p>Your company account is currently under review.</p>
            </div>
          </div>
        )}
        {companyData.verification_status === "rejected" &&
          companyData.rejection_reason && (
            <div className="verification-alert rejected">
              <div className="verification-alert-content">
                <h4>Verification Rejected</h4>
                <p>
                  <strong>Reason:</strong> {companyData.rejection_reason}
                </p>
              </div>
            </div>
          )}

        <div id="profile-header-section" className="company-profile-header">
          <div className="company-profile-banner"></div>
          <div className="company-profile-info-section">
            <div className="company-profile-logo-wrapper">
              {companyData.logo ? (
                <img
                  src={companyData.logo}
                  alt="Company Logo"
                  className="company-profile-logo"
                />
              ) : (
                <div className="company-profile-logo company-profile-logo-placeholder">
                  <span>{companyData.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="company-profile-details">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <h1 className="company-profile-name">{companyData.name}</h1>
                {companyData.verification_status && (
                  <span
                    className={`verification-badge ${companyData.verification_status}`}
                  >
                    {companyData.verification_status === "verified" && "✓ "}
                    {companyData.verification_status === "verified"
                      ? "Verified"
                      : companyData.verification_status === "pending"
                        ? "⏳ Pending"
                        : "❌ Rejected"}
                  </span>
                )}
              </div>
              <p className="company-profile-type">Company</p>
              <div className="company-profile-meta">
                <div className="company-profile-meta-item">
                  <span>📍 {companyData.address}</span>
                </div>
                <div className="company-profile-meta-item">
                  {companyData.website !== "Website not provided" ? (
                    <a
                      href={companyData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="company-profile-link"
                    >
                      🌐 {companyData.website}
                    </a>
                  ) : (
                    <span>🌐 {companyData.website}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="company-profile-about-section">
            <h3 className="company-profile-about-title">About us</h3>
            <p className="company-profile-about-text">
              {companyData.description}
            </p>
          </div>
        </div>

        <div className="company-accepted-section">
          <h2 className="company-profile-section-title">
            Active Interns ({acceptedInterns.length})
          </h2>
          {acceptedInterns.length === 0 ? (
            <p className="company-requests-empty">No active interns now.</p>
          ) : (
            <div className="accepted-list">
              {acceptedInterns.map((app) => (
                <div key={app.id} className="accepted-item">
                  <div className="accepted-info">
                    <div className="accepted-photo">
                      {app.seeker?.photo ? (
                        <img
                          src={
                            app.seeker.photo.startsWith("http")
                              ? app.seeker.photo
                              : `${import.meta.env.VITE_API_URL}/storage/${
                                  app.seeker.photo
                                }`
                          }
                          alt={app.seeker.user?.name}
                        />
                      ) : (
                        <div className="accepted-photo-placeholder">
                          {app.seeker?.user?.name?.charAt(0).toUpperCase() ||
                            "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="accepted-name">
                        {app.seeker?.user?.name || "Unknown"}
                      </div>
                      <div className="accepted-meta">
                        {app.status} • {app.post?.position}
                      </div>
                    </div>
                  </div>
                  <div className="accepted-actions">
                    <button
                      onClick={() => rejectApplication(app.id)}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => completeApplication(app.id)}
                      className="btn-finish"
                    >
                      Finish Internship
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="company-requests-section company-requests-link-card"
          onClick={() => navigate("/company/requests")}
        >
          <h2 className="company-profile-section-title">
            University Requests
            {incomingRequests.length > 0 && (
              <span className="requests-count-badge">
                {incomingRequests.length}
              </span>
            )}
          </h2>
          <p className="requests-link-text">
            View and manage internship requests from universities
          </p>
          <button className="requests-view-all-btn">View All Requests →</button>
        </div>

        {companyData.posts.length > 0 && (
          <div className="company-profile-posts-card">
            <h2 className="company-profile-posts-title">
              Internship Opportunities
            </h2>
            <div className="company-profile-posts-list">
              {companyData.posts.map((post) => (
                <div key={post.id} className="company-profile-post-item">
                  {/* {post.photo && (
                    <img
                      src={
                        post.photo.startsWith("http")
                          ? post.photo
                          : `${import.meta.env.VITE_API_URL}/storage/${
                              post.photo
                            }`
                      }
                      alt={post.position}
                      className="company-profile-post-photo"
                    />
                  )} */}
                  <div className="company-profile-post-content">
                    <h3 className="company-profile-post-title">
                      {post.position}
                    </h3>
                    <p className="company-profile-post-technology">
                      {post.technology}
                    </p>
                    {post.description && (
                      <p className="company-profile-post-description">
                        {post.description}
                      </p>
                    )}
                    <button
                      onClick={() => handleViewApplicants(post)}
                      className="company-profile-view-applicants-btn"
                    >
                      View Applicants ({post.applications_count || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div id="edit-profile-section" className="company-profile-form-card">
          <h2 className="company-profile-form-title">Edit Company Profile</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="company-profile-form-group">
              <label htmlFor="photo" className="company-profile-label">
                Company Logo
              </label>
              <div className="company-profile-file-input-group">
                <input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="company-profile-file-input"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Logo Preview"
                    className="company-profile-logo-preview"
                  />
                )}
              </div>
            </div>
            <div className="company-profile-form-group">
              <label htmlFor="address" className="company-profile-label">
                Address
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                placeholder="e.g. 123 Business St, City, Country"
                className="company-profile-input"
              />
            </div>
            <div className="company-profile-form-group">
              <label htmlFor="website_link" className="company-profile-label">
                Website
              </label>
              <input
                id="website_link"
                type="url"
                name="website_link"
                value={form.website_link}
                onChange={handleInputChange}
                placeholder="https://www.yourcompany.com"
                className="company-profile-input"
              />
            </div>
            <div className="company-profile-form-group">
              <label htmlFor="description" className="company-profile-label">
                About us
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about your company"
                className="company-profile-textarea"
              />
            </div>
            <button
              type="submit"
              className="company-profile-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {success && (
              <div className="company-profile-success">
                Profile updated successfully!
              </div>
            )}
            {error && <div className="company-profile-error">{error}</div>}
          </form>
        </div>

        <div id="add-post-section" className="company-profile-form-card">
          <h2 className="company-profile-form-title">
            {editingPostId ? "Edit Post" : "Add New Internship Post"}
          </h2>
          <form onSubmit={handlePostSubmit} encType="multipart/form-data">
            <div className="company-profile-form-group">
              <label htmlFor="position" className="company-profile-label">
                Position
              </label>
              <input
                id="position"
                type="text"
                name="position"
                value={postForm.position}
                onChange={handlePostInputChange}
                placeholder="e.g. Full Stack Developer Intern"
                className="company-profile-input"
                required
              />
            </div>
            <div className="company-profile-form-group">
              <label htmlFor="technology" className="company-profile-label">
                Technology
              </label>
              <input
                id="technology"
                type="text"
                name="technology"
                value={postForm.technology}
                onChange={handlePostInputChange}
                placeholder="e.g. React, Node.js, MongoDB"
                className="company-profile-input"
                required
              />
            </div>
            <div className="company-profile-form-group">
              <label
                htmlFor="post-description"
                className="company-profile-label"
              >
                Description
              </label>
              <textarea
                id="post-description"
                name="description"
                value={postForm.description}
                onChange={handlePostInputChange}
                rows={4}
                placeholder="Describe the internship opportunity"
                className="company-profile-textarea"
              />
            </div>
            <div className="company-profile-form-group">
              <label htmlFor="post-photo" className="company-profile-label">
                Post Image
              </label>
              <div className="company-profile-file-input-group">
                <input
                  ref={postFileInputRef}
                  id="post-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePostPhotoChange}
                  className="company-profile-file-input"
                />
                {postPhotoPreview && (
                  <img
                    src={postPhotoPreview}
                    alt="Post Preview"
                    className="company-profile-post-preview"
                  />
                )}
              </div>
            </div>
            <div className="company-profile-button-group">
              <button
                type="submit"
                className="company-profile-button"
                disabled={postSaving}
              >
                {postSaving
                  ? "Saving..."
                  : editingPostId
                    ? "Update Post"
                    : "Add Post"}
              </button>
              {editingPostId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="company-profile-button-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
            {postSuccess && (
              <div className="company-profile-success">
                Post {editingPostId ? "updated" : "added"} successfully!
              </div>
            )}
            {postError && (
              <div className="company-profile-error">{postError}</div>
            )}
          </form>

          {posts.length > 0 && (
            <div className="company-profile-posts-manage">
              <h3 className="company-profile-manage-title">Your Posts</h3>
              <div className="company-profile-manage-list">
                {posts.map((post) => (
                  <div key={post.id} className="company-profile-manage-item">
                    <div className="company-profile-manage-content">
                      <h4 className="company-profile-manage-post-title">
                        {post.position}
                      </h4>
                      <p className="company-profile-manage-technology">
                        {post.technology}
                      </p>
                    </div>
                    <div className="company-profile-manage-actions">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="company-profile-icon-button company-profile-icon-button-edit"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="company-profile-icon-button company-profile-icon-button-delete"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showApplicantsModal && (
        <div className="company-modal-overlay" onClick={closeApplicantsModal}>
          <div
            className="company-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="company-modal-header">
              <h2 className="company-modal-title">
                Applicants for {selectedPost?.position}
              </h2>
              <button
                onClick={closeApplicantsModal}
                className="company-modal-close"
              >
                ×
              </button>
            </div>
            <div className="company-modal-body">
              {loadingApplicants ? (
                <div className="company-modal-loading">
                  Loading applicants...
                </div>
              ) : applicants.length === 0 ? (
                <div className="company-modal-empty">
                  No applicants yet for this position.
                </div>
              ) : (
                <div className="company-applicants-list">
                  {applicants.map((application) => {
                    const seeker = application.seeker || {};
                    const seekerId = seeker.id;
                    const seekerName =
                      seeker.user?.name || seeker.name || "Unknown";
                    const photo = seeker.photo
                      ? seeker.photo.startsWith("http")
                        ? seeker.photo
                        : `${import.meta.env.VITE_API_URL}/storage/${
                            seeker.photo
                          }`
                      : null;

                    return (
                      <div
                        key={application.id}
                        className="company-applicant-compact"
                      >
                        <button
                          className="applicant-link"
                          onClick={() => {
                            if (seekerId) navigate(`/seekers/${seekerId}`);
                            closeApplicantsModal();
                          }}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt={seekerName}
                              className="company-applicant-photo"
                            />
                          ) : (
                            <div className="company-applicant-photo-placeholder">
                              {seekerName?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <span className="company-applicant-name">
                            {seekerName}
                          </span>
                        </button>
                        <div className="company-applicant-actions">
                          {application.status === "applied" && (
                            <>
                              <button
                                onClick={() =>
                                  acceptApplication(application.id)
                                }
                                className="btn-accept"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  rejectApplication(application.id)
                                }
                                className="btn-reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {["accepted", "in_progress"].includes(
                            application.status,
                          ) && (
                            <>
                              <button
                                onClick={() =>
                                  rejectApplication(application.id)
                                }
                                className="btn-reject"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() =>
                                  completeApplication(application.id)
                                }
                                className="btn-finish"
                              >
                                Finish Internship
                              </button>
                            </>
                          )}
                          {application.status === "completed" && (
                            <span className="badge-rated">
                              ✓ Completed & Rated
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {ratingModalOpen && (
        <div
          className="company-modal-overlay"
          onClick={() => setRatingModalOpen(false)}
        >
          <div
            className="company-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="company-modal-header">
              <h2 className="company-modal-title">Rate Intern</h2>
              <button
                onClick={() => setRatingModalOpen(false)}
                className="company-modal-close"
              >
                ×
              </button>
            </div>
            <div className="company-modal-body">
              <RatingForm
                onCancel={() => setRatingModalOpen(false)}
                onSubmit={submitRating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfilePage;
