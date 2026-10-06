import API_BASE from "../api.js";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError(t("register.errorPasswordMatch"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to create your account."
        );
      }

      alert(data.message || t("register.successMessage"));
      navigate("/login");

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">

      <GlobalControls />
      <SiteNavbar />

      {/* LEFT SIDE */}
      <section className="register-visual">

        <div className="register-visual-overlay"></div>
        <div className="register-decoration register-decoration-one"></div>
        <div className="register-decoration register-decoration-two"></div>

        <div className="register-visual-content">

          <Link to="/" className="register-brand">
            <span className="register-brand-mark">R</span>
            <span className="register-brand-text">
              <strong>{t("brand.name")}</strong>
              <small>{t("brand.country").toUpperCase()}</small>
            </span>
          </Link>

          <div className="register-message">
            <div className="register-eyebrow">
              <span></span>
              {t("register.eyebrow")}
            </div>
            <h1>
              {t("register.visualTitle1")}
              <em> {t("register.visualTitle2")}</em>
            </h1>
            <p>{t("register.visualDesc")}</p>
          </div>

          <div className="register-quote">
            <span className="register-quote-line"></span>
            <p>{t("register.visualQuote")}</p>
          </div>

        </div>

        <div className="register-page-number">02</div>

      </section>

      {/* RIGHT SIDE */}
      <section className="register-form-side">

        <div className="register-form-wrapper">

          <Link to="/" className="register-mobile-brand">
            <span>R</span>
            <strong>{t("brand.name")} {t("brand.country")}</strong>
          </Link>

          <div className="register-heading">
            <div className="register-small-label">{t("register.smallLabel")}</div>
            <h2>{t("register.formTitle1")} <em>{t("register.formTitle2")}</em></h2>
            <p>{t("register.formDesc")}</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">

            <div className="register-field">
              <label htmlFor="full_name">{t("register.fullNameLabel")}</label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">R</span>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder={t("register.fullNamePlaceholder")}
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="email">{t("register.emailLabel")}</label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">@</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("register.emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="password">{t("register.passwordLabel")}</label>
              <div className="register-input-wrapper">
                <span className="register-input-icon register-password-symbol">•</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.passwordPlaceholder")}
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="register-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? t("register.hide") : t("register.show")}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="confirm_password">{t("register.confirmPasswordLabel")}</label>
              <div className="register-input-wrapper">
                <span className="register-input-icon register-password-symbol">•</span>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("register.confirmPasswordPlaceholder")}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="register-show-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? t("register.hide") : t("register.show")}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  color: "#b42318",
                  background: "rgba(180, 35, 24, 0.06)",
                  border: "1px solid rgba(180, 35, 24, 0.15)",
                  padding: "11px 13px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" className="register-submit" disabled={loading}>
              <span>{loading ? t("register.submitLoading") : t("register.submitBtn")}</span>
              {!loading && <strong>→</strong>}
            </button>

          </form>

          <div className="register-login">
            <p>{t("register.alreadyAccount")}</p>
            <Link to="/login">
              {t("register.signIn")}
              <span>→</span>
            </Link>
          </div>

          <div className="register-security">
            <span></span>
            {t("register.secureNote")}
          </div>

        </div>

      </section>

    </main>
  );
}

export default Register;
