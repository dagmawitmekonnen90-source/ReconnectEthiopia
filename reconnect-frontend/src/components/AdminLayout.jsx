import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalControls from "./GlobalControls";
import "./AdminLayout.css";

/**
 * Exclusive admin shell — completely separate from user Dashboard.
 * Dark charcoal sidebar + dark header bar.
 *
 * Props:
 *   title       - page title shown in the header
 *   subtitle    - optional subtitle
 *   children    - page body content
 */
function AdminLayout({ title, subtitle, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  let admin = {};
  try {
    admin = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    admin = {};
  }

  const adminName = admin.full_name || "Administrator";
  const adminInitial = adminName.trim().charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/admin",                 icon: "◈",  label: "Overview" },
    { path: "/admin/missing-persons", icon: "🔎", label: "Missing Persons" },
    { path: "/admin/sightings",       icon: "📍", label: "Sightings" },
    { path: "/admin/case-events",     icon: "📋", label: "Case Events" },
    { path: "/admin/users",           icon: "👥", label: "Users" },
    { path: "/admin/accounts",        icon: "🔐", label: "Account Management" },
    { path: "/admin/institutions",    icon: "🏥", label: "Institutions" },
  ];

  return (
    <div className="admin-shell" data-admin="true">

      <GlobalControls />

      {/* ===== SIDEBAR ===== */}
      <aside className="admin-shell__sidebar">

        {/* Brand */}
        <div className="admin-shell__brand">
          <span className="admin-shell__brand-mark">R</span>
          <div className="admin-shell__brand-text">
            <strong>ReConnect</strong>
            <small>ADMIN PANEL</small>
          </div>
        </div>

        <div className="admin-shell__divider" />

        {/* Nav */}
        <nav className="admin-shell__nav">
          <span className="admin-shell__nav-label">MANAGEMENT</span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-shell__nav-item${isActive(item.path) ? " active" : ""}`}
            >
              <span className="admin-shell__nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-shell__spacer" />

        {/* Danger zone */}
        <div className="admin-shell__divider" />
        <nav className="admin-shell__nav admin-shell__nav--bottom">
          <span className="admin-shell__nav-label">SESSION</span>
          <Link to="/dashboard" className="admin-shell__nav-item">
            <span className="admin-shell__nav-icon">⌂</span>
            User View
          </Link>
          <button className="admin-shell__nav-item admin-shell__logout" onClick={handleLogout}>
            <span className="admin-shell__nav-icon">↪</span>
            Sign Out
          </button>
        </nav>

        {/* Admin profile at bottom */}
        <div className="admin-shell__profile">
          <div className="admin-shell__avatar">{adminInitial}</div>
          <div className="admin-shell__profile-info">
            <strong>{adminName}</strong>
            <small>Administrator</small>
          </div>
        </div>

      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="admin-shell__main">

        {/* Top header bar */}
        <header className="admin-shell__header">
          <div className="admin-shell__header-left">
            <span className="admin-shell__breadcrumb">
              ADMIN
              <b>/</b>
              {title}
            </span>
            {subtitle && <p className="admin-shell__subtitle">{subtitle}</p>}
          </div>

          <div className="admin-shell__header-right">
            <div className="admin-shell__admin-badge">
              <span className="admin-shell__status-dot"></span>
              Admin Session
            </div>
            <div className="admin-shell__header-avatar">{adminInitial}</div>
          </div>
        </header>

        {/* Page body */}
        <div className="admin-shell__body">
          {children}
        </div>

      </div>
    </div>
  );
}

export default AdminLayout;
