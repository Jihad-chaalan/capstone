import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import "../styles/AdminDashboard.css";
import {
  UsersBreakdownChart,
  SkillsDistributionChart,
  TechnologyDemandChart,
  ApplicationsStatsChart,
  ActivityOverviewChart,
} from "../pages/AdminCharts";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  // Chart data states
  const [usersBreakdown, setUsersBreakdown] = useState([]);
  const [skillsDistribution, setSkillsDistribution] = useState([]);
  const [technologyDemand, setTechnologyDemand] = useState([]);
  const [applicationsStats, setApplicationsStats] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    seekers: 0,
    companies: 0,
    universities: 0,
    totalApplications: 0,
    totalPosts: 0,
    skills: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let loadingTimer;

    const loadData = async () => {
      loadingTimer = setTimeout(() => {
        if (isMounted) setLoading(true);
      }, 500);

      try {
        // Try new statistics endpoint first
        try {
          const statsRes = await api.get("/admin/statistics/all");
          const data = statsRes.data.data;

          if (!isMounted) return;

          setStats({
            totalUsers: data.overview.totalUsers || 0,
            seekers: data.overview.seekers || 0,
            companies: data.overview.companies || 0,
            universities: data.overview.universities || 0,
            totalApplications: data.overview.totalApplications || 0,
            totalPosts: data.overview.totalPosts || 0,
            skills: data.overview.totalSkills || 0,
          });

          setUsersBreakdown(data.usersBreakdown || []);
          setSkillsDistribution(data.skillsDistribution || []);
          setTechnologyDemand(data.technologyDemand || []);
          setApplicationsStats(data.applicationsStats || {});
        } catch (error) {
          // Fallback to old endpoints
          console.log("New endpoint failed, using legacy endpoints...", error);
          const [usersRes, appsRes, postsRes, skillsRes] = await Promise.all([
            api.get("/admin/users"),
            api.get("/admin/applications"),
            api.get("/posts"),
            api.get("/admin/skills"),
          ]);

          const usersData = usersRes.data.data.data || usersRes.data.data || [];
          const appsData = Array.isArray(appsRes.data.data)
            ? appsRes.data.data
            : appsRes.data.data?.data || [];
          const postsData = Array.isArray(postsRes.data.data)
            ? postsRes.data.data
            : postsRes.data.data?.data || [];
          const skillsData = Array.isArray(skillsRes.data.data)
            ? skillsRes.data.data
            : skillsRes.data.data?.data || [];

          setStats({
            totalUsers: usersData.length,
            seekers: usersData.filter((u) => u.role === "seeker").length,
            companies: usersData.filter((u) => u.role === "company").length,
            universities: usersData.filter((u) => u.role === "university")
              .length,
            totalApplications: appsData.length,
            totalPosts: postsData.length,
            skills: skillsData.length,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading admin data:", error);
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimer);
    };
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-page">
      {/* Navbar */}
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h2 className="admin-navbar-title">Admin Dashboard</h2>
          <div className="admin-navbar-actions">
            <span className="admin-user-name">Welcome, {user?.name}</span>
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
        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/users")}
            style={{ cursor: "pointer" }}
          >
            <div className="admin-stat-icon admin-stat-icon-blue">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Users</p>
              <p className="admin-stat-value">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-green">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Seekers</p>
              <p className="admin-stat-value">{stats.seekers}</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-orange">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Universities</p>
              <p className="admin-stat-value">{stats.universities}</p>
            </div>
          </div>

          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/posts")}
            style={{ cursor: "pointer" }}
          >
            <div className="admin-stat-icon admin-stat-icon-teal">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Posts</p>
              <p className="admin-stat-value">{stats.totalPosts}</p>
            </div>
          </div>

          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/applications")}
            style={{ cursor: "pointer" }}
          >
            <div className="admin-stat-icon admin-stat-icon-red">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Applications</p>
              <p className="admin-stat-value">{stats.totalApplications}</p>
            </div>
          </div>
          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/companies")}
            style={{ cursor: "pointer" }}
          >
            <div className="admin-stat-icon admin-stat-icon-red">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Companies</p>
              <p className="admin-stat-value">{stats.companies || 0}</p>
            </div>
          </div>

          <div
            className="admin-stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/admin/skills")}
          >
            <div className="admin-stat-icon admin-stat-icon-orange">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Manage Skills</p>
              <p className="admin-stat-value">{stats.skills || 0}</p>
            </div>
            {/* <div className="admin-stat-details">
              <h3>Skills</h3>
              <p className="admin-stat-number">{stats.skills || 0}</p>
              <p className="admin-stat-label">Manage Skills</p>
            </div> */}
          </div>
        </div>

        {/* Charts Section */}
        <div className="admin-charts-section">
          <UsersBreakdownChart data={usersBreakdown} />
          <ActivityOverviewChart stats={stats} />
          <SkillsDistributionChart data={skillsDistribution} />
          <TechnologyDemandChart data={technologyDemand} />
          <ApplicationsStatsChart data={applicationsStats} />
        </div>

        {/* Quick Links */}
        <div className="admin-section">
          <h2 className="admin-section-title">Quick Links</h2>
          <div className="admin-quick-links">
            <button
              onClick={() => navigate("/admin/users")}
              className="admin-quick-link-btn"
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Manage Users
            </button>
            <button
              onClick={() => navigate("/admin/posts")}
              className="admin-quick-link-btn"
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Manage Posts
            </button>
            <button
              onClick={() => navigate("/admin/applications")}
              className="admin-quick-link-btn"
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
