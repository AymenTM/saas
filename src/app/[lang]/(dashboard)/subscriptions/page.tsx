'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getSubscriptions,
  createSubscription,
  renewSubscription,
  cancelSubscription,
  deleteSubscription,
} from '@/lib/actions/subscriptions'
import { getCustomers } from '@/lib/actions/customers'
import { getVehicles } from '@/lib/actions/vehicles'
import { getCompanyById } from '@/lib/actions/admin'
import type {
  SubscriptionWithStatus,
  Customer,
  Vehicle,
  SubscriptionFormData,
  Company,
} from '@/types'
import SubscriptionForm from '@/components/subscriptions/SubscriptionForm'
import PDFDownloadButton from '@/components/pdf/PDFDownloadButton'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate, formatCurrency, statusColor } from '@/lib/utils'
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Ban,
  Trash2,
  X,
  Eye,
  QrCode,
  FileDown,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BottomSheet from '@/components/ui/BottomSheet'
import MobileDataCard from '@/components/ui/MobileDataCard'

export default function SubscriptionsPage() {

  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const { companyId } = useAuth()
  const { can } = usePermissions()
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [renewingSub, setRenewingSub] = useState<SubscriptionWithStatus | undefined>()
  const [renewDuration, setRenewDuration] = useState(1)
  const [renewPrice, setRenewPrice] = useState(1000)
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash')
  const [cancellingSub, setCancellingSub] = useState<SubscriptionWithStatus | undefined>()
  const [deletingSub, setDeletingSub] = useState<SubscriptionWithStatus | undefined>()

  const loadData = async () => {
    if (!companyId) {
      setLoading(false)
      return
    }
    try {
      const [subs, custs, vehs, comp] = await Promise.all([
        getSubscriptions(companyId),
        getCustomers(companyId),
        getVehicles(companyId),
        getCompanyById(companyId),
      ])
      setSubscriptions(subs)
      setCustomers(custs)
      setVehicles(vehs)
      setCompany(comp)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement des abonnements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false

      // Search filter
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const customer = customers.find((c) => c.id === sub.customerId)
      const vehicle = vehicles.find((v) => v.id === sub.vehicleId)

      return (
        sub.token.toLowerCase().includes(q) ||
        (customer && customer.fullName.toLowerCase().includes(q)) ||
        (customer && customer.phone.toLowerCase().includes(q)) ||
        (vehicle && vehicle.licensePlate.toLowerCase().includes(q))
      )
    })
  }, [subscriptions, statusFilter, search, customers, vehicles])

  const handleCreate = async (data: SubscriptionFormData) => {
    if (!companyId) return
    const res = await createSubscription(data, companyId)
    if (res.success) {
      toast.success('Abonnement créé avec succès !')
      setIsCreateOpen(false)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleRenew = async () => {
    if (!companyId || !renewingSub) return
    const res = await renewSubscription(renewingSub.id, companyId, renewDuration, renewPrice, renewPaymentMethod)
    if (res.success) {
      toast.success('Abonnement renouvelé !')
      setRenewingSub(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleCancel = async () => {
    if (!companyId || !cancellingSub) return
    const res = await cancelSubscription(cancellingSub.id, companyId)
    if (res.success) {
      toast.success('Abonnement annulé')
      setCancellingSub(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async () => {
    if (!companyId || !deletingSub) return
    const res = await deleteSubscription(deletingSub.id, companyId)
    if (res.success) {
      toast.success('Abonnement supprimé')
      setDeletingSub(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 className="page-title">Gestion des abonnements</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {subscriptions.length} abonnement(s) enregistré(s)
          </p>
        </div>

        {can.createSubscription && (
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ width: 'auto' }}>
            <Plus size={18} />
            <span>Nouvel abonnement</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', overflowX: 'auto', maxWidth: '100%' }}>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'active', label: 'Actifs' },
              { id: 'expired', label: 'Expirés' },
              { id: 'cancelled', label: 'Annulés' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  background: statusFilter === tab.id ? 'var(--bg-card)' : 'transparent',
                  color: statusFilter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="search"
              className="input-base"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Rechercher (Nom, Plaque, Réf)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredSubscriptions.length === 0 ? (
        <EmptyState
          title="Aucun abonnement trouvé"
          description={search ? "Aucun résultat pour votre recherche." : "Créez votre premier abonnement de stationnement."}
          icon={<CreditCard size={28} />}
          action={
            can.createSubscription && !search ? (
              <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Nouvel abonnement
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredSubscriptions.map((sub) => {
              const customer = customers.find((c) => c.id === sub.customerId)
              const vehicle = vehicles.find((v) => v.id === sub.vehicleId)

              const pdfData = {
                companyName: company?.name || 'ParkSub',
                customerName: customer?.fullName || 'N/A',
                customerPhone: customer?.phone || 'N/A',
                licensePlate: vehicle?.licensePlate || 'N/A',
                brand: vehicle?.brand || '',
                model: vehicle?.model || '',
                startDate: sub.startDate,
                endDate: sub.endDate,
                price: sub.price,
                status: sub.status,
                token: sub.token,
              }

              return (
                <MobileDataCard
                  key={sub.id}
                  title={customer?.fullName || 'N/A'}
                  subtitle={`Réf: ${sub.token.slice(0, 8)}...`}
                  badge={
                    <span className={`badge ${statusColor(sub.status)}`}>
                      {sub.status === 'active' ? 'Actif' : sub.status === 'expired' ? 'Expiré' : 'Annulé'}
                    </span>
                  }
                  fields={[
                    { label: 'Véhicule', value: vehicle ? `${vehicle.licensePlate} (${vehicle.brand})` : 'N/A' },
                    { label: 'Tarif', value: formatCurrency(sub.price) },
                    { label: 'Période', value: `${formatDate(sub.startDate, 'fr', 'dd/MM/yy')} → ${formatDate(sub.endDate, 'fr', 'dd/MM/yy')}` },
                  ]}
                  actions={
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                      <PDFDownloadButton data={pdfData} label="" className="btn btn-ghost btn-icon" />

                      <Link href={`/${locale}/subscriptions/${sub.id}`} className="btn btn-ghost btn-icon" title="Voir QR Code">
                        <QrCode size={16} />
                      </Link>

                      <button
                        onClick={() => {
                          setRenewingSub(sub)
                          setRenewPrice(sub.price)
                        }}
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--success)' }}
                        title="Renouveler"
                      >
                        <RefreshCw size={16} />
                      </button>

                      {can.cancelSubscription && sub.status === 'active' && (
                        <button
                          onClick={() => setCancellingSub(sub)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--warning)' }}
                          title="Annuler"
                        >
                          <Ban size={16} />
                        </button>
                      )}

                      {can.deleteSubscription && (
                        <button
                          onClick={() => setDeletingSub(sub)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--danger)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  }
                />
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="desktop-only card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Véhicule</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => {
                    const customer = customers.find((c) => c.id === sub.customerId)
                    const vehicle = vehicles.find((v) => v.id === sub.vehicleId)

                    const pdfData = {
                      companyName: company?.name || 'ParkSub',
                      customerName: customer?.fullName || 'N/A',
                      customerPhone: customer?.phone || 'N/A',
                      licensePlate: vehicle?.licensePlate || 'N/A',
                      brand: vehicle?.brand || '',
                      model: vehicle?.model || '',
                      startDate: sub.startDate,
                      endDate: sub.endDate,
                      price: sub.price,
                      status: sub.status,
                      token: sub.token,
                    }

                    return (
                      <tr key={sub.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand)' }}>
                          <Link href={`/${locale}/subscriptions/${sub.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {sub.token.slice(0, 8)}...
                          </Link>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {customer?.fullName || 'N/A'}
                        </td>
                        <td>
                          {vehicle ? (
                            <span>
                              <strong style={{ color: 'var(--brand)' }}>{vehicle.licensePlate}</strong> ({vehicle.brand})
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{formatDate(sub.startDate, 'fr', 'dd/MM/yyyy')}</td>
                        <td style={{ fontSize: '0.8125rem', fontWeight: sub.status === 'expired' ? 700 : 400, color: sub.status === 'expired' ? 'var(--danger)' : 'inherit' }}>
                          {formatDate(sub.endDate, 'fr', 'dd/MM/yyyy')}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(sub.price)}</td>
                        <td>
                          <span className={`badge ${statusColor(sub.status)}`}>
                            {sub.status === 'active' ? 'Actif' : sub.status === 'expired' ? 'Expiré' : 'Annulé'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                            <PDFDownloadButton data={pdfData} label="" className="btn btn-ghost" />

                            <Link href={`/${locale}/subscriptions/${sub.id}`} className="btn btn-ghost" style={{ padding: '0.375rem', minHeight: '36px', width: '36px' }} title="Voir le QR Code">
                              <QrCode size={16} />
                            </Link>

                            <button
                              onClick={() => {
                                setRenewingSub(sub)
                                setRenewPrice(sub.price)
                              }}
                              className="btn btn-ghost"
                              style={{ padding: '0.375rem', minHeight: '36px', width: '36px', color: 'var(--success)' }}
                              title="Renouveler"
                            >
                              <RefreshCw size={16} />
                            </button>

                            {can.cancelSubscription && sub.status === 'active' && (
                              <button
                                onClick={() => setCancellingSub(sub)}
                                className="btn btn-ghost"
                                style={{ padding: '0.375rem', minHeight: '36px', width: '36px', color: 'var(--warning)' }}
                                title="Annuler"
                              >
                                <Ban size={16} />
                              </button>
                            )}

                            {can.deleteSubscription && (
                              <button
                                onClick={() => setDeletingSub(sub)}
                                className="btn btn-ghost"
                                style={{ padding: '0.375rem', minHeight: '36px', width: '36px', color: 'var(--danger)' }}
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Create Subscription */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvel abonnement"
      >
        <SubscriptionForm customers={customers} vehicles={vehicles} onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
      </BottomSheet>

      {/* Modal: Renew Subscription */}
      <BottomSheet
        isOpen={!!renewingSub}
        onClose={() => setRenewingSub(undefined)}
        title="Renouveler l'abonnement"
      >
        <div style={{ display: 'grid', gap: '1rem', padding: '0.25rem 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Durée de prolongation</label>
            <select className="input-base" value={renewDuration} onChange={(e) => setRenewDuration(Number(e.target.value))}>
              <option value={1}>1 mois</option>
              <option value={2}>2 mois</option>
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Nouveau tarif (DA)</label>
            <input type="number" step="0.01" className="input-base" value={renewPrice} onChange={(e) => setRenewPrice(Number(e.target.value))} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Moyen de paiement</label>
            <select className="input-base" value={renewPaymentMethod} onChange={(e) => setRenewPaymentMethod(e.target.value as any)}>
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="transfer">Virement</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={() => setRenewingSub(undefined)} className="btn btn-ghost" style={{ width: '100%' }}>Annuler</button>
            <button onClick={handleRenew} className="btn btn-primary" style={{ width: '100%' }}>Confirmer</button>
          </div>
        </div>
      </BottomSheet>

      {/* Modal: Cancel Confirmation */}
      <BottomSheet
        isOpen={!!cancellingSub}
        onClose={() => setCancellingSub(undefined)}
        title="Annuler l'abonnement"
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Ban size={24} />
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            L&apos;abonnement basculera au statut &quot;Annulé&quot;. Voulez-vous continuer ?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => setCancellingSub(undefined)} className="btn btn-ghost" style={{ width: '100%' }}>Conserver</button>
            <button onClick={handleCancel} className="btn btn-primary" style={{ width: '100%', background: 'var(--warning)', borderColor: 'var(--warning)' }}>Annuler l&apos;abonnement</button>
          </div>
        </div>
      </BottomSheet>

      {/* Modal: Delete Confirmation */}
      <BottomSheet
        isOpen={!!deletingSub}
        onClose={() => setDeletingSub(undefined)}
        title="Supprimer l'abonnement"
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244,63,94,0.12)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Trash2 size={24} />
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Cette action est irréversible. Voulez-vous vraiment supprimer cet abonnement ?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => setDeletingSub(undefined)} className="btn btn-ghost" style={{ width: '100%' }}>Annuler</button>
            <button onClick={handleDelete} className="btn btn-danger" style={{ width: '100%' }}>Supprimer</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

