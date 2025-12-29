import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminPages.css";
// import "../styles/AdminDashboard.css";

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
    return (
      <div className="admin-container">
        <div className="loading-spinner">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Skills Management</h1>
          <button className="back-button" onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="admin-header-right" ref={menuRef}>
          <button className="btn-primary" onClick={handleAddNew}>
            + Add New Skill
          </button>
          <div className="user-info" onClick={() => setShowMenu(!showMenu)}>
            <span>{user?.name}</span>
            <div className="user-avatar">{user?.name?.charAt(0)}</div>
          </div>
          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Skills Table */}
      <div className="admin-content">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Skill Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Seekers</th>
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
                    <td>{skill.seekers_count || 0}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleEdit(skill)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
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
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSkill ? "Edit Skill" : "Add New Skill"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                      setFormData({ ...formData, description: e.target.value })
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingSkill ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkillsPage;
