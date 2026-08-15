'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Vehicle, VehicleFormData, Customer } from '@/types'

const vehicleSchema = z.object({
  customerId: z.string().min(1, 'Veuillez sélectionner un client'),
  licensePlate: z.string().min(2, 'Plaque d\'immatriculation requise'),
  brand: z.string().min(1, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  color: z.string().min(1, 'Couleur requise'),
})

interface VehicleFormProps {
  initialData?: Vehicle
  customers: Customer[]
  preselectedCustomerId?: string
  onSubmit: (data: VehicleFormData) => Promise<void>
  onCancel: () => void
}

export default function VehicleForm({
  initialData,
  customers,
  preselectedCustomerId,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      customerId: initialData?.customerId || preselectedCustomerId || '',
      licensePlate: initialData?.licensePlate || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      color: initialData?.color || '',
    },
  })

  const handleFormSubmit = async (data: VehicleFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'grid', gap: '0.875rem' }}>
      {/* Customer Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Client propriétaire *
        </label>
        <select className="input-base" {...register('customerId')} disabled={!!preselectedCustomerId}>
          <option value="">-- Sélectionner un client --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} ({c.phone})
            </option>
          ))}
        </select>
        {errors.customerId && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.customerId.message}
          </p>
        )}
      </div>

      {/* License Plate */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Plaque d&apos;immatriculation *
        </label>
        <input className="input-base" placeholder="AA-123-BB" style={{ textTransform: 'uppercase' }} {...register('licensePlate')} />
        {errors.licensePlate && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.licensePlate.message}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Brand */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Marque *
          </label>
          <input className="input-base" placeholder="Peugeot" {...register('brand')} />
          {errors.brand && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.brand.message}
            </p>
          )}
        </div>

        {/* Model */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Modèle *
          </label>
          <input className="input-base" placeholder="208" {...register('model')} />
          {errors.model && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.model.message}
            </p>
          )}
        </div>
      </div>

      {/* Color */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Couleur *
        </label>
        <input className="input-base" placeholder="Gris métallisé" {...register('color')} />
        {errors.color && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.color.message}
          </p>
        )}
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

