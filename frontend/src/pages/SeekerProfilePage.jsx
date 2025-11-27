import "../styles/SeekerProfilePage.css";
import React, { useEffect, useState } from "react";
import api from "../api/client";

const SeekerProfilePage = () => {
  const [form, setForm] = useState({ skills: "", description: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch seeker profile on mount
  useEffect(() => {
    api
      .get("/seeker/me")
      .then((res) => {
        const seeker = res.data.data;
        setForm({
          skills: seeker.skills || "",
          description: seeker.description || "",
        });
        setPhotoPreview(
          seeker.photo
            ? seeker.photo.startsWith("http")
              ? seeker.photo
              : `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
            : ""
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
    setError(null);
  };

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
    setSuccess(false);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("skills", form.skills ?? "");
    formData.append("description", form.description ?? "");
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    api
      .post("/seeker/update?_method=PUT", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setSuccess(true);
        setSaving(false);
        const seeker = res.data.data;
        setForm({
          skills: seeker.skills || "",
          description: seeker.description || "",
        });
        setPhotoPreview(
          seeker.photo
            ? seeker.photo.startsWith("http")
              ? seeker.photo
              : `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
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
    <div className="seeker-profile-container">
      <h1 className="seeker-profile-title">My Profile</h1>
      <form
        onSubmit={handleSubmit}
        className="seeker-profile-form"
        encType="multipart/form-data"
      >
        <div>
          <label className="block font-medium mb-1">Skills</label>
          <input
            type="text"
            name="skills"
            value={form.skills}
            onChange={handleInputChange}
            className="seeker-profile-input"
            placeholder="e.g. JavaScript, PHP, React"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            className="seeker-profile-input"
            rows={4}
            placeholder="Tell us about yourself"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="seeker-profile-input"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Profile"
              className="seeker-profile-photo-preview"
            />
          )}
        </div>
        <button
          type="submit"
          className="seeker-profile-button"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {success && (
          <div className="seeker-profile-success">Profile updated!</div>
        )}
        {error && <div className="seeker-profile-error">{error}</div>}
      </form>
    </div>
  );
};

export default SeekerProfilePage;
