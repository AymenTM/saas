import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | ParkSub',
    default: 'ParkSub — Parking Subscription Management',
  },
  description: 'Modern SaaS for managing parking subscriptions, customers, and vehicles.',
  keywords: ['parking', 'subscription', 'management', 'saas', 'stationnement'],
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'fr' }]
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {

  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </AuthProvider>
  )
}
