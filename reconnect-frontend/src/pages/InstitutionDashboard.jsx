import API_BASE from "../api.js";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteNavbar from "../components/SiteNavbar";
import GlobalControls from "../components/GlobalControls";
import ImageUpload from "../components/ImageUpload";
import "./InstitutionDashboard.css";

const API = API_BASE;

const CONDITIONS = [
  { value: "conscious",   key: "condConscious" },
  { value: "unconscious", key: "condUnconscious" },
  { value: "stable",      key: "condStable" },
  { value: "critical",    key: "condCritical" },
  { value: "in_custody",  key: "condCustody" },
  { value: "deceased",    key: "condDeceased" },
  { value: "unknown",     key: "condUnknown" },
];

const STATUS_COLORS = {
  open:       { bg: "#1a3530", color: "#4db8af" },
  identified: { bg: "#1a3020", color: "#6ecf92" },
  closed:     { bg: "#252525", color: "#888" },
};

export default function InstitutionDashboard() {
  const navigate  = useNavigate();
  const { t }    = useTranslation();
  const token     = localStorage.getItem("access_token");

  const [institution, setInstitution] = useState(null);
  const [records, setRecords]         = useState([]);
  const [instLoading, setInstLoading] = useState(true);
  const [recLoading, setRecLoading]   = useState(false);
  const [error, setError]             = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [submitMsg, setSubmitMsg]     = useState("");
  const [submitErr, setSubmitErr]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [photo, setPhoto]             = useState(null);

  const [form, setForm] = useState({
    estimated_age_min: "",
    estimated_age_max: "",
    gender: "unknown",
    physical_description: "",
    found_location: "",
    found_date: "",
    condition: "unknown",
    notes: "",
  });

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchInstitution();
  }, []);

  const fetchInstitution = async () => {
    setInstLoading(true);
    try {
      const res = await fetch(`${API}/api/institutions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) { setInstitution(null); setInstLoading(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load institution.");
      setInstitution(data.institution);
      if (data.institution.status === "approved") fetchRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setInstLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecLoading(true);
    try {
      const res = await fetch(`${API}/api/institutions/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load records.");
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setSubmitErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSubmitErr("");
    setSubmitMsg("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      if (photo) fd.append("photo", photo);

      const res = await fetch(`${API}/api/institutions/records`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setSubmitMsg(
        `Record submitted. ${data.potential_matches_notified} potential match notification(s) sent.`
      );
      setRecords(prev => [data.record, ...prev]);
      setShowForm(false);
      setForm({
        estimated_age_min: "", estimated_age_max: "", gender: "unknown",
        physical_description: "", found_location: "", found_date: "",
        condition: "unknown", notes: "",
      });
      setPhoto(null);
    } catch (err) {
      setSubmitErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (instLoading) {
    return (
      <div className="inst-dash-page">
        <GlobalControls /><SiteNavbar />
        <div className="inst-dash-state"><div className="inst-dash-spinner" /><p>{t("institutionDashboard.loadingRecords")}</p></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="inst-dash-page">
        <GlobalControls /><SiteNavbar />
        <div className="inst-dash-state inst-dash-state--empty">
          <span>🏥</span>
          <h2>{t("institutionDashboard.noProfileTitle")}</h2>
          <p>{t("institutionDashboard.noProfileDesc")}</p>
          <Link to="/institutions/register" className="inst-dash-btn">{t("institutionDashboard.registerBtn")}</Link>
        </div>
      </div>
    );
  }

  const statusInfo = {
    pending:  { color: "#d4a017", label: t("institutionDashboard.pendingTitle"),  desc: t("institutionDashboard.pendingDesc") },
    approved: { color: "#4db8af", label: t("institutionDashboard.approvedTitle"), desc: null },
    rejected: { color: "#e89090", label: t("institutionDashboard.rejectedTitle"), desc: t("institutionDashboard.rejectedDesc") },
  }[institution.status] || { color: "#888", label: institution.status };

  return (
    <div className="inst-dash-page">
      <GlobalControls /><SiteNavbar />

      {/* Header */}
      <header className="inst-dash-header">
        <div className="inst-dash-header-content">
          <span className="inst-dash-type-badge">
            {institution.facility_type === "hospital" ? "🏥" : "🚔"} {institution.facility_type === "hospital" ? "Hospital" : "Police Station"}
          </span>
          <h1>{institution.facility_name}</h1>
          <p>{institution.city}, {institution.region}{institution.address ? ` · ${institution.address}` : ""}</p>
        </div>
        <div className="inst-dash-status-badge" style={{ color: statusInfo.color, borderColor: statusInfo.color }}>
          {statusInfo.label}
        </div>
      </header>

      {/* Pending / rejected message */}
      {institution.status !== "approved" && (
        <div className="inst-dash-notice">{statusInfo.desc}</div>
      )}

      {/* Success message */}
      {submitMsg && (
        <div className="inst-dash-success-msg">✓ {submitMsg}</div>
      )}

      {error && <div className="inst-dash-error">{error}</div>}

      {institution.status === "approved" && (
        <main className="inst-dash-main">

          {/* Stats */}
          <div className="inst-dash-stats">
            <div className="inst-stat"><strong>{records.length}</strong><span>{t("institutionDashboard.totalRecords")}</span></div>
            <div className="inst-stat"><strong>{records.filter(r => r.status === "open").length}</strong><span>{t("institutionDashboard.openRecords")}</span></div>
            <div className="inst-stat"><strong>{records.filter(r => r.status === "identified").length}</strong><span>{t("institutionDashboard.identifiedRecords")}</span></div>
          </div>

          {/* Submit record button */}
          <div className="inst-dash-toolbar">
            <h2>{t("institutionDashboard.recordsTitle")}</h2>
            <button className="inst-dash-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? t("institutionDashboard.cancelBtn") : t("institutionDashboard.submitBtn")}
            </button>
          </div>

          {/* Submit form */}
          {showForm && (
            <form className="inst-dash-form" onSubmit={handleSubmit}>
              <div className="inst-dash-form-title">
                <h3>{t("institutionDashboard.formTitle")}</h3>
                <p>{t("institutionDashboard.formDesc")}</p>
              </div>

              <div className="inst-form-grid">
                <div className="inst-form-field">
                  <label>{t("institutionDashboard.ageMinLabel")}</label>
                  <input type="number" name="estimated_age_min" min="0" max="120"
                    value={form.estimated_age_min} onChange={handleChange} placeholder={t("institutionDashboard.ageMinPlaceholder")} />
                </div>
                <div className="inst-form-field">
                  <label>{t("institutionDashboard.ageMaxLabel")}</label>
                  <input type="number" name="estimated_age_max" min="0" max="120"
                    value={form.estimated_age_max} onChange={handleChange} placeholder={t("institutionDashboard.ageMaxPlaceholder")} />
                </div>
                <div className="inst-form-field">
                  <label>{t("institutionDashboard.genderLabel")}</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="unknown">{t("institutionDashboard.genderUnknown")}</option>
                    <option value="male">{t("institutionDashboard.genderMale")}</option>
                    <option value="female">{t("institutionDashboard.genderFemale")}</option>
                  </select>
                </div>
                <div className="inst-form-field">
                  <label>{t("institutionDashboard.conditionLabel")}</label>
                  <select name="condition" value={form.condition} onChange={handleChange}>
                    {CONDITIONS.map(c => (
                      <option key={c.value} value={c.value}>{t(`institutionDashboard.${c.key}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>{t("institutionDashboard.locationLabel")} *</label>
                  <input type="text" name="found_location" required
                    value={form.found_location} onChange={handleChange}
                    placeholder={t("institutionDashboard.locationPlaceholder")} />
                </div>
                <div className="inst-form-field">
                  <label>{t("institutionDashboard.dateLabel")} *</label>
                  <input type="date" name="found_date" required
                    value={form.found_date} onChange={handleChange} />
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>{t("institutionDashboard.descLabel")}</label>
                  <textarea name="physical_description" rows={4}
                    value={form.physical_description} onChange={handleChange}
                    placeholder={t("institutionDashboard.descPlaceholder")} />
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>{t("institutionDashboard.notesLabel")}</label>
                  <textarea name="notes" rows={2}
                    value={form.notes} onChange={handleChange}
                    placeholder={t("institutionDashboard.notesPlaceholder")} />
                </div>
                <ImageUpload
                  id="inst-photo"
                  label={t("institutionDashboard.photoLabel")}
                  hint={t("institutionDashboard.photoHelper")}
                  optional={true}
                  value={photo}
                  onChange={(file) => setPhoto(file)}
                />
              </div>

              {submitErr && <div className="inst-dash-error">{submitErr}</div>}

              <div className="inst-form-actions">
                <button type="button" className="inst-dash-btn inst-dash-btn--ghost" onClick={() => setShowForm(false)}>
                  {t("institutionDashboard.cancelBtn")}
                </button>
                <button type="submit" className="inst-dash-btn" disabled={saving}>
                  {saving ? t("institutionDashboard.submitting") : t("institutionDashboard.submitRecordBtn")}
                </button>
              </div>
            </form>
          )}

          {/* Records list */}
          {recLoading ? (
            <div className="inst-dash-state"><div className="inst-dash-spinner" /><p>{t("institutionDashboard.loadingRecords")}</p></div>
          ) : records.length === 0 ? (
            <div className="inst-dash-state inst-dash-state--empty">
              <span>📋</span>
              <h3>{t("institutionDashboard.noRecordsTitle")}</h3>
              <p>{t("institutionDashboard.noRecordsDesc")}</p>
            </div>
          ) : (
            <div className="inst-records-grid">
              {records.map(rec => {
                const st = STATUS_COLORS[rec.status] || STATUS_COLORS.open;
                return (
                  <div className="inst-record-card" key={rec.id}>
                    <div className="inst-record-card__top">
                      <span className="inst-record-id">#{rec.id}</span>
                      <span className="inst-record-status" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="inst-record-card__body">
                      <div className="inst-record-row">
                        <span>{t("institutionDashboard.genderDisplay")}</span>
                        <strong>{rec.gender || t("institutionDashboard.unknown")}</strong>
                      </div>
                      <div className="inst-record-row">
                        <span>{t("institutionDashboard.estAge")}</span>
                        <strong>
                          {rec.estimated_age_min || rec.estimated_age_max
                            ? `${rec.estimated_age_min ?? "?"} – ${rec.estimated_age_max ?? "?"} ${t("institutionDashboard.years")}`
                            : t("institutionDashboard.unknown")}
                        </strong>
                      </div>
                      <div className="inst-record-row">
                        <span>{t("institutionDashboard.locationDisplay")}</span>
                        <strong>{rec.found_location}</strong>
                      </div>
                      <div className="inst-record-row">
                        <span>{t("institutionDashboard.found")}</span>
                        <strong>{formatDate(rec.found_date)}</strong>
                      </div>
                      <div className="inst-record-row">
                        <span>{t("institutionDashboard.condition")}</span>
                        <strong>{rec.condition}</strong>
                      </div>
                      {rec.physical_description && (
                        <p className="inst-record-desc">{rec.physical_description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      )}
    </div>
  );
}
