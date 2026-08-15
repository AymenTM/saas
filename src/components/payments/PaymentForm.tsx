'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { PaymentFormData, SubscriptionWithStatus, PaymentMethod } from '@/types'
import { PAYMENT_METHODS } from '@/lib/constants'

const paymentSchema = z.object({
  subscriptionId: z.string().min(1, 'Veuillez sélectionner un abonnement'),
  amount: z.coerce.number().min(0.01, 'Le montant doit être supérieur à 0'),
  paymentDate: z.string().min(1, 'Date de paiement requise'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().optional(),
})

interface PaymentFormProps {
  subscriptions: SubscriptionWithStatus[]
  onSubmit: (data: PaymentFormData) => Promise<void>
  onCancel: () => void
}

export default function PaymentForm({
  subscriptions,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]!

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      subscriptionId: '',
      amount: 0,
      paymentDate: today,
      paymentMethod: 'cash',
      notes: '',
    },
  })

  const methodLabels: Record<PaymentMethod, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    transfer: 'Virement bancaire',
    other: 'Autre',
  }

  const handleSubscriptionChange = (subscriptionId: string) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId)
    if (sub) {
      setValue('amount', sub.price)
    }
  }

  const handleFormSubmit = async (data: PaymentFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'grid', gap: '0.875rem' }}>
      {/* Subscription Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Abonnement *
        </label>
        <select
          className="input-base"
          {...register('subscriptionId')}
          onChange={(e) => {
            handleSubscriptionChange(e.target.value)
            register('subscriptionId').onChange(e)
          }}
        >
          <option value="">-- Sélectionner un abonnement --</option>
          {subscriptions.map((s) => (
            <option key={s.id} value={s.id}>
              Réf : {s.token.slice(0, 8)}... ({s.price} €)
            </option>
          ))}
        </select>
        {errors.subscriptionId && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.subscriptionId.message}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Amount */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Montant (€) *
          </label>
          <input type="number" step="0.01" className="input-base" placeholder="50.00" {...register('amount')} />
          {errors.amount && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.amount.message}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Date de paiement *
          </label>
          <input type="date" className="input-base" {...register('paymentDate')} />
          {errors.paymentDate && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.paymentDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Mode de paiement *
        </label>
        <select className="input-base" {...register('paymentMethod')}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {methodLabels[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Notes (optionnel)
        </label>
        <input className="input-base" placeholder="N° de reçu, référence..." {...register('notes')} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={loading} style={{ width: '100%' }}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Enregistrer
        </button>
      </div>
    </form>
  )
}

