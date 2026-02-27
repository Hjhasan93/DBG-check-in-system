import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminFetch } from "../utils/adminFetch";
import DbgShell from "../DbgShell";

export default function AdminVisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  const [visit, setVisit] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`${BACKEND}/visits/${id}`);
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
    return (
      <DbgShell title="Admin Visit Detail" subtitle="Error">
        <div className="dbgErr">{err}</div>
        <div style={{ marginTop: 12 }}>
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/admin")}>
            Back
          </button>
        </div>
      </DbgShell>
    );
  }

  if (!visit) {
    return (
      <DbgShell title="Admin Visit Detail" subtitle="Loading">
        <div className="dbgAdminLoading">Loading…</div>
      </DbgShell>
    );
  }

  const fullName = `${visit.firstName || ""} ${visit.lastName || ""}`.trim();

  return (
    <DbgShell
      title={fullName || "Visit"}
      subtitle={visit.createdAt ? new Date(visit.createdAt).toLocaleString() : ""}
      footer={
        <div className="dbgGrid2">
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/admin")}>
            ← Back to Admin
          </button>

          <button
            className="dbgBtn dbgBtnPrimary"
            onClick={() => {
              const token = sessionStorage.getItem("dbg_admin_token") || "";
              const params = new URLSearchParams();
              params.set("token", token);
              params.set("range", "all");
              params.set("q", fullName);
              window.open(`${BACKEND}/visits.csv?${params.toString()}`, "_blank");
            }}
          >
            Export CSV (filtered)
          </button>
        </div>
      }
    >
      <div className="dbgDetailGrid">
        <div className="dbgDetailCard">
          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Visit ID</div>
            <div className="dbgDetailVal dbgMono">{visit.id || ""}</div>
          </div>

          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Reason</div>
            <div className="dbgDetailVal">{visit.reasonLabel || ""}</div>
          </div>

          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Badge</div>
            <div className="dbgDetailVal">{visit.badgeType || ""}</div>
          </div>

          {visit.host ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Host</div>
              <div className="dbgDetailVal">{visit.host}</div>
            </div>
          ) : null}

          {visit.tourStudentName ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Touring with</div>
              <div className="dbgDetailVal">{visit.tourStudentName}</div>
            </div>
          ) : null}

          {visit.phone ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Phone</div>
              <div className="dbgDetailVal">{visit.phone}</div>
            </div>
          ) : null}

          {visit.email ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Email</div>
              <div className="dbgDetailVal">{visit.email}</div>
            </div>
          ) : null}

          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Waiver</div>
            <div className="dbgDetailVal">
              <span className={`dbgPill ${visit.waiverAccepted ? "dbgPillOk" : "dbgPillMuted"}`}>
                {visit.waiverAccepted ? "Signed" : "Not signed"}
              </span>
            </div>
          </div>

          {visit.waiverSignedName ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Signed name</div>
              <div className="dbgDetailVal">{visit.waiverSignedName}</div>
            </div>
          ) : null}

          {visit.waiverSignedAt ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Signed at</div>
              <div className="dbgDetailVal">
                {new Date(visit.waiverSignedAt).toLocaleString()}
              </div>
            </div>
          ) : null}
        </div>

        <div className="dbgPhotoCard">
          <div className="dbgSideTitle">Photo</div>

          <div className="dbgPhotoFrame">
            {visit.photoDataUrl ? (
              <img src={visit.photoDataUrl} alt="Visitor" className="dbgPhotoImg" />
            ) : (
              <div className="dbgPreviewPlaceholder">No photo</div>
            )}
          </div>
        </div>
      </div>
    </DbgShell>
  );
}
