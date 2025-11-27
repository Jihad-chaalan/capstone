import "../styles/CompanyProfilePage.css";
import React, { useEffect, useState, useRef } from "react";
import api from "../api/client";

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
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
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
        });
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

  if (loading)
    return (
      <div className="company-profile-loading">Loading your profile...</div>
    );

  return (
    <div className="company-profile-container">
      {/* Public Profile View - How others see it */}
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

      {/* Edit Form Card */}
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
    </div>
  );
};

export default CompanyProfilePage;
