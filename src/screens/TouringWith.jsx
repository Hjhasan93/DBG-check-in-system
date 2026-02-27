import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STUDENTS } from "../config/students";
import { useVisit } from "../context/VisitContext";


export default function TouringWith() {
  const navigate = useNavigate();
  const { setVisit } = useVisit();


  const [q, setQ] = useState("");


  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return STUDENTS;
    return STUDENTS.filter((x) => x.name.toLowerCase().includes(s) || x.id.toLowerCase().includes(s));
  }, [q]);


  function selectStudent(stu) {
    setVisit((v) => ({
      ...v,
      tourStudentId: stu.id,
      tourStudentName: stu.name,
    }));
    navigate("/photo");
  }


  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Touring with</h1>
        <p style={styles.subtitle}>Search and select the DBG student.</p>


        <input
          style={styles.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type student name or ID"
        />


        <div style={styles.list}>
          {filtered.map((stu) => (
            <button key={stu.id} style={styles.item} onClick={() => selectStudent(stu)}>
              <div style={styles.name}>{stu.name}</div>
              <div style={styles.id}>{stu.id}</div>
            </button>
          ))}
        </div>


        <button style={styles.secondary} onClick={() => navigate("/host")}>
          Back
        </button>
      </div>
    </div>
  );
}


const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "var(--bg)",
    color: "var(--text)",
    padding: 24,
  },

  card: {
    width: "min(980px, 100%)",
    background:
      "radial-gradient(1200px 600px at 50% -20%, rgba(183,155,83,0.18), transparent 60%), var(--card)",
    padding: 28,
    borderRadius: "var(--radius)",
    border: "1px solid var(--stroke)",
    boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
  },

  title: {
    fontSize: 36,
    margin: 0,
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 14,
    color: "var(--muted)",
  },

  input: {
    width: "100%",
    fontSize: 20,
    padding: "14px 14px",
    borderRadius: "var(--radiusSm)",
    border: "1px solid var(--stroke)",
    outline: "none",
    marginBottom: 14,
    background: "#0f0f0f",
    color: "var(--text)",
  },

  list: {
    display: "grid",
    gap: 10,
    marginBottom: 16,
    maxHeight: 420,
    overflow: "auto",
    paddingRight: 6,
  },

  item: {
    textAlign: "left",
    padding: "14px 14px",
    borderRadius: 14,
    border: "1px solid var(--stroke)",
    background: "#0f0f0f",
    color: "var(--text)",
    cursor: "pointer",
    transition: "border-color 120ms ease, transform 120ms ease",
  },

  name: {
    fontSize: 20,
    fontWeight: 700,
  },

  id: {
    color: "var(--muted)",
    marginTop: 4,
  },

  secondary: {
    fontSize: 18,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--stroke)",
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer",
  },
};
