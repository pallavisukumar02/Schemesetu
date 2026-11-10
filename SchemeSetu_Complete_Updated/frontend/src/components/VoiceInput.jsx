import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const LANG_MAP = { en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN" };

// Small mic button that transcribes speech into the given field using the
// browser's native Web Speech API. Falls back to a disabled state with a
// tooltip on browsers that don't support it (notably Firefox).
export default function VoiceInput({ onResult, lang = "en" }) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = Boolean(SpeechRecognition);

  function toggleListening() {
    if (!supported) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[lang] || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={!supported}
      title={supported ? t("voice.speak") : t("voice.unsupported")}
      aria-pressed={listening}
      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-colors
        ${listening ? "bg-rust text-paper border-rust" : "bg-transparent border-ink/20 text-ink"}
        ${!supported ? "opacity-40 cursor-not-allowed" : "hover:border-marigold"}`}
    >
      🎙
    </button>
  );
}
