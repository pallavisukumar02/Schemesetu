// SchemeSetu AI assistant.
// Grok is called only from the backend. The browser never receives XAI_API_KEY.
const express = require("express");
const path = require("path");
const fs = require("fs");
const { matchProfile } = require("../matching/matchEngine");

const router = express.Router();
const SCHEMES_PATH = path.join(__dirname, "..", "..", "schemes.json");
const schemes = JSON.parse(fs.readFileSync(SCHEMES_PATH, "utf8"));

const LANG_NAMES = { en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada", ml: "Malayalam" };
const MODEL = process.env.XAI_MODEL || "grok-4.6";
const XAI_URL = "https://api.x.ai/v1/responses";

function compactSchemes() {
  return schemes.map((s) => ({
    id: s.id,
    name: s.name,
    ministry: s.ministry,
    eligibility: s.eligibility,
    benefits: s.benefits,
    application_link: s.application_link,
    summary: s.plain_language_summary,
  }));
}

function detectAction(message) {
  const s = message.toLowerCase();
  if (/nearby bank|nearest bank|bank near me|find.*bank|बैंक|బ్యాంక్|வங்கி|ಬ್ಯಾಂಕ್|ബാങ്ക്/.test(s)) return { path: "/banks", label: "nearby banks" };
  if (/dashboard|my application|my scheme|application status|डैशबोर्ड|అప్లికేషన్|டாஷ்போர்டு|ಡ್ಯಾಶ್‌ಬೋರ್ಡ್|ഡാഷ്ബോർഡ്/.test(s)) return { path: "/dashboard", label: "dashboard" };
  if (/find scheme|find schemes|which scheme|eligible scheme|government scheme|योजना|పథకం|திட்டம்|ಯೋಜನೆ|പദ്ധതി/.test(s)) return { path: "/onboarding", label: "scheme matching" };
  return null;
}

function findScheme(message) {
  const s = message.toLowerCase();
  return schemes.find((scheme) => {
    const hay = `${scheme.name} ${scheme.id} ${scheme.plain_language_summary || ""}`.toLowerCase();
    return hay.split(/\s+/).filter((word) => word.length > 3).some((word) => s.includes(word));
  });
}

function offlineReply(message, language, profile) {
  const action = detectAction(message);
  const scheme = findScheme(message);
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey|hii|namaste|namaskar|नमस्ते|नमस्कार|హాయ్|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം)[!. ]*$/i.test(lower)) {
    return "Hi! I'm SchemeSetu Assistant. I can help you find government schemes, understand eligibility, documents, benefits, application steps, and your SchemeSetu matches. What would you like to know?";
  }

  if (scheme) {
    return `${scheme.name}\n\n${scheme.plain_language_summary || "This scheme is available in SchemeSetu."}\n\nBenefits: ${scheme.benefits || "See the official portal for current benefits."}\n\nEligibility: ${scheme.eligibility || "See the official portal for the complete eligibility rules."}\n\nOfficial application: ${scheme.application_link || "Open the scheme details in SchemeSetu for the official portal."}`;
  }

  if (/which schemes|what schemes|schemes fit|eligible|match me|recommend|suggest|for me|मेरे लिए|मेरे लिये|योजना|नాకు|నాకు|పథకం|எனக்கு|திட்டம்|ನನಗೆ|ಯೋಜನೆ|എനിക്ക്|പദ്ധതി/.test(lower) && profile) {
    try {
      const matches = matchProfile(profile).slice(0, 5);
      if (matches.length) return `Based on your SchemeSetu profile, these are your strongest matches:\n\n${matches.map((m, i) => `${i + 1}. ${m.name} — ${m.score}% match`).join("\n")}\n\nThese scores come from SchemeSetu's transparent rule-based matching engine. Tap “Find schemes” for the detailed reasons and official links.`;
      return "I couldn't find a strong match from the current profile. Tap “Find schemes” and check that your profile details are complete.";
    } catch (_) {}
  }

  if (/document|documents|paper|proof|certificate|कागज|दस्तावेज|प्रमाण|పత్ర|పత్రాలు|ஆவண|ஆவணங்கள்|ದಾಖಲೆ|ದಾಖಲೆಗಳು|രേഖ|രേഖകൾ/.test(lower)) {
    if (scheme) return `${scheme.name}\n\nDocuments/requirements: ${scheme.documents || "The available SchemeSetu record does not list documents separately. Please check the official application portal before applying."}`;
    return "I can help with documents. Tell me the scheme name, for example: “What documents do I need for PMEGP?”";
  }

  if (/apply|application|how.*apply|where.*apply|portal|आवेदन|कैसे आवेदन|दाखिल|దరఖాస్తు|ఎలా దరఖాస్తు|விண்ணப்ப|எப்படி விண்ணப்ப|ಅರ್ಜಿ|ಹೇಗೆ ಅರ್ಜಿ|അപേക്ഷ|എങ്ങനെ അപേക്ഷ/.test(lower)) {
    if (scheme) return `${scheme.name}\n\nApplication: ${scheme.application_link ? `Use the official portal listed in SchemeSetu: ${scheme.application_link}` : "The official application link is not listed in the current SchemeSetu record. Open the scheme details and verify the official government portal."}`;
    return "Tell me the scheme name and I can show the application guidance and official portal available in SchemeSetu.";
  }

  if (/benefit|benefits|subsidy|loan amount|how much|लाभ|सब्सिडी|लोन|लाभ क्या|ప్రయోజనం|సబ్సిడీ|கடன்|நன்மை|ಸಬ್ಸಿಡಿ|ಲಾಭ|ആനുകൂല്യം|സബ്സിഡി/.test(lower)) {
    if (scheme) return `${scheme.name}\n\nBenefits: ${scheme.benefits || "The current SchemeSetu record does not specify the benefit amount. Please verify the official portal."}`;
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
  return "I'm your SchemeSetu Assistant. I can help with government schemes, eligibility, match results, benefits, documents, application steps, nearby banks, and application tracking. Try: “Which schemes fit me?”, “What documents do I need?”, or name a scheme.";
}
function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function xaiErrorMessage(status, data) {
  const raw = JSON.stringify(data || {}).toLowerCase();
  if (status === 401 || raw.includes("invalid api key") || raw.includes("unauthorized")) return "Grok is not authenticated. Your XAI_API_KEY is invalid or expired. Create/rotate the key in xAI Console, update the root .env once, then restart SchemeSetu.";
  if (status === 403 || raw.includes("permission") || raw.includes("forbidden")) return `Grok is connected, but this API key does not have permission to use ${MODEL}. In xAI Console, give the key access to the inference endpoint/model, then restart SchemeSetu.`;
  if (status === 404 || raw.includes("model") && raw.includes("not found")) return `The configured Grok model “${MODEL}” was not found for this key. Check the model access in xAI Console.`;
  if (status === 429) return "Grok is temporarily rate-limited or the API account has reached its usage limit. Please check the xAI Console usage/credits.";
  return `Grok is temporarily unavailable (HTTP ${status}). SchemeSetu is using its built-in guidance instead, so you can continue using the app.`;
}

