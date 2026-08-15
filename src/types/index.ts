import type { Timestamp } from 'firebase/firestore'

// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'company_admin' | 'employee'

// ─── Status ───────────────────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'
export type CompanyPlan = 'starter' | 'professional' | 'enterprise'

// ─── Base document ────────────────────────────────────────────────────────────
export interface BaseDocument {
  id: string
  companyId: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ─── Company ──────────────────────────────────────────────────────────────────
export interface Company {
  id: string
  name: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  plan: CompanyPlan
  isActive: boolean
  subscriptionEndsAt?: Timestamp | Date | string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface AppUser extends BaseDocument {
  uid: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface Customer extends BaseDocument {
  fullName: string
  phone: string
  email?: string
  address?: string
  nationalId?: string
  notes?: string
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export interface Vehicle extends BaseDocument {
  customerId: string
  licensePlate: string
  brand: string
  model: string
  color: string
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export interface Subscription extends BaseDocument {
  customerId: string
  vehicleId: string
  token: string        // UUID v4 — used in public QR URL
  startDate: Timestamp | Date
  endDate: Timestamp | Date
  durationMonths: number
  price: number
  isCancelled: boolean
}

// Computed status (not stored) — derived from dates + isCancelled
export interface SubscriptionWithStatus extends Subscription {
  status: SubscriptionStatus
  // Populated from joins
  customer?: Customer
  vehicle?: Vehicle
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export interface Payment extends BaseDocument {
  subscriptionId: string
  amount: number
  paymentDate: Timestamp | Date
  paymentMethod: PaymentMethod
  notes?: string
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  activeSubscriptions: number
  expiredSubscriptions: number
  expiringIn7Days: number
  totalCustomers: number
  totalVehicles: number
  monthlyRevenue: number
  yearlyRevenue: number
}

export interface MonthlyData {
  month: string
  subscriptions: number
  revenue: number
}

// ─── Form types ───────────────────────────────────────────────────────────────
export type CustomerFormData = {
  fullName: string
  phone: string
  email?: string
  address?: string
  nationalId?: string
  notes?: string
}

export type VehicleFormData = {
  customerId: string
  licensePlate: string
  brand: string
  model: string
  color: string
}

export type SubscriptionFormData = {
  customerId: string
  vehicleId: string
  startDate: string
  durationMonths: number
  price: number
  paymentMethod: PaymentMethod
}

export type PaymentFormData = {
  subscriptionId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes?: string
}

export type CompanyFormData = {
  name: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  plan: CompanyPlan
  subscriptionEndsAt?: string
}

// ─── Server Action response ───────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
