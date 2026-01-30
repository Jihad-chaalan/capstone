import "../styles/CompanyRequestsPage.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

const CompanyRequestsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState("");

  async function fetchIncomingRequests() {
    try {
      const res = await api.get("/company/requests");
      setIncomingRequests(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncomingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/internship-requests/${requestId}/accept`, {
        response: responseText,
      });
      setShowRequestModal(false);
      setResponseText("");
      await fetchIncomingRequests();
      alert("Request accepted successfully!");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/internship-requests/${requestId}/reject`, {
        response: responseText,
      });
      setShowRequestModal(false);
      setResponseText("");
      await fetchIncomingRequests();
      alert("Request rejected");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    }
  };

  const getRequestStatusBadge = (status) => {
    const badges = {
      pending: "status-pending",
      accepted: "status-accepted",
      rejected: "status-rejected",
    };
    return badges[status] || "status-pending";
  };

  if (loading) {
    return <div className="requests-loading">Loading requests...</div>;
  }

  return (
    <div className="requests-page">
      {/* Navbar */}
      <nav className="requests-navbar">
        <div className="requests-navbar-container">
          <div className="requests-navbar-content">
            <h1 className="requests-navbar-brand">InternLeb</h1>
            <div className="requests-navbar-actions">
              <button
                onClick={() => navigate("/company/profile")}
                className="requests-nav-button"
                title="My Profile"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="requests-nav-logout"
                title="Sign Out"
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
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="requests-container">
        <div className="requests-header">
          {/* <button
            onClick={() => navigate("/company/profile")}
            className="requests-back-button"
          >
            ← Back to Profile
          </button> */}
          <h1 className="requests-title">University Requests</h1>
          <p className="requests-subtitle">
            Manage internship requests from universities
          </p>
        </div>

        <div className="requests-section">
          {incomingRequests.length === 0 ? (
            <p className="requests-empty">No requests yet.</p>
          ) : (
            <div className="requests-list">
              {incomingRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-card-header">
                    <h3 className="request-card-title">{request.position}</h3>
                    <span
                      className={`request-status-badge ${getRequestStatusBadge(
                        request.status,
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="request-card-body">
                    <p>
                      <strong>University:</strong>{" "}
                      {request.university?.user?.name}
                    </p>
                    <p>
                      <strong>Technology:</strong> {request.technology}
                    </p>
                    <p>
                      <strong>Students Needed:</strong>{" "}
                      {request.number_of_students}
                    </p>
                    <p>
                      <strong>Description:</strong> {request.description}
                    </p>
                    {request.company_response && (
                      <div className="request-response">
                        <strong>Your Response:</strong>
                        <p>{request.company_response}</p>
                      </div>
                    )}
                  </div>
                  {request.status === "pending" && (
                    <div className="request-card-actions">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestModal(true);
                        }}
                        className="request-respond-button"
                      >
                        Respond
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Response Modal */}
      {showRequestModal && selectedRequest && (
        <div
          className="request-modal-overlay"
          onClick={() => setShowRequestModal(false)}
        >
          <div
            className="request-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="request-modal-header">
              <h2 className="request-modal-title">Respond to Request</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="request-modal-close"
              >
                ×
              </button>
            </div>
            <div className="request-modal-body">
              <p>
                <strong>Position:</strong> {selectedRequest.position}
              </p>
              <p>
                <strong>University:</strong>{" "}
                {selectedRequest.university?.user?.name}
              </p>
              <p>
                <strong>Technology:</strong> {selectedRequest.technology}
              </p>
              <p>
                <strong>Students:</strong> {selectedRequest.number_of_students}
              </p>
              <p>
                <strong>Description:</strong> {selectedRequest.description}
              </p>
              <div className="request-form-group">
                <label className="request-form-label">
                  Response Message (optional)
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Add a message to the university..."
                  rows={4}
                  className="request-form-textarea"
                />
              </div>
              <div className="request-modal-actions">
                <button
                  onClick={() => handleAcceptRequest(selectedRequest.id)}
                  className="request-accept-button"
                >
                  Accept Request
                </button>
                <button
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                  className="request-reject-button"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setResponseText("");
                  }}
                  className="request-cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyRequestsPage;
