import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function AdminVisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  const [visit, setVisit] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BACKEND}/visits/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setVisit(data);
      } catch {
        setErr("Could not load visit");
      }
    }
    if (BACKEND && id) load();
  }, [BACKEND, id]);

  if (err) {
    return <div style={styles.page}>{err}</div>;
  }

  if (!visit) {
    return <div style={styles.page}>Loading…</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button style={styles.back} onClick={() => navigate("/admin")}>
          ← Back
        </button>

        <h1 style={styles.title}>
          {visit.firstName} {visit.lastName}
        </h1>

        <div style={styles.grid}>
          <div>
            <p><b>Reason:</b> {visit.reasonLabel}</p>
            <p><b>Badge:</b> {visit.badgeType}</p>
            {visit.host && <p><b>Host:</b> {visit.host}</p>}
            {visit.tourStudentName && (
              <p><b>Touring with:</b> {visit.tourStudentName}</p>
            )}
            <p><b>Time:</b> {new Date(visit.createdAt).toLocaleString()}</p>
            <p><b>Waiver:</b> {visit.waiverAccepted ? "Signed" : "Not required"}</p>
            {visit.waiverSignedAt && (
              <p><b>Signed at:</b> {new Date(visit.waiverSignedAt).toLocaleString()}</p>
            )}
          </div>

          <div style={styles.photoBox}>
            {visit.photoDataUrl ? (
              <img src={visit.photoDataUrl} alt="Visitor" style={styles.photo} />
            ) : (
              <div>No photo</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0b0b0b", color: "white", padding: 24 },
  card: { maxWidth: 1000, margin: "0 auto", background: "#151515", padding: 24, borderRadius: 18 },
  back: { marginBottom: 12, background: "transparent", color: "white", border: "none", cursor: "pointer", fontSize: 16 },
  title: { margin: "6px 0 18px 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 },
  photoBox: { background: "#101010", borderRadius: 12, padding: 12, textAlign: "center" },
  photo: { width: "100%", borderRadius: 12 },
};
