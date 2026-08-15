'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPayments, createPayment } from '@/lib/actions/payments'
import { getSubscriptions } from '@/lib/actions/subscriptions'
import type { Payment, PaymentFormData, SubscriptionWithStatus } from '@/types'
import PaymentForm from '@/components/payments/PaymentForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Banknote, Plus, Search, Calendar, CreditCard, X, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import BottomSheet from '@/components/ui/BottomSheet'
import MobileDataCard from '@/components/ui/MobileDataCard'

export default function PaymentsPage() {

  const { companyId } = useAuth()
  const { can } = usePermissions()
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    if (!companyId) return
    try {
      const [pays, subs] = await Promise.all([
        getPayments(companyId),
        getSubscriptions(companyId),
      ])
      setPayments(pays)
      setSubscriptions(subs)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  )

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments
    const q = search.toLowerCase()
    return payments.filter(
      (p) =>
        p.paymentMethod.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.amount.toString().includes(q)
    )
  }, [payments, search])

  const handleCreate = async (data: PaymentFormData) => {
    if (!companyId) return
    const res = await createPayment(data, companyId)
    if (res.success) {
      toast.success('Paiement enregistré avec succès !')
      setIsModalOpen(false)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    transfer: 'Virement bancaire',
    other: 'Autre',
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 className="page-title">Gestion des paiements</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Historique des encaissements et suivi des revenus
          </p>
        </div>

        {can.createPayment && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: 'auto' }}>
            <Plus size={18} />
            <span>Enregistrer un paiement</span>
          </button>
        )}
      </div>

      {/* Revenue Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total encaissé</span>
            <Banknote size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Transactions</span>
            <TrendingUp size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {payments.length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="input-base"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Rechercher (Méthode, Montant, Notes)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="Aucun paiement enregistré"
          description={search ? "Aucun résultat trouvé." : "Enregistrez les encaissements d'abonnements ici."}
          icon={<Banknote size={28} />}
          action={
            can.createPayment && !search ? (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Enregistrer un paiement
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredPayments.map((payment) => {
              const sub = subscriptions.find((s) => s.id === payment.subscriptionId)

              return (
                <MobileDataCard
                  key={payment.id}
                  title={formatCurrency(payment.amount)}
                  subtitle={formatDate(payment.paymentDate, 'fr', 'dd/MM/yyyy')}
                  badge={
                    <span className="badge badge-active">
                      {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                    </span>
                  }
                  fields={[
                    { label: 'Abonnement', value: sub ? `Réf: ${sub.token.slice(0, 8)}...` : '-' },
                    { label: 'Notes', value: payment.notes || '-' },
                  ]}
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
                    <th>Date de paiement</th>
                    <th>Montant</th>
                    <th>Mode de règlement</th>
                    <th>Abonnement associé</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const sub = subscriptions.find((s) => s.id === payment.subscriptionId)

                    return (
                      <tr key={payment.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            {formatDate(payment.paymentDate, 'fr', 'dd/MM/yyyy')}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '1rem', color: '#10b981' }}>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td>
                          <span className="badge badge-active">
                            {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>
                          {sub ? `Réf: ${sub.token.slice(0, 8)}...` : '-'}
                        </td>
                        <td>{payment.notes || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Record Payment */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer un paiement"
      >
        <PaymentForm subscriptions={subscriptions} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </BottomSheet>
    </div>
  )
}

