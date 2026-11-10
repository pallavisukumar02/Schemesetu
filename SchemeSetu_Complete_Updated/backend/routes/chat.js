// SchemeSetu AI assistant.
// Gemini is called only from the backend. The browser never receives GEMINI_API_KEY.
const express = require("express");
const path = require("path");
const fs = require("fs");
const { matchProfile } = require("../matching/matchEngine");

const router = express.Router();
const SCHEMES_PATH = path.join(__dirname, "..", "..", "schemes.json");
const schemes = JSON.parse(fs.readFileSync(SCHEMES_PATH, "utf8"));

const LANG_NAMES = { en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada", ml: "Malayalam" };
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;

function compactSchemes() {
  return schemes.map((s) => ({
    id: s.id,
    name: s.name,
    ministry: s.ministry,
    eligibility: s.eligibility,
    benefits: s.benefits,
    application_link: s.application_link,
    summary: s.plain_language_summary,
    operational_status: s.operational_status || "not_verified",
    status_note: s.status_note || null,
    status_source: s.status_source || null,
    status_source_title: s.status_source_title || null,
  }));
}

// Only navigate when the user explicitly asks to OPEN a page. Mentioning a
// scheme, bank, dashboard, or eligibility in a normal question must never
// interrupt the conversation or send the user back to onboarding.
function detectAction(message) {
  const s = String(message || "").toLowerCase().trim().replace(/[.!?]+$/, "");
  const openIntent = /^(?:please\s+)?(?:open|go to|take me to|navigate to|show me)\s+(?:the\s+)?/;
  if (!openIntent.test(s)) return null;
  if (/\b(?:my )?dashboard\b|\bapplication tracker\b/.test(s)) return { path: "/dashboard", label: "dashboard" };
  if (/\b(?:scheme matching|find schemes|scheme finder)\b/.test(s)) return { path: "/onboarding", label: "scheme matching" };
  if (/\b(?:opportunities|toolkit|tracker)\b/.test(s)) {
    const page = /opportunities/.test(s) ? "/opportunities" : /toolkit/.test(s) ? "/toolkit" : "/tracker";
    return { path: page, label: page.slice(1) };
  }
  return null;
}

function readableValue(value) {
  if (value === null || value === undefined || value === "") return "Not specified in the current SchemeSetu record.";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => `• ${readableValue(item)}`).join("\n");
  if (typeof value === "object") return Object.entries(value)
    .map(([key, item]) => `${key.replace(/[_-]/g, " ")}: ${readableValue(item)}`)
    .join("\n");
  return String(value);
}

function findScheme(message) {
  const s = message.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // Prefer full scheme names/aliases before loose token matching to avoid
  // confusing similarly named schemes (for example Mahila e-Haat vs
  // Mahila Udyam Nidhi).
  const aliases = { "mahila-e-haat": ["mahila e haat", "mahila ehaat", "e haat", "ehaat"] };
  const exact = schemes.find((scheme) => {
    const name = scheme.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return s.includes(name) || (aliases[scheme.id] || []).some((a) => s.includes(a));
  });
  if (exact) return exact;
  return schemes.find((scheme) => {
    const hay = `${scheme.name} ${scheme.id}`.toLowerCase();
    const tokens = hay.split(/[^a-z0-9]+/).filter((word) => word.length > 4);
    return tokens.length > 0 && tokens.every((word) => s.includes(word));
  });
}

