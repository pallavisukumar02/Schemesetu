export const DOC_LIBRARY = {
  pmegp: ["Aadhaar / identity proof", "PAN", "Bank account details", "Business or project details", "Project report (if required)", "Category certificate (if applicable)"],
  "mudra-shishu": ["Identity proof", "Address proof", "Bank account details", "Business details", "Quotation or basic project information"],
  "mudra-kishor": ["Identity proof", "Address proof", "Bank account details", "Existing business details", "Business/financial records"],
  "standup-india": ["Identity proof", "PAN", "Category / eligibility proof (if applicable)", "Business/project details", "Banking information"],
  "pm-svanidhi": ["Identity proof", "Street-vendor/eligibility proof", "Bank account details", "Business/location details"],
  "tread-scheme": ["Identity proof", "Business proposal", "Bank details", "Project cost details", "Training/NGO-related information if requested"],
  "startup-india-seed-fund": ["Identity proof", "Startup/business details", "Innovation/product description", "DPIIT/incubator information if applicable", "Pitch or project material"],
  "pm-vishwakarma": ["Identity proof", "Trade/craft details", "Bank account details", "Address information", "Supporting craft information if requested"],
  "pmfme": ["Identity proof", "Business details", "Food-processing activity details", "Bank account details", "Project cost information"],
  default: ["Identity proof", "PAN (if applicable)", "Bank account details", "Business details", "Scheme-specific supporting documents", "Project or financial information if requested"]
};

export function getDocuments(schemeId) {
  return DOC_LIBRARY[schemeId] || DOC_LIBRARY.default;
}

export function readinessFor(match, user) {
  if (!match || !user) return { overall: 0, eligibility: 0, documents: 0, business: 0, profile: 0 };
  const required = getDocuments(match.schemeId || match.id);
  const completed = Number(localStorage.getItem(`schemesetu_docs_${match.schemeId || match.id}`) || 0);
  const documents = Math.min(100, Math.round((completed / required.length) * 100));
  const profileFields = ["name", "age", "gender", "category", "state", "district", "income_bracket", "education_level", "business_type"];
  const filled = profileFields.filter((f) => user[f] !== undefined && user[f] !== null && String(user[f]).trim() !== "").length;
  const profile = Math.round((filled / profileFields.length) * 100);
  const business = user.business_type ? 75 : 25;
  const eligibility = Math.min(100, Math.round(Number(match.score || 0) * 0.95));
  const overall = Math.round(eligibility * 0.4 + documents * 0.25 + business * 0.15 + profile * 0.2);
  return { overall, eligibility, documents, business, profile, completedDocs: completed, totalDocs: required.length };
}

export function labelForScore(score) {
  if (score >= 80) return { label: "Strong fit", className: "badge-green" };
  if (score >= 65) return { label: "Good fit", className: "badge-gold" };
  return { label: "Explore", className: "badge-red" };
}

export function sourceLabel(url = "") {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("gov.in") || host.endsWith("nic.in") || host.endsWith("gov")) return "Government domain";
    return "Official/source link in catalog";
  } catch {
    return "Source link";
  }
}

export function getJourney(user) {
  const type = user?.business_type;
  if (type === "existing") return ["Idea", "Registered", "Fund", "Grow", "Sell"];
  if (type === "artisan") return ["Craft", "Train", "Fund", "Build", "Sell"];
  if (type === "street_vendor") return ["Plan", "Register", "Working capital", "Sell", "Grow"];
  return ["Idea", "Register", "Fund", "Build", "Sell"];
}

export function getOpportunityType(scheme) {
  const text = `${scheme.name} ${scheme.benefits || ""} ${scheme.plain_language_summary || ""}`.toLowerCase();
  if (scheme.resource_only) return "Support resource";
  if (/women|mahila|tread/.test(text)) return "Women entrepreneurship";
  if (/training|skill|niesbud|iie/.test(text)) return "Training & skills";
  if (/food/.test(text)) return "Food business";
  if (/loan|credit|fund|subsidy|financial/.test(text)) return "Finance";
  return "Business support";
}