function buildSystem(language, profile, currentPath) {
  const profileText = profile ? JSON.stringify({
    name: profile.name, age: profile.age, gender: profile.gender, category: profile.category,
    income_bracket: profile.income_bracket, education_level: profile.education_level,
    business_type: profile.business_type, state: profile.state, district: profile.district,
  }) : "No profile has been created yet.";

  return `You are SchemeSetu Assistant, a friendly multilingual guide for marginalized and aspiring entrepreneurs in India. You are powered by Grok.

LANGUAGE: Reply in ${LANG_NAMES[language] || "English"}. Keep the language simple and practical. Official scheme names may stay in English.

SOURCE OF TRUTH: The scheme JSON below is the only source of truth for scheme-specific facts. Do not invent eligibility, subsidy amounts, loan limits, deadlines, documents, ministries, or application URLs. If a fact is absent, say so and advise checking the official portal. Never fabricate an official URL.

MATCHING: The rule-based SchemeSetu matching engine is authoritative for eligibility/match scores. You can explain results, but never claim to override the engine.

PRIVACY: Never ask for OTPs, UPI PINs, card PINs, passwords, or banking credentials.

CURRENT PAGE: ${currentPath}
USER PROFILE: ${profileText}
SCHEME DATA:\n${JSON.stringify(compactSchemes())}`;
}

router.get("/status", async (_req, res) => {
  if (!process.env.XAI_API_KEY) return res.json({ configured: false, connected: false, model: MODEL, mode: "offline" });
  try {
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.json({ configured: true, connected: false, model: MODEL, status: response.status, message: xaiErrorMessage(response.status, data) });
    const modelList = Array.isArray(data.data) ? data.data.map((m) => m.id) : [];
    return res.json({ configured: true, connected: true, model: MODEL, modelAvailable: modelList.includes(MODEL), modelsChecked: modelList.length });
  } catch (error) {
    return res.json({ configured: true, connected: false, model: MODEL, message: "Could not reach xAI. Check your internet connection." });
  }
});

router.post("/", async (req, res) => {
  const { message, history = [], language = "en", profile = null, currentPath = "/" } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Message is required." });
  if (message.length > 2000) return res.status(400).json({ error: "Please keep your message under 2000 characters." });

  const action = detectAction(message);
  const fallback = offlineReply(message, language, profile);
  if (!process.env.XAI_API_KEY) return res.json({ reply: fallback, action, mode: "offline" });

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: String(m.content || "").slice(0, 3000) }))
    : [];

  try {
    const response = await fetch(XAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        input: [{ role: "system", content: buildSystem(language, profile, currentPath) }, ...safeHistory, { role: "user", content: message }],
        temperature: 0.3,
        max_output_tokens: 900,
        store: false,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = xaiErrorMessage(response.status, data);
      console.error("xAI API error:", response.status, data);
      return res.json({ reply: `${detail}\n\nFor now, here is SchemeSetu's built-in guidance:\n\n${fallback}`, action, mode: "fallback", grokError: detail });
    }

    const reply = extractOutputText(data);
    if (!reply) return res.json({ reply: fallback, action, mode: "fallback", grokError: "Grok returned an empty response." });
    return res.json({ reply, action, model: MODEL, mode: "grok" });
  } catch (error) {
    console.error("Grok request failed:", error.message);
    return res.json({ reply: `I couldn't reach Grok right now, so I'm switching to SchemeSetu's built-in guidance.\n\n${fallback}`, action, mode: "fallback", grokError: error.message });
  }
});

module.exports = router;
