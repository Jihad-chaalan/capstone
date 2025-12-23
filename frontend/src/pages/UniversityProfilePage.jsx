import "../styles/UniversityProfilePage.css";
import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const UniversityProfilePage = () => {
  const [form, setForm] = useState({
    address: "",
    website_link: "",
    description: "",
  });
  const [universityData, setUniversityData] = useState({
    name: "",
    address: "",
    website: "",
    description: "",
    logo: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    api
      .get("/university/me")
      .then((res) => {
        const university = res.data.data;
        setForm({
          address: university.address || "",
          website_link: university.website_link || "",
          description: university.description || "",
        });
        setUniversityData({
          name: university.user?.name || "University Name",
          address: university.address || "Address not provided",
          website: university.website_link || "Website not provided",
          description: university.description || "No description available",
          logo: university.logo
            ? university.logo.startsWith("http")
              ? university.logo
              : `${import.meta.env.VITE_API_URL}/storage/${university.logo}`
            : "",
        });
        setPhotoPreview(
          university.logo
            ? university.logo.startsWith("http")
              ? university.logo
              : `${import.meta.env.VITE_API_URL}/storage/${university.logo}`
            : ""
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
      formData.append("logo", photoFile);
    }

    api
      .post("/university/update?_method=PUT", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setSuccess(true);
        setSaving(false);
        const university = res.data.data;
        setForm({
          address: university.address || "",
          website_link: university.website_link || "",
          description: university.description || "",
        });
        setUniversityData({
          name: university.user?.name || "University Name",
          address: university.address || "Address not provided",
          website: university.website_link || "Website not provided",
          description: university.description || "No description available",
          logo: university.logo
            ? university.logo.startsWith("http")
              ? university.logo
              : `${import.meta.env.VITE_API_URL}/storage/${university.logo}`
            : "",
        });
        setPhotoPreview(
          university.logo
            ? university.logo.startsWith("http")
              ? university.logo
              : `${import.meta.env.VITE_API_URL}/storage/${university.logo}`
            : ""
        );
      })
      .catch(() => {
        setError("Failed to update profile.");
        setSaving(false);
      });
  };

  if (loading)
    return (
      <div className="university-profile-loading">Loading your profile...</div>
    );

  return (
    <div className="university-profile-container">
      {/* Navbar */}
      <nav className="university-profile-navbar">
        <div className="university-profile-navbar-container">
          <div className="university-profile-navbar-content">
            <h1 className="university-profile-navbar-brand">Int Leb Web</h1>
            <div className="university-profile-navbar-actions">
              {/* <button
                onClick={() => navigate("/posts")}
                className="university-profile-nav-button"
                title="Browse All Posts"
              >
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
                Browse Posts
              </button> */}
              <button
                onClick={() => navigate("/university/requests")}
                className="university-profile-nav-button"
                title="Manage Requests"
              >
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Manage Requests
              </button>
              <button
                onClick={handleLogout}
                className="university-profile-nav-logout"
                title="Sign Out"
              >
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="university-profile-header">
        <div className="university-profile-banner"></div>
        <div className="university-profile-info-section">
          <div className="university-profile-logo-wrapper">
            {universityData.logo ? (
              <img
                src={universityData.logo}
                alt="University Logo"
                className="university-profile-logo"
              />
            ) : (
              <div className="university-profile-logo university-profile-logo-placeholder">
                <span>{universityData.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="university-profile-details">
            <h1 className="university-profile-name">{universityData.name}</h1>
            <p className="university-profile-type">University</p>
            <div className="university-profile-meta">
              <div className="university-profile-meta-item">
                <svg
                  className="university-profile-icon"
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
                <span>{universityData.address}</span>
              </div>
              <div className="university-profile-meta-item">
                <svg
                  className="university-profile-icon"
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
                {universityData.website !== "Website not provided" ? (
                  <a
                    href={universityData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="university-profile-link"
                  >
                    {universityData.website}
                  </a>
                ) : (
                  <span>{universityData.website}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="university-profile-about-section">
          <h3 className="university-profile-about-title">About</h3>
          <p className="university-profile-about-text">
            {universityData.description}
          </p>
        </div>
      </div>
      {/* <button
        onClick={() => navigate("/university/requests")}
        className="university-profile-btn-requests"
      >
        Manage Requests
      </button> */}

      {/* Edit Form Card */}
      <div className="university-profile-form-card">
        <h2 className="university-profile-form-title">
          Edit University Profile
        </h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="university-profile-form-group">
            <label htmlFor="logo" className="university-profile-label">
              University Logo
            </label>
            <div className="university-profile-file-input-group">
              <input
                ref={fileInputRef}
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="university-profile-file-input"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Logo Preview"
                  className="university-profile-logo-preview"
                />
              )}
            </div>
          </div>

          <div className="university-profile-form-group">
            <label htmlFor="address" className="university-profile-label">
              Address
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={form.address}
              onChange={handleInputChange}
              placeholder="e.g. 123 University Ave, City, Country"
              className="university-profile-input"
            />
          </div>

          <div className="university-profile-form-group">
            <label htmlFor="website_link" className="university-profile-label">
              Website
            </label>
            <input
              id="website_link"
              type="url"
              name="website_link"
              value={form.website_link}
              onChange={handleInputChange}
              placeholder="https://www.youruniversity.edu"
              className="university-profile-input"
            />
          </div>

          <div className="university-profile-form-group">
            <label htmlFor="description" className="university-profile-label">
              About
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your university"
              className="university-profile-textarea"
            />
          </div>

          <button
            type="submit"
            className="university-profile-button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {success && (
            <div className="university-profile-success">
              Profile updated successfully!
            </div>
          )}
          {error && <div className="university-profile-error">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default UniversityProfilePage;
