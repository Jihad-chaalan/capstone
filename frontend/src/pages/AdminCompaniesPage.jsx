import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminPages.css";

const AdminCompaniesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, verified, rejected
  const menuRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/admin/companies");
        const companiesData = Array.isArray(res.data.data) ? res.data.data : [];
        setCompanies(companiesData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading companies:", error);
        setLoading(false);
      }
    };

    fetchCompanies();
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleVerify = async (companyId) => {
    try {
      await api.post(`/admin/companies/${companyId}/verify`);
      // Reload companies
      const res = await api.get("/admin/companies");
      setCompanies(Array.isArray(res.data.data) ? res.data.data : []);
      setShowCompanyModal(false);
      alert("Company verified successfully");
    } catch (error) {
      console.error("Error verifying company:", error);
      alert("Failed to verify company");
    }
  };

  const handleRejectClick = (company) => {
    setSelectedCompany(company);
    setShowRejectModal(true);
    setShowCompanyModal(false);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      await api.post(`/admin/companies/${selectedCompany.id}/reject`, {
        reason: rejectReason,
      });
      // Reload companies
      const res = await api.get("/admin/companies");
      setCompanies(Array.isArray(res.data.data) ? res.data.data : []);
      setShowRejectModal(false);
      setRejectReason("");
      alert("Company rejected");
    } catch (error) {
      console.error("Error rejecting company:", error);
      alert("Failed to reject company");
    }
  };

  const handleViewCertificate = async (companyId) => {
    try {
      const response = await api.get(
        `/admin/companies/${companyId}/certificate`,
        {
          responseType: "blob",
        }
      );

      // Get the content type from response headers
      const contentType = response.headers["content-type"] || "application/pdf";

      // Create blob with proper content type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, "_blank");

      // Optional: Clean up the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error viewing certificate:", error);
      alert("Failed to load certificate");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: "status-badge-pending", text: "Pending" },
      verified: { class: "status-badge-verified", text: "Verified" },
      rejected: { class: "status-badge-rejected", text: "Rejected" },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const filteredCompanies = companies.filter((company) => {
    if (filter === "all") return true;
    return company.verification_status === filter;
  });

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Company Verification</h1>
          <button className="back-button" onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="admin-header-right" ref={menuRef}>
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

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All ({companies.length})
        </button>
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pending (
          {companies.filter((c) => c.verification_status === "pending").length})
        </button>
        <button
          className={filter === "verified" ? "active" : ""}
          onClick={() => setFilter("verified")}
        >
          Verified (
          {companies.filter((c) => c.verification_status === "verified").length}
          )
        </button>
        <button
          className={filter === "rejected" ? "active" : ""}
          onClick={() => setFilter("rejected")}
        >
          Rejected (
          {companies.filter((c) => c.verification_status === "rejected").length}
          )
        </button>
      </div>

      {/* Companies Table */}
      <div className="admin-content">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Certificate</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No companies found
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.id}</td>
                    <td>{company.name}</td>
                    <td>{company.email}</td>
                    <td>{company.address || "N/A"}</td>
                    <td>{getStatusBadge(company.verification_status)}</td>
                    <td>
                      {company.certificate_path ? (
                        <button
                          className="btn-view-cert"
                          onClick={() => handleViewCertificate(company.id)}
                        >
                          View
                        </button>
                      ) : (
                        <span style={{ color: "#999" }}>No certificate</span>
                      )}
                    </td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleViewCompany(company)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Details Modal */}
      {showCompanyModal && selectedCompany && (
        <div
          className="modal-overlay"
          onClick={() => setShowCompanyModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Company Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowCompanyModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Company Name:</strong>
                <span>{selectedCompany.name}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedCompany.email}</span>
              </div>
              <div className="detail-row">
                <strong>Address:</strong>
                <span>{selectedCompany.address || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Website:</strong>
                <span>
                  {selectedCompany.website_link ? (
                    <a
                      href={selectedCompany.website_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedCompany.website_link}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                {getStatusBadge(selectedCompany.verification_status)}
              </div>
              {selectedCompany.rejection_reason && (
                <div className="detail-row">
                  <strong>Rejection Reason:</strong>
                  <span>{selectedCompany.rejection_reason}</span>
                </div>
              )}
              {selectedCompany.verified_at && (
                <div className="detail-row">
                  <strong>Verified At:</strong>
                  <span>
                    {new Date(selectedCompany.verified_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <strong>Registered:</strong>
                <span>
                  {new Date(selectedCompany.created_at).toLocaleString()}
                </span>
              </div>
              {selectedCompany.certificate_path && (
                <div className="detail-row">
                  <strong>Certificate:</strong>
                  <button
                    className="btn-primary"
                    onClick={() => handleViewCertificate(selectedCompany.id)}
                  >
                    View Certificate
                  </button>
                </div>
              )}
            </div>
            {selectedCompany.verification_status === "pending" && (
              <div className="modal-footer">
                <button
                  className="btn-success"
                  onClick={() => handleVerify(selectedCompany.id)}
                >
                  Verify Company
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleRejectClick(selectedCompany)}
                >
                  Reject Company
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Company</h2>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Please provide a reason for rejecting{" "}
                <strong>{selectedCompany?.name}</strong>:
              </p>
              <textarea
                className="reject-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleRejectSubmit}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompaniesPage;
