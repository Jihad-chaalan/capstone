import "../styles/CompanyProfilePage.css";
import React, { useEffect, useState } from "react";
import api from "../api/client";

const CompanyProfilePage = () => {
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

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="company-profile-container">
      <h1 className="company-profile-title">Company Profile</h1>
      <form
        onSubmit={handleSubmit}
        className="company-profile-form"
        encType="multipart/form-data"
      >
        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            className="company-profile-input"
            placeholder="Company address"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Website</label>
          <input
            type="url"
            name="website_link"
            value={form.website_link}
            onChange={handleInputChange}
            className="company-profile-input"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            className="company-profile-input"
            rows={4}
            placeholder="Tell us about your company"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="company-profile-input"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Company Logo"
              className="company-profile-photo-preview"
            />
          )}
        </div>
        <button
          type="submit"
          className="company-profile-button"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {success && (
          <div className="company-profile-success">Profile updated!</div>
        )}
        {error && <div className="company-profile-error">{error}</div>}
      </form>
    </div>
  );
};

export default CompanyProfilePage;
