'use server'

import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/constants'
import type { Company, CompanyFormData, AppUser, UserRole, ActionResult } from '@/types'
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

export async function createCompany(
  data: CompanyFormData
): Promise<ActionResult<string>> {
  try {
    const subEnd = data.subscriptionEndsAt ? Timestamp.fromDate(new Date(data.subscriptionEndsAt)) : null

    const ref = await adminDb.collection(COLLECTIONS.COMPANIES).add({
      name: data.name,
      logoUrl: data.logoUrl || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      plan: data.plan,
      isActive: true,
      subscriptionEndsAt: subEnd,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/admin/companies')
    return { success: true, data: ref.id }
  } catch (error) {
    console.error('createCompany error:', error)
    return { success: false, error: 'Erreur lors de la création de la société' }
  }
}

export async function updateCompany(
  companyId: string,
  data: Partial<CompanyFormData & { isActive: boolean }>
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.COMPANIES).doc(companyId)
    const updates: Record<string, unknown> = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (data.subscriptionEndsAt !== undefined) {
      updates.subscriptionEndsAt = data.subscriptionEndsAt
        ? Timestamp.fromDate(new Date(data.subscriptionEndsAt))
        : null
    }

    await ref.update(updates)

    revalidatePath('/admin/companies')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('updateCompany error:', error)
    return { success: false, error: 'Erreur lors de la modification' }
  }
}

export async function deleteCompany(companyId: string): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.COMPANIES).doc(companyId)
    await ref.delete()

    revalidatePath('/admin/companies')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('deleteCompany error:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.COMPANIES)
      .get()

    const list = snapshot.docs.map((d) =>
      serializeAdminDoc<Company>(d.id, d.data())
    )

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt as unknown as string).getTime() || 0
      const timeB = new Date(b.createdAt as unknown as string).getTime() || 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('getCompanies error:', error)
    return []
  }
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    const ref = adminDb.collection(COLLECTIONS.COMPANIES).doc(companyId)
    const snap = await ref.get()
    if (!snap.exists) return null
    return serializeAdminDoc<Company>(snap.id, snap.data()!)
  } catch (error) {
    console.error('getCompanyById error:', error)
    return null
  }
}

export async function createUser(data: {
  email: string
  password: string
  name: string
  role: UserRole
  companyId: string
}): Promise<ActionResult<string>> {
  try {
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    })

    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      companyId: data.companyId,
      uid: userRecord.uid,
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/admin/users')
    return { success: true, data: userRecord.uid }
  } catch (error: unknown) {
    console.error('createUser error:', error)
    const err = error as { message?: string }
    return { success: false, error: String(err?.message || 'Erreur lors de la création de l\'utilisateur') }
  }
}

export async function updateUser(
  userId: string,
  data: { name?: string; role?: UserRole; isActive?: boolean }
): Promise<ActionResult<void>> {
  try {
    const ref = adminDb.collection(COLLECTIONS.USERS).doc(userId)
    await ref.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Sync Firebase Auth disabled status
    if (data.isActive !== undefined) {
      await adminAuth.updateUser(userId, {
        disabled: !data.isActive,
      })
    }

    revalidatePath('/admin/users')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('updateUser error:', error)
    return { success: false, error: 'Erreur lors de la modification de l\'utilisateur' }
  }
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .get()

    const list = snapshot.docs.map((d) =>
      serializeAdminDoc<AppUser>(d.id, d.data())
    )

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt as unknown as string).getTime() || 0
      const timeB = new Date(b.createdAt as unknown as string).getTime() || 0
      return timeB - timeA
    })
  } catch (error) {
    console.error('getUsers error:', error)
    return []
  }
}
