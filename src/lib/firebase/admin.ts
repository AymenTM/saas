import 'server-only'
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

// Lazy-loaded Admin app instance
let adminAppInstance: App | null = null

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1)
    }
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  if (!projectId || !clientEmail || !privateKey) {
    // Return null during build / static collection if credentials are missing
    return null
  }

  try {
    adminAppInstance = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
    return adminAppInstance
  } catch (err) {
    console.warn('Firebase Admin SDK initialization skipped:', err)
    return null
  }
}

export function getAdminDb(): Firestore {
  const app = getAdminApp()
  if (!app) {
    // Fallback stub for build time
    return getFirestore()
  }
  return getFirestore(app)
}

export function getAdminAuth(): Auth {
  const app = getAdminApp()
  if (!app) {
    // Fallback stub for build time
    return getAuth()
  }
  return getAuth(app)
}

// Proxies for legacy exports
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    const db = getAdminDb()
    const val = (db as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(db) : val
  },
})

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    const auth = getAdminAuth()
    const val = (auth as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(auth) : val
  },
})
