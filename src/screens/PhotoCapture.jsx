import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import { REASONS } from "../config/reasons";

export default function PhotoCapture() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [preview, setPreview] = useState(visit.photoDataUrl || "");

  const reason = REASONS.find((r) => r.key === visit.reasonKey);

  useEffect(() => {
    async function startCamera() {
      try {
        setError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        setError("Camera access is blocked. Please allow camera permissions, or see the front desk.");
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  function routeNext() {
  if (reason?.waiverRequired) navigate("/waiver");
  else navigate("/print");
}


  function captureNow() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);

    setVisit((v) => ({ ...v, photoDataUrl: dataUrl }));
  }

  async function startCountdownAndCapture() {
    if (error) return;

    setCountdown(3);
    for (let i = 2; i >= 0; i--) {
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(i);
    }
    setCountdown(null);
    captureNow();
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Take your photo</h1>
        <p style={styles.subtitle}>Stand in the frame. We will take it after a short countdown.</p>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.previewRow}>
          <div style={styles.videoBox}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            {countdown !== null ? (
              <div style={styles.countdownOverlay}>
                <div style={styles.countdownNumber}>{countdown === 0 ? "Smile!" : countdown}</div>
              </div>
            ) : null}
          </div>

          <div style={styles.side}>
            <div style={styles.sideTitle}>Preview</div>
            <div style={styles.previewBox}>
              {preview ? <img src={preview} alt="Preview" style={styles.previewImg} /> : <div style={styles.previewPlaceholder}>No photo yet</div>}
            </div>

            <button style={styles.primaryBtn} onClick={startCountdownAndCapture} disabled={!!error}>
              {countdown !== null ? "Capturing..." : "Start Countdown"}
            </button>

            <button style={styles.secondaryBtn} onClick={() => navigate("/reason")}>
              Back
            </button>

            <button
              style={{ ...styles.primaryBtn, opacity: preview ? 1 : 0.4, marginTop: 10 }}
              disabled={!preview}
              onClick={routeNext}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#0b0b0b",
    color: "white",
  },
  card: {
    width: "min(1100px, 100%)",
    borderRadius: 18,
    padding: 28,
    background: "#151515",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  title: { fontSize: 36, margin: 0 },
  subtitle: { fontSize: 16, opacity: 0.9, marginTop: 10, marginBottom: 18 },

  error: {
    background: "#2a0f0f",
    border: "1px solid #5a1e1e",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },

  previewRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 16,
    alignItems: "start",
  },
  videoBox: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #2b2b2b",
    background: "#0f0f0f",
    minHeight: 520,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  countdownOverlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.35)",
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: 800,
  },

  side: {
    borderRadius: 16,
    border: "1px solid #2b2b2b",
    padding: 14,
    background: "#101010",
  },
  sideTitle: { fontSize: 16, opacity: 0.9, marginBottom: 10 },
  previewBox: {
    borderRadius: 14,
    border: "1px solid #2b2b2b",
    background: "#0f0f0f",
    height: 220,
  }
}