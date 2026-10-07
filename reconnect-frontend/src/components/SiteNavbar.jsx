import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./SiteNavbar.css";

/**
 * Shared navbar used on all public and authenticated pages.
 *
 * Props:
 *  - variant  "overlay"  — transparent, sits over a dark hero/background (LandingPage)
 *             "solid"    — dark teal background bar (all other pages)
 */
function SiteNavbar({ variant = "solid" }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authState, setAuthState]     = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return { user: raw ? JSON.parse(raw) : null, token: localStorage.getItem("access_token") };
    } catch { return { user: null, token: null }; }
  });
  const dropdownRef = useRef(null);

  // Re-read auth state every time the URL changes (catches post-login navigations)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setAuthState({
        user: raw ? JSON.parse(raw) : null,
        token: localStorage.getItem("access_token"),
      });
    } catch {
      setAuthState({ user: null, token: null });
    }
  }, [location.pathname]);

  const user = authState.user;
  const isLoggedIn = !!authState.token && !!user;
  const displayName = user?.full_name || "Account";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setDropdownOpen(false);
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <nav className={`site-navbar site-navbar--${variant}`}>
      <div className="site-navbar__inner">

        {/* ===== BRAND ===== */}
        <Link to="/" className="site-navbar__brand">
          <span className="site-navbar__brand-mark">R</span>
          <span className="site-navbar__brand-text">
            <strong>{t("brand.name")}</strong>
            <small>{t("brand.country")}</small>
          </span>
        </Link>

        {/* ===== NAV LINKS (desktop) ===== */}
        <div className="site-navbar__links">
          <Link to="/" className={isActive("/") ? "active" : ""}>{t("nav.home")}</Link>
          <Link to="/missing-persons" className={isActive("/missing-persons") ? "active" : ""}>{t("nav.missingPersons")}</Link>
          <Link to="/report-missing" className={isActive("/report-missing") ? "active" : ""}>{t("nav.reportMissing")}</Link>
          <Link to="/report-sighting" className={isActive("/report-sighting") ? "active" : ""}>{t("nav.reportSighting")}</Link>
          {/* Only show For Institutions if not logged in as institution */}
          {(!isLoggedIn || (user?.role !== "institution" && user?.role !== "admin")) && (
            <Link to="/institutions/register" className={isActive("/institutions") ? "active" : ""}>For Institutions</Link>
          )}
        </div>

        {/* ===== AUTH ACTIONS ===== */}
        <div className="site-navbar__actions">
          {isLoggedIn ? (
            /* ---- Profile dropdown ---- */
            <div className="site-navbar__profile" ref={dropdownRef}>
              <button
                className="site-navbar__avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
              >
                <span className="site-navbar__avatar">{avatarInitial}</span>
                <span className="site-navbar__avatar-name">{displayName.split(" ")[0]}</span>
                <span className="site-navbar__chevron">{dropdownOpen ? "▲" : "▼"}</span>
              </button>

              {dropdownOpen && (
                <div className="site-navbar__dropdown">
                  <div className="site-navbar__dropdown-header">
                    <span className="site-navbar__dropdown-avatar">{avatarInitial}</span>
                    <div>
                      <strong>{displayName}</strong>
                      <small>{user?.email}</small>
                    </div>
                  </div>

                  <div className="site-navbar__dropdown-divider" />

                  {user?.role === "institution" ? (
                    <Link
                      to="/institutions/dashboard"
                      className="site-navbar__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      🏥 Institution Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="site-navbar__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      ⌂ {t("nav.dashboard")}
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="site-navbar__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      ★ Admin Panel
                    </Link>
                  )}

                  <div className="site-navbar__dropdown-divider" />

                  <button
                    className="site-navbar__dropdown-item site-navbar__dropdown-logout"
                    onClick={handleLogout}
                  >
                    ↪ {t("dashboard.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ---- Sign in / Get Started ---- */
            <>
              <Link to="/login" className="site-navbar__signin">{t("nav.signIn")}</Link>
              <Link to="/register" className="site-navbar__register">{t("nav.getStarted")}</Link>
            </>
          )}
        </div>

        {/* ===== MOBILE HAMBURGER ===== */}
        <button
          className="site-navbar__hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>

      {/* ===== MOBILE MENU ===== */}
      {menuOpen && (
        <div className="site-navbar__mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)} className={isActive("/") ? "active" : ""}>{t("nav.home")}</Link>
          <Link to="/missing-persons" onClick={() => setMenuOpen(false)} className={isActive("/missing-persons") ? "active" : ""}>{t("nav.missingPersons")}</Link>
          <Link to="/report-missing" onClick={() => setMenuOpen(false)} className={isActive("/report-missing") ? "active" : ""}>{t("nav.reportMissing")}</Link>
          <Link to="/report-sighting" onClick={() => setMenuOpen(false)} className={isActive("/report-sighting") ? "active" : ""}>{t("nav.reportSighting")}</Link>
          {(!isLoggedIn || (user?.role !== "institution" && user?.role !== "admin")) && (
            <Link to="/institutions/register" onClick={() => setMenuOpen(false)}>For Institutions</Link>
          )}

          {isLoggedIn ? (
            <>
              {user?.role === "institution" ? (
                <Link to="/institutions/dashboard" onClick={() => setMenuOpen(false)}>🏥 Institution Dashboard</Link>
              ) : (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>{t("nav.dashboard")}</Link>
              )}
              {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
              <button onClick={() => { setMenuOpen(false); handleLogout(); }}>{t("dashboard.signOut")}</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>{t("nav.signIn")}</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>{t("nav.getStarted")}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default SiteNavbar;
