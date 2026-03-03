import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import { WATCHLIST } from "../config/watchlist";

const onlyLetters = (s) => s.replace(/[^a-zA-Z]/g, "");
const onlyDigits = (s) => s.replace(/\D/g, "");

const cleanPhone = (s) => (s || "").replace(/\D/g, "").slice(0, 10);
const cleanEmail = (s) => (s || "").trim().toLowerCase();

export default function AboutYou() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const [first, setFirst] = useState(visit.firstName || "");
  const [last, setLast] = useState(visit.lastName || "");
  const [phone, setPhone] = useState(visit.phone || "");
  const [email, setEmail] = useState(visit.email || "");
  const [error, setError] = useState("");

  // Email is optional, but if entered it must be valid
  const emailOk = useMemo(() => {
    const e = email.trim();
    if (!e) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }, [email]);

  const canContinue =
    first.trim().length > 0 &&
    last.trim().length > 0 &&
    phone.trim().length === 10 &&
    emailOk;

  useEffect(() => {
    const t = setTimeout(() => navigate("/"), 120000);
    return () => clearTimeout(t);
  }, [navigate]);

  function resetVisitAndGoHome() {
    setVisit({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      reasonKey: "",
      reasonLabel: "",
      badgeType: "",
      host: "",
      photoDataUrl: "",
      waiverAccepted: false,
      waiverSignedName: "",
      waiverSignedAt: "",
      tourStudentId: "",
      tourStudentName: "",
    });

    navigate("/", { replace: true });
  }

  async function notifyWatchlistHit(payload) {
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL;
      if (!BACKEND) return;

      await fetch(`${BACKEND}/watchlist-hit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // silent for kiosk
    }
  }

  async function onNext() {
    setError("");

    const firstName = first.trim();
    const lastName = last.trim();
    const phoneNum = phone.trim();
    const emailVal = email.trim();

    if (firstName.length === 0 || lastName.length === 0) {
      setError("First and last name are required.");
      return;
    }

    if (phoneNum.length !== 10) {
      setError("Phone number must be 10 digits.");
      return;
    }

    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }

    // Build normalized values for matching
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    const phoneDigits = cleanPhone(phoneNum);
    const emailLower = cleanEmail(emailVal);

    // Find hit + how it matched
    let matchedBy = "";
    const hit = WATCHLIST.find((w) => {
      const wFirst = (w.firstName || "").trim().toLowerCase();
      const wLast = (w.lastName || "").trim().toLowerCase();
      const wPhone = cleanPhone(w.phone || "");
      const wEmail = cleanEmail(w.email || "");

      const nameMatch =
        wFirst && wLast && wFirst === firstNameLower && wLast === lastNameLower;

      const phoneMatch = wPhone && phoneDigits && wPhone === phoneDigits;
      const emailMatch = wEmail && emailLower && wEmail === emailLower;

      if (nameMatch) matchedBy = "name";
      else if (phoneMatch) matchedBy = "phone";
      else if (emailMatch) matchedBy = "email";

      return nameMatch || phoneMatch || emailMatch;
    });

    if (hit) {
      // notify admin (backend) then silently reset and go home
      notifyWatchlistHit({
        createdAt: new Date().toISOString(),
        firstName,
        lastName,
        phone: phoneDigits,
        email: emailLower,
        note: hit.note || "",
        matchedBy,
      });

      resetVisitAndGoHome();
      return;
    }

    // Save into context only if not watchlisted
    setVisit((v) => ({
      ...v,
      firstName,
      lastName,
      phone: phoneDigits,
      email: emailVal,
    }));

    navigate("/reason");
  }

  return (
    <div className="dbgPage">
      <div className="dbgCard">
        <div className="dbgHeader">
          <h1 className="dbgTitle">About you</h1>
        </div>

        <p className="dbgSubtitle">Please enter your info.</p>

        <div className="dbgFormGrid">
          <label className="dbgLabel">
            First name
            <input
              className="dbgInput"
              value={first}
              onChange={(e) => setFirst(onlyLetters(e.target.value).slice(0, 20))}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="dbgLabel">
            Last name
            <input
              className="dbgInput"
              value={last}
              onChange={(e) => setLast(onlyLetters(e.target.value).slice(0, 20))}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="dbgLabel">
            Phone
            <input
              className="dbgInput"
              value={phone}
              onChange={(e) => setPhone(onlyDigits(e.target.value).slice(0, 10))}
              placeholder="10 digits"
              inputMode="numeric"
              maxLength={10}
              autoComplete="off"
            />
          </label>

          <label className="dbgLabel">
            Email
            <input
              className="dbgInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email.trim() && !emailOk) {
                  setError("Please enter a valid email address.");
                }
              }}
              placeholder="name@example.com"
              inputMode="email"
              type="email"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>

        {error ? <div className="dbgErr">{error}</div> : null}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 22,
            gap: 12,
          }}
        >
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/")}>
            Back
          </button>

          <button
            className="dbgBtn dbgBtnPrimary"
            disabled={!canContinue}
            onClick={onNext}
            style={!canContinue ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}