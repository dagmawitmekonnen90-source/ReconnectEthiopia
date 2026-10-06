import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";
import am from "./locales/am/translation.json";

const savedLang = localStorage.getItem("lang") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    lng: savedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

// Persist language choice and update <html lang> whenever it changes
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("lang", lng);
  document.documentElement.setAttribute("lang", lng);
});

// Set initial lang attribute
document.documentElement.setAttribute("lang", savedLang);

export default i18n;
