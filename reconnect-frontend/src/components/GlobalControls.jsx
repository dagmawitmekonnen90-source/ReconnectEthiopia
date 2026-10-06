import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import "./GlobalControls.css";

function GlobalControls() {
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const isAmharic = i18n.language === "am";

  const toggleLang = () => {
    i18n.changeLanguage(isAmharic ? "en" : "am");
  };

  return (
    <div className="global-controls" aria-label="Page controls">
      {/* Language toggle — icon only */}
      <button
        className="global-controls-btn"
        onClick={toggleLang}
        aria-label={isAmharic ? t("controls.langEn") : t("controls.langAm")}
        title={isAmharic ? t("controls.langEn") : t("controls.langAm")}
      >
        <span className="global-controls-icon">
          {isAmharic ? "EN" : "አማ"}
        </span>
      </button>

      {/* Theme toggle — icon only */}
      <button
        className="global-controls-btn"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("controls.toggleLight") : t("controls.toggleDark")}
        title={theme === "dark" ? t("controls.toggleLight") : t("controls.toggleDark")}
      >
        <span className="global-controls-icon">
          {theme === "dark" ? "☀" : "☾"}
        </span>
      </button>
    </div>
  );
}

export default GlobalControls;
