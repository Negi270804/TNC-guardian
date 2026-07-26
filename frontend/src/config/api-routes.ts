export const API_ROUTES = {
  HEALTH: {
    ROOT: '/health',
    V1: '/api/v1/health',
  },
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  USERS: {
    ME: '/api/users/me',
    CHANGE_PASSWORD: '/api/users/change-password',
  },
  DOCUMENTS: {
    BASE: '/api/documents',
    UPLOAD: '/api/documents/upload',
    BY_ID: (id: string) => `/api/documents/${id}`,
    EXTRACT: (id: string) => `/api/documents/${id}/extract`,
    TEXT: (id: string) => `/api/documents/${id}/text`,
  },
  ANALYSIS: {
    PDF: '/api/analysis/pdf',
    TEXT: '/api/analysis/text',
    URL: '/api/analysis/url',
    BY_ID: (id: string) => `/api/analysis/${id}`,
  },
  RESULTS: {
    BY_ID: (id: string) => `/api/results/${id}`,
    SUMMARY: (id: string) => `/api/results/${id}/summary`,
    CLAUSES: (id: string) => `/api/results/${id}/clauses`,
    RISK_SCORE: (id: string) => `/api/results/${id}/risk-score`,
  },
  HISTORY: {
    BASE: '/api/history',
    BY_ID: (id: string) => `/api/history/${id}`,
    BULK_DELETE: '/api/history/bulk-delete',
    REANALYZE: (id: string) => `/api/history/${id}/reanalyze`,
  },
  SUBSCRIPTION: {
    CURRENT: '/api/subscription/current',
    PLANS: '/api/subscription/plans',
    USAGE: '/api/subscription/usage',
    UPGRADE: '/api/subscription/upgrade',
    CANCEL: '/api/subscription/cancel',
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
  },
} as const;
