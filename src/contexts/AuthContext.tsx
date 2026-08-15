'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import type { AppUser, UserRole } from '@/types'
import { COLLECTIONS } from '@/lib/constants'

interface AuthContextValue {
  user: User | null
  userProfile: AppUser | null
  role: UserRole | null
  companyId: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  sendReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const ref = doc(db, COLLECTIONS.USERS, uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setUserProfile({ id: snap.id, ...snap.data() } as AppUser)
      } else {
        setUserProfile(null)
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err)
      setUserProfile(null)
    }
  }, [])

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason ?? '')
      const name = reason instanceof Error ? reason.name : ''

      if (
        name === 'AbortError' ||
        message.includes('AbortError') ||
        message.includes('user aborted a request') ||
        message.includes('Database is closing/hidden') ||
        message.includes('closing/hidden')
      ) {
        event.preventDefault()
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation()
        }
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })
      unsubscribe()
    }
  }, [fetchProfile])

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const ref = doc(db, COLLECTIONS.USERS, cred.user.uid)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      const profile = snap.data() as AppUser
      if (profile.isActive === false) {
        await signOut(auth)
        throw new Error('Votre compte est désactivé. Veuillez contacter l\'administrateur.')
      }

      // Check if user's company is active and subscription is valid (for non super-admins)
      if (profile.role !== 'super_admin' && profile.companyId) {
        const companyRef = doc(db, COLLECTIONS.COMPANIES, profile.companyId)
        const companySnap = await getDoc(companyRef)
        if (companySnap.exists()) {
          const compData = companySnap.data()
          if (compData.isActive === false) {
            await signOut(auth)
            throw new Error('Votre société est désactivée. Veuillez contacter l\'administrateur.')
          }

          if (compData.subscriptionEndsAt) {
            const subEnd = 'toDate' in compData.subscriptionEndsAt
              ? compData.subscriptionEndsAt.toDate()
              : new Date(compData.subscriptionEndsAt)
            if (subEnd < new Date()) {
              await signOut(auth)
              throw new Error('L\'abonnement SaaS de votre société a expiré. Veuillez contacter l\'administrateur.')
            }
          }
        }
      }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUserProfile(null)
  }

  const sendReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const value: AuthContextValue = {
    user,
    userProfile,
    role: userProfile?.role ?? null,
    companyId: userProfile?.companyId ?? null,
    loading,
    login,
    logout,
    sendReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
