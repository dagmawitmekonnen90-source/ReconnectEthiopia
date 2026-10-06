import API_BASE from "../api.js";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteNavbar from "../components/SiteNavbar";
import GlobalControls from "../components/GlobalControls";
import "./InstitutionRegister.css";

const API = API_BASE;

export default function InstitutionRegister() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    facility_name: "",
    facility_type: "hospital",
    region: "",
    city: "",
    address: "",
    contact_phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem("access_token");

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate("/login", { state: { from: "/institutions/register" } });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/institutions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inst-reg-page">
      <GlobalControls />
      <SiteNavbar />

      <div className="inst-reg-container">

        <div className="inst-reg-hero">
          <span className="inst-reg-type-badge">🏥 Police &amp; Hospital Connect</span>
          <h1>Register Your Institution</h1>
          <p>
            Hospitals and police stations can submit unidentified patient and
            detainee records — no personal info required. Our system automatically
            cross-references them with reported missing persons and notifies families
            of potential matches.
          </p>

          <div className="inst-reg-how">
            <div className="inst-reg-step">
              <span>1</span>
              <div>
                <strong>Register &amp; get approved</strong>
                <small>Submit your facility details. An admin reviews and approves within 24 hours.</small>
              </div>
            </div>
            <div className="inst-reg-step">
              <span>2</span>
              <div>
                <strong>Submit unidentified records</strong>
                <small>Describe physical appearance — no name, ID, or personal info needed.</small>
              </div>
            </div>
            <div className="inst-reg-step">
              <span>3</span>
              <div>
                <strong>Families get notified</strong>
                <small>When a record matches a missing person, the family is alerted automatically.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="inst-reg-form-card">

          {success ? (
            <div className="inst-reg-success">
              <div className="inst-reg-success-icon">✓</div>
              <h2>Application Submitted</h2>
              <p>
                Your institution registration is under review. An admin will approve
                it within 24 hours. You'll be able to submit records once approved.
              </p>
              <Link to="/dashboard" className="inst-reg-btn">Go to Dashboard</Link>
            </div>
          ) : (
            <>
              <div className="inst-reg-form-header">
                <h2>Facility Details</h2>
                <p>All fields marked * are required.</p>
              </div>

              <form onSubmit={handleSubmit} className="inst-reg-form">

                <div className="inst-reg-field">
                  <label htmlFor="facility_name">Facility Name *</label>
                  <input
                    id="facility_name" name="facility_name" type="text"
                    placeholder="e.g. Addis Ababa General Hospital"
                    value={form.facility_name} onChange={handleChange} required
                  />
                </div>

                <div className="inst-reg-field">
                  <label htmlFor="facility_type">Facility Type *</label>
                  <select id="facility_type" name="facility_type" value={form.facility_type} onChange={handleChange} required>
                    <option value="hospital">🏥 Hospital / Health Facility</option>
                    <option value="police">🚔 Police Station / Law Enforcement</option>
                  </select>
                </div>

                <div className="inst-reg-row">
                  <div className="inst-reg-field">
                    <label htmlFor="region">Region *</label>
                    <input
                      id="region" name="region" type="text"
                      placeholder="e.g. Addis Ababa"
                      value={form.region} onChange={handleChange} required
                    />
                  </div>
                  <div className="inst-reg-field">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city" name="city" type="text"
                      placeholder="e.g. Addis Ababa"
                      value={form.city} onChange={handleChange} required
                    />
                  </div>
                </div>

                <div className="inst-reg-field">
                  <label htmlFor="address">Address (optional)</label>
                  <input
                    id="address" name="address" type="text"
                    placeholder="Street address or landmark"
                    value={form.address} onChange={handleChange}
                  />
                </div>

                <div className="inst-reg-field">
                  <label htmlFor="contact_phone">Contact Phone (optional)</label>
                  <input
                    id="contact_phone" name="contact_phone" type="tel"
                    placeholder="+251 ..."
                    value={form.contact_phone} onChange={handleChange}
                  />
                </div>

                {error && <div className="inst-reg-error">{error}</div>}

                <div className="inst-reg-privacy">
                  🔒 Your facility information is only visible to platform admins and is used solely to verify your identity. It is never shown to the public.
                </div>

                <button type="submit" className="inst-reg-btn inst-reg-btn--full" disabled={loading}>
                  {loading ? "Submitting…" : "Submit Registration →"}
                </button>

              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
