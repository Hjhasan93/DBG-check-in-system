import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useVisit } from "../context/VisitContext";
import DbgShell from "../DbgShell";
import { findOrCreateContact, createCheckIn, uploadPhoto } from "../services/salesforce";

export default function ThankYou() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const [secondsLeft, setSecondsLeft] = useState(5);

  // ✅ prevents double-save in React StrictMode (dev)
  const savedRef = useRef(false);

  useEffect(() => {
    async function saveVisit() {
      try {
        // 1. Find an existing visitor Contact (or create one)
        const contactId = await findOrCreateContact({
          firstName: visit.firstName,
          lastName: visit.lastName,
          phone: visit.phone,
          email: visit.email,
        });

        // 2. Create the check-in Event
        const eventId = await createCheckIn(visit, contactId);
        setVisit((v) => ({ ...v, contactId, eventId }));

        // 3. Best-effort photo upload — never fail the check-in over a photo
        if (visit.photoDataUrl) {
          try {
            await uploadPhoto(
              contactId,
              visit.photoDataUrl,
              `${visit.firstName} ${visit.lastName}`.trim()
            );
          } catch (e) {
            console.error("Photo upload failed (check-in still saved):", e);
          }
        }
      } catch (e) {
        // keep silent for kiosk mode, but surface for debugging
        console.error("Check-in save failed:", e);
      }
    }

    // ✅ only save once per visit
    if (savedRef.current) return;
    if (visit.firstName && visit.lastName) {
      savedRef.current = true;
      saveVisit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit.firstName, visit.lastName]); // ✅ don’t depend on whole visit object

  useEffect(() => {
    setSecondsLeft(5);

    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const t = setTimeout(() => {
      // ✅ clear id so next visitor gets a fresh one
      sessionStorage.removeItem("dbg_client_visit_id");

      setVisit({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        reasonKey: "",
        reasonLabel: "",
        badgeType: "",
        host: "",
        hostId: "",
        photoDataUrl: "",
        waiverAccepted: false,
        waiverSignedName: "",
        waiverSignedAt: "",
        tourStudentId: "",
        tourStudentName: "",
        contactId: "",
        eventId: "",
      });
      navigate("/");
    }, 5000);

    return () => {
      clearTimeout(t);
      clearInterval(tick);
    };
  }, [navigate, setVisit]);

  return (
    <DbgShell
      title="Detroit Boxing Gym"
      subtitle="Thank you. Your check-in is complete."
      footer={
        <div className="dbgGrid2">
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/")}>
            Back to start
          </button>
          <button className="dbgBtn dbgBtnPrimary" onClick={() => navigate("/")}>
            Start next check-in
          </button>
        </div>
      }
    >
      <div className="dbgThankYouCenter">
        <div className="dbgBigTitle">Thank you.</div>
        <div className="dbgThankSub">Printing your badge now.</div>

        <div className="dbgSummaryBox">
          <div>
            <b>Name:</b> {visit.firstName} {visit.lastName}
          </div>
          <div>
            <b>Reason:</b> {visit.reasonLabel}
          </div>
          <div>
            <b>Badge:</b> {visit.badgeType}
          </div>
          {visit.host ? (
            <div>
              <b>Host:</b> {visit.host}
            </div>
          ) : null}
        </div>

        <div className="dbgSmallText">
          Returning to start in <b>{secondsLeft}</b> seconds.
        </div>
      </div>
    </DbgShell>
  );
}
