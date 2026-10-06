import API_BASE from "../api.js";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import NotificationPanel from "../components/NotificationPanel";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [dashboardData, setDashboardData] = useState(null);
  const [caseEvents, setCaseEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login"); return; }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const dashboardResponse = await fetch(
          `${API_BASE}/api/dashboard/my-reports`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );

        if (dashboardResponse.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!dashboardResponse.ok) throw new Error("Failed to load dashboard information.");

        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult);

        const caseEventsResponse = await fetch(
          `${API_BASE}/api/case-events/my`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );

        if (caseEventsResponse.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!caseEventsResponse.ok) throw new Error("Failed to load case activity.");

        const caseEventsResult = await caseEventsResponse.json();
        setCaseEvents(caseEventsResult.events || []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(t("dashboard.errorMsg"));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate, t]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = dashboardData?.user || {};
  const missingReports = dashboardData?.missing_reports || [];
  const sightingReports = dashboardData?.sighting_reports || [];
  const totalMissingReports = dashboardData?.summary?.total_missing_reports ?? missingReports.length;
  const totalSightingReports = dashboardData?.summary?.total_sighting_reports ?? sightingReports.length;
  const activeCases = missingReports.filter(r => r.status?.toLowerCase() === "active").length;
  const reunitedCases = missingReports.filter(r =>
    ["resolved", "reunited", "closed"].includes(r.status?.toLowerCase())
  ).length;

  const displayName = user.full_name || "Community member";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const formatNumber = n => String(n).padStart(2, "0");

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const getReportInitial = r => {
    if (r.full_name) return r.full_name.trim().charAt(0).toUpperCase();
    return r.type === "sighting" ? "S" : "M";
  };

  const getReportTitle = r => r.type === "sighting"
    ? t("dashboard.sightingSubmitted")
    : r.full_name || t("dashboard.missingPersonReport");

  const getReportDescription = r => {
    if (r.type === "sighting")
      return r.location ? `${t("dashboard.sightingSubmitted")} · ${r.location}` : t("dashboard.sightingSubmitted");
    return r.last_seen_location
      ? `${t("dashboard.missingPersonReport")} · ${r.last_seen_location}`
      : t("dashboard.missingPersonReport");
  };

  const getReportStatus = r => {
    const s = r.status?.toLowerCase();
    if (s === "active") return { text: t("dashboard.statusActive"), className: "active" };
    if (["resolved", "reunited", "closed"].includes(s)) return { text: t("dashboard.statusResolved"), className: "submitted" };
    if (s === "pending") return { text: t("dashboard.statusPending"), className: "pending" };
    return { text: t("dashboard.statusSubmitted"), className: "submitted" };
  };

  const getCaseEventTitle = event => {
    const et = event.event_type?.toLowerCase();
    if (et === "report_submitted")    return t("dashboard.eventReportSubmitted");
    if (et === "sighting_received")   return t("dashboard.eventSightingReceived");
    if (et === "status_updated")      return t("dashboard.eventStatusUpdated");
    if (et === "investigation_update")return t("dashboard.eventInvestigationUpdate");
    if (et === "reunited")            return t("dashboard.eventReunited");
    return event.event_type || t("dashboard.eventDefault");
  };

  const getCaseEventDescription = event => {
    if (event.description) return event.description;
    if (event.missing_person_name) return `Update for ${event.missing_person_name}.`;
    return "There is a new update on your case.";
  };

  const allReports = [
    ...missingReports.map(r => ({ ...r, type: "missing_person" })),
    ...sightingReports.map(r => ({ ...r, type: "sighting" })),
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const recentReports     = allReports.slice(0, 3);
  const recentCaseEvents  = caseEvents.slice(0, 3);

  return (
    <div className="db-page">

      <GlobalControls />

      {/* ===== TOP NAVBAR ===== */}
      <SiteNavbar />

      {/* ===== PAGE BODY ===== */}
      <div className="db-body">

        {/* ===== TOPBAR ===== */}
        <header className="db-topbar">
          <div className="db-topbar-left">
            <div className="db-eyebrow">{t("dashboard.eyebrow")}</div>
            <h1 className="db-welcome">
              {t("dashboard.welcomeTitle1")} <em>{t("dashboard.welcomeTitle2")}</em>
            </h1>
            <p className="db-welcome-desc">{t("dashboard.welcomeDesc")}</p>
          </div>

          <div className="db-topbar-right">
            <NotificationPanel />
            <div className="db-user-pill">
              <div className="db-avatar">{avatarInitial}</div>
              <div className="db-user-info">
                <strong>{displayName}</strong>
                <span>{user.email || "Community member"}</span>
              </div>
            </div>
            <Link to="/report-missing" className="db-cta-btn">
              {t("dashboard.reportMissingBtn")} →
            </Link>
          </div>
        </header>

        {loading && <div className="db-loading">{t("dashboard.loading")}</div>}
        {error && !loading && <div className="db-error">{error}</div>}

        {!loading && !error && (
          <>
            {/* ===== STATS ===== */}
            <section className="db-stats">
              {[
                { icon: "◎", status: t("dashboard.statActive"),    number: formatNumber(totalMissingReports), label: t("dashboard.statMissingReports") },
                { icon: "◉", status: t("dashboard.statSubmitted"), number: formatNumber(totalSightingReports), label: t("dashboard.statSightings") },
                { icon: "◌", status: t("dashboard.statOpen"),      number: formatNumber(activeCases),          label: t("dashboard.statActiveCases") },
                { icon: "✓", status: t("dashboard.statResolved"),  number: formatNumber(reunitedCases),        label: t("dashboard.statreunited"),   gold: true },
              ].map((card, i) => (
                <article className={`db-stat-card${card.gold ? " db-stat-card--gold" : ""}`} key={i}>
                  <div className="db-stat-top">
                    <span className="db-stat-icon">{card.icon}</span>
                    <span className="db-stat-status">{card.status}</span>
                  </div>
                  <strong className="db-stat-number">{card.number}</strong>
                  <span className="db-stat-label">{card.label}</span>
                </article>
              ))}
            </section>

            {/* ===== QUICK ACTIONS ===== */}
            <section className="db-section">
              <div className="db-section-heading">
                <span>{t("dashboard.quickActionsLabel")}</span>
                <h2>{t("dashboard.quickActionsTitle")}</h2>
              </div>
              <div className="db-actions">
                <Link to="/report-missing" className="db-action-card">
                  <div className="db-action-icon">+</div>
                  <div className="db-action-content">
                    <h3>{t("dashboard.actionReportTitle")}</h3>
                    <p>{t("dashboard.actionReportDesc")}</p>
                    <span>{t("dashboard.actionReportBtn")} →</span>
                  </div>
                </Link>
                <Link to="/report-sighting" className="db-action-card">
                  <div className="db-action-icon">◉</div>
                  <div className="db-action-content">
                    <h3>{t("dashboard.actionSightingTitle")}</h3>
                    <p>{t("dashboard.actionSightingDesc")}</p>
                    <span>{t("dashboard.actionSightingBtn")} →</span>
                  </div>
                </Link>
                <Link to="/missing-persons" className="db-action-card">
                  <div className="db-action-icon">◎</div>
                  <div className="db-action-content">
                    <h3>{t("dashboard.missingPersonsNav")}</h3>
                    <p>{t("dashboard.actionReportDesc")}</p>
                    <span>{t("dashboard.viewAll")} →</span>
                  </div>
                </Link>
              </div>
            </section>

            {/* ===== LOWER PANELS ===== */}
            <section className="db-lower">

              {/* Recent Reports */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div>
                    <span>{t("dashboard.recentLabel")}</span>
                    <h2>{t("dashboard.recentTitle")}</h2>
                  </div>
                  <Link to="/missing-persons">{t("dashboard.viewAll")} →</Link>
                </div>
                <div className="db-report-list">
                  {recentReports.length === 0 ? (
                    <div className="db-empty">
                      <strong>{t("dashboard.noReports")}</strong>
                      <span>{t("dashboard.noReportsDesc")}</span>
                    </div>
                  ) : recentReports.map(report => {
                    const status = getReportStatus(report);
                    return (
                      <div className="db-report-item" key={`${report.type}-${report.id}`}>
                        <div className="db-report-avatar">{getReportInitial(report)}</div>
                        <div className="db-report-info">
                          <strong>{getReportTitle(report)}</strong>
                          <span>{getReportDescription(report)} · {formatDate(report.created_at)}</span>
                        </div>
                        <span className={`db-badge db-badge--${status.className}`}>{status.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Case Activity */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div>
                    <span>{t("dashboard.caseLabel")}</span>
                    <h2>{t("dashboard.caseTitle")}</h2>
                  </div>
                </div>
                <div className="db-timeline">
                  {recentCaseEvents.length > 0 ? recentCaseEvents.map((event, index) => (
                    <div className="db-timeline-item" key={`case-event-${event.id}`}>
                      <span className={`db-timeline-dot${index === recentCaseEvents.length - 1 ? " gold" : ""}`} />
                      <div>
                        <strong>{getCaseEventTitle(event)}</strong>
                        <p>{getCaseEventDescription(event)}</p>
                        <small>{formatDate(event.created_at)}</small>
                      </div>
                    </div>
                  )) : (
                    <div className="db-timeline-item">
                      <span className="db-timeline-dot gold" />
                      <div>
                        <strong>{t("dashboard.noUpdates")}</strong>
                        <p>{t("dashboard.noUpdatesDesc")}</p>
                        <small>{t("dashboard.noUpdatesEmpty")}</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </section>
          </>
        )}

        <footer className="db-footer">
          <span>{t("dashboard.footer")}</span>
          <span>{t("dashboard.footerTagline")}</span>
        </footer>

      </div>
    </div>
  );
}

export default Dashboard;
