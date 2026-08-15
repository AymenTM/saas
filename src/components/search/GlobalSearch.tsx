'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, User, Car, CreditCard, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getCustomers } from '@/lib/actions/customers'
import { getVehicles } from '@/lib/actions/vehicles'
import { getSubscriptions } from '@/lib/actions/subscriptions'
import type { Customer, Vehicle, SubscriptionWithStatus } from '@/types'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { companyId } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && companyId) {
      setLoading(true)
      Promise.all([
        getCustomers(companyId),
        getVehicles(companyId),
        getSubscriptions(companyId),
      ])
        .then(([c, v, s]) => {
          setCustomers(c)
          setVehicles(v)
          setSubscriptions(s)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, companyId])

  if (!isOpen) return null

  const q = query.trim().toLowerCase()

  const matchedCustomers = q
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    : []

  const matchedVehicles = q
    ? vehicles.filter(
        (v) =>
          v.licensePlate.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      )
    : []

  const matchedSubscriptions = q
    ? subscriptions.filter((s) => s.token.toLowerCase().includes(q))
    : []

  const navigateTo = (path: string) => {
    router.push(`/${locale}${path}`)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '5vh',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <Search size={20} color="var(--brand)" style={{ marginRight: '0.75rem' }} />
          <input
            autoFocus
            type="search"
            placeholder="Rechercher par nom, téléphone, plaque d'immatriculation, token QR..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text-primary)',
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.75rem' }}>
          {loading && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Recherche en cours...
            </div>
          )}

          {!loading && q && (
            <>
              {matchedCustomers.length === 0 &&
                matchedVehicles.length === 0 &&
                matchedSubscriptions.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun résultat trouvé pour &quot;{query}&quot;
                  </div>
                )}

              {/* Customers section */}
              {matchedCustomers.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', paddingLeft: '0.5rem' }}>
                    Clients
                  </div>
                  {matchedCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigateTo(`/customers/${c.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                    >
                      <User size={16} color="var(--brand)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Vehicles section */}
              {matchedVehicles.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', paddingLeft: '0.5rem' }}>
                    Véhicules
                  </div>
                  {matchedVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => navigateTo(`/vehicles`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                    >
                      <Car size={16} color="var(--info)" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--brand)' }}>{v.licensePlate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.brand} {v.model}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Subscriptions section */}
              {matchedSubscriptions.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', paddingLeft: '0.5rem' }}>
                    Abonnements
                  </div>
                  {matchedSubscriptions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigateTo(`/subscriptions/${s.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                    >
                      <CreditCard size={16} color="var(--success)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace' }}>Réf: {s.token.slice(0, 12)}...</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Statut: {s.status}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {!q && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Tapez au moins 1 caractère pour lancer la recherche globale.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
