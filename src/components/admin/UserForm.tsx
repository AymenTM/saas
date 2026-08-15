'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Company, UserRole } from '@/types'
import { USER_ROLES } from '@/lib/constants'

const userSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['super_admin', 'company_admin', 'employee'] as const),
  companyId: z.string().min(1, 'Veuillez sélectionner une société'),
})

export type CreateUserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  companies: Company[]
  onSubmit: (data: CreateUserFormData) => Promise<void>
  onCancel: () => void
}

export default function UserForm({
  companies,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'company_admin',
      companyId: companies[0]?.id || '',
    },
  })

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin (Accès global)',
    company_admin: 'Administrateur Société',
    employee: 'Employé (Lectures & Renouvellements)',
  }

  const handleFormSubmit = async (data: CreateUserFormData) => {
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
          Nom complet *
        </label>
        <input className="input-base" placeholder="Pierre Martin" {...register('name')} />
        {errors.name && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Adresse e-mail *
        </label>
        <input className="input-base" type="email" placeholder="pierre.martin@exemple.com" {...register('email')} />
        {errors.email && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Mot de passe *
        </label>
        <input className="input-base" type="password" placeholder="••••••••" {...register('password')} />
        {errors.password && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Company Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Société *
        </label>
        <select className="input-base" {...register('companyId')}>
          <option value="">-- Sélectionner une société --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.companyId && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errors.companyId.message}
          </p>
        )}
      </div>

      {/* Role */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
          Rôle d&apos;accès *
        </label>
        <select className="input-base" {...register('role')}>
          {Object.values(USER_ROLES).map((r) => (
            <option key={r} value={r}>
              {roleLabels[r as UserRole]}
            </option>
          ))}
        </select>
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

