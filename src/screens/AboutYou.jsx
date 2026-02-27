import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import { WATCHLIST } from "../config/watchlist";

const onlyLetters = (s) => s.replace(/[^a-zA-Z]/g, "");
const onlyDigits = (s) => s.replace(/\D/g, "");

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

  function onNext() {
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

    setVisit((v) => ({
      ...v,
      firstName,
      lastName,
      phone: phoneNum,
      email: emailVal,
    }));

    const cleanPhone = (s) => (s || "").replace(/\D/g, "").slice(0, 10);
    const cleanEmail = (s) => (s || "").trim().toLowerCase();

    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    const phoneDigits = cleanPhone(phoneNum);
    const emailLower = cleanEmail(emailVal);

    const hit = WATCHLIST.find((w) => {
      const wFirst = (w.firstName || "").trim().toLowerCase();
      const wLast = (w.lastName || "").trim().toLowerCase();
      const wPhone = cleanPhone(w.phone || "");
      const wEmail = cleanEmail(w.email || "");

      const nameMatch =
        wFirst && wLast && wFirst === firstNameLower && wLast === lastNameLower;

      const phoneMatch = wPhone && phoneDigits && wPhone === phoneDigits;
      const emailMatch = wEmail && emailLower && wEmail === emailLower;

      return nameMatch || phoneMatch || emailMatch;
    });

    if (hit) {
      navigate("/watchlist");
      return;
    }

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
                if (email.trim() && !emailOk) setError("Please enter a valid email address.");
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