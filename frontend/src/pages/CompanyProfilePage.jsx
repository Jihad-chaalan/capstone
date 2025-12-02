import "../styles/CompanyProfilePage.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const CompanyProfilePage = () => {
  const [form, setForm] = useState({
    address: "",
    website_link: "",
    description: "",
  });
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    website: "",
    description: "",
    logo: "",
    posts: [],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Post management state
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
  const postFileInputRef = useRef(null);

  // Applicants state
  const [selectedPost, setSelectedPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);

  // University requests state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Close menu when clicking outside
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

  const loadProfile = () => {
    api
      .get("/company/me")
      .then((res) => {
        const company = res.data.data;
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
          logo: company.photo
            ? company.photo.startsWith("http")
              ? company.photo
              : `${import.meta.env.VITE_API_URL}/storage/${company.photo}`
            : "",
          posts: company.posts || [],
        });
        setPosts(company.posts || []);
        setPhotoPreview(
          company.photo
            ? company.photo.startsWith("http")
              ? company.photo
              : `${import.meta.env.VITE_API_URL}/storage/${company.photo}`
            : ""
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
  };

  const fetchIncomingRequests = async () => {
    try {
      const res = await api.get("/company/requests");
      setIncomingRequests(res.data.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      loadProfile();
      await fetchIncomingRequests();
    };
    loadData();
  }, []);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("address", form.address ?? "");
    formData.append("website_link", form.website_link ?? "");
    formData.append("description", form.description ?? "");
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    api
      .post("/company/update?_method=PUT", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setSuccess(true);
        setSaving(false);
        const company = res.data.data;
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
          logo: company.photo
            ? company.photo.startsWith("http")
              ? company.photo
              : `${import.meta.env.VITE_API_URL}/storage/${company.photo}`
            : "",
          posts: company.posts || [],
        });
        setPhotoPreview(
          company.photo
            ? company.photo.startsWith("http")
              ? company.photo
              : `${import.meta.env.VITE_API_URL}/storage/${company.photo}`
            : ""
        );
      })
      .catch(() => {
        setError("Failed to update profile.");
        setSaving(false);
      });
  };

  // Post management handlers
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

  const handlePostSubmit = (e) => {
    e.preventDefault();
    setPostSaving(true);
    setPostError(null);
    setPostSuccess(false);

    const formData = new FormData();
    formData.append("position", postForm.position);
    formData.append("technology", postForm.technology);
    formData.append("description", postForm.description ?? "");
    if (postPhotoFile) {
      formData.append("photo", postPhotoFile);
    }

    const request = editingPostId
      ? api.post(`/posts/${editingPostId}?_method=PUT`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

    request
      .then(() => {
        setPostSuccess(true);
        setPostSaving(false);
        setPostForm({ position: "", technology: "", description: "" });
        setPostPhotoFile(null);
        setPostPhotoPreview("");
        setEditingPostId(null);
        loadProfile();
      })
      .catch(() => {
        setPostError("Failed to save post.");
        setPostSaving(false);
      });
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
        : ""
    );
    setEditingPostId(post.id);
    setPostSuccess(false);
    setPostError(null);
  };

  const handleCancelEdit = () => {
    setPostForm({ position: "", technology: "", description: "" });
    setPostPhotoFile(null);
    setPostPhotoPreview("");
    setEditingPostId(null);
    setPostError(null);
    setPostSuccess(false);
  };

  const handleDeletePost = (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    api
      .delete(`/posts/${postId}`)
      .then(() => {
        loadProfile();
      })
      .catch(() => {
        setPostError("Failed to delete post.");
      });
  };

  // Applicants handlers
  const handleViewApplicants = (post) => {
    setSelectedPost(post);
    setLoadingApplicants(true);
    setShowApplicantsModal(true);

    api
      .get(`/posts/${post.id}/applications`)
      .then((res) => {
        setApplicants(res.data.data);
        setLoadingApplicants(false);
      })
      .catch(() => {
        setLoadingApplicants(false);
        alert("Failed to load applicants.");
      });
  };

  const closeApplicantsModal = () => {
    setShowApplicantsModal(false);
    setSelectedPost(null);
    setApplicants([]);
  };

  // University request handlers
  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/internship-requests/${requestId}/accept`, {
        response: responseText,
      });
      setShowRequestModal(false);
      setResponseText("");
      fetchIncomingRequests();
      alert("Request accepted successfully!");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/internship-requests/${requestId}/reject`, {
        response: responseText,
      });
      setShowRequestModal(false);
      setResponseText("");
      fetchIncomingRequests();
      alert("Request rejected");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    }
  };

  const getRequestStatusBadge = (status) => {
    const badges = {
      pending: "status-pending",
      accepted: "status-accepted",
      rejected: "status-rejected",
    };
    return badges[status] || "status-pending";
  };

  if (loading)
    return (
      <div className="company-profile-loading">Loading your profile...</div>
    );

  return (
    <div className="company-profile-page">
      {/* Navbar */}
      <nav className="company-profile-navbar">
        <div className="company-profile-navbar-container">
          <div className="company-profile-navbar-content">
            <h1 className="company-profile-navbar-brand">Int Leb Web</h1>
            <div className="company-profile-menu-wrapper" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="company-profile-menu-button"
                aria-label="Menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {showMenu && (
                <div className="company-profile-dropdown">
                  <button
                    onClick={handleLogout}
                    className="company-profile-dropdown-item"
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
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="company-profile-container">
        {/* Public Profile View */}
        <div className="company-profile-header">
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
              <h1 className="company-profile-name">{companyData.name}</h1>
              <p className="company-profile-type">Company</p>
              <div className="company-profile-meta">
                <div className="company-profile-meta-item">
                  <svg
                    className="company-profile-icon"
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
                  <span>{companyData.address}</span>
                </div>
                <div className="company-profile-meta-item">
                  <svg
                    className="company-profile-icon"
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
                  {companyData.website !== "Website not provided" ? (
                    <a
                      href={companyData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="company-profile-link"
                    >
                      {companyData.website}
                    </a>
                  ) : (
                    <span>{companyData.website}</span>
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

        {/* University Requests Section */}
        <div className="company-requests-section">
          <h2 className="company-profile-section-title">
            Internship Requests from Universities
          </h2>
          {incomingRequests.length === 0 ? (
            <p className="company-requests-empty">No requests yet.</p>
          ) : (
            <div className="company-requests-list">
              {incomingRequests.map((request) => (
                <div key={request.id} className="company-request-card">
                  <div className="company-request-header">
                    <h3 className="company-request-title">
                      {request.position}
                    </h3>
                    <span
                      className={`request-status-badge ${getRequestStatusBadge(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="company-request-body">
                    <p>
                      <strong>University:</strong>{" "}
                      {request.university?.user?.name}
                    </p>
                    <p>
                      <strong>Technology:</strong> {request.technology}
                    </p>
                    <p>
                      <strong>Students Needed:</strong>{" "}
                      {request.number_of_students}
                    </p>
                    <p>
                      <strong>Description:</strong> {request.description}
                    </p>
                    {request.company_response && (
                      <div className="company-request-response">
                        <strong>Your Response:</strong>
                        <p>{request.company_response}</p>
                      </div>
                    )}
                  </div>
                  {request.status === "pending" && (
                    <div className="company-request-actions">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestModal(true);
                        }}
                        className="btn-view-request"
                      >
                        Respond
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Posts Section with Applicant Count */}
        {companyData.posts.length > 0 && (
          <div className="company-profile-posts-card">
            <h2 className="company-profile-posts-title">
              Internship Opportunities
            </h2>
            <div className="company-profile-posts-list">
              {companyData.posts.map((post) => (
                <div key={post.id} className="company-profile-post-item">
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
                      className="company-profile-post-photo"
                    />
                  )}
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
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      View Applicants ({post.applications_count || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applicants Modal */}
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
                    {applicants.map((application) => (
                      <div
                        key={application.id}
                        className="company-applicant-card"
                      >
                        <div className="company-applicant-header">
                          {application.seeker?.photo ? (
                            <img
                              src={
                                application.seeker.photo.startsWith("http")
                                  ? application.seeker.photo
                                  : `${import.meta.env.VITE_API_URL}/storage/${
                                      application.seeker.photo
                                    }`
                              }
                              alt={application.seeker.user?.name}
                              className="company-applicant-photo"
                            />
                          ) : (
                            <div className="company-applicant-photo-placeholder">
                              {application.seeker.user?.name
                                ?.charAt(0)
                                .toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="company-applicant-info">
                            <h3 className="company-applicant-name">
                              {application.seeker.user?.name || "Unknown"}
                            </h3>
                            <div className="company-applicant-contact">
                              <div className="company-applicant-contact-item">
                                <svg
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  width="16"
                                  height="16"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                <a
                                  href={`mailto:${application.seeker.user?.email}`}
                                  className="company-applicant-email"
                                >
                                  {application.seeker.user?.email}
                                </a>
                              </div>
                              {application.seeker.user?.phone && (
                                <div className="company-applicant-contact-item">
                                  <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                  <span>{application.seeker.user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {application.seeker.skills && (
                          <div className="company-applicant-skills">
                            <strong>Skills:</strong> {application.seeker.skills}
                          </div>
                        )}
                        {application.seeker.description && (
                          <div className="company-applicant-description">
                            {application.seeker.description}
                          </div>
                        )}
                        {application.seeker.projects &&
                          application.seeker.projects.length > 0 && (
                            <div className="company-applicant-projects">
                              <strong>Projects:</strong>
                              <ul>
                                {application.seeker.projects.map((project) => (
                                  <li key={project.id}>
                                    <strong>{project.title}</strong>
                                    {project.link && (
                                      <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="company-project-link"
                                      >
                                        View Project →
                                      </a>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        <div className="company-applicant-footer">
                          Applied on{" "}
                          {new Date(
                            application.created_at
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Request Response Modal */}
        {showRequestModal && selectedRequest && (
          <div
            className="company-modal-overlay"
            onClick={() => setShowRequestModal(false)}
          >
            <div
              className="company-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="company-modal-header">
                <h2 className="company-modal-title">Respond to Request</h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="company-modal-close"
                >
                  ×
                </button>
              </div>
              <div className="company-modal-body">
                <p>
                  <strong>Position:</strong> {selectedRequest.position}
                </p>
                <p>
                  <strong>University:</strong>{" "}
                  {selectedRequest.university?.user?.name}
                </p>
                <p>
                  <strong>Technology:</strong> {selectedRequest.technology}
                </p>
                <p>
                  <strong>Students:</strong>{" "}
                  {selectedRequest.number_of_students}
                </p>
                <p>
                  <strong>Description:</strong> {selectedRequest.description}
                </p>

                <div className="company-profile-form-group">
                  <label className="company-profile-label">
                    Response Message (optional)
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Add a message to the university..."
                    rows={4}
                    className="company-profile-textarea"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    onClick={() => handleAcceptRequest(selectedRequest.id)}
                    className="btn-accept"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    className="btn-reject"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setResponseText("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Form Card */}
        <div className="company-profile-form-card">
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

        {/* Post Management Card */}
        <div className="company-profile-form-card">
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

          {/* Existing Posts List for Management */}
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
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="company-profile-icon-button company-profile-icon-button-delete"
                        title="Delete"
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
