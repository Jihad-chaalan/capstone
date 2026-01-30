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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState("all");
  const menuRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const handleVerify = async (companyId) => {
    try {
      await api.post(`/admin/companies/${companyId}/verify`);
      const res = await api.get("/admin/companies");
      setCompanies(Array.isArray(res.data.data) ? res.data.data : []);
      showToast("Company verified successfully", "success");
    } catch (error) {
      console.error("Error verifying company:", error);
      showToast("Failed to verify company", "error");
    }
  };

  const handleReject = async (companyId) => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }

    try {
      await api.post(`/admin/companies/${companyId}/reject`, {
        reason: rejectReason,
      });
      const res = await api.get("/admin/companies");
      setCompanies(Array.isArray(res.data.data) ? res.data.data : []);
      setShowRejectModal(false);
      setRejectReason("");
      showToast("Company rejected", "success");
    } catch (error) {
      console.error("Error rejecting company:", error);
      showToast("Failed to reject company", "error");
    }
  };

  const handleViewCertificate = async (companyId) => {
    try {
      const response = await api.get(
        `/admin/companies/${companyId}/certificate`,
        { responseType: "blob" },
      );

      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error viewing certificate:", error);
      alert("Failed to load certificate");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
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
    return <div className="admin-loading">Loading companies...</div>;
  }

  return (
    <div className="admin-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h2 className="admin-navbar-title">Company Verification</h2>
          <div className="admin-navbar-actions">
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
          <h2 className="admin-section-title">
            All Companies ({companies.length})
          </h2>

          {/* Filter Tabs */}
          <div className="filter-tabs" style={{ marginBottom: "2rem" }}>
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
              {
                companies.filter((c) => c.verification_status === "pending")
                  .length
              }
              )
            </button>
            <button
              className={filter === "verified" ? "active" : ""}
              onClick={() => setFilter("verified")}
            >
              Verified (
              {
                companies.filter((c) => c.verification_status === "verified")
                  .length
              }
              )
            </button>
            <button
              className={filter === "rejected" ? "active" : ""}
              onClick={() => setFilter("rejected")}
            >
              Rejected (
              {
                companies.filter((c) => c.verification_status === "rejected")
                  .length
              }
              )
            </button>
          </div>

          {/* Companies Table */}
          <div className="admin-table-container">
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
                            className="admin-btn-view"
                            onClick={() => handleViewCertificate(company.id)}
                          >
                            View
                          </button>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>
                      <td>
                        {new Date(company.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {company.verification_status === "pending" && (
                          <>
                            <button
                              className="admin-btn-verify"
                              onClick={() => handleVerify(company.id)}
                            >
                              Verify
                            </button>
                            <button
                              className="admin-btn-reject"
                              onClick={() => {
                                setSelectedCompany(company);
                                setShowRejectModal(true);
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredCompanies.length === 0 && (
              <p className="admin-empty-message">No companies available</p>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div
            className="admin-modal-overlay"
            onClick={() => setShowRejectModal(false)}
          >
            <div
              className="admin-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Reject Company</h2>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="admin-modal-close"
                ></button>
              </div>
              <div className="admin-modal-body">
                <p>Please provide a reason for rejection:</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="4"
                />
              </div>
              <div className="admin-modal-footer">
                <button
                  className="admin-btn-reject"
                  onClick={() => handleReject(selectedCompany?.id)}
                >
                  Reject
                </button>
                <button onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompaniesPage;
