'use server'

import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/constants'
import type { Customer, CustomerFormData, ActionResult } from '@/types'
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

export async function createCustomer(
  data: CustomerFormData,
  companyId: string
): Promise<ActionResult<string>> {
  try {
    const ref = await adminDb.collection(COLLECTIONS.CUSTOMERS).add({
      companyId,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      nationalId: data.nationalId || null,
      notes: data.notes || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/customers')
    revalidatePath('/dashboard')
    return { success: true, data: ref.id }
  } catch (error) {
    console.error('createCustomer error:', error)
    return { success: false, error: 'Erreur lors de la création du client' }
  }
}

export async function updateCustomer(
  customerId: string,
  data: Partial<CustomerFormData>,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.CUSTOMERS).doc(customerId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Client introuvable' }
    }

    await ref.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('updateCustomer error:', error)
    return { success: false, error: 'Erreur lors de la modification du client' }
  }
}

export async function deleteCustomer(
  customerId: string,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.CUSTOMERS).doc(customerId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Client introuvable' }
    }

    await ref.delete()

    revalidatePath('/customers')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('deleteCustomer error:', error)
    return { success: false, error: 'Erreur lors de la suppression du client' }
  }
}

export async function getCustomers(companyId: string): Promise<Customer[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.CUSTOMERS)
      .where('companyId', '==', companyId)
      .get()

    const list = snapshot.docs.map((d) =>
      serializeAdminDoc<Customer>(d.id, d.data())
    )

    // Sort in memory (newest first) — avoids needing composite indexes
    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt as unknown as string).getTime() || 0
      const timeB = new Date(b.createdAt as unknown as string).getTime() || 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('getCustomers error:', error)
    return []
  }
}

export async function getCustomerById(
  customerId: string,
  companyId: string
): Promise<Customer | null> {
  try {
    const ref = adminDb.collection(COLLECTIONS.CUSTOMERS).doc(customerId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return null
    }

    return serializeAdminDoc<Customer>(snap.id, snap.data()!)
  } catch (error) {
    console.error('getCustomerById error:', error)
    return null
  }
}
