// whatsapp-bot/bot.js
//
// PROTOTYPE — this is a working conversational-flow prototype against Twilio's
// WhatsApp SANDBOX, not a production bot. It reuses the exact same
// `matchProfile()` function the web app uses (backend/matching/matchEngine.js),
// so the two never drift apart.
//
// Voice notes: Twilio delivers voice notes as a MediaUrl (an audio file). This
// prototype stubs `transcribeVoiceNote()` and `synthesizeSpeech()` — plug in
// any STT/TTS provider (e.g. Google Cloud Speech-to-Text / Text-to-Speech,
// or Whisper) behind those two functions to make voice fully live. Text-based
// conversation works end-to-end without any extra setup beyond Twilio.
//
// Setup:
//   1. Create a free Twilio account, join the WhatsApp sandbox (Console →
//      Messaging → Try it Out → WhatsApp).
//   2. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM in .env
//   3. Point the sandbox's "when a message comes in" webhook at
//      https://<your-tunnel>/whatsapp (use ngrok for local testing)
//   4. node whatsapp-bot/bot.js

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const express = require("express");
const { matchProfile } = require("../backend/matching/matchEngine");

const app = express();
app.use(express.urlencoded({ extended: false }));

// In-memory session store keyed by WhatsApp number. A real deployment should
// persist this (e.g. in the same `users` table, keyed by phone_number) so a
// conversation survives a bot restart.
const sessions = {};

const QUESTIONS = [
  { key: "category", prompt: "What's your social category? (general / sc / st / obc / minority)" },
  { key: "gender", prompt: "Gender? (male / female / other)" },
  { key: "age", prompt: "Your age?", parse: Number },
  { key: "income_bracket", prompt: "Household income? (below_1l / 1l_3l / 3l_6l / 6l_10l / above_10l)" },
  { key: "business_type", prompt: "What best describes your business? (new / existing / street_vendor / artisan / food_business / urban_poor)" },
  { key: "state", prompt: "Which state are you in?" },
];

async function transcribeVoiceNote(mediaUrl) {
  // TODO: call your STT provider with `mediaUrl` and return the transcript.
  throw new Error("Voice transcription not wired up — this is a mockup hook.");
}

async function synthesizeSpeech(text, language) {
  // TODO: call your TTS provider and return a hosted audio URL Twilio can send.
  throw new Error("Voice synthesis not wired up — this is a mockup hook.");
}

function nextQuestion(session) {
  return QUESTIONS.find((q) => session.profile[q.key] === undefined);
}

function formatMatchesAsText(matches) {
  if (matches.length === 0) {
    return "I couldn't find a matching scheme with these details yet. A team member may follow up, or try the web app for the full list.";
  }
  const lines = matches
    .slice(0, 5)
    .map((m, i) => `${i + 1}. *${m.name}* (${m.score}% match)\n   ${m.plain_language_summary}`);
  return `Here's what you're eligible for:\n\n${lines.join("\n\n")}\n\nReply with a number to see the application link.`;
}

app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;
  const body = (req.body.Body || "").trim();
  const numMedia = parseInt(req.body.NumMedia || "0", 10);

  let session = sessions[from];
  if (!session) {
    session = sessions[from] = { profile: {}, matches: null };
    return respond(res, "Namaste! I'll ask a few quick questions to find schemes you qualify for. " + QUESTIONS[0].prompt);
  }

  let incomingText = body;
  if (numMedia > 0 && req.body.MediaUrl0) {
    try {
      incomingText = await transcribeVoiceNote(req.body.MediaUrl0);
    } catch (err) {
      return respond(res, "Voice notes aren't fully wired up in this prototype yet — could you type your answer instead?");
    }
  }

  const question = nextQuestion(session);
  if (question) {
    session.profile[question.key] = question.parse ? question.parse(incomingText) : incomingText.toLowerCase();
    const next = nextQuestion(session);
    if (next) return respond(res, next.prompt);

    // All questions answered — run the SAME matching engine the web app uses.
    session.matches = matchProfile(session.profile);
    return respond(res, formatMatchesAsText(session.matches));
  }

  // Post-match: user replying with a number to get the application link.
  const choice = parseInt(incomingText, 10);
  if (session.matches && choice >= 1 && choice <= session.matches.length) {
    const m = session.matches[choice - 1];
    return respond(res, `${m.name}\nApply here: ${m.application_link}`);
  }

  return respond(res, "Type 'restart' to run the questions again, or reply with a scheme number from your last match list.");
});

function respond(res, message) {
  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>${message}</Message></Response>`);
}

const PORT = process.env.WHATSAPP_BOT_PORT || 4001;
app.listen(PORT, () => console.log(`WhatsApp bot webhook listening on :${PORT}/whatsapp`));
