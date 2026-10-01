export interface CampusDocument {
  id: string;
  title: string;
  category: "academic" | "non-academic";
  description: string;
  status: "Available" | "Active" | "Verified" | "Approved" | "Ready";
  statusVariant: "success" | "default" | "secondary" | "warning";
  issuedDate: string;
  documentNumber: string;
  validThrough?: string;
  iconName:
    | "id-card"
    | "award"
    | "file-text"
    | "calendar-check"
    | "book-open"
    | "shield-check"
    | "bus"
    | "home"
    | "users"
    | "activity"
    | "key";
  details: {
    issuer: string;
    verifiedBy: string;
    referenceCode: string;
    remarks?: string;
  };
}

export const MOCK_ACADEMIC_DOCUMENTS: CampusDocument[] = [
  {
    id: "doc-acad-01",
    title: "Institutional Digital ID",
    category: "academic",
    description: "Official university identity card with smart chip barcode.",
    status: "Active",
    statusVariant: "success",
    issuedDate: "Aug 2023",
    validThrough: "Jul 2027",
    documentNumber: "ID-2026-8841",
    iconName: "id-card",
    details: {
      issuer: "Office of the Registrar",
      verifiedBy: "Academic Security Cell",
      referenceCode: "CAMPUS-ID-VERIFIED",
      remarks: "Digitally signed with institutional cryptographic certificate.",
    },
  },
  {
    id: "doc-acad-02",
    title: "Bonafide Certificate",
    category: "academic",
    description: "Official proof of current regular enrollment in degree program.",
    status: "Available",
    statusVariant: "default",
    issuedDate: "Jan 2026",
    documentNumber: "BON-2026-0319",
    iconName: "award",
    details: {
      issuer: "Dean of Academic Affairs",
      verifiedBy: "University Portal Services",
      referenceCode: "CERT-BON-98214",
      remarks: "Valid for visa, bank loan, internship, and external exam applications.",
    },
  },
  {
    id: "doc-acad-03",
    title: "Semester Grade Card",
    category: "academic",
    description: "Authenticated statement of grades & credits earned.",
    status: "Verified",
    statusVariant: "success",
    issuedDate: "Dec 2025",
    documentNumber: "GC-S5-4491",
    iconName: "file-text",
    details: {
      issuer: "Controller of Examinations",
      verifiedBy: "Central Evaluation Committee",
      referenceCode: "COE-RES-2025-W",
      remarks: "Includes SGPA 8.92 and cumulative CGPA 8.84.",
    },
  },
  {
    id: "doc-acad-04",
    title: "Attendance Record",
    category: "academic",
    description: "Certified bio-metric and class attendance summary (88%).",
    status: "Verified",
    statusVariant: "success",
    issuedDate: "Current Semester",
    documentNumber: "ATT-2026-SEM6",
    iconName: "calendar-check",
    details: {
      issuer: "Department Academic Coordinator",
      verifiedBy: "Automated Biometric Core",
      referenceCode: "ATT-COMPLIANT-OK",
      remarks: "Above mandatory 75% threshold across all registered lectures & labs.",
    },
  },
  {
    id: "doc-acad-05",
    title: "Course Registration Sheet",
    category: "academic",
    description: "Registered courses, electives, credit breakdown and lab sections.",
    status: "Ready",
    statusVariant: "default",
    issuedDate: "Jan 2026",
    documentNumber: "REG-2026-602",
    iconName: "book-open",
    details: {
      issuer: "Head of Department",
      verifiedBy: "Faculty Advisor",
      referenceCode: "CRS-SEM6-FINAL",
      remarks: "Total 24 credits approved including 1 elective and 1 open seminar.",
    },
  },
  {
    id: "doc-acad-06",
    title: "Academic Transcript",
    category: "academic",
    description: "Provisional academic transcript with complete course audit.",
    status: "Available",
    statusVariant: "secondary",
    issuedDate: "Jan 2026",
    documentNumber: "TRN-2026-0042",
    iconName: "award",
    details: {
      issuer: "Examination Secretariat",
      verifiedBy: "Controller of Examinations",
      referenceCode: "TRN-SEAL-8891",
      remarks: "Compliant with National Academic Depository (NAD) guidelines.",
    },
  },
];

