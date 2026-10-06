import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalControls from "./GlobalControls";
import "../pages/Dashboard.css";

/**
 * Shared layout shell used by all authenticated user pages.
 *
 * Props:
 *  - breadcrumb  {string}   Page name shown after the "/" separator (required)
 *  - children               Page content rendered inside .dashboard-main
 */
function AppLayout({ breadcrumb, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Read user from localStorage (written at login)
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const displayName = user.full_name || "Community member";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <main className="dashboard-page">

      <GlobalControls />

      {/* ===== SIDEBAR ===== */}
      <aside className="dashboard-sidebar">

        <Link to="/" className="dashboard-brand">
          <span className="dashboard-brand-mark">R</span>
          <span className="dashboard-brand-text">
            <strong>{t("brand.name")}</strong>
            <small>{t("brand.country").toUpperCase()}</small>
          </span>
        </Link>

        <nav className="dashboard-nav">
          <div className="dashboard-nav-label">{t("dashboard.workspaceLabel")}</div>

          <Link
            to="/dashboard"
            className={`dashboard-nav-link${isActive("/dashboard") ? " active" : ""}`}
          >
            <span className="dashboard-nav-icon">⌂</span>
            {t("nav.dashboard")}
          </Link>

          <Link
            to="/missing-persons"
            className={`dashboard-nav-link${isActive("/missing-persons") ? " active" : ""}`}
          >
            <span className="dashboard-nav-icon">◎</span>
            {t("dashboard.missingPersonsNav")}
          </Link>

          <Link
            to="/report-missing"
            className={`dashboard-nav-link${isActive("/report-missing") ? " active" : ""}`}
          >
            <span className="dashboard-nav-icon">+</span>
            {t("dashboard.reportMissingNav")}
          </Link>

          <Link
            to="/report-sighting"
            className={`dashboard-nav-link${isActive("/report-sighting") ? " active" : ""}`}
          >
            <span className="dashboard-nav-icon">◉</span>
            {t("dashboard.reportSightingNav")}
          </Link>

          <div className="dashboard-nav-label dashboard-nav-label-space">
            {t("dashboard.accountLabel")}
          </div>

          <button className="dashboard-nav-link dashboard-logout" onClick={handleLogout}>
            <span className="dashboard-nav-icon">↪</span>
            {t("dashboard.signOut")}
          </button>
        </nav>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-help-mark">?</div>
          <div>
            <strong>{t("dashboard.helpTitle")}</strong>
            <span>{t("dashboard.helpDesc")}</span>
          </div>
        </div>

      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <section className="dashboard-main">

        {/* Topbar: breadcrumb + user profile */}
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <span>{t("dashboard.breadcrumb")}</span>
            <b>/</b>
            {breadcrumb}
          </div>

          <div className="dashboard-user">
            <div className="dashboard-user-info">
              <strong>{displayName}</strong>
              <span>{user.email || "Community member"}</span>
            </div>
            <div className="dashboard-avatar">{avatarInitial}</div>
          </div>
        </header>

        {/* Page content */}
        {children}

      </section>

    </main>
  );
}

export default AppLayout;
