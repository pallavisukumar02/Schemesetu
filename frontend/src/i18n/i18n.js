import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

// Translations are fetched at runtime from /locales/{lang}.json — those files
// live in frontend/public/locales/, which Vite serves directly at that URL
// path in both dev and production, with no bundler involved.
//
// Why fetch instead of `import en from "../../../locales/en.json"`: an
// earlier version of this file statically imported the JSON files from a
// /locales folder OUTSIDE the frontend project (a sibling of /frontend).
// That works fine for a production build (Rollup just inlines it), but
// Vite's dev server treats files outside its own project root differently —
// and depending on your OS, antivirus, or a OneDrive-synced project folder,
// that cross-boundary import can silently fail, leaving every translation
// key unresolved (which is exactly the "dashboard.loadError" showing up
// literally on screen instead of real text). Fetching from our own
// public/locales/ keeps everything inside one project root, so this class of
// bug can't happen regardless of OS or where you've placed the folder.
i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: { loadPath: "/locales/{{lng}}.json" },
    lng: localStorage.getItem("schemesetu_lang") || "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
  });

export function setLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem("schemesetu_lang", lang);
  document.documentElement.lang = lang;
}

export default i18n;
