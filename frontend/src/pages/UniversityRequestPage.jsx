import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/UniversityRequestsPage.css";

const UniversityRequestsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_id: "",
    position: "",
    technology: "",
    description: "",
    number_of_students: 1,
  });
  const [showMenu, setShowMenu] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/university/requests");
      setRequests(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setLoading(false);
    }
  };

  // Removed unused fetchCompanies function

  useEffect(() => {
    const loadData = async () => {
      try {
        const [requestsRes, companiesRes] = await Promise.all([
          api.get("/university/requests"),
          api.get("/companies"),
        ]);
        setRequests(requestsRes.data.data);
        setCompanies(companiesRes.data.data.data || companiesRes.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        await api.put(`/internship-requests/${editingRequest.id}`, formData);
      } else {
        await api.post("/internship-requests", formData);
      }
      setShowForm(false);
      setEditingRequest(null);
      setFormData({
        company_id: "",
        position: "",
        technology: "",
        description: "",
        number_of_students: 1,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(error.response?.data?.message || "Failed to submit request");
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      company_id: request.company_id,
      position: request.position,
      technology: request.technology,
      description: request.description,
      number_of_students: request.number_of_students,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await api.delete(`/internship-requests/${id}`);
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error.response?.data?.message || "Failed to delete request");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const getStatusBadge = (status) => {
    const badges = {
      pending: "uni-req-badge-pending",
      accepted: "uni-req-badge-accepted",
      rejected: "uni-req-badge-rejected",
    };
    return badges[status] || "uni-req-badge-pending";
  };

  if (loading) {
    return <div className="uni-req-loading">Loading...</div>;
  }

  return (
    <div className="uni-req-page">
      <nav className="uni-req-navbar">
        <div className="uni-req-navbar-content">
          <h2 className="uni-req-navbar-title">Internship Requests</h2>
          <div className="uni-req-navbar-actions">
            <button
              onClick={() => navigate("/university/profile")}
              className="uni-req-btn-secondary"
            >
              Back to Profile
            </button>
            <div className="uni-req-menu-container">
              <button onClick={toggleMenu} className="uni-req-menu-button">
                ⋮
              </button>
              {showMenu && (
                <div className="uni-req-dropdown">
                  <button
                    onClick={handleLogout}
                    className="uni-req-dropdown-item"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="uni-req-container">
        <div className="uni-req-header">
          <h1>Manage Internship Requests</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingRequest(null);
              setFormData({
                company_id: "",
                position: "",
                technology: "",
                description: "",
                number_of_students: 1,
              });
            }}
            className="uni-req-btn-primary"
          >
            {showForm ? "Cancel" : "+ New Request"}
          </button>
        </div>

        {showForm && (
          <div className="uni-req-form-card">
            <h2>{editingRequest ? "Edit Request" : "Create New Request"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="uni-req-form-group">
                <label htmlFor="company_id">Company *</label>
                <select
                  id="company_id"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  required
                  disabled={editingRequest !== null}
                  className="uni-req-input"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.user?.name || "Unknown Company"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="uni-req-form-group">
                <label htmlFor="position">Position *</label>
                <input
                  id="position"
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="e.g. Frontend Developer"
                  required
                  className="uni-req-input"
                />
              </div>

              <div className="uni-req-form-group">
                <label htmlFor="technology">Technology *</label>
                <input
                  id="technology"
                  type="text"
                  name="technology"
                  value={formData.technology}
                  onChange={handleInputChange}
                  placeholder="e.g. React, Node.js"
                  required
                  className="uni-req-input"
                />
              </div>

              <div className="uni-req-form-group">
                <label htmlFor="number_of_students">Number of Students *</label>
                <input
                  id="number_of_students"
                  type="number"
                  name="number_of_students"
                  value={formData.number_of_students}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  required
                  className="uni-req-input"
                />
              </div>

              <div className="uni-req-form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe the internship requirements and expectations..."
                  required
                  className="uni-req-textarea"
                />
              </div>

              <button type="submit" className="uni-req-btn-primary">
                {editingRequest ? "Update Request" : "Send Request"}
              </button>
            </form>
          </div>
        )}

        <div className="uni-req-list">
          <h2>Your Requests ({requests.length})</h2>
          {requests.length === 0 ? (
            <p className="uni-req-empty">
              No requests yet. Create your first internship request above.
            </p>
          ) : (
            <div className="uni-req-grid">
              {requests.map((request) => (
                <div key={request.id} className="uni-req-card">
                  <div className="uni-req-card-header">
                    <h3>{request.position}</h3>
                    <span
                      className={`uni-req-badge ${getStatusBadge(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="uni-req-card-body">
                    <p className="uni-req-company">
                      <strong>Company:</strong>{" "}
                      {request.company?.user?.name || "N/A"}
                    </p>
                    <p className="uni-req-tech">
                      <strong>Technology:</strong> {request.technology}
                    </p>
                    <p className="uni-req-students">
                      <strong>Students:</strong> {request.number_of_students}
                    </p>
                    <p className="uni-req-description">{request.description}</p>
                    {request.company_response && (
                      <div className="uni-req-response">
                        <strong>Company Response:</strong>
                        <p>{request.company_response}</p>
                      </div>
                    )}
                    <p className="uni-req-date">
                      Sent: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {request.status === "pending" && (
                    <div className="uni-req-card-actions">
                      <button
                        onClick={() => handleEdit(request)}
                        className="uni-req-btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="uni-req-btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityRequestsPage;
