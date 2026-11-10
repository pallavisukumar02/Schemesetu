import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LANG_MAP = { en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN" };

function speak(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_MAP[lang] || "en-IN";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function routeCommand(text) {
  const s = text.toLowerCase().trim();
  if (/dashboard|my matches|my schemes|matched schemes|डैशबोर्ड|డాష్‌బోర్డ్|டாஷ்போர்டு|ಡ್ಯಾಶ್‌ಬೋರ್ಡ್|ഡാഷ്ബോർഡ്/.test(s)) return ["/dashboard", "Opening your dashboard."];
  if (/find scheme|find schemes|government scheme|schemes|scheme|योजना|योजनाएं|పథకం|పథకాలు|திட்டம்|திட்டங்கள்|ಯೋಜನೆ|ಯೋಜನೆಗಳು|പദ്ധതി|പദ്ധതികൾ/.test(s)) return ["/onboarding", "Let's find schemes for you."];
  if (/profile|my profile|edit profile|प्रोफाइल|ప్రొఫైల్|சுயவிவரம்|ಪ್ರೊಫೈಲ್|പ്രൊഫൈൽ/.test(s)) return ["/onboarding", "Opening your profile."];
  if (/home|go home|मुख्य|होम|హోమ్|முகப்பு|ಮುಖಪುಟ|ഹോം/.test(s)) return ["/", "Going home."];
  return [null, "I heard you, but I didn't understand the command. Try saying find schemes, dashboard, or home."];
}

export default function VoiceAssistant() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recognitionRef = useRef(null);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = Boolean(SpeechRecognition);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggle() {
    if (!supported) {
      speak("Voice commands are not supported in this browser. Please use Chrome or Edge.", i18n.language);
      return;
    }
    if (listening) { recognitionRef.current?.stop(); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[i18n.language] || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setHeard(text);
      const [path, response] = routeCommand(text);
      speak(response, i18n.language);
      if (path && path !== location.pathname) navigate(path);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); speak("Sorry, I could not hear that. Please try again.", i18n.language); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="relative flex items-center">
      <button type="button" onClick={toggle} aria-label="Voice assistant" title={supported ? "Speak a command" : "Voice commands require Chrome or Edge"}
        className={`w-10 h-10 rounded-full border flex items-center justify-center font-semibold transition ${listening ? "bg-rust text-paper border-rust animate-pulse" : "bg-ink text-paper border-ink hover:opacity-90"}`}>
        {listening ? "■" : "🎙"}
      </button>
      {heard && <span className="absolute right-0 top-12 z-50 w-64 text-xs bg-white border border-ink/10 shadow-lg rounded-card px-3 py-2">Heard: “{heard}”</span>}
    </div>
  );
}
