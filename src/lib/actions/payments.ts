'use server'

import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/constants'
import type { Payment, PaymentFormData, ActionResult } from '@/types'
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

export async function createPayment(
  data: PaymentFormData,
  companyId: string
): Promise<ActionResult<string>> {
  try {
    const paymentDate = new Date(data.paymentDate)

    const ref = await adminDb.collection(COLLECTIONS.PAYMENTS).add({
      companyId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      paymentDate: Timestamp.fromDate(paymentDate),
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/payments')
    revalidatePath('/dashboard')
    return { success: true, data: ref.id }
  } catch (error) {
    console.error('createPayment error:', error)
    return { success: false, error: 'Erreur lors de l\'enregistrement du paiement' }
  }
}

export async function getPayments(companyId: string): Promise<Payment[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.PAYMENTS)
      .where('companyId', '==', companyId)
      .get()

    const list = snapshot.docs.map((d) =>
      serializeAdminDoc<Payment>(d.id, d.data())
    )

    return list.sort((a, b) => {
      const timeA = new Date(a.paymentDate as unknown as string).getTime() || 0
      const timeB = new Date(b.paymentDate as unknown as string).getTime() || 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('getPayments error:', error)
    return []
  }
}
