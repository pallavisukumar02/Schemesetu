import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n/i18n.js";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
];

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <select
      aria-label="Choose language"
      value={i18n.language}
      onChange={(e) => setLanguage(e.target.value)}
      className="bg-transparent border border-ink/20 rounded-card px-2 py-1 text-sm cursor-pointer"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
