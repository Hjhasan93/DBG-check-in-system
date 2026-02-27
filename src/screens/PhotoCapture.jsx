import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import { REASONS } from "../config/reasons";
import DbgShell from "../DbgShell";

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
        setError(
          "Camera access is blocked. Please allow camera permissions, or see the front desk."
        );
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
    <DbgShell
      title="Detroit Boxing Gym"
      subtitle="Take your photo. Stand in the frame, we’ll take it after a short countdown."
      footer={
        <div className="dbgGrid3">
          <button
            className="dbgBtn dbgBtnPrimary"
            onClick={startCountdownAndCapture}
            disabled={!!error || countdown !== null}
          >
            {countdown !== null ? "Capturing..." : "Start Countdown"}
          </button>

          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/reason")}>
            Back
          </button>

          <button
            className="dbgBtn dbgBtnPrimary"
            disabled={!preview}
            onClick={routeNext}
          >
            Continue
          </button>
        </div>
      }
    >
      {error ? <div className="dbgErr">{error}</div> : null}

      <div className="dbgPhotoLayout">
        <div className="dbgVideoBox">
          <video ref={videoRef} autoPlay playsInline muted className="dbgVideo" />

          {countdown !== null ? (
            <div className="dbgCountdownOverlay">
              <div className="dbgCountdownNumber">
                {countdown === 0 ? "Smile!" : countdown}
              </div>
            </div>
          ) : null}
        </div>

        <div className="dbgSideCard">
          <div className="dbgSideTitle">Preview</div>

          <div className="dbgPreviewBox">
            {preview ? (
              <img src={preview} alt="Preview" className="dbgPreviewImg" />
            ) : (
              <div className="dbgPreviewPlaceholder">No photo yet</div>
            )}
          </div>

          <div className="dbgHint">
            If the camera is blocked, allow permissions in the browser, then try again.
          </div>
        </div>
      </div>
    </DbgShell>
  );
}
