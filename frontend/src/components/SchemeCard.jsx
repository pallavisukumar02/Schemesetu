import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SchemeCard({ scheme }) {
  const { t } = useTranslation();
  return (
    <div className="border border-ink/10 rounded-card p-5 bg-white/50 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug">{scheme.name}</h3>
        <span className="shrink-0 text-sm font-semibold text-ink bg-marigold/30 rounded-full px-2.5 py-0.5">
          {scheme.score}%
        </span>
      </div>
      <p className="text-sm text-ink/70">{scheme.plain_language_summary}</p>

      {scheme.reasons?.length > 0 && (
        <ul className="text-xs text-moss space-y-1">
          {scheme.reasons.map((r, i) => (
            <li key={i}>✓ {r}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-4 pt-1">
        <Link to={`/schemes/${scheme.schemeId}`} className="text-sm font-medium text-ink underline decoration-marigold decoration-2 underline-offset-4">
          {t("scheme.viewDetails")}
        </Link>
      </div>
    </div>
  );
}
