import "../styles/SeekerProfilePage.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const SeekerProfilePage = () => {
  const [form, setForm] = useState({ skills: "", description: "" });
  const [seekerData, setSeekerData] = useState({
    name: "",
    skills: "",
    description: "",
    photo: "",
    projects: [],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Project management state
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    link: "",
  });
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState(null);
  const [projectSuccess, setProjectSuccess] = useState(false);

  // Auth and navigation
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

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
      .get("/seeker/me")
      .then((res) => {
        const seeker = res.data.data;
        setForm({
          skills: seeker.skills || "",
          description: seeker.description || "",
        });
        setSeekerData({
          name: seeker.user?.name || "User",
          skills: seeker.skills || "No skills listed",
          description: seeker.description || "No description available",
          photo: seeker.photo
            ? seeker.photo.startsWith("http")
              ? seeker.photo
              : `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
            : "",
          projects: seeker.projects || [],
        });
        setProjects(seeker.projects || []);
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
  };

  useEffect(() => {
    loadProfile();
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
        setSeekerData({
          name: seeker.user?.name || "User",
          skills: seeker.skills || "No skills listed",
          description: seeker.description || "No description available",
          photo: seeker.photo
            ? seeker.photo.startsWith("http")
              ? seeker.photo
              : `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
            : "",
          projects: seeker.projects || [],
        });
        setProjects(seeker.projects || []);
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

  // Project management handlers
  const handleProjectInputChange = (e) => {
    setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
    setProjectSuccess(false);
    setProjectError(null);
  };

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    setProjectSaving(true);
    setProjectError(null);
    setProjectSuccess(false);

    const request = editingProjectId
      ? api.put(`/projects/${editingProjectId}`, projectForm)
      : api.post("/projects", projectForm);

    request
      .then(() => {
        setProjectSuccess(true);
        setProjectSaving(false);
        setProjectForm({ title: "", description: "", link: "" });
        setEditingProjectId(null);
        loadProfile();
      })
      .catch(() => {
        setProjectError("Failed to save project.");
        setProjectSaving(false);
      });
  };

  const handleEditProject = (project) => {
    setProjectForm({
      title: project.title,
      description: project.description || "",
      link: project.link || "",
    });
    setEditingProjectId(project.id);
    setProjectSuccess(false);
    setProjectError(null);
  };

  const handleCancelEdit = () => {
    setProjectForm({ title: "", description: "", link: "" });
    setEditingProjectId(null);
    setProjectError(null);
    setProjectSuccess(false);
  };

  const handleDeleteProject = (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    api
      .delete(`/projects/${projectId}`)
      .then(() => {
        loadProfile();
      })
      .catch(() => {
        setProjectError("Failed to delete project.");
      });
  };

  if (loading)
    return (
      <div className="seeker-profile-loading">Loading your profile...</div>
    );

  return (
    <div className="seeker-profile-page">
      {/* Navbar */}
      <nav className="seeker-profile-navbar">
        <div className="seeker-profile-navbar-container">
          <div className="seeker-profile-navbar-content">
            <h1 className="seeker-profile-navbar-brand">Internship Portal</h1>
            <div className="seeker-profile-navbar-actions">
              <button
                onClick={() => navigate("/posts")}
                className="seeker-profile-nav-button"
              >
                Browse Posts
              </button>
              <div className="seeker-profile-menu-wrapper" ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  className="seeker-profile-menu-button"
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
                  <div className="seeker-profile-dropdown">
                    <button
                      onClick={handleLogout}
                      className="seeker-profile-dropdown-item"
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
        </div>
      </nav>

      <div className="seeker-profile-container">
        {/* Public Profile View - How others see it */}
        <div className="seeker-profile-header">
          <div className="seeker-profile-banner"></div>
          <div className="seeker-profile-info-section">
            <div className="seeker-profile-photo-wrapper">
              {seekerData.photo ? (
                <img
                  src={seekerData.photo}
                  alt="Profile"
                  className="seeker-profile-photo"
                />
              ) : (
                <div className="seeker-profile-photo seeker-profile-photo-placeholder">
                  <span>{seekerData.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="seeker-profile-details">
              <h1 className="seeker-profile-name">{seekerData.name}</h1>
              <p className="seeker-profile-type">Internship Seeker</p>
              <div className="seeker-profile-meta">
                <div className="seeker-profile-meta-item">
                  <svg
                    className="seeker-profile-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span>{seekerData.skills}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="seeker-profile-about-section">
            <h3 className="seeker-profile-about-title">About</h3>
            <p className="seeker-profile-about-text">
              {seekerData.description}
            </p>
          </div>
        </div>

        {/* Projects Section */}
        {seekerData.projects.length > 0 && (
          <div className="seeker-profile-projects-card">
            <h2 className="seeker-profile-projects-title">Projects</h2>
            <div className="seeker-profile-projects-list">
              {seekerData.projects.map((project) => (
                <div key={project.id} className="seeker-profile-project-item">
                  <h3 className="seeker-profile-project-title">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="seeker-profile-project-description">
                      {project.description}
                    </p>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="seeker-profile-project-link"
                    >
                      View Project →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Form Card */}
        <div className="seeker-profile-form-card">
          <h2 className="seeker-profile-form-title">Edit Profile</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="seeker-profile-form-group">
              <label htmlFor="photo" className="seeker-profile-label">
                Profile Photo
              </label>
              <div className="seeker-profile-file-input-group">
                <input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="seeker-profile-file-input"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Photo Preview"
                    className="seeker-profile-photo-preview-small"
                  />
                )}
              </div>
            </div>

            <div className="seeker-profile-form-group">
              <label htmlFor="skills" className="seeker-profile-label">
                Skills
              </label>
              <input
                id="skills"
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleInputChange}
                placeholder="e.g. JavaScript, PHP, React"
                className="seeker-profile-input"
              />
            </div>

            <div className="seeker-profile-form-group">
              <label htmlFor="description" className="seeker-profile-label">
                About
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about yourself"
                className="seeker-profile-textarea"
              />
            </div>

            <button
              type="submit"
              className="seeker-profile-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {success && (
              <div className="seeker-profile-success">
                Profile updated successfully!
              </div>
            )}
            {error && <div className="seeker-profile-error">{error}</div>}
          </form>
        </div>

        {/* Project Management Card */}
        <div className="seeker-profile-form-card">
          <h2 className="seeker-profile-form-title">
            {editingProjectId ? "Edit Project" : "Add New Project"}
          </h2>
          <form onSubmit={handleProjectSubmit}>
            <div className="seeker-profile-form-group">
              <label htmlFor="project-title" className="seeker-profile-label">
                Project Title
              </label>
              <input
                id="project-title"
                type="text"
                name="title"
                value={projectForm.title}
                onChange={handleProjectInputChange}
                placeholder="e.g. E-commerce Website"
                className="seeker-profile-input"
                required
              />
            </div>

            <div className="seeker-profile-form-group">
              <label
                htmlFor="project-description"
                className="seeker-profile-label"
              >
                Description
              </label>
              <textarea
                id="project-description"
                name="description"
                value={projectForm.description}
                onChange={handleProjectInputChange}
                rows={3}
                placeholder="Describe your project"
                className="seeker-profile-textarea"
              />
            </div>

            <div className="seeker-profile-form-group">
              <label htmlFor="project-link" className="seeker-profile-label">
                Project Link
              </label>
              <input
                id="project-link"
                type="url"
                name="link"
                value={projectForm.link}
                onChange={handleProjectInputChange}
                placeholder="https://github.com/username/project"
                className="seeker-profile-input"
              />
            </div>

            <div className="seeker-profile-button-group">
              <button
                type="submit"
                className="seeker-profile-button"
                disabled={projectSaving}
              >
                {projectSaving
                  ? "Saving..."
                  : editingProjectId
                  ? "Update Project"
                  : "Add Project"}
              </button>
              {editingProjectId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="seeker-profile-button-secondary"
                >
                  Cancel
                </button>
              )}
            </div>

            {projectSuccess && (
              <div className="seeker-profile-success">
                Project {editingProjectId ? "updated" : "added"} successfully!
              </div>
            )}
            {projectError && (
              <div className="seeker-profile-error">{projectError}</div>
            )}
          </form>

          {/* Existing Projects List for Management */}
          {projects.length > 0 && (
            <div className="seeker-profile-projects-manage">
              <h3 className="seeker-profile-manage-title">Your Projects</h3>
              <div className="seeker-profile-manage-list">
                {projects.map((project) => (
                  <div key={project.id} className="seeker-profile-manage-item">
                    <div className="seeker-profile-manage-content">
                      <h4 className="seeker-profile-manage-project-title">
                        {project.title}
                      </h4>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="seeker-profile-manage-link"
                        >
                          {project.link}
                        </a>
                      )}
                    </div>
                    <div className="seeker-profile-manage-actions">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="seeker-profile-icon-button seeker-profile-icon-button-edit"
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
                        onClick={() => handleDeleteProject(project.id)}
                        className="seeker-profile-icon-button seeker-profile-icon-button-delete"
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

export default SeekerProfilePage;
