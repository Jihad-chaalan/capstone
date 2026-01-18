import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminPages.css";

const AdminSkillsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchSkills();
  }, []);

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

  const fetchSkills = async () => {
    try {
      const res = await api.get("/admin/skills");
      setSkills(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading skills:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const handleAddNew = () => {
    setEditingSkill(null);
    setFormData({ name: "", description: "", is_active: true });
    setShowModal(true);
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description || "",
      is_active: skill.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingSkill) {
        await api.put(`/admin/skills/${editingSkill.id}`, formData);
      } else {
        await api.post("/admin/skills", formData);
      }
      setShowModal(false);
      fetchSkills();
      alert(editingSkill ? "Skill updated!" : "Skill created!");
    } catch (error) {
      console.error("Error saving skill:", error);
      alert(error.response?.data?.message || "Failed to save skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) {
      return;
    }

    try {
      await api.delete(`/admin/skills/${skillId}`);
      fetchSkills();
      alert("Skill deleted successfully");
    } catch (error) {
      console.error("Error deleting skill:", error);
      alert(error.response?.data?.message || "Failed to delete skill");
    }
  };

  const handleToggleStatus = async (skillId) => {
    try {
      await api.post(`/admin/skills/${skillId}/toggle-status`);
      fetchSkills();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading skills...</div>;
  }

  return (
    <div className="admin-page">
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h2 className="admin-navbar-title">Skills Management</h2>
          <div className="admin-navbar-actions">
            <button className="btn-primary" onClick={handleAddNew}>
              + Add New Skill
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="admin-nav-back-btn"
            >
              Back to Dashboard
            </button>
            <div className="admin-menu-container" ref={menuRef}>
              <button onClick={toggleMenu} className="admin-menu-button">
                ⋮
              </button>
              {showMenu && (
                <div className="admin-dropdown">
                  <button
                    onClick={handleLogout}
                    className="admin-dropdown-item"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="admin-container">
        <div className="admin-section">
          <h2 className="admin-section-title">All Skills ({skills.length})</h2>

          {/* Skills Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Skill Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No skills found. Add your first skill!
                    </td>
                  </tr>
                ) : (
                  skills.map((skill) => (
                    <tr key={skill.id}>
                      <td>{skill.id}</td>
                      <td>
                        <strong>{skill.name}</strong>
                      </td>
                      <td>{skill.description || "N/A"}</td>
                      <td>
                        <button
                          className={`status-toggle ${
                            skill.is_active ? "active" : "inactive"
                          }`}
                          onClick={() => handleToggleStatus(skill.id)}
                        >
                          {skill.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <button
                          className="admin-btn-view"
                          onClick={() => handleEdit(skill)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-delete"
                          onClick={() => handleDelete(skill.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {skills.length === 0 && (
              <p className="admin-empty-message">No skills available</p>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="admin-modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="admin-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">
                  {editingSkill ? "Edit Skill" : "Add New Skill"}
                </h2>
                <button
                  className="admin-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  X
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  <div className="form-group">
                    <label>Skill Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. JavaScript, Python, React"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the skill..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                      />{" "}
                      Active (visible to seekers)
                    </label>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingSkill ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSkillsPage;