export const MOCK_NON_ACADEMIC_DOCUMENTS: CampusDocument[] = [
  {
    id: "doc-nonacad-01",
    title: "Campus Event Permission",
    category: "non-academic",
    description: "Approved security clearance for Annual Tech Symposium.",
    status: "Approved",
    statusVariant: "success",
    issuedDate: "Feb 2026",
    validThrough: "Mar 2026",
    documentNumber: "EVT-2026-091",
    iconName: "shield-check",
    details: {
      issuer: "Student Affairs Office",
      verifiedBy: "Chief Proctor",
      referenceCode: "EVT-PERM-AUDITORIUM-B",
      remarks: "Includes sound equipment and late-hour campus access clearance.",
    },
  },
  {
    id: "doc-nonacad-02",
    title: "Hostel Gate & Room Pass",
    category: "non-academic",
    description: "Resident pass for Block 3 with biometric door authorization.",
    status: "Active",
    statusVariant: "success",
    issuedDate: "Jul 2025",
    validThrough: "Jun 2026",
    documentNumber: "HST-BLK3-304",
    iconName: "home",
    details: {
      issuer: "Hostel Management Committee",
      verifiedBy: "Senior Warden",
      referenceCode: "HST-ROOM-304B",
      remarks: "Authorized for extended library hours curfew extension.",
    },
  },
  {
    id: "doc-nonacad-03",
    title: "Campus Transport Pass",
    category: "non-academic",
    description: "Valid pass for Route 4 Metro Station - South Campus shuttle.",
    status: "Active",
    statusVariant: "success",
    issuedDate: "Jan 2026",
    validThrough: "Jun 2026",
    documentNumber: "BUS-R4-2026",
    iconName: "bus",
    details: {
      issuer: "Campus Transport Logistics",
      verifiedBy: "Operations Desk",
      referenceCode: "TRANS-R4-SEAT",
      remarks: "Valid across all morning and evening shuttle departures.",
    },
  },
  {
    id: "doc-nonacad-04",
    title: "Technical Society Membership",
    category: "non-academic",
    description: "Lead Developer credential for Campus Open Source Collective.",
    status: "Verified",
    statusVariant: "success",
    issuedDate: "Sep 2024",
    documentNumber: "SOC-2025-DEV",
    iconName: "users",
    details: {
      issuer: "Campus Societies Council",
      verifiedBy: "Faculty In-Charge",
      referenceCode: "CLUB-OSC-CORE",
      remarks: "Recognized extra-curricular leadership role.",
    },
  },
  {
    id: "doc-nonacad-05",
    title: "Inter-College Sports Credential",
    category: "non-academic",
    description: "Certificate of participation in University Badminton Championship.",
    status: "Verified",
    statusVariant: "secondary",
    issuedDate: "Nov 2025",
    documentNumber: "SPT-2025-072",
    iconName: "activity",
    details: {
      issuer: "Director of Physical Education",
      verifiedBy: "Sports Board",
      referenceCode: "ATH-BAD-RUNNER",
      remarks: "Silver Medalist — Men's Doubles Team.",
    },
  },
  {
    id: "doc-nonacad-06",
    title: "Innovation Lab 24/7 Access",
    category: "non-academic",
    description: "Special security clearance for AI & Hardware Prototyping Labs.",
    status: "Active",
    statusVariant: "success",
    issuedDate: "Jan 2026",
    validThrough: "Dec 2026",
    documentNumber: "ACC-LAB-774",
    iconName: "key",
    details: {
      issuer: "Director of Research & Innovation",
      verifiedBy: "Lab Security In-Charge",
      referenceCode: "RFID-LAB-ACCESS-A",
      remarks: "Authorized to supervise hackathon team equipment after 8:00 PM.",
    },
  },
];
