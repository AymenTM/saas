// ─── Routes ───────────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  VEHICLES: '/vehicles',
  SUBSCRIPTIONS: '/subscriptions',
  PAYMENTS: '/payments',
  ADMIN: {
    COMPANIES: '/admin/companies',
    USERS: '/admin/users',
  },
} as const

// ─── Roles ────────────────────────────────────────────────────────────────────
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_ADMIN: 'company_admin',
  EMPLOYEE: 'employee',
} as const

// ─── Subscription status ──────────────────────────────────────────────────────
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

// ─── Payment methods ──────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'other'] as const

// ─── Company plans ────────────────────────────────────────────────────────────
export const COMPANY_PLANS = ['starter', 'professional', 'enterprise'] as const

// ─── Firestore collections ────────────────────────────────────────────────────
export const COLLECTIONS = {
  COMPANIES: 'companies',
  USERS: 'users',
  CUSTOMERS: 'customers',
  VEHICLES: 'vehicles',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
} as const

// ─── Duration options ─────────────────────────────────────────────────────────
export const DURATION_OPTIONS = [1, 2, 3, 6, 12] as const

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20

// ─── App metadata ─────────────────────────────────────────────────────────────
export const APP_NAME = 'ParkSub'
export const APP_DESCRIPTION = 'Parking Subscription Management SaaS'
