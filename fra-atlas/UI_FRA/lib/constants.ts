// Government portal constants and configuration

export const GOVERNMENT_COLORS = {
  green: "#2C6E49",
  blue: "#0F2A44",
  saffron: "#E57C04",
  teal: "#0E9AA7",
  lightGreen: "#4A7C59",
  lightBlue: "#1E3A54",
} as const

export const CLAIM_STATUS = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
} as const

export const CONTACT_INFO = {
  tollFree: "1800 180 2117",
  alternateNumber: "1800 180 2060",
  email: "mfmb-agri[at]hry[dot]gov[dot]in",
  address: "Krishi Bhawan, Sector 21, Budanpur, Panchkula-134117 (Haryana)",
  workingHours: "Monday to Friday, 9:00AM - 5:00PM",
} as const

export const DEPARTMENT_INFO = {
  name: "Department of Agriculture and Farmers Welfare, Haryana",
  ministry: "Government of India - Ministry of Tribal Affairs",
  portal: "FRA Atlas Portal",
  tagline: "Forest Rights Act Atlas Portal",
} as const

export const SESSION_CONFIG = {
  timeout: 30, // minutes
  warningTime: 5, // minutes before timeout to show warning
} as const

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: [20.5937, 78.9629], // India center
  defaultZoom: 5,
  maxZoom: 18,
  minZoom: 4,
  clusterDistance: 50,
} as const

// API endpoints
export const API_ENDPOINTS = {
  login: "/api/login",
  villages: "/api/villages",
  claims: "/api/claims",
  claim: (id: string) => `/api/claim/${id}`,
  verifyClaim: (id: string) => `/api/claim/${id}/verify`,
  rejectClaim: (id: string) => `/api/claim/${id}/reject`,
  exportCsv: "/api/export/csv",
  debugInfo: "/api/_debug_db_info",
} as const

// Form validation
export const VALIDATION = {
  minPasswordLength: 8,
  maxClaimsDisplay: 2000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
} as const
