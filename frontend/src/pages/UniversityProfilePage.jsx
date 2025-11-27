import "../styles/UniversityProfilePage.css";
import React, { useEffect, useState } from "react";
import api from "../api/client";

const UniversityProfilePage = () => {
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
      .get("/university/me")
      .then((res) => {
        const university = res.data.data;
        setForm({
          address: university.address || "",
          website_link: university.website_link || "",
          description: university.description || "",
        });
        setPhotoPreview(
          university.logo
            ? university.logo.startsWith("http")
              ? university.logo
              : `${import.meta.env.VITE_API_BASE_URL}/storage/${
                  university.logo
                }`
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
        setPhotoPreview(
          university.logo
            ? university.logo.startsWith("http")
              ? university.logo
              : `${import.meta.env.VITE_API_BASE_URL}/storage/${
                  university.logo
                }`
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
    <div className="university-profile-container">
      <h1 className="university-profile-title">University Profile</h1>
      <form
        onSubmit={handleSubmit}
        className="university-profile-form"
        encType="multipart/form-data"
      >
        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            className="university-profile-input"
            placeholder="University address"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Website</label>
          <input
            type="url"
            name="website_link"
            value={form.website_link}
            onChange={handleInputChange}
            className="university-profile-input"
            placeholder="https://example.edu"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            className="university-profile-input"
            rows={4}
            placeholder="Tell us about your university"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="university-profile-input"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="University Logo"
              className="university-profile-photo-preview"
            />
          )}
        </div>
        <button
          type="submit"
          className="university-profile-button"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {success && (
          <div className="university-profile-success">Profile updated!</div>
        )}
        {error && <div className="university-profile-error">{error}</div>}
      </form>
    </div>
  );
};

export default UniversityProfilePage;
