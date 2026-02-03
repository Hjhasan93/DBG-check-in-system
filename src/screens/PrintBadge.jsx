import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";

export default function PrintBadge() {
  const navigate = useNavigate();
  const { visit } = useVisit();

  function mockPrint() {
    alert("Printing is set up later. Badge preview confirmed.");
    navigate("/thankyou");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Ready to print</h1>
        <p style={styles.subtitle}>Confirm the badge below, then print.</p>

        <div style={styles.layout}>
          <div style={styles.badgeWrapper}>
            <div id="badge" style={styles.badge}>
              <div style={styles.badgeTop}>
                <div style={styles.badgeType}>{visit.badgeType || "VISITOR"}</div>
                <div style={styles.badgeName}>
                  {(visit.firstName + " " + visit.lastName).trim() || "Guest"}
                </div>
                {visit.host ? (
                 <div style={styles.badgeHost}>Host: {visit.host}</div>
                    ) : null}

                {visit.waiverAccepted ? (
                  <div style={styles.badgeHost}>Waiver: Signed</div>
                      ) : null}
    

                {visit.tourStudentName ? (
                  <div style={styles.badgeHost}>Touring with: {visit.tourStudentName}</div>
                    ) : null}

                      <div style={styles.badgeReason}>{visit.reasonLabel || ""}</div>

              </div>

              <div style={styles.photoBox}>
                {visit.photoDataUrl ? (
                  <img src={visit.photoDataUrl} alt="photo" style={styles.photo} />
                ) : (
                  <div style={styles.noPhoto}>No photo</div>
                )}
              </div>

              <div style={styles.badgeBottom}>
                <div>{new Date().toLocaleString()}</div>
                <div>DBG</div>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.primary} onClick={mockPrint}>
              Print Badge
            </button>

            <button style={styles.secondary} onClick={() => navigate("/thankyou")}>
              Skip Print
            </button>

            <button style={styles.secondary} onClick={() => navigate("/photo")}>
              Retake Photo
            </button>
          </div>
        </div>

        <p style={styles.note}>
          Printing will be connected later to the facility PC and Brother printer.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0b0b",
    color: "white",
    padding: 24,
  },
  card: {
    width: "min(1100px, 100%)",
    background: "#151515",
    padding: 28,
    borderRadius: 18,
  },
  title: { fontSize: 36, margin: 0 },
  subtitle: { opacity: 0.9, marginTop: 10, marginBottom: 18 },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 16,
    alignItems: "start",
  },

  badgeWrapper: { display: "grid", placeItems: "center" },

  badge: {
    width: 320,
    height: 520,
    borderRadius: 18,
    background: "white",
    color: "black",
    overflow: "hidden",
    border: "2px solid #000",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
  },
  badgeTop: { padding: 14, borderBottom: "2px solid #000" },
  badgeType: { fontSize: 28, fontWeight: 900, letterSpacing: 1 },
  badgeName: { fontSize: 24, fontWeight: 800, marginTop: 6 },
  badgeHost: { marginTop: 6, fontSize: 14 },
  badgeReason: { marginTop: 6, fontSize: 14, opacity: 0.9 },

  photoBox: { display: "grid", placeItems: "center", background: "#eee" },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  noPhoto: { opacity: 0.7 },

  badgeBottom: {
    padding: 10,
    borderTop: "2px solid #000",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
  },

  actions: { display: "flex", flexDirection: "column", gap: 12 },
  primary: {
    fontSize: 18,
    padding: "14px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
  },
  secondary: {
    fontSize: 16,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
  note: { marginTop: 16, opacity: 0.75 },
};