function offlineReply(message, language, profile) {
  const action = detectAction(message);
  const scheme = findScheme(message);
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey|hii|namaste|namaskar|नमस्ते|नमस्कार|హాయ్|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം)[!. ]*$/i.test(lower)) {
    return "Hi! I'm SchemeSetu Assistant. I can help you find government schemes, understand eligibility, documents, benefits, application steps, and your SchemeSetu matches. What would you like to know?";
  }

  if (scheme && scheme.operational_status === "closed") {
    return `${scheme.name} — CLOSED\n\n${scheme.status_note || "This programme is marked closed in the SchemeSetu catalogue."}\n\nIt was launched in 2016 as an online marketing platform for women entrepreneurs, SHGs and NGOs. The Government of India confirmed in a Rajya Sabha answer on 11 December 2024 that the Ministry closed it with effect from July 2020.\n\nDo not use the old portal or follow old vendor-registration instructions. SchemeSetu has removed it from active scheme matching.\n\nOfficial status source: ${scheme.status_source || "See the Government of India parliamentary record."}`;
  }

  if (scheme) {
    return `${scheme.name}\n\n${scheme.plain_language_summary || "This scheme is listed in SchemeSetu."}\n\nBenefits:\n${readableValue(scheme.benefits)}\n\nEligibility:\n${readableValue(scheme.eligibility)}\n\nOfficial application: ${scheme.application_link || "The current official application link is not verified in the SchemeSetu catalogue. Check the scheme details and confirm through the responsible government department."}`;
  }

  if (/which schemes|what schemes|schemes fit|eligible|match me|recommend|suggest|for me|मेरे लिए|मेरे लिये|योजना|नాకు|నాకు|పథకం|எனக்கு|திட்டம்|ನನಗೆ|ಯೋಜನೆ|എനിക്ക്|പദ്ധതി/.test(lower) && profile) {
    try {
      const matches = matchProfile(profile).slice(0, 5);
      if (matches.length) return `Based on your SchemeSetu profile, these are your strongest matches:\n\n${matches.map((m, i) => `${i + 1}. ${m.name} — ${m.score}% match`).join("\n")}\n\nThese scores come from SchemeSetu's transparent rule-based matching engine. Tap “Find schemes” for the detailed reasons and official links.`;
      return "I couldn't find a strong match from the current profile. Tap “Find schemes” and check that your profile details are complete.";
    } catch (_) {}
  }

  if (/document|documents|paper|proof|certificate|कागज|दस्तावेज|प्रमाण|పత్ర|పత్రాలు|ஆவண|ஆவணங்கள்|ದಾಖಲೆ|ದಾಖಲೆಗಳು|രേഖ|രേഖകൾ/.test(lower)) {
    if (scheme) return `${scheme.name}\n\nDocuments/requirements:\n${readableValue(scheme.documents)}`;
    return "I can help with documents. Tell me the scheme name, for example: “What documents do I need for PMEGP?”";
  }

  if (/apply|application|how.*apply|where.*apply|portal|आवेदन|कैसे आवेदन|दाखिल|దరఖాస్తు|ఎలా దరఖాస్తు|விண்ணப்ப|எப்படி விண்ணப்ப|ಅರ್ಜಿ|ಹೇಗೆ ಅರ್ಜಿ|അപേക്ഷ|എങ്ങനെ അപേക്ഷ/.test(lower)) {
    if (scheme) return `${scheme.name}\n\nApplication: ${scheme.application_link ? `Use the official portal listed in SchemeSetu: ${scheme.application_link}` : "The official application link is not listed in the current SchemeSetu record. Open the scheme details and verify the official government portal."}`;
    return "Tell me the scheme name and I can show the application guidance and official portal available in SchemeSetu.";
  }

  if (/benefit|benefits|subsidy|loan amount|how much|लाभ|सब्सिडी|लोन|लाभ क्या|ప్రయోజనం|సబ్సిడీ|கடன்|நன்மை|ಸಬ್ಸಿಡಿ|ಲಾಭ|ആനുകൂല്യം|സബ്സിഡി/.test(lower)) {
    if (scheme) return `${scheme.name}\n\nBenefits:\n${readableValue(scheme.benefits)}`;
    return "I can explain benefits or subsidy details. Tell me the scheme name so I don't guess or invent an amount.";
  }

  if (/woman|women|female|lady|महिला|औरत|महिलाओं|మహిళ|பெண்|பெண்கள்|ಮಹಿಳೆ|ಮಹಿಳೆಯರು|സ്ത്രീ|സ്ത്രീകൾ/.test(lower)) {
    return "SchemeSetu can identify schemes relevant to women entrepreneurs using your profile. Tap “Find schemes” and make sure your gender and business details are filled in.";
  }

  if (/sc|st|obc|scheduled caste|scheduled tribe|backward|एससी|एसटी|ओबीसी|దళిత|ఆదివాసి|பட்டியல்|ಪರಿಶಿಷ್ಟ|പട്ടിക/.test(lower)) {
    return "SchemeSetu can use your category when applying the transparent matching rules. Tap “Find schemes” and enter your category accurately to see the relevant matches.";
  }

  if (/rural|village|ಗ್ರಾಮ|गांव|गाँव|ग्रामीण|గ్రామ|கிராமம்|கிராம|ഗ്രാമം/.test(lower)) {
    return "If your profile is in a rural area, SchemeSetu can consider the rural/business details included in the matching rules. Tap “Find schemes” to see the results for your profile.";
  }

  if (/privacy|safe|secure|data|password|otp|pin|bank password/.test(lower)) {
    return "For safety, never share OTPs, UPI PINs, card PINs, passwords, or bank-login credentials with SchemeSetu. The chatbot only needs the profile information required for scheme guidance.";
  }

  if (action) return `Sure — I can help with ${action.label}. Use the navigation button in the response to open that part of SchemeSetu.`;
  return "I'm your SchemeSetu Assistant. I can help with government schemes, eligibility, match results, benefits, documents, application steps and application tracking. Try: “Which schemes fit me?”, “What documents do I need?”, or name a scheme.";
}
function extractGeminiText(data) {
  return (data?.candidates?.[0]?.content?.parts || [])
    .filter((part) => typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function geminiErrorMessage(status, data) {
  const raw = JSON.stringify(data || {}).toLowerCase();
  const detail = data?.error?.message;
  if (status === 400 && (raw.includes("api key") || raw.includes("invalid_argument"))) {
    return `Gemini rejected the request. Check that GEMINI_API_KEY is copied correctly and that GEMINI_MODEL (${MODEL}) is supported. ${detail || ""}`.trim();
  }
  if (status === 401 || status === 403 || raw.includes("api key not valid") || raw.includes("permission_denied")) {
    return `Gemini authentication or API access failed. Check that the key was created in Google AI Studio, the Gemini API is enabled for its project, and the key has no restrictive API limitation. ${detail || ""}`.trim();
  }
  if (status === 404) return `Gemini model “${MODEL}” was not found or is unavailable to this key. Update GEMINI_MODEL to a model listed for your project. ${detail || ""}`.trim();
  if (status === 429) return `Gemini quota/rate limit reached. Check the Gemini API usage and billing page; free-tier limits vary by model and account. ${detail || ""}`.trim();
  return `Gemini is temporarily unavailable (HTTP ${status}). ${detail || "Please try again shortly."}`.trim();
}

function buildSystem(language, profile, currentPath) {
  const profileText = profile ? JSON.stringify({
    name: profile.name, age: profile.age, gender: profile.gender, category: profile.category,
    income_bracket: profile.income_bracket, education_level: profile.education_level,
    business_type: profile.business_type, state: profile.state, district: profile.district,
  }) : "No profile has been created yet.";

  const websiteGuide = {
    "/": "Home page: explains SchemeSetu and helps visitors begin.",
    "/onboarding": "Find schemes: user enters profile details and runs the explainable eligibility matcher.",
    "/dashboard": "Dashboard: displays the user's saved scheme matches and application overview when signed in.",
    "/opportunities": "Opportunities: browse entrepreneurship and support opportunities listed by the site.",
    "/toolkit": "Toolkit: practical resources for preparing a small business and applications.",
    "/tracker": "Application tracker: stores user-entered application records/status notes; it is not a live government status feed unless an authorized API is connected.",
    "/prepare": "Preparation: helps users organize application readiness and documents.",
    "/privacy": "Privacy page: explains privacy and safe handling of personal information.",
    "/integrations": "Integrations page: shows configured integrations and their connection status.",
    "/login": "Sign in to access account features.",
    "/signup": "Create an account to save profile and application information."
  };

  return `You are SchemeSetu AI, a capable, patient, multilingual customer-support assistant for the SchemeSetu website in India.

LANGUAGE: Reply in ${LANG_NAMES[language] || "English"}. Match the user's language where possible. Use simple, respectful, practical wording. Explain acronyms.

YOUR JOB: Answer natural questions about government schemes AND how to use any part of the SchemeSetu website. Do not require exact keywords or predefined prompts. Handle broad questions, misspellings, follow-up questions, comparisons, step-by-step instructions, and questions about the current page. Use the conversation history for context.

WEBSITE KNOWLEDGE: ${JSON.stringify(websiteGuide)}
Current page: ${currentPath}

CURRENT USER PROFILE (use only to tailor answers; do not unnecessarily repeat personal data): ${profileText}

SCHEME SOURCE OF TRUTH: ${JSON.stringify(compactSchemes())}
Use only the scheme data above for scheme-specific factual claims. Treat operational_status as authoritative: "closed" means the scheme/platform is NOT open for applications or registrations. For a closed scheme, clearly say it is closed, explain any historical purpose only as history, do not provide application steps, do not present its old URL as an application portal, and do not imply that eligibility makes it currently available. For "not_verified" or missing status, say current operational status is unverified and do not claim applications are open. Only "active" records may be described as currently accepting applications, and even then state that the official portal must confirm live windows. Never invent eligibility rules, subsidy/loan amounts, deadlines, required documents, current availability, official URLs, or bank participation. If a record omits a detail, say it is not listed in the current SchemeSetu catalogue. Scheme records may need updating; distinguish verified facts from unknowns.

MATCHING: SchemeSetu's rule-based matcher is authoritative for eligibility scores. Explain that a match score is an indicative fit, not government approval or a guarantee of a loan/grant. Never override hard eligibility rules or promise approval.

APPLICATION TRACKING: Clearly distinguish user-entered/manual tracking from official government application status. SchemeSetu must not claim a live government status connection unless an authorized API/webhook is configured and active.

WEBSITE SUPPORT: Give numbered steps when guiding users through signup, login, profile setup, scheme matching, details, official portal handoff, preparation, tracker, language settings. If the user asks about a feature that is not present or not connected, say so and explain the available alternative. Do not claim to click buttons or change account data.

PRIVACY AND SAFETY: Never ask for OTPs, UPI PINs, card PINs, passwords, or bank credentials. Do not make legal, financial approval, or government-authority claims.

STYLE: Answer the actual question first. Be specific to SchemeSetu. Ask at most one short clarification only when essential. If uncertain, state what is unknown instead of guessing.`;
}

async function callGemini(contents, systemInstruction, maxOutputTokens = 1800) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens },
    }),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

