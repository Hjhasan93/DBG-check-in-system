export const REASONS = [
  { key: "tour", label: "Tour", hostRequired: true, photoRequired: true, waiverRequired: false, badgeType: "TOUR" },
  { key: "parent", label: "Parent/Guardian", hostRequired: false, photoRequired: true, waiverRequired: false, badgeType: "GUARDIAN" },
  { key: "appointment", label: "Appointment", hostRequired: true, photoRequired: true, waiverRequired: false, badgeType: "VISITOR" },
  { key: "contractor", label: "Contractor/Vendor", hostRequired: false, photoRequired: true, waiverRequired: false, badgeType: "CONTRACTOR" },
  { key: "volunteer", label: "Volunteer", hostRequired: false, photoRequired: true, waiverRequired: true, badgeType: "VOLUNTEER" },
  { key: "student", label: "DBG Student", hostRequired: false, photoRequired: false, waiverRequired: false, badgeType: "STUDENT" },
  { key: "work", label: "Employee", hostRequired: false, photoRequired: false, waiverRequired: false, badgeType: "STAFF" },
  { key: "other", label: "Other", hostRequired: false, photoRequired: true, waiverRequired: false, badgeType: "VISITOR" },
];
