import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVisit } from "../services/salesforce";
import DbgShell from "../DbgShell";

// Quote a CSV field only when it contains a comma, quote, or newline.
function csvEscape(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminVisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getVisit(id);
        if (cancelled) return;
        if (!data) {
          setErr("Visit not found");
          return;
        }
        setVisit(data);
      } catch {
        if (!cancelled) setErr("Could not load visit");
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  const fullName = `${visit.Who?.FirstName || ""} ${visit.Who?.LastName || ""}`.trim();
  const hostName = visit.Host__r?.Name || "";
  const tourStudentName = `${visit.Tour_Student__r?.FirstName || ""} ${
    visit.Tour_Student__r?.LastName || ""
  }`.trim();
  const phone = visit.Who?.Phone || "";
  const email = visit.Who?.Email || "";
  const waiverAccepted = !!visit.Waiver_Accepted__c;

  function downloadCsv() {
    const headers = [
      "Visit ID",
      "Time",
      "Visitor",
      "Reason",
      "Badge",
      "Host",
      "Touring With",
      "Phone",
      "Email",
      "Waiver",
      "Signed Name",
      "Signed At",
    ];
    const row = [
      visit.Id || "",
      visit.CreatedDate ? new Date(visit.CreatedDate).toLocaleString() : "",
      fullName,
      visit.Visit_Reason__c || "",
      visit.Badge_Type__c || "",
      hostName,
      tourStudentName,
      phone,
      email,
      waiverAccepted ? "Signed" : "Not signed",
      visit.Waiver_Signed_Name__c || "",
      visit.Waiver_Signed_At__c ? new Date(visit.Waiver_Signed_At__c).toLocaleString() : "",
    ];

    const csv = [headers, row].map((r) => r.map(csvEscape).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visit-${visit.Id || "detail"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <DbgShell
      title={fullName || "Visit"}
      subtitle={visit.CreatedDate ? new Date(visit.CreatedDate).toLocaleString() : ""}
      footer={
        <div className="dbgGrid2">
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/admin")}>
            ← Back to Admin
          </button>

          <button className="dbgBtn dbgBtnPrimary" onClick={downloadCsv}>
            Export CSV (filtered)
          </button>
        </div>
      }
    >
      <div className="dbgDetailGrid">
        <div className="dbgDetailCard">
          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Visit ID</div>
            <div className="dbgDetailVal dbgMono">{visit.Id || ""}</div>
          </div>

          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Reason</div>
            <div className="dbgDetailVal">{visit.Visit_Reason__c || ""}</div>
          </div>

          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Badge</div>
            <div className="dbgDetailVal">{visit.Badge_Type__c || ""}</div>
          </div>

          {hostName ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Host</div>
              <div className="dbgDetailVal">{hostName}</div>
            </div>
          ) : null}

          {tourStudentName ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Touring with</div>
              <div className="dbgDetailVal">{tourStudentName}</div>
            </div>
          ) : null}

          {phone ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Phone</div>
              <div className="dbgDetailVal">{phone}</div>
            </div>
          ) : null}

          {email ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Email</div>
              <div className="dbgDetailVal">{email}</div>
            </div>
          ) : null}

          <div className="dbgDetailRow">
            <div className="dbgDetailKey">Waiver</div>
            <div className="dbgDetailVal">
              <span className={`dbgPill ${waiverAccepted ? "dbgPillOk" : "dbgPillMuted"}`}>
                {waiverAccepted ? "Signed" : "Not signed"}
              </span>
            </div>
          </div>

          {visit.Waiver_Signed_Name__c ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Signed name</div>
              <div className="dbgDetailVal">{visit.Waiver_Signed_Name__c}</div>
            </div>
          ) : null}

          {visit.Waiver_Signed_At__c ? (
            <div className="dbgDetailRow">
              <div className="dbgDetailKey">Signed at</div>
              <div className="dbgDetailVal">
                {new Date(visit.Waiver_Signed_At__c).toLocaleString()}
              </div>
            </div>
          ) : null}
        </div>

        <div className="dbgPhotoCard">
          <div className="dbgSideTitle">Photo</div>

          <div className="dbgPhotoFrame">
            <div className="dbgPreviewPlaceholder">
              Photo stored in Salesforce on the visitor's record.
            </div>
          </div>
        </div>
      </div>
    </DbgShell>
  );
}
