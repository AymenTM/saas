'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Customer, CustomerFormData } from '@/types'

const customerSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  email: z.string().email('Adresse e-mail invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  nationalId: z.string().optional(),
  notes: z.string().optional(),
})

interface CustomerFormProps {
  initialData?: Customer
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      nationalId: initialData?.nationalId || '',
      notes: initialData?.notes || '',
    },
  })

  const handleFormSubmit = async (data: CustomerFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'grid', gap: '0.875rem' }}>
      {/* Full Name */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Nom complet *
        </label>
        <input className="input-base" placeholder="Jean Dupont" {...register('fullName')} />
        {errors.fullName && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Téléphone *
        </label>
        <input className="input-base" type="tel" placeholder="+33 6 12 34 56 78" {...register('phone')} />
        {errors.phone && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          E-mail (optionnel)
        </label>
        <input className="input-base" type="email" placeholder="jean.dupont@exemple.com" {...register('email')} />
        {errors.email && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* National ID */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          N° CIN / Passeport (optionnel)
        </label>
        <input className="input-base" placeholder="12345678" {...register('nationalId')} />
      </div>

      {/* Address */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Adresse (optionnel)
        </label>
        <input className="input-base" placeholder="12 Rue des Fleurs, Paris" {...register('address')} />
      </div>

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Notes (optionnel)
        </label>
        <textarea
          className="input-base"
          rows={3}
          placeholder="Remarques particulières..."
          {...register('notes')}
          style={{ minHeight: '80px' }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={loading} style={{ width: '100%' }}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {initialData ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

