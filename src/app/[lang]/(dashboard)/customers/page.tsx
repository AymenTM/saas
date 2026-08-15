'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/lib/actions/customers'
import type { Customer, CustomerFormData } from '@/types'
import CustomerForm from '@/components/customers/CustomerForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/lib/utils'
import { Users, Plus, Search, Edit, Trash2, Eye, Phone, Mail, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BottomSheet from '@/components/ui/BottomSheet'
import MobileDataCard from '@/components/ui/MobileDataCard'

export default function CustomersPage() {

  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const { companyId } = useAuth()
  const { can } = usePermissions()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | undefined>()

  const loadData = async () => {
    if (!companyId) {
      setLoading(false)
      return
    }
    try {
      const data = await getCustomers(companyId)
      setCustomers(data)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.nationalId && c.nationalId.toLowerCase().includes(q))
    )
  }, [customers, search])

  const handleCreate = async (data: CustomerFormData) => {
    if (!companyId) return
    const res = await createCustomer(data, companyId)
    if (res.success) {
      toast.success('Client créé avec succès !')
      setIsModalOpen(false)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleUpdate = async (data: CustomerFormData) => {
    if (!companyId || !editingCustomer) return
    const res = await updateCustomer(editingCustomer.id, data, companyId)
    if (res.success) {
      toast.success('Client modifié avec succès !')
      setEditingCustomer(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async () => {
    if (!companyId || !deletingCustomer) return
    const res = await deleteCustomer(deletingCustomer.id, companyId)
    if (res.success) {
      toast.success('Client supprimé')
      setDeletingCustomer(undefined)
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
          <h1 className="page-title">Gestion des clients</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {customers.length} client(s) au total
          </p>
        </div>

        {can.createCustomer && (
          <button
            onClick={() => {
              setEditingCustomer(undefined)
              setIsModalOpen(true)
            }}
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            <Plus size={18} />
            <span>Ajouter un client</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="input-base"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Rechercher par nom, téléphone, CIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List / Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="Aucun client trouvé"
          description={search ? "Aucun client ne correspond à votre recherche." : "Commencez par ajouter votre premier client."}
          icon={<Users size={28} />}
          action={
            can.createCustomer && !search ? (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Ajouter un client
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredCustomers.map((customer) => (
              <MobileDataCard
                key={customer.id}
                title={customer.fullName}
                subtitle={customer.nationalId ? `CIN: ${customer.nationalId}` : undefined}
                fields={[
                  { label: 'Téléphone', value: customer.phone },
                  { label: 'E-mail', value: customer.email || '-' },
                  { label: 'Créé le', value: formatDate(customer.createdAt, 'fr', 'dd/MM/yyyy') },
                ]}
                actions={
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                    <Link
                      href={`/${locale}/customers/${customer.id}`}
                      className="btn btn-ghost"
                      style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem' }}
                    >
                      <Eye size={15} /> Voir
                    </Link>
                    {can.editCustomer && (
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="btn btn-ghost"
                        style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem' }}
                      >
                        <Edit size={15} /> Éditer
                      </button>
                    )}
                    {can.deleteCustomer && (
                      <button
                        onClick={() => setDeletingCustomer(customer)}
                        className="btn btn-ghost"
                        style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                }
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="desktop-only card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Téléphone</th>
                    <th>E-mail</th>
                    <th>N° CIN / ID</th>
                    <th>Créé le</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link href={`/${locale}/customers/${customer.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {customer.fullName}
                        </Link>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          {customer.phone}
                        </div>
                      </td>
                      <td>
                        {customer.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Mail size={13} color="var(--text-muted)" />
                            {customer.email}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>{customer.nationalId || '-'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {formatDate(customer.createdAt, 'fr', 'dd/MM/yyyy')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <Link href={`/${locale}/customers/${customer.id}`} className="btn btn-ghost" style={{ padding: '0.375rem', minHeight: '36px', width: '36px' }} title="Voir le profil">
                            <Eye size={16} />
                          </Link>
                          {can.editCustomer && (
                            <button
                              onClick={() => setEditingCustomer(customer)}
                              className="btn btn-ghost"
                              style={{ padding: '0.375rem', minHeight: '36px', width: '36px' }}
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {can.deleteCustomer && (
                            <button
                              onClick={() => setDeletingCustomer(customer)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Create Customer */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau client"
      >
        <CustomerForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </BottomSheet>

      {/* Modal: Edit Customer */}
      <BottomSheet
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(undefined)}
        title="Modifier le client"
      >
        <CustomerForm initialData={editingCustomer} onSubmit={handleUpdate} onCancel={() => setEditingCustomer(undefined)} />
      </BottomSheet>

      {/* Modal: Delete Confirmation */}
      <BottomSheet
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(undefined)}
        title="Supprimer le client"
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244,63,94,0.12)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Trash2 size={24} />
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Êtes-vous sûr de vouloir supprimer <strong>{deletingCustomer?.fullName}</strong> ? Cette action est irréversible.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => setDeletingCustomer(undefined)} className="btn btn-ghost" style={{ width: '100%' }}>
              Annuler
            </button>
            <button onClick={handleDelete} className="btn btn-danger" style={{ width: '100%' }}>
              Supprimer
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

