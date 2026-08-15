'use server'

import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/constants'
import type { Vehicle, VehicleFormData, ActionResult } from '@/types'
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

export async function addVehicle(
  data: VehicleFormData,
  companyId: string
): Promise<ActionResult<string>> {
  try {
    const ref = await adminDb.collection(COLLECTIONS.VEHICLES).add({
      companyId,
      customerId: data.customerId,
      licensePlate: data.licensePlate.toUpperCase().trim(),
      brand: data.brand,
      model: data.model,
      color: data.color,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/vehicles')
    revalidatePath('/customers')
    revalidatePath('/dashboard')
    return { success: true, data: ref.id }
  } catch (error) {
    console.error('addVehicle error:', error)
    return { success: false, error: 'Erreur lors de l\'ajout du véhicule' }
  }
}

export async function updateVehicle(
  vehicleId: string,
  data: Partial<VehicleFormData>,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.VEHICLES).doc(vehicleId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Véhicule introuvable' }
    }

    const updates: Record<string, unknown> = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (data.licensePlate) {
      updates.licensePlate = data.licensePlate.toUpperCase().trim()
    }

    await ref.update(updates)

    revalidatePath('/vehicles')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('updateVehicle error:', error)
    return { success: false, error: 'Erreur lors de la modification du véhicule' }
  }
}

export async function deleteVehicle(
  vehicleId: string,
  companyId: string
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.VEHICLES).doc(vehicleId)
    const snap = await ref.get()

    if (!snap.exists || snap.data()?.companyId !== companyId) {
      return { success: false, error: 'Véhicule introuvable' }
    }

    await ref.delete()

    revalidatePath('/vehicles')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('deleteVehicle error:', error)
    return { success: false, error: 'Erreur lors de la suppression du véhicule' }
  }
}

export async function getVehicles(companyId: string): Promise<Vehicle[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.VEHICLES)
      .where('companyId', '==', companyId)
      .get()

    const list = snapshot.docs.map((d) =>
      serializeAdminDoc<Vehicle>(d.id, d.data())
    )

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt as unknown as string).getTime() || 0
      const timeB = new Date(b.createdAt as unknown as string).getTime() || 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('getVehicles error:', error)
    return []
  }
}

export async function getVehiclesByCustomer(
  customerId: string,
  companyId: string
): Promise<Vehicle[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.VEHICLES)
      .where('companyId', '==', companyId)
      .where('customerId', '==', customerId)
      .get()

    return snapshot.docs.map((d) =>
      serializeAdminDoc<Vehicle>(d.id, d.data())
    )
  } catch (error) {
    console.error('getVehiclesByCustomer error:', error)
    return []
  }
}
