import "../styles/SeekerProfilePage.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const SeekerProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Refs
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Profile state
  const [seekerData, setSeekerData] = useState({
    name: "",
    description: "",
    photo: "",
    projects: [],
    skills_list: [],
    average_rating: 0,
    rating_count: 0,
    applications: [],
  });
  const [form, setForm] = useState({ description: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Skills state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  // Projects state
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

  // Ratings state (for seeker to publish)
  const [ratings, setRatings] = useState([]);

  // Load available skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get("/skills");
        setAvailableSkills(res.data.data || []);
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };
    fetchSkills();
  }, []);

  // Load seeker profile
  const loadProfile = async () => {
    try {
      const res = await api.get("/seeker/me");
      const seeker = res.data.data;

      const photoUrl = seeker.photo
        ? seeker.photo.startsWith("http")
          ? seeker.photo
          : `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
        : "";

      setForm({
        description: seeker.description || "",
      });

      setSeekerData({
        name: seeker.user?.name || "User",
        description: seeker.description || "No description available",
        photo: photoUrl,
        projects: seeker.projects || [],
        skills_list: seeker.skills_list || seeker.skillsList || [],
        average_rating: seeker.average_rating || 0,
        rating_count: seeker.rating_count || 0,
        applications: seeker.applications || [],
      });

      setProjects(seeker.projects || []);
      setPhotoPreview(photoUrl);

      // Set selected skills
      const skillsList = seeker.skills_list || seeker.skillsList || [];
      const seekerSkillIds = skillsList.map((s) => s.id) || [];
      setSelectedSkills(seekerSkillIds);

      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile.");
      setLoading(false);
    }
  };

  async function fetchRatings() {
    try {
      const res = await api.get("/seeker/ratings");
      setRatings(res.data.data || []);
    } catch (err) {
      console.error("Error fetching ratings:", err);
      setRatings([]);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
      fetchRatings();
    });
  }, []);

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

  // Auth handlers
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Profile form handlers
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

  const handleSkillToggle = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
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
    formData.append("description", form.description || "");
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    // Add selected skill IDs
    selectedSkills.forEach((skillId) => {
      formData.append("skill_ids[]", skillId);
    });

    try {
      await api.post("/seeker/update?_method=PUT", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setSaving(false);
      await loadProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile.");
      setSaving(false);
    }
  };

  // Project form handlers
  const handleProjectInputChange = (e) => {
    setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
    setProjectSuccess(false);
    setProjectError(null);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setProjectSaving(true);
    setProjectError(null);
    setProjectSuccess(false);

    try {
      if (editingProjectId) {
        await api.put(`/projects/${editingProjectId}`, projectForm);
      } else {
        await api.post("/projects", projectForm);
      }

      setProjectSuccess(true);
      setProjectSaving(false);
      setProjectForm({ title: "", description: "", link: "" });
      setEditingProjectId(null);
      await loadProfile();
    } catch (err) {
      console.error("Error saving project:", err);
      setProjectError("Failed to save project.");
      setProjectSaving(false);
    }
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

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      await loadProfile();
    } catch (err) {
      console.error("Error deleting project:", err);
      setProjectError("Failed to delete project.");
    }
  };

  const handlePublishRating = async (ratingId) => {
    try {
      await api.patch(`/ratings/${ratingId}/publish`);
      await fetchRatings();
      await loadProfile();
      alert("Rating published to your public profile.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to publish rating");
    }
  };

  if (loading) {
    return (
      <div className="seeker-profile-loading">Loading your profile...</div>
    );
  }

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
        {/* Public Profile View */}
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
                  ⭐ {(Number(seekerData.average_rating) || 0).toFixed(1)} (
                  {Number(seekerData.rating_count) || 0} ratings)
                </div>
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
                  <div className="skills-display">
                    {seekerData.skills_list?.length > 0 ? (
                      seekerData.skills_list.map((skill) => (
                        <span key={skill.id} className="skill-badge-display">
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <span>No skills listed</span>
                    )}
                  </div>
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

        {/* Current/Past Internships Section */}
        <div className="seeker-profile-form-card">
          <h2 className="seeker-profile-form-title">
            Current / Past Internships
          </h2>
          {seekerData.applications && seekerData.applications.length > 0 ? (
            <div className="seeker-internship-list">
              {seekerData.applications.map((app) => (
                <div key={app.id} className="seeker-internship-item">
                  <div>
                    <strong>
                      {app.post?.company?.user?.name ||
                        app.post?.company?.name ||
                        "Company"}
                    </strong>
                    <div>{app.post?.position}</div>
                    <div className="muted">
                      Status: {app.status}
                      {app.started_at &&
                        ` • Started: ${new Date(
                          app.started_at
                        ).toLocaleDateString()}`}
                      {app.completed_at &&
                        ` • Completed: ${new Date(
                          app.completed_at
                        ).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">You have no internship applications yet.</p>
          )}
        </div>

        {/* Ratings Section */}
        <div className="seeker-profile-form-card">
          <h2 className="seeker-profile-form-title">Ratings from Companies</h2>
          {ratings.length === 0 ? (
            <p className="empty">No ratings yet.</p>
          ) : (
            <div className="seeker-ratings-list">
              {ratings.map((r) => (
                <div key={r.id} className="rating-card">
                  <div className="rating-head">
                    <strong>
                      {r.company?.user?.name || r.company?.name || "Company"}
                    </strong>
                    <span className="rating-score">⭐ {r.score} / 5</span>
                  </div>
                  {r.comment && <p className="rating-comment">{r.comment}</p>}
                  <div className="rating-footer">
                    <span className="rating-date">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    {!r.visible && (
                      <button
                        onClick={() => handlePublishRating(r.id)}
                        className="btn-primary"
                        style={{ marginLeft: 12 }}
                      >
                        Publish to profile
                      </button>
                    )}
                    {r.visible && (
                      <span className="badge-published">✓ Published</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {/* Edit Profile Form */}
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
              <label className="seeker-profile-label">
                Select Your Skills *
              </label>
              <div className="skills-selection">
                {availableSkills.length === 0 ? (
                  <p className="help-text">
                    No skills available. Please contact admin.
                  </p>
                ) : (
                  availableSkills.map((skill) => (
                    <label key={skill.id} className="skill-checkbox">
                      <input
                        type="checkbox"
                        value={skill.id}
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => handleSkillToggle(skill.id)}
                      />
                      <span className="skill-badge">{skill.name}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedSkills.length === 0 && availableSkills.length > 0 && (
                <p className="help-text">Please select at least one skill</p>
              )}
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
              disabled={
                saving ||
                (availableSkills.length > 0 && selectedSkills.length === 0)
              }
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
                Project Title *
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