router.get("/status", async (_req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ configured: false, connected: false, model: MODEL, provider: "gemini", mode: "offline", message: "Add GEMINI_API_KEY to the root .env file and restart SchemeSetu." });
  }
  try {
    // A tiny live inference check confirms key + model + quota, not merely that a key exists.
    const { response, data } = await callGemini(
      [{ role: "user", parts: [{ text: "Reply with OK only." }] }],
      "You are a connectivity test. Reply with OK only.",
      5
    );
    if (!response.ok) {
      const message = geminiErrorMessage(response.status, data);
      return res.json({ configured: true, connected: false, model: MODEL, provider: "gemini", status: response.status, message });
    }
    const reply = extractGeminiText(data);
    return res.json({ configured: true, connected: Boolean(reply), model: MODEL, provider: "gemini", mode: reply ? "gemini" : "offline", message: reply ? "Gemini inference test succeeded." : "Gemini returned no text candidate." });
  } catch (error) {
    return res.json({ configured: true, connected: false, model: MODEL, provider: "gemini", message: `Could not reach Gemini: ${error.message}` });
  }
});

router.post("/", async (req, res) => {
  const { message, history = [], language = "en", profile = null, currentPath = "/" } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Message is required." });
  if (message.length > 2000) return res.status(400).json({ error: "Please keep your message under 2000 characters." });

  const action = detectAction(message);
  const fallback = offlineReply(message, language, profile);
  if (!process.env.GEMINI_API_KEY) return res.json({
    reply: `${fallback}\n\nNote: Gemini AI is not connected yet. Add GEMINI_API_KEY to the root .env file and restart SchemeSetu.`,
    action, mode: "offline"
  });

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: String(m.content || "").slice(0, 3000) }],
      })).filter((m) => m.parts[0].text.trim())
    : [];

  try {
    const contents = [...safeHistory, { role: "user", parts: [{ text: message }] }];
    const { response, data } = await callGemini(contents, buildSystem(language, profile, currentPath), 1800);
    if (!response.ok) {
      const detail = geminiErrorMessage(response.status, data);
      console.error("Gemini API error:", response.status, data?.error || data);
      return res.json({ reply: `${detail}\n\nFor now, here is SchemeSetu's built-in guidance:\n\n${fallback}`, action, mode: "fallback", aiError: detail });
    }

    const reply = extractGeminiText(data);
    if (!reply) return res.json({ reply: fallback, action, mode: "fallback", aiError: "Gemini returned an empty response." });
    return res.json({ reply, action, model: MODEL, provider: "gemini", mode: "gemini" });
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    return res.json({ reply: `I couldn't reach Gemini right now, so I'm switching to SchemeSetu's built-in guidance.\n\n${fallback}`, action, mode: "fallback", aiError: error.message });
  }
});

module.exports = router;
