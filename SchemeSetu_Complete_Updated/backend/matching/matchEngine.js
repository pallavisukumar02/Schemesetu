// backend/matching/matchEngine.js
//
// Rule-based, fully transparent matching engine. No ML model, no black box:
// every point of the match score maps to a specific eligibility rule, and
// `matchScheme()` always returns *why* a scheme did or didn't match.
//
// This module is imported by both routes/schemes.js (web app) and the
// WhatsApp bot (whatsapp-bot/bot.js) so the matching logic is never duplicated.

const fs = require("fs");
const path = require("path");

const SCHEMES_PATH = path.join(__dirname, "..", "..", "schemes.json");

function loadSchemes() {
  const raw = fs.readFileSync(SCHEMES_PATH, "utf8");
  return JSON.parse(raw);
}

// Business-stage tags a user profile can satisfy. "any" on a scheme matches
// every stage; a scheme with a specific stage only matches that same stage
// or a profile that also says "any" (used for generic browsing/testing).
function businessStageMatches(schemeStage, userStage) {
  if (!schemeStage || schemeStage === "any") return true;
  if (!userStage) return false;
  return schemeStage === userStage;
}

function incomeBracketToNumber(bracket) {
  // Profiles store an income *bracket* label (never an exact figure) to limit
  // how much precise financial data is collected. Map the bracket to its
  // upper bound so it can be checked against a scheme's income_max.
  const map = {
    below_1l: 100000,
    "1l_3l": 300000,
    "3l_6l": 600000,
    "6l_10l": 1000000,
    above_10l: Infinity,
  };
  return map[bracket] ?? Infinity;
}

/**
 * Score one scheme against one user profile.
 * Returns { matched: boolean, score: number (0-100), reasons: string[] }
 */
function matchScheme(scheme, profile) {
  const reasons = [];
  const failReasons = [];
  const e = scheme.eligibility;
  let pointsEarned = 0;
  let pointsPossible = 0;

  // The score measures *strength of fit*, not just whether a rule allows the
  // applicant. A broad rule such as gender="any" or states="all" is useful,
  // but it is not positive evidence that the scheme is especially targeted
  // to this applicant. Those broad rules therefore receive partial credit.
  // This prevents a long list of schemes from appearing as 100% matches.

  // --- category (25) ---
  pointsPossible += 25;
  if (!e.category || e.category.length === 0) {
    pointsEarned += 15;
  } else if (e.category.includes(profile.category)) {
    pointsEarned += 25;
    reasons.push(`Your category (${String(profile.category || "").toUpperCase()}) is eligible`);
  } else {
    failReasons.push(`Restricted to: ${e.category.join(", ").toUpperCase()}`);
  }

  // --- gender (15) ---
  pointsPossible += 15;
  if (!e.gender || e.gender === "any") {
    pointsEarned += 8;
  } else if (e.gender === profile.gender) {
    pointsEarned += 15;
    reasons.push(`Open to ${e.gender} applicants — matches your profile`);
  } else {
    failReasons.push(`Only open to ${e.gender} applicants`);
  }

  // --- age (15) ---
  pointsPossible += 15;
  const ageOk =
    (e.age_min == null || profile.age >= e.age_min) &&
    (e.age_max == null || profile.age <= e.age_max);
  if (ageOk) {
    const hasAgeBoundary = e.age_min != null || e.age_max != null;
    pointsEarned += hasAgeBoundary ? 12 : 8;
    if (e.age_min != null) reasons.push(`Meets the minimum age of ${e.age_min}`);
  } else {
    failReasons.push(`Age requirement: ${e.age_min ?? "no min"}–${e.age_max ?? "no max"}`);
  }

  // --- income (15) ---
  pointsPossible += 15;
  const userIncomeMax = incomeBracketToNumber(profile.income_bracket);
  if (e.income_max == null || userIncomeMax <= e.income_max) {
    pointsEarned += e.income_max == null ? 8 : 15;
    if (e.income_max != null) {
      reasons.push(`Household income is within the ₹${e.income_max.toLocaleString("en-IN")} limit`);
    }
  } else {
    failReasons.push(`Income must be under ₹${e.income_max.toLocaleString("en-IN")}`);
  }

  // --- education (10) ---
  pointsPossible += 10;
  if (!e.education_min) {
    pointsEarned += 5;
  } else if (!profile.education_level) {
    pointsEarned += 3;
  } else {
    const order = ["none", "class_8", "class_10", "class_12", "graduate", "postgraduate"];
    const need = order.indexOf(e.education_min);
    const have = order.indexOf(profile.education_level);
    if (have === -1 || have >= need) {
      pointsEarned += 10;
      reasons.push(`Education meets the ${e.education_min.replace("_", " ")} requirement`);
    } else {
      failReasons.push(`Requires at least ${e.education_min.replace("_", " ")}`);
    }
  }

  // --- business stage (10) ---
  pointsPossible += 10;
  if (businessStageMatches(e.business_stage, profile.business_type)) {
    if (e.business_stage && e.business_stage !== "any") {
      pointsEarned += 10;
      reasons.push(`Fits your business type (${e.business_stage.replace("_", " ")})`);
    } else {
      pointsEarned += 5;
    }
  } else {
    failReasons.push(`Meant for "${e.business_stage.replace("_", " ")}" businesses`);
  }

  // --- state (10) ---
  pointsPossible += 10;
  if (e.states === "all" || !e.states) {
    pointsEarned += 5;
  } else if (Array.isArray(e.states) && e.states.includes(profile.state)) {
    pointsEarned += 10;
    reasons.push(`Available in ${profile.state}`);
  } else {
    failReasons.push(`Only available in: ${Array.isArray(e.states) ? e.states.join(", ") : e.states}`);
  }

  const score = Math.min(95, Math.round((pointsEarned / pointsPossible) * 100));
  const hardBlockers = failReasons.some(
    (r) => r.startsWith("Restricted to") || r.startsWith("Only open to") || r.startsWith("Meant for")
  );
  const matched = !hardBlockers && score >= 60;

  return {
    schemeId: scheme.id,
    matched,
    score,
    reasons: matched ? reasons : [],
    whyNot: matched ? [] : failReasons,
  };
}

/**
 * Match a full user profile against every scheme, ranked by score descending.
 * profile shape: { category, gender, age, income_bracket, education_level,
 *                   business_type, state }
 */
function matchProfile(profile) {
  const schemes = loadSchemes();
  const results = schemes
    .filter((scheme) => !scheme.resource_only && scheme.operational_status !== "closed")
    .map((scheme) => {
      const result = matchScheme(scheme, profile);
      return {
        ...result,
        name: scheme.name,
        ministry: scheme.ministry,
        benefits: scheme.benefits,
        application_link: scheme.application_link,
        plain_language_summary: scheme.plain_language_summary,
      };
    })
    .filter((r) => r.matched)
    .sort((a, b) => b.score - a.score);

  return results;
}

module.exports = { loadSchemes, matchScheme, matchProfile };
