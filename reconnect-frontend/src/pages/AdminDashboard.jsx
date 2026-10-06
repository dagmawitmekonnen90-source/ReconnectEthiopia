import API_BASE from "../api.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || data.message || "Failed to load dashboard.");
        }

        setDashboard(data);
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statistics = dashboard?.statistics || {};

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="admin-loading">
          <h2>{t("adminDashboard.loadingTitle")}</h2>
          <p>{t("adminDashboard.loadingDesc")}</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="admin-error">
          <h2>{t("adminDashboard.errorTitle")}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            {t("adminDashboard.tryAgain")}
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Overview of platform activity and management tools."
    >
      {/* Statistics */}
      <section className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <span>{t("adminDashboard.totalUsers")}</span>
            <strong>{statistics.total_users ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔎</div>
          <div>
            <span>{t("adminDashboard.missingPersons")}</span>
            <strong>{statistics.total_missing_persons ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div>
            <span>{t("adminDashboard.reportedSightings")}</span>
            <strong>{statistics.total_sightings ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📂</div>
          <div>
            <span>{t("adminDashboard.activeCases")}</span>
            <strong>{statistics.active_cases ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div>
            <span>{t("adminDashboard.foundCases")}</span>
            <strong>{statistics.found_cases ?? 0}</strong>
          </div>
        </div>
      </section>

      {/* Management */}
      <section className="admin-section">
        <div className="section-heading">
          <p>{t("adminDashboard.adminLabel")}</p>
          <h2>{t("adminDashboard.managementTitle")}</h2>
        </div>
        <div className="management-grid">
          <Link to="/admin/missing-persons" className="management-card">
            <div className="management-icon">🔎</div>
            <div>
              <h3>{t("adminDashboard.manageMissingTitle")}</h3>
              <p>{t("adminDashboard.manageMissingDesc")}</p>
            </div>
            <span className="arrow">→</span>
          </Link>
          <Link to="/admin/sightings" className="management-card">
            <div className="management-icon">📍</div>
            <div>
              <h3>{t("adminDashboard.manageSightingsTitle")}</h3>
              <p>{t("adminDashboard.manageSightingsDesc")}</p>
            </div>
            <span className="arrow">→</span>
          </Link>
          <Link to="/admin/users" className="management-card">
            <div className="management-icon">👥</div>
            <div>
              <h3>{t("adminDashboard.manageUsersTitle")}</h3>
              <p>{t("adminDashboard.manageUsersDesc")}</p>
            </div>
            <span className="arrow">→</span>
          </Link>
          <Link to="/admin/case-events" className="management-card">
            <div className="management-icon">📋</div>
            <div>
              <h3>{t("adminDashboard.manageCaseEventsTitle")}</h3>
              <p>{t("adminDashboard.manageCaseEventsDesc")}</p>
            </div>
            <span className="arrow">→</span>
          </Link>

          <Link to="/admin/accounts" className="management-card">
            <div className="management-icon">🔐</div>
            <div>
              <h3>Account Management</h3>
              <p>Ban accounts, change roles, and review account status.</p>
            </div>
            <span className="arrow">→</span>
          </Link>

          <Link to="/admin/institutions" className="management-card">
            <div className="management-icon">🏥</div>
            <div>
              <h3>Institutions</h3>
              <p>Approve hospital and police registrations, review unidentified records.</p>
            </div>
            <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Admin Information */}
      <section className="admin-info">
        <div>
          <span className="info-label">{t("adminDashboard.systemLabel")}</span>
          <h3>{t("adminDashboard.systemTitle")}</h3>
          <p>{t("adminDashboard.systemDesc")}</p>
        </div>
        <div className="system-status">
          <span className="status-dot"></span>
          {t("adminDashboard.systemConnected")}
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboard;