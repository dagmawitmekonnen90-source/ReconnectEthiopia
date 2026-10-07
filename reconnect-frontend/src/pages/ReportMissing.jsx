import API_BASE from "../api.js";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import PageHeader from "../components/PageHeader";
import ImageUpload from "../components/ImageUpload";
import "./ReportMissing.css";

function ReportMissing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    full_name: "", age: "", gender: "",
    description: "", last_seen_location: "", last_seen_date: "",
  });

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

      const data = new FormData();
      data.append("full_name", formData.full_name);
      data.append("age", formData.age);
      data.append("gender", formData.gender);
      data.append("description", formData.description);
      data.append("last_seen_location", formData.last_seen_location);
      data.append("last_seen_date", formData.last_seen_date);
      if (photo) data.append("photo", photo);

      const response = await fetch(`${API_BASE}/api/missing-persons`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }

      if (!response.ok) {
        throw new Error(result.msg || result.message || result.error || t("reportMissing.errorMsg"));
      }

      setMessage(t("reportMissing.successMsg"));
      setFormData({ full_name: "", age: "", gender: "", description: "", last_seen_location: "", last_seen_date: "" });
      setPhoto(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-missing-page">

      <GlobalControls />
      <SiteNavbar />

      <PageHeader
        eyebrow={t("reportMissing.eyebrow")}
        title={t("reportMissing.title")}
        subtitle={t("reportMissing.desc")}
      />

      <div className="report-missing-container">

        <form className="report-missing-form" onSubmit={handleSubmit}>

          <div className="form-section">
            <h2>{t("reportMissing.sectionPersonal")}</h2>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="full_name">{t("reportMissing.fullNameLabel")}</label>
                <input
                  id="full_name" name="full_name" type="text"
                  value={formData.full_name} onChange={handleChange}
                  placeholder={t("reportMissing.fullNamePlaceholder")} required
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">{t("reportMissing.ageLabel")}</label>
                <input
                  id="age" name="age" type="number" min="0" max="150"
                  value={formData.age} onChange={handleChange}
                  placeholder={t("reportMissing.agePlaceholder")} required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">{t("reportMissing.genderLabel")}</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">{t("reportMissing.genderDefault")}</option>
                  <option value="Male">{t("reportMissing.genderMale")}</option>
                  <option value="Female">{t("reportMissing.genderFemale")}</option>
                  <option value="Other">{t("reportMissing.genderOther")}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="last_seen_date">{t("reportMissing.lastSeenDateLabel")}</label>
                <input
                  id="last_seen_date" name="last_seen_date" type="date"
                  value={formData.last_seen_date} onChange={handleChange} required
                />
              </div>

            </div>
          </div>

          <div className="form-section">
            <h2>{t("reportMissing.sectionLocation")}</h2>
            <div className="form-group">
              <label htmlFor="last_seen_location">{t("reportMissing.locationLabel")}</label>
              <input
                id="last_seen_location" name="last_seen_location" type="text"
                value={formData.last_seen_location} onChange={handleChange}
                placeholder={t("reportMissing.locationPlaceholder")} required
              />
            </div>
          </div>

          <div className="form-section">
            <ImageUpload
              id="missing-photo"
              label={t("reportMissing.photoLabel")}
              hint={t("reportMissing.photoHelper")}
              optional={true}
              value={photo}
              onChange={(file) => setPhoto(file)}
            />
          </div>

          <div className="form-section">
            <h2>{t("reportMissing.sectionAdditional")}</h2>
            <div className="form-group">
              <label htmlFor="description">{t("reportMissing.descriptionLabel")}</label>
              <textarea
                id="description" name="description"
                value={formData.description} onChange={handleChange}
                placeholder={t("reportMissing.descriptionPlaceholder")} rows="6"
              />
            </div>
          </div>

          {message && <div className="report-success">{message}</div>}
          {error && <div className="report-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => navigate("/dashboard")}>
              {t("reportMissing.cancelBtn")}
            </button>
            <button type="submit" className="submit-report-button" disabled={loading}>
              {loading ? t("reportMissing.submittingBtn") : t("reportMissing.submitBtn")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ReportMissing;
