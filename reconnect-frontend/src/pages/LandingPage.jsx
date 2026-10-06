import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroVideo from "../assets/hero-reunion.mp4";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import "./LandingPage.css";

function LandingPage() {
  const { t } = useTranslation();

  return (
    <main className="landing-page">

      <GlobalControls />

      {/* ================= HERO ================= */}
      <section className="hero">

        <div className="hero-video-container">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            src={heroVideo}
          />
        </div>

        <div className="hero-overlay"></div>

        {/* ================= NAVIGATION ================= */}
        <SiteNavbar variant="overlay" />

        {/* ================= HERO CONTENT ================= */}
        <div className="hero-content">

          <div className="hero-eyebrow">
            <span></span>
            {t("landing.eyebrow")}
          </div>

          <h1>
            {t("landing.heroTitle1")}
            <span> {t("landing.heroTitle2")}</span>
          </h1>

          <p className="hero-description">
            {t("landing.heroDesc")}
          </p>

          <div className="hero-buttons">
            <Link to="/report-missing" className="hero-primary-btn">
              {t("landing.reportBtn")}
              <span>→</span>
            </Link>
            <Link to="/missing-persons" className="hero-secondary-btn">
              {t("landing.exploreBtn")}
            </Link>
          </div>

          <div className="hero-trust">
            <span className="trust-line"></span>
            <span>{t("landing.heroTrust")}</span>
          </div>

        </div>

        <div className="scroll-indicator">
          <span>{t("landing.scrollLabel")}</span>
          <div className="scroll-line"></div>
        </div>

      </section>

      {/* ================= INTRO / WHY RECONNECT ================= */}
      <section className="intro-section">

        <div className="section-label">
          <span></span>
          {t("landing.whyLabel")}
        </div>

        <div className="intro-heading">
          <h2>
            {t("landing.whyTitle1")}
            <br />
            <em>{t("landing.whyTitle2")}</em>
          </h2>
          <p className="intro-text">{t("landing.whyDesc")}</p>
        </div>

        <div className="feature-grid">

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-number">01</div>
              <div className="feature-icon">◎</div>
            </div>
            <div className="feature-content">
              <h3>{t("landing.feature1Title")}</h3>
              <p>{t("landing.feature1Desc")}</p>
            </div>
            <div className="feature-line"></div>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-number">02</div>
              <div className="feature-icon">⌁</div>
            </div>
            <div className="feature-content">
              <h3>{t("landing.feature2Title")}</h3>
              <p>{t("landing.feature2Desc")}</p>
            </div>
            <div className="feature-line"></div>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-number">03</div>
              <div className="feature-icon">◇</div>
            </div>
            <div className="feature-content">
              <h3>{t("landing.feature3Title")}</h3>
              <p>{t("landing.feature3Desc")}</p>
            </div>
            <div className="feature-line"></div>
          </article>

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="process-section">

        <div className="process-header">

          <div className="process-intro">
            <div className="section-label">
              <span></span>
              {t("landing.howLabel")}
            </div>
            <h2>
              {t("landing.howTitle1")}
              <br />
              <em>{t("landing.howTitle2")}</em>
            </h2>
          </div>

          <div className="process-description">
            <p>{t("landing.howDesc")}</p>
            <Link to="/report-missing" className="dark-button">
              {t("landing.startReport")}
              <span>→</span>
            </Link>
          </div>

        </div>

        <div className="process-timeline">

          <div className="timeline-line"></div>

          {[
            { num: "01", labelKey: "step1Label", titleKey: "step1Title", descKey: "step1Desc" },
            { num: "02", labelKey: "step2Label", titleKey: "step2Title", descKey: "step2Desc" },
            { num: "03", labelKey: "step3Label", titleKey: "step3Title", descKey: "step3Desc" },
            { num: "04", labelKey: "step4Label", titleKey: "step4Title", descKey: "step4Desc" },
          ].map((step) => (
            <div className="process-step" key={step.num}>
              <div className="step-marker">{step.num}</div>
              <div className="step-content">
                <span className="step-label">{t(`landing.${step.labelKey}`)}</span>
                <h3>{t(`landing.${step.titleKey}`)}</h3>
                <p>{t(`landing.${step.descKey}`)}</p>
              </div>
            </div>
          ))}

        </div>

      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="final-cta">

        <div className="cta-pattern"></div>

        <div className="cta-inner">
          <div className="cta-content">

            <div className="section-label light">
              <span></span>
              {t("landing.ctaLabel")}
            </div>

            <h2>
              {t("landing.ctaTitle1")}
              <br />
              {t("landing.ctaTitle2")}
            </h2>

            <p>{t("landing.ctaDesc")}</p>

            <div className="cta-actions">
              <Link to="/report-missing" className="cta-primary">
                {t("landing.ctaReport")}
                <span>→</span>
              </Link>
              <Link to="/report-sighting" className="cta-outline">
                {t("landing.ctaSighting")}
              </Link>
            </div>

          </div>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="footer">

        <div className="footer-main">

          <div className="footer-brand">
            <Link to="/" className="brand footer-brand-link">
              <span className="brand-mark">R</span>
              <span className="brand-text">
                <strong>{t("brand.name")}</strong>
                <small>{t("brand.country")}</small>
              </span>
            </Link>
            <p className="footer-purpose">{t("brand.tagline")}</p>
          </div>

          <div className="footer-column">
            <h4>{t("landing.footerPlatform")}</h4>
            <Link to="/missing-persons">{t("nav.missingPersons")}</Link>
            <Link to="/report-missing">{t("nav.reportMissing")}</Link>
            <Link to="/report-sighting">{t("nav.reportSighting")}</Link>
          </div>

          <div className="footer-column">
            <h4>{t("landing.footerAccount")}</h4>
            <Link to="/login">{t("nav.signIn")}</Link>
            <Link to="/register">{t("landing.footerCreateAccount")}</Link>
            <Link to="/institutions/register">Register Institution</Link>
          </div>

          <div className="footer-column">
            <h4>{t("landing.footerPurposeTitle")}</h4>
            <p>{t("landing.footerPurposeDesc")}</p>
          </div>

        </div>

        <div className="footer-bottom">
          <span>{t("landing.footerCopyright")}</span>
          <span>{t("landing.footerMeta")}</span>
        </div>

      </footer>

    </main>
  );
}

export default LandingPage;
