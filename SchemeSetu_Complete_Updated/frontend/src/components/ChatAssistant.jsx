import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";

const LANG_MAP = { en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN" };
const LABELS = {
  en: { title: "SchemeSetu Assistant", powered: "Smart SchemeSetu guidance", welcome: "Hi! I can guide you through government schemes, eligibility, documents, applications.", placeholder: "Ask me anything about schemes...", send: "Send", close: "Close", mic: "Speak", thinking: "SchemeSetu is thinking...", privacy: "Don't share OTPs, PINs, passwords or bank credentials.", chips: ["Which schemes fit me?", "How do I apply?", "What documents do I need?"] },
  hi: { title: "SchemeSetu सहायक", powered: "SchemeSetu smart guidance", welcome: "नमस्ते! मैं सरकारी योजनाओं, पात्रता, दस्तावेज़, आवेदन और नज़दीकी बैंकों में आपकी मदद कर सकता हूँ।", placeholder: "योजनाओं के बारे में पूछें...", send: "भेजें", close: "बंद करें", mic: "बोलें", thinking: "SchemeSetu सोच रहा है...", privacy: "OTP, PIN, पासवर्ड या बैंक विवरण साझा न करें।", chips: ["मेरे लिए कौन सी योजनाएं हैं?", "आवेदन कैसे करें?", "कौन से दस्तावेज़ चाहिए?"] },
  te: { title: "SchemeSetu సహాయకుడు", powered: "SchemeSetu smart guidance", welcome: "నమస్కారం! ప్రభుత్వ పథకాలు, అర్హత, పత్రాలు, దరఖాస్తు నేను సహాయం చేస్తాను.", placeholder: "పథకాల గురించి అడగండి...", send: "పంపు", close: "మూసివేయి", mic: "మాట్లాడు", thinking: "SchemeSetu ఆలోచిస్తోంది...", privacy: "OTPలు, PINలు, పాస్‌వర్డ్‌లు లేదా బ్యాంక్ వివరాలను పంచుకోకండి.", chips: ["నాకు ఏ పథకాలు సరిపోతాయి?", "ఎలా దరఖాస్తు చేయాలి?", "ఏ పత్రాలు కావాలి?"] },
  ta: { title: "SchemeSetu உதவியாளர்", powered: "SchemeSetu smart guidance", welcome: "வணக்கம்! அரசு திட்டங்கள், தகுதி, ஆவணங்கள், விண்ணப்பம் உதவுகிறேன்.", placeholder: "திட்டங்களைப் பற்றி கேளுங்கள்...", send: "அனுப்பு", close: "மூடு", mic: "பேசு", thinking: "SchemeSetu யோசிக்கிறது...", privacy: "OTP, PIN, கடவுச்சொல் அல்லது வங்கி விவரங்களைப் பகிர வேண்டாம்.", chips: ["எனக்கு எந்த திட்டங்கள் பொருந்தும்?", "எப்படி விண்ணப்பிப்பது?", "என்ன ஆவணங்கள் வேண்டும்?"] },
  kn: { title: "SchemeSetu ಸಹಾಯಕ", powered: "SchemeSetu smart guidance", welcome: "ನಮಸ್ಕಾರ! ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಅರ್ಹತೆ, ದಾಖಲೆಗಳು, ಅರ್ಜಿ ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.", placeholder: "ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ...", send: "ಕಳುಹಿಸಿ", close: "ಮುಚ್ಚಿ", mic: "ಮಾತನಾಡಿ", thinking: "SchemeSetu ಯೋಚಿಸುತ್ತಿದೆ...", privacy: "OTP, PIN, ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.", chips: ["ನನಗೆ ಯಾವ ಯೋಜನೆಗಳು ಸೂಕ್ತ?", "ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು?", "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?"] },
  ml: { title: "SchemeSetu സഹായി", powered: "SchemeSetu smart guidance", welcome: "നമസ്കാരം! സർക്കാർ പദ്ധതികൾ, യോഗ്യത, രേഖകൾ, അപേക്ഷ, എന്നിവയിൽ ഞാൻ സഹായിക്കാം.", placeholder: "പദ്ധതികളെക്കുറിച്ച് ചോദിക്കൂ...", send: "അയയ്ക്കുക", close: "അടയ്ക്കുക", mic: "സംസാരിക്കുക", thinking: "SchemeSetu ചിന്തിക്കുന്നു...", privacy: "OTP, PIN, പാസ്‌വേഡ് അല്ലെങ്കിൽ ബാങ്ക് വിവരങ്ങൾ പങ്കിടരുത്.", chips: ["എനിക്ക് ഏത് പദ്ധതികൾ അനുയോജ്യം?", "എങ്ങനെ അപേക്ഷിക്കാം?", "ഏത് രേഖകൾ വേണം?"] },
};

function speak(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_MAP[lang] || "en-IN";
  u.rate = 0.96;
  window.speechSynthesis.speak(u);
}

export default function ChatAssistant() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiMode, setAiMode] = useState("offline");
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const lang = LABELS[i18n.language] ? i18n.language : "en";
  const ui = LABELS[lang];
  const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  useEffect(() => {
    if (open && messages.length === 0) setMessages([{ role: "assistant", content: ui.welcome }]);
  }, [open, lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);


  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);

  async function sendMessage(text) {
    const clean = text.trim();
    if (!clean || loading) return;
    const next = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, history: messages.slice(-10), language: lang, profile: user || null, currentPath: location.pathname }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Chat service is unavailable.");
      setAiMode(data.mode || "offline");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Sorry, I could not generate a response." }]);
      if (data.action?.path && data.action.path !== location.pathname) navigate(data.action.path);
      if (data.reply) speak(data.reply, lang);
    } catch (error) {
      const msg = error.message || "Something went wrong.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    if (!SpeechRecognition) { speak("Voice input works best in Chrome or Edge.", lang); return; }
    if (listening) { recognitionRef.current?.stop(); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[lang] || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label={ui.title}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-ink text-paper px-4 py-3 shadow-2xl border border-white/10 hover:-translate-y-0.5 transition">
          <span className="text-lg">✦</span><span className="font-semibold text-sm hidden sm:inline">SchemeSetu AI</span><span className="text-lg">💬</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(390px,calc(100vw-24px))] h-[min(650px,calc(100vh-32px))] bg-paper border border-ink/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between">
            <div><div className="font-semibold">{ui.title}</div>
              <div className="text-[11px] text-paper/60">{aiMode === "gemini" ? "Gemini connected · SchemeSetu guidance" : "Basic guidance · AI not connected"}</div></div>
            <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20" aria-label={ui.close}>×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-marigold text-ink rounded-br-sm" : "bg-white border border-ink/10 text-ink rounded-bl-sm"}`}>{m.content}</div>
              </div>
            ))}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {ui.chips.map((chip) => <button key={chip} type="button" onClick={() => sendMessage(chip)} className="text-xs bg-white border border-ink/15 rounded-full px-3 py-2 hover:border-marigold">{chip}</button>)}
              </div>
            )}
            {loading && <div className="text-xs text-ink/50 px-2">{ui.thinking}</div>}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-2 text-[10px] text-ink/45">{ui.privacy}</div>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-3 pt-1 border-t border-ink/10 flex gap-2">
            <button type="button" onClick={toggleVoice} title={ui.mic} aria-label={ui.mic} className={`shrink-0 w-10 h-10 rounded-full border ${listening ? "bg-rust text-paper border-rust animate-pulse" : "bg-white border-ink/15"}`}>{listening ? "■" : "🎙"}</button>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} className="min-w-0 flex-1 bg-white border border-ink/15 rounded-full px-4 text-sm outline-none focus:border-marigold" />
            <button type="submit" disabled={!input.trim() || loading} className="shrink-0 rounded-full bg-ink text-paper px-4 text-sm disabled:opacity-40">{ui.send}</button>
          </form>
        </div>
      )}
    </>
  );
}
