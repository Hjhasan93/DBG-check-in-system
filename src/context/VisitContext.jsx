import { createContext, useContext, useMemo, useState } from "react";

const VisitContext = createContext(null);

export function VisitProvider({ children }) {
  const [visit, setVisit] = useState({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  reasonKey: "",
  reasonLabel: "",
  badgeType: "",
  host: "",        // host display name (for the badge/summary)
  hostId: "",      // host Salesforce User Id (written to Event.Host__c)
  photoDataUrl: "",
  waiverAccepted: false,
  waiverSignedName: "",
  waiverSignedAt: "",
  tourStudentId: "",
  tourStudentName: "",
  contactId: "",   // visitor Salesforce Contact Id (set during check-in)
  eventId: "",     // created check-in Event Id
});


  const value = useMemo(() => ({ visit, setVisit }), [visit]);
  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisit must be used inside VisitProvider");
  return ctx;
}
