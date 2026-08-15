'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { Customer, Vehicle, SubscriptionFormData } from '@/types'
import { DURATION_OPTIONS } from '@/lib/constants'

const subscriptionSchema = z.object({
  customerId: z.string().min(1, 'Veuillez sélectionner un client'),
  vehicleId: z.string().min(1, 'Veuillez sélectionner un véhicule'),
  startDate: z.string().min(1, 'Date de début requise'),
  durationMonths: z.coerce.number().min(1, 'Durée invalide'),
  price: z.coerce.number().min(0, 'Prix invalide'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other'] as const),
})

interface SubscriptionFormProps {
  customers: Customer[]
  vehicles: Vehicle[]
  onSubmit: (data: SubscriptionFormData) => Promise<void>
  onCancel: () => void
}

export default function SubscriptionForm({
  customers,
  vehicles,
  onSubmit,
  onCancel,
}: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

  const today = new Date().toISOString().split('T')[0]!

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      customerId: '',
      vehicleId: '',
      startDate: today,
      durationMonths: 1,
      price: 1000,
      paymentMethod: 'cash',
    },
  })

  // Filter vehicles when customer changes
  const filteredVehicles = vehicles.filter(
    (v) => v.customerId === selectedCustomerId
  )

  useEffect(() => {
    // Reset vehicle when customer changes
    setValue('vehicleId', '')
  }, [selectedCustomerId, setValue])

  const handleFormSubmit = async (data: SubscriptionFormData) => {
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
          Client *
        </label>
        <select
          className="input-base"
          {...register('customerId')}
          onChange={(e) => {
            setSelectedCustomerId(e.target.value)
            register('customerId').onChange(e)
          }}
        >
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

      {/* Vehicle Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Véhicule *
        </label>
        <select
          className="input-base"
          {...register('vehicleId')}
          disabled={!selectedCustomerId || filteredVehicles.length === 0}
        >
          <option value="">
            {!selectedCustomerId
              ? '-- Sélectionnez d\'abord un client --'
              : filteredVehicles.length === 0
              ? '-- Aucun véhicule enregistré pour ce client --'
              : '-- Sélectionner un véhicule --'}
          </option>
          {filteredVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.licensePlate} ({v.brand} {v.model})
            </option>
          ))}
        </select>
        {errors.vehicleId && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.vehicleId.message}
          </p>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Date de début *
        </label>
        <input type="date" className="input-base" {...register('startDate')} />
        {errors.startDate && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.startDate.message}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Duration */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Durée (mois) *
          </label>
          <select className="input-base" {...register('durationMonths')}>
            {DURATION_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} {m > 1 ? 'mois' : 'mois'}
              </option>
            ))}
          </select>
          {errors.durationMonths && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.durationMonths.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Prix (DA) *
          </label>
          <input type="number" step="0.01" className="input-base" placeholder="1000.00" {...register('price')} />
          {errors.price && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.price.message}
            </p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Moyen de paiement *
        </label>
        <select className="input-base" {...register('paymentMethod')}>
          <option value="cash">Espèces</option>
          <option value="card">Carte bancaire</option>
          <option value="transfer">Virement</option>
          <option value="other">Autre</option>
        </select>
        {errors.paymentMethod && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.paymentMethod.message}
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
          Créer
        </button>
      </div>
    </form>
  )
}

