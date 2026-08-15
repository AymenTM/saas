import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'
import type { SubscriptionStatus } from '@/types'

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function toDate(value: Timestamp | Date | string | null | undefined): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  // Firestore Timestamp
  if ('toDate' in value) return value.toDate()
  return new Date()
}

export function formatDate(
  value: Timestamp | Date | string | null | undefined,
  locale: string = 'fr',
  fmt: string = 'dd MMMM yyyy'
): string {
  const date = toDate(value)
  return format(date, fmt, { locale: locale === 'fr' ? fr : enUS })
}

export function formatDateShort(
  value: Timestamp | Date | string | null | undefined,
  locale: string = 'fr'
): string {
  return formatDate(value, locale, 'dd/MM/yyyy')
}

// ─── Currency helpers ─────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'DZD', locale = 'fr-DZ'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Subscription status computation ─────────────────────────────────────────
export function computeSubscriptionStatus(
  endDate: Timestamp | Date | string,
  isCancelled: boolean
): SubscriptionStatus {
  if (isCancelled) return 'cancelled'
  const now = new Date()
  const end = toDate(endDate)
  if (isBefore(end, now)) return 'expired'
  return 'active'
}

export function isExpiringSoon(
  endDate: Timestamp | Date | string,
  daysThreshold = 7
): boolean {
  const now = new Date()
  const end = toDate(endDate)
  const threshold = addDays(now, daysThreshold)
  return isAfter(end, now) && isBefore(end, threshold)
}

// ─── String helpers ───────────────────────────────────────────────────────────
export function truncate(str: string, length = 40): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Color for status ─────────────────────────────────────────────────────────
export function statusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'badge-active'
    case 'expired':
      return 'badge-expired'
    case 'cancelled':
      return 'badge-cancelled'
  }
}

// ─── Calculate end date from start + duration ─────────────────────────────────
export function calculateEndDate(startDate: Date, durationMonths: number): Date {
  const end = new Date(startDate)
  end.setMonth(end.getMonth() + durationMonths)
  return end
}

// ─── Serialize Firestore doc for client ───────────────────────────────────────
// Converts Timestamps to ISO strings so data can cross the server/client boundary
export function serializeDoc<T extends Record<string, unknown>>(doc: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (value && typeof value === 'object' && 'toDate' in value) {
      result[key] = (value as Timestamp).toDate().toISOString()
    } else if (value instanceof Date) {
      result[key] = value.toISOString()
    } else {
      result[key] = value
    }
  }
  return result as T
}
