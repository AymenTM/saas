'use server'

import { v4 as uuidv4 } from 'uuid'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/constants'
import type {
  Subscription,
  SubscriptionWithStatus,
  SubscriptionFormData,
  PaymentMethod,
  ActionResult,
} from '@/types'
import { computeSubscriptionStatus, calculateEndDate, toDate } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

function serializeAdminDoc<T>(id: string, data: Record<string, unknown>): T {
  const result: Record<string, unknown> = { id }
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString()
    } else if (value instanceof Date) {
      result[key] = value.toISOString()
    } else {
      result[key] = value
    }
  }
  return result as T
}

export async function createSubscription(
  data: SubscriptionFormData,
  companyId: string
): Promise<ActionResult<string>> {
  try {
    const startDate = new Date(data.startDate)
    const endDate = calculateEndDate(startDate, data.durationMonths)
    const token = uuidv4()

    const ref = await adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).add({
      companyId,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      token,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      durationMonths: data.durationMonths,
      price: data.price,
      isCancelled: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Automatically record payment if price > 0
    if (data.price > 0) {
      await adminDb.collection(COLLECTIONS.PAYMENTS).add({
        companyId,
        subscriptionId: ref.id,
        amount: data.price,
        paymentDate: Timestamp.fromDate(startDate),
        paymentMethod: data.paymentMethod || 'cash',
        notes: `Paiement automatique - Nouvel abonnement (${data.durationMonths} mois)`,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/subscriptions')
    return { success: true, data: ref.id }
  } catch (error) {
    console.error('createSubscription error:', error)
    return { success: false, error: 'Erreur lors de la création de l\'abonnement' }
  }
}

export async function renewSubscription(
  subscriptionId: string,
  companyId: string,
  durationMonths: number,
  price: number,
  paymentMethod: PaymentMethod = 'cash'
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Abonnement introuvable' }
    }

    const currentEnd = toDate(snap.data()?.endDate)
    const now = new Date()
    const renewFrom = currentEnd > now ? currentEnd : now
    const newEndDate = calculateEndDate(renewFrom, durationMonths)

    await ref.update({
      endDate: Timestamp.fromDate(newEndDate),
      durationMonths,
      price,
      isCancelled: false,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Automatically record payment for renewal if price > 0
    if (price > 0) {
      await adminDb.collection(COLLECTIONS.PAYMENTS).add({
        companyId,
        subscriptionId,
        amount: price,
        paymentDate: Timestamp.fromDate(now),
        paymentMethod,
        notes: `Paiement automatique - Renouvellement (${durationMonths} mois)`,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    revalidatePath('/subscriptions')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('renewSubscription error:', error)
    return { success: false, error: 'Erreur lors du renouvellement' }
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Abonnement introuvable' }
    }

    await ref.update({
      isCancelled: true,
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/subscriptions')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('cancelSubscription error:', error)
    return { success: false, error: 'Erreur lors de l\'annulation' }
  }
}

export async function updateSubscription(
  subscriptionId: string,
  data: Partial<SubscriptionFormData>,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Abonnement introuvable' }
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

    if (data.startDate) {
      const startDate = new Date(data.startDate)
      updates.startDate = Timestamp.fromDate(startDate)
      if (data.durationMonths) {
        updates.endDate = Timestamp.fromDate(calculateEndDate(startDate, data.durationMonths))
      }
    }
    if (data.durationMonths) updates.durationMonths = data.durationMonths
    if (data.price !== undefined) updates.price = data.price

    await ref.update(updates)

    revalidatePath('/subscriptions')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('updateSubscription error:', error)
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteSubscription(
  subscriptionId: string,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Abonnement introuvable' }
    }

    await ref.delete()
    revalidatePath('/subscriptions')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('deleteSubscription error:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

export async function getSubscriptions(
  companyId: string
): Promise<SubscriptionWithStatus[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .where('companyId', '==', companyId)
      .get()

    const subs: SubscriptionWithStatus[] = snapshot.docs.map((d) => {
      const data = d.data() as Omit<Subscription, 'id'>
      const status = computeSubscriptionStatus(data.endDate, data.isCancelled)
      return serializeAdminDoc<SubscriptionWithStatus>(d.id, { ...data, status })
    })

    return subs.sort((a, b) => {
      const timeA = new Date(a.createdAt as unknown as string).getTime() || 0
      const timeB = new Date(b.createdAt as unknown as string).getTime() || 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('getSubscriptions error:', error)
    return []
  }
}

export async function getSubscriptionByToken(
  token: string
): Promise<SubscriptionWithStatus | null> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const d = snapshot.docs[0]!
    const data = d.data() as Omit<Subscription, 'id'>
    const status = computeSubscriptionStatus(data.endDate, data.isCancelled)
    return serializeAdminDoc<SubscriptionWithStatus>(d.id, { ...data, status })
  } catch (error) {
    console.error('getSubscriptionByToken error:', error)
    return null
  }
}
