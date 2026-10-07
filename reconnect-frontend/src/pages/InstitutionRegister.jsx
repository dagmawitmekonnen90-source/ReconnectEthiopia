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
          <span className="inst-reg-type-badge">{t("institutionRegister.badge")}</span>
          <h1>{t("institutionRegister.title")}</h1>
          <p>{t("institutionRegister.desc")}</p>

          <div className="inst-reg-how">
            <div className="inst-reg-step">
              <span>1</span>
              <div>
                <strong>{t("institutionRegister.step1Title")}</strong>
                <small>{t("institutionRegister.step1Desc")}</small>
              </div>
            </div>
            <div className="inst-reg-step">
              <span>2</span>
              <div>
                <strong>{t("institutionRegister.step2Title")}</strong>
                <small>{t("institutionRegister.step2Desc")}</small>
              </div>
            </div>
            <div className="inst-reg-step">
              <span>3</span>
              <div>
                <strong>{t("institutionRegister.step3Title")}</strong>
                <small>{t("institutionRegister.step3Desc")}</small>
              </div>
            </div>
          </div>
        </div>

        <div className="inst-reg-form-card">

          {success ? (
            <div className="inst-reg-success">
              <div className="inst-reg-success-icon">✓</div>
              <h2>{t("institutionRegister.successTitle")}</h2>
              <p>{t("institutionRegister.successDesc")}</p>
              <Link to="/dashboard" className="inst-reg-btn">{t("institutionRegister.successBtn")}</Link>
            </div>
          ) : (
            <>
              <div className="inst-reg-form-header">
                <h2>{t("institutionRegister.formTitle")}</h2>
                <p>{t("institutionRegister.formDesc")}</p>
              </div>

              <form onSubmit={handleSubmit} className="inst-reg-form">

                <div className="inst-reg-field">
                  <label htmlFor="facility_name">{t("institutionRegister.facilityNameLabel")}</label>
                  <input
                    id="facility_name" name="facility_name" type="text"
                    placeholder={t("institutionRegister.facilityNamePlaceholder")}
                    value={form.facility_name} onChange={handleChange} required
                  />
                </div>

                <div className="inst-reg-field">
                  <label htmlFor="facility_type">{t("institutionRegister.facilityTypeLabel")}</label>
                  <select id="facility_type" name="facility_type" value={form.facility_type} onChange={handleChange} required>
                    <option value="hospital">{t("institutionRegister.typeHospital")}</option>
                    <option value="police">{t("institutionRegister.typePolice")}</option>
                  </select>
                </div>

                <div className="inst-reg-row">
                  <div className="inst-reg-field">
                    <label htmlFor="region">{t("institutionRegister.regionLabel")}</label>
                    <input id="region" name="region" type="text"
                      placeholder={t("institutionRegister.regionPlaceholder")}
                      value={form.region} onChange={handleChange} required />
                  </div>
                  <div className="inst-reg-field">
                    <label htmlFor="city">{t("institutionRegister.cityLabel")}</label>
                    <input id="city" name="city" type="text"
                      placeholder={t("institutionRegister.cityPlaceholder")}
                      value={form.city} onChange={handleChange} required />
                  </div>
                </div>

                <div className="inst-reg-field">
                  <label htmlFor="address">{t("institutionRegister.addressLabel")}</label>
                  <input id="address" name="address" type="text"
                    placeholder={t("institutionRegister.addressPlaceholder")}
                    value={form.address} onChange={handleChange} />
                </div>

                <div className="inst-reg-field">
                  <label htmlFor="contact_phone">{t("institutionRegister.phoneLabel")}</label>
                  <input id="contact_phone" name="contact_phone" type="tel"
                    placeholder={t("institutionRegister.phonePlaceholder")}
                    value={form.contact_phone} onChange={handleChange} />
                </div>

                {error && <div className="inst-reg-error">{error}</div>}

                <div className="inst-reg-privacy">{t("institutionRegister.privacyNote")}</div>

                <button type="submit" className="inst-reg-btn inst-reg-btn--full" disabled={loading}>
                  {loading ? t("institutionRegister.submitting") : t("institutionRegister.submitBtn")}
                </button>

              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
