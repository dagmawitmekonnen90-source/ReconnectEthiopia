import API_BASE from "../api.js";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || data.msg || t("login.errorInvalid")
        );
      }

      localStorage.setItem("access_token", data.access_token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.role === "admin") {
        const requestedPage = location.state?.from;
        const destination =
          requestedPage && requestedPage.startsWith("/admin")
            ? requestedPage
            : "/admin";
        navigate(destination, { replace: true });
        return;
      }

      const requestedPage = location.state?.from;
      const isAuthPage =
        requestedPage === "/login" || requestedPage === "/register";

      if (requestedPage && !isAuthPage) {
        navigate(requestedPage, { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || t("login.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      <GlobalControls />
      <SiteNavbar />

      {/* LEFT SIDE */}
      <section className="login-visual">

        <div className="login-visual-overlay"></div>
        <div className="login-decoration login-decoration-one"></div>
        <div className="login-decoration login-decoration-two"></div>

        <div className="login-visual-content">

          <Link to="/" className="login-brand">
            <span className="login-brand-mark">R</span>
            <span className="login-brand-text">
              <strong>{t("brand.name")}</strong>
              <small>{t("brand.country").toUpperCase()}</small>
            </span>
          </Link>

          <div className="login-message">
            <div className="login-eyebrow">
              <span></span>
              {t("login.eyebrow")}
            </div>
            <h1>
              {t("login.visualTitle1")}
              <em> {t("login.visualTitle2")}</em>
            </h1>
            <p>{t("login.visualDesc")}</p>
          </div>

          <div className="login-quote">
            <span className="login-quote-line"></span>
            <p>{t("login.visualQuote")}</p>
          </div>

        </div>

        <div className="login-page-number">01</div>

      </section>

      {/* RIGHT SIDE */}
      <section className="login-form-side">

        <div className="login-form-wrapper">

          <Link to="/" className="login-mobile-brand">
            <span>R</span>
            <strong>{t("brand.name")} {t("brand.country")}</strong>
          </Link>

          <div className="login-heading">
            <div className="login-small-label">{t("login.smallLabel")}</div>
            <h2>{t("login.formTitle1")} <em>{t("login.formTitle2")}</em></h2>
            <p>{t("login.formDesc")}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">

            <div className="login-field">
              <label htmlFor="email">{t("login.emailLabel")}</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">@</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">{t("login.passwordLabel")}</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon login-password-symbol">•</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="login-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? t("login.hide") : t("login.show")}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={loading}>
              <span>{loading ? t("login.submitLoading") : t("login.submitBtn")}</span>
              {!loading && <strong>→</strong>}
            </button>

          </form>

          <div className="login-register">
            <p>{t("login.noAccount")}</p>
            <Link to="/register">
              {t("login.createAccount")}
              <span>→</span>
            </Link>
          </div>

          <div className="login-security">
            <span></span>
            {t("login.secureNote")}
          </div>

        </div>

      </section>

    </main>
  );
}

export default Login;
