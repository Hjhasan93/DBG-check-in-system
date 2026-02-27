import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import DbgShell from "../DbgShell";

export default function PrintBadge() {
  const navigate = useNavigate();
  const { visit } = useVisit();

  function mockPrint() {
  alert("Printing is set up later. Badge preview confirmed.");
  window.print();
  navigate("/thankyou");
}


  return (
    <DbgShell
      title="Detroit Boxing Gym"
      subtitle="Ready to print. Confirm the badge below, then print."
      footer={
        <div className="dbgGrid3">
          <button className="dbgBtn dbgBtnPrimary" onClick={mockPrint}>
            Print Badge
          </button>

          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/thankyou")}>
            Skip Print
          </button>

          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/photo")}>
            Retake Photo
          </button>
        </div>
      }
    >
      <div className="dbgPrintLayout">
        <div className="dbgBadgeWrapper">
          <div id="badge" className="dbgBadge">
            <div className="dbgBadgeTop">
              <div className="dbgBadgeType">{visit.badgeType || "VISITOR"}</div>

              <div className="dbgBadgeName">
                {(visit.firstName + " " + visit.lastName).trim() || "Guest"}
              </div>

              {visit.host ? <div className="dbgBadgeMeta">Host: {visit.host}</div> : null}

              {visit.waiverAccepted ? (
                <div className="dbgBadgeMeta">Waiver: Signed</div>
              ) : null}

              <div className="dbgBadgeReason">{visit.reasonLabel || ""}</div>
            </div>

            <div className="dbgBadgePhotoBox">
              {visit.photoDataUrl ? (
                <img src={visit.photoDataUrl} alt="photo" className="dbgBadgePhoto" />
              ) : (
                <div className="dbgBadgeNoPhoto">No photo</div>
              )}
            </div>

            <div className="dbgBadgeBottom">
              <div>{new Date().toLocaleString()}</div>
              <div>DBG</div>
            </div>
          </div>
        </div>

        <p className="dbgNote">
          Printing will be connected later to the facility PC and Brother printer.
        </p>
      </div>
    </DbgShell>
  );
}
