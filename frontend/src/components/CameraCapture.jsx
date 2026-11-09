import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Captures a still frame from the device camera and returns a base64 JPEG to
// the parent via onCapture(dataUrl). The backend stores only a file path/URL
// derived from this — never the raw blob in the database row itself (see
// database/schema.sql, users.photo_url).
export default function CameraCapture({ onCapture }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState(null);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
    } catch (err) {
      setError(t("camera.permissionDenied"));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPreview(dataUrl);
    onCapture?.(dataUrl);
    stopCamera();
  }

  return (
    <div className="border border-dashed border-ink/25 rounded-card p-4 flex flex-col items-center gap-3">
      {preview ? (
        <img src={preview} alt="Profile preview" className="w-28 h-28 rounded-full object-cover" />
      ) : (
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-xs rounded-card bg-ink/5" />
      )}

      {error && <p className="text-sm text-rust">{error}</p>}

      <div className="flex gap-3">
        {!preview && !cameraOpen && (
          <button type="button" onClick={startCamera} className="text-sm px-3 py-1.5 rounded-card bg-ink text-paper">
            {t("camera.open")}
          </button>
        )}
        {!preview && cameraOpen && (
          <button type="button" onClick={takePhoto} className="text-sm px-3 py-1.5 rounded-card bg-marigold text-ink font-medium">
            {t("camera.capture")}
          </button>
        )}
        {preview && (
          <button
            type="button"
            onClick={() => { setPreview(null); setCameraOpen(false); onCapture?.(null); }}
            className="text-sm px-3 py-1.5 rounded-card border border-ink/20"
          >
            {t("camera.retake")}
          </button>
        )}
      </div>
    </div>
  );
}
