import API_BASE from "../api.js";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import GlobalControls from "../components/GlobalControls";
import "./InstitutionDashboard.css";

const API = API_BASE;

const CONDITIONS = [
  { value: "conscious",    label: "Conscious" },
  { value: "unconscious",  label: "Unconscious" },
  { value: "stable",       label: "Stable" },
  { value: "critical",     label: "Critical" },
  { value: "in_custody",   label: "In Custody" },
  { value: "deceased",     label: "Deceased" },
  { value: "unknown",      label: "Unknown" },
];

const STATUS_COLORS = {
  open:       { bg: "#1a3530", color: "#4db8af", label: "Open" },
  identified: { bg: "#1a3020", color: "#6ecf92", label: "Identified" },
  closed:     { bg: "#252525", color: "#888",    label: "Closed" },
};

export default function InstitutionDashboard() {
  const navigate  = useNavigate();
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
        <div className="inst-dash-state"><div className="inst-dash-spinner" /><p>Loading institution profile…</p></div>
      </div>
    );
  }

  // Not registered yet
  if (!institution) {
    return (
      <div className="inst-dash-page">
        <GlobalControls /><SiteNavbar />
        <div className="inst-dash-state inst-dash-state--empty">
          <span>🏥</span>
          <h2>No Institution Profile Found</h2>
          <p>Register your hospital or police station to submit unidentified records.</p>
          <Link to="/institutions/register" className="inst-dash-btn">Register Institution →</Link>
        </div>
      </div>
    );
  }

  const statusInfo = {
    pending:  { color: "#d4a017", label: "⏳ Pending Admin Approval", desc: "Your registration is under review. You will be able to submit records once approved." },
    approved: { color: "#4db8af", label: "✓ Approved",               desc: null },
    rejected: { color: "#e89090", label: "✕ Registration Rejected",  desc: "Your institution was not approved. Contact the platform admins for more information." },
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
            <div className="inst-stat"><strong>{records.length}</strong><span>Total Records</span></div>
            <div className="inst-stat"><strong>{records.filter(r => r.status === "open").length}</strong><span>Open</span></div>
            <div className="inst-stat"><strong>{records.filter(r => r.status === "identified").length}</strong><span>Identified</span></div>
          </div>

          {/* Submit record button */}
          <div className="inst-dash-toolbar">
            <h2>Unidentified Records</h2>
            <button className="inst-dash-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? "✕ Cancel" : "+ Submit New Record"}
            </button>
          </div>

          {/* Submit form */}
          {showForm && (
            <form className="inst-dash-form" onSubmit={handleSubmit}>
              <div className="inst-dash-form-title">
                <h3>New Unidentified Individual</h3>
                <p>Do not include any personally identifying information. Describe only observable physical characteristics.</p>
              </div>

              <div className="inst-form-grid">
                <div className="inst-form-field">
                  <label>Estimated Age Min</label>
                  <input type="number" name="estimated_age_min" min="0" max="120"
                    value={form.estimated_age_min} onChange={handleChange} placeholder="e.g. 25" />
                </div>
                <div className="inst-form-field">
                  <label>Estimated Age Max</label>
                  <input type="number" name="estimated_age_max" min="0" max="120"
                    value={form.estimated_age_max} onChange={handleChange} placeholder="e.g. 35" />
                </div>
                <div className="inst-form-field">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="inst-form-field">
                  <label>Condition</label>
                  <select name="condition" value={form.condition} onChange={handleChange}>
                    {CONDITIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>Found / Admitted Location *</label>
                  <input type="text" name="found_location" required
                    value={form.found_location} onChange={handleChange}
                    placeholder="e.g. Addis Ababa General Hospital, Addis Ababa" />
                </div>
                <div className="inst-form-field">
                  <label>Date Found / Admitted *</label>
                  <input type="date" name="found_date" required
                    value={form.found_date} onChange={handleChange} />
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>Physical Description</label>
                  <textarea name="physical_description" rows={4}
                    value={form.physical_description} onChange={handleChange}
                    placeholder="Height, build, hair, skin tone, clothing, tattoos, scars, etc. Do NOT include name or ID." />
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>Additional Notes</label>
                  <textarea name="notes" rows={2}
                    value={form.notes} onChange={handleChange}
                    placeholder="Any other observable details…" />
                </div>
                <div className="inst-form-field inst-form-full">
                  <label>Photo (optional)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={e => setPhoto(e.target.files[0] || null)} />
                  <small>Upload only if the individual has consented or is unconscious/unresponsive. Max 5 MB.</small>
                </div>
              </div>

              {submitErr && <div className="inst-dash-error">{submitErr}</div>}

              <div className="inst-form-actions">
                <button type="button" className="inst-dash-btn inst-dash-btn--ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inst-dash-btn" disabled={saving}>
                  {saving ? "Submitting…" : "Submit Record →"}
                </button>
              </div>
            </form>
          )}

          {/* Records list */}
          {recLoading ? (
            <div className="inst-dash-state"><div className="inst-dash-spinner" /><p>Loading records…</p></div>
          ) : records.length === 0 ? (
            <div className="inst-dash-state inst-dash-state--empty">
              <span>📋</span>
              <h3>No records yet</h3>
              <p>Submit your first unidentified individual record using the button above.</p>
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
                        <span>Gender</span><strong>{rec.gender || "Unknown"}</strong>
                      </div>
                      <div className="inst-record-row">
                        <span>Est. Age</span>
                        <strong>
                          {rec.estimated_age_min || rec.estimated_age_max
                            ? `${rec.estimated_age_min ?? "?"} – ${rec.estimated_age_max ?? "?"} yrs`
                            : "Unknown"}
                        </strong>
                      </div>
                      <div className="inst-record-row">
                        <span>Location</span><strong>{rec.found_location}</strong>
                      </div>
                      <div className="inst-record-row">
                        <span>Found</span><strong>{formatDate(rec.found_date)}</strong>
                      </div>
                      <div className="inst-record-row">
                        <span>Condition</span><strong>{rec.condition}</strong>
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
