'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Company, CompanyFormData, CompanyPlan } from '@/types'
import { COMPANY_PLANS } from '@/lib/constants'

const companySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  logoUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Adresse e-mail invalide').optional().or(z.literal('')),
  plan: z.enum(COMPANY_PLANS),
  subscriptionEndsAt: z.string().optional(),
})

interface CompanyFormProps {
  initialData?: Company
  onSubmit: (data: CompanyFormData) => Promise<void>
  onCancel: () => void
}

export default function CompanyForm({
  initialData,
  onSubmit,
  onCancel,
}: CompanyFormProps) {
  const [loading, setLoading] = useState(false)

  const initialSubEnd = initialData?.subscriptionEndsAt
    ? typeof initialData.subscriptionEndsAt === 'string'
      ? initialData.subscriptionEndsAt.split('T')[0]
      : new Date(initialData.subscriptionEndsAt as any).toISOString().split('T')[0]
    : ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || '',
      logoUrl: initialData?.logoUrl || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      plan: initialData?.plan || 'starter',
      subscriptionEndsAt: initialSubEnd,
    },
  })

  const planLabels: Record<CompanyPlan, string> = {
    starter: 'Starter (Debutant)',
    professional: 'Professionnel',
    enterprise: 'Entreprise',
  }

  const handleFormSubmit = async (data: CompanyFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'grid', gap: '0.875rem' }}>
      {/* Name */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Nom de la société *
        </label>
        <input className="input-base" placeholder="Parking Express SARL" {...register('name')} />
        {errors.name && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Subscription Plan */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Offre d&apos;abonnement SaaS *
          </label>
          <select className="input-base" {...register('plan')}>
            {COMPANY_PLANS.map((p) => (
              <option key={p} value={p}>
                {planLabels[p]}
              </option>
            ))}
          </select>
        </div>

        {/* Expiration date */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Expiration de l&apos;abonnement
          </label>
          <input type="date" className="input-base" {...register('subscriptionEndsAt')} />
        </div>
      </div>

      {/* Logo URL */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          URL du logo (optionnel)
        </label>
        <input className="input-base" type="url" placeholder="https://exemple.com/logo.png" {...register('logoUrl')} />
        {errors.logoUrl && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.logoUrl.message}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            E-mail
          </label>
          <input className="input-base" type="email" placeholder="contact@parkingexpress.fr" {...register('email')} />
        </div>

        {/* Phone */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Téléphone
          </label>
          <input className="input-base" type="tel" placeholder="+33 1 23 45 67 89" {...register('phone')} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Adresse
        </label>
        <input className="input-base" placeholder="100 Avenue de la République, Lyon" {...register('address')} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={loading} style={{ width: '100%' }}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {initialData ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

