import API_BASE from "../api.js";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import PageHeader from "../components/PageHeader";
import "./ReportSighting.css";

function ReportSighting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [missingPersons, setMissingPersons] = useState([]);
  const [formData, setFormData] = useState({
    missing_person_id: "", description: "", location: "", sighting_date: "",
  });

  const [loadingPersons, setLoadingPersons] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMissingPersons = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login", { replace: true, state: { from: location.pathname } });
          return;
        }

        const response = await fetch(`${API_BASE}/api/missing-persons`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true, state: { from: location.pathname } });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load missing persons.");
        }

        setMissingPersons(Array.isArray(data) ? data : data.missing_persons || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPersons(false);
      }
    };

    fetchMissingPersons();
  }, [navigate, location.pathname]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login", { replace: true, state: { from: location.pathname } });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/sightings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          missing_person_id: Number(formData.missing_person_id),
          description: formData.description,
          location: formData.location,
          sighting_date: formData.sighting_date,
        }),
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }

      if (!response.ok) {
        throw new Error(result.msg || result.message || result.error || t("reportSighting.errorMsg"));
      }

      setMessage(t("reportSighting.successMsg"));
      setFormData({ missing_person_id: "", description: "", location: "", sighting_date: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-sighting-page">

      <GlobalControls />
      <SiteNavbar />

      <PageHeader
        eyebrow={t("reportSighting.eyebrow")}
        title={t("reportSighting.title")}
        subtitle={t("reportSighting.desc")}
      />

      <div className="report-sighting-container">

        <form className="report-sighting-form" onSubmit={handleSubmit}>

          <div className="form-section">
            <h2>{t("reportSighting.sectionPerson")}</h2>
            <div className="form-group">
              <label htmlFor="missing_person_id">{t("reportSighting.missingPersonLabel")}</label>

              {loadingPersons ? (
                <p className="loading-text">{t("reportSighting.loadingPersons")}</p>
              ) : missingPersons.length === 0 ? (
                <div className="no-persons">
                  <p>{t("reportSighting.noPersonsMsg")}</p>
                  <button type="button" onClick={() => navigate("/report-missing")}>
                    {t("reportSighting.noPersonsBtn")}
                  </button>
                </div>
              ) : (
                <select
                  id="missing_person_id" name="missing_person_id"
                  value={formData.missing_person_id} onChange={handleChange} required
                >
                  <option value="">{t("reportSighting.selectPerson")}</option>
                  {missingPersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name}
                      {person.age ? ` — Age ${person.age}` : ""}
                      {person.last_seen_location ? ` — ${person.last_seen_location}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>{t("reportSighting.sectionInfo")}</h2>

            <div className="form-group">
              <label htmlFor="location">{t("reportSighting.locationLabel")}</label>
              <input
                id="location" name="location" type="text"
                value={formData.location} onChange={handleChange}
                placeholder={t("reportSighting.locationPlaceholder")} required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sighting_date">{t("reportSighting.dateLabel")}</label>
              <input
                id="sighting_date" name="sighting_date" type="date"
                value={formData.sighting_date} onChange={handleChange} required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">{t("reportSighting.observationLabel")}</label>
              <textarea
                id="description" name="description"
                value={formData.description} onChange={handleChange}
                placeholder={t("reportSighting.observationPlaceholder")}
                rows="7" required
              />
            </div>
          </div>

          {message && <div className="sighting-success">{message}</div>}
          {error && <div className="sighting-error">{error}</div>}

          <div className="sighting-actions">
            <button type="button" className="sighting-cancel-button" onClick={() => navigate("/dashboard")}>
              {t("reportSighting.cancelBtn")}
            </button>
            <button
              type="submit" className="sighting-submit-button"
              disabled={loading || loadingPersons || missingPersons.length === 0}
            >
              {loading ? t("reportSighting.submittingBtn") : t("reportSighting.submitBtn")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ReportSighting;
