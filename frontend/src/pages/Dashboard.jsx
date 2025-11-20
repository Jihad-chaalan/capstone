import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getRoleDisplay = () => {
    const roleMap = {
      seeker: "Internship Seeker",
      company: "Company Representative",
      university: "University Administrator",
      admin: "System Administrator",
    };
    return roleMap[user?.role] || user?.role;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-brand">Internship Portal</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 capitalize hidden sm:inline">
                {getRoleDisplay()}
              </span>
              <button onClick={handleLogout} className="btn btn-danger">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-8">
        <div className="card card-lg">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-600">
              Here's what's happening with your internship journey today.
            </p>
          </div>

          {/* User Info */}
          <div className="bg-slate-100 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Your Role</p>
                <p className="font-semibold text-slate-900 capitalize">
                  {user?.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Email</p>
                <p className="font-semibold text-slate-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Member Since</p>
                <p className="font-semibold text-slate-900">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Recently"}
                </p>
              </div>
            </div>
          </div>

          {/* Role-specific Actions */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user?.role === "seeker" && (
                <>
                  <button className="btn btn-primary">
                    Browse Internships
                  </button>
                  <button className="btn btn-primary">My Applications</button>
                  <button className="btn btn-primary">My Projects</button>
                </>
              )}
              {user?.role === "company" && (
                <>
                  <button className="btn btn-success">Create New Post</button>
                  <button className="btn btn-primary">Manage Posts</button>
                  <button className="btn btn-primary">View Applications</button>
                </>
              )}
              {user?.role === "university" && (
                <>
                  <button className="btn btn-primary">Manage Students</button>
                  <button className="btn btn-primary">View Reports</button>
                  <button className="btn btn-primary">Settings</button>
                </>
              )}
              {user?.role === "admin" && (
                <>
                  <button className="btn btn-primary">Manage Users</button>
                  <button className="btn btn-primary">System Stats</button>
                  <button className="btn btn-primary">Site Settings</button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
