'use client'

import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/actions/admin'
import type { Company, CompanyFormData } from '@/types'
import CompanyForm from '@/components/admin/CompanyForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { formatDate } from '@/lib/utils'
import { Building2, Plus, Edit, Trash2, Power, X, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import BottomSheet from '@/components/ui/BottomSheet'
import MobileDataCard from '@/components/ui/MobileDataCard'

export default function CompaniesAdminPage() {

  const { isSuperAdmin } = usePermissions()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | undefined>()
  const [deletingCompany, setDeletingCompany] = useState<Company | undefined>()

  const loadData = async () => {
    try {
      const data = await getCompanies()
      setCompanies(data)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement des sociétés')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      loadData()
    }
  }, [isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <div className="card" style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Accès non autorisé</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Seuls les Super Administrateurs peuvent accéder à cette section.</p>
      </div>
    )
  }

  const handleCreate = async (data: CompanyFormData) => {
    const res = await createCompany(data)
    if (res.success) {
      toast.success('Société créée avec succès !')
      setIsCreateOpen(false)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleUpdate = async (data: CompanyFormData) => {
    if (!editingCompany) return
    const res = await updateCompany(editingCompany.id, data)
    if (res.success) {
      toast.success('Société modifiée !')
      setEditingCompany(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const toggleStatus = async (company: Company) => {
    const res = await updateCompany(company.id, { isActive: !company.isActive })
    if (res.success) {
      toast.success(`Société ${!company.isActive ? 'activée' : 'désactivée'}`)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async () => {
    if (!deletingCompany) return
    const res = await deleteCompany(deletingCompany.id)
    if (res.success) {
      toast.success('Société supprimée')
      setDeletingCompany(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 className="page-title">Gestion des sociétés</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Super Admin Panel — {companies.length} société(s) inscrite(s)
          </p>
        </div>

        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus size={18} /> <span>Ajouter une société</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : companies.length === 0 ? (
        <EmptyState
          title="Aucune société enregistrée"
          description="Créer la première société pour démarrer la gestion multi-tenant."
          icon={<Building2 size={28} />}
          action={
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={18} /> Ajouter une société
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {companies.map((comp) => (
              <MobileDataCard
                key={comp.id}
                title={comp.name}
                subtitle={`Plan: ${comp.plan}`}
                badge={
                  <span className={`badge ${comp.isActive ? 'badge-active' : 'badge-cancelled'}`}>
                    {comp.isActive ? 'Actif' : 'Inactif'}
                  </span>
                }
                fields={[
                  { label: 'Contact', value: comp.email || comp.phone || '-' },
                  { label: 'Créé le', value: formatDate(comp.createdAt, 'fr', 'dd/MM/yyyy') },
                ]}
                actions={
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
                    <button
                      onClick={() => toggleStatus(comp)}
                      className="btn btn-ghost"
                      style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem', color: comp.isActive ? 'var(--warning)' : 'var(--success)' }}
                    >
                      <Power size={15} /> {comp.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => setEditingCompany(comp)}
                      className="btn btn-ghost"
                      style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem' }}
                    >
                      <Edit size={15} /> Éditer
                    </button>
                    <button
                      onClick={() => setDeletingCompany(comp)}
                      className="btn btn-ghost"
                      style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem', color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
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
                    <th>Société</th>
                    <th>Offre SaaS</th>
                    <th>Email / Tél</th>
                    <th>Statut</th>
                    <th>Expiration SaaS</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((comp) => {
                    const isSubExpired = comp.subscriptionEndsAt
                      ? new Date(comp.subscriptionEndsAt as any) < new Date()
                      : false
                    const displayStatus = !comp.isActive
                      ? 'Inactif'
                      : isSubExpired
                      ? 'Abonnement expiré'
                      : 'Actif'
                    const badgeClass = !comp.isActive
                      ? 'badge-cancelled'
                      : isSubExpired
                      ? 'badge-expired'
                      : 'badge-active'

                    return (
                      <tr key={comp.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {comp.name}
                        </td>
                        <td>
                          <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>
                            {comp.plan}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {comp.email || comp.phone || '-'}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {comp.subscriptionEndsAt ? formatDate(comp.subscriptionEndsAt, 'fr', 'dd/MM/yyyy') : 'Illimité'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => toggleStatus(comp)}
                            className="btn btn-ghost"
                            style={{ padding: '0.375rem', minHeight: '36px', width: '36px', color: comp.isActive ? 'var(--warning)' : 'var(--success)' }}
                            title={comp.isActive ? 'Désactiver' : 'Activer'}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => setEditingCompany(comp)}
                            className="btn btn-ghost"
                            style={{ padding: '0.375rem', minHeight: '36px', width: '36px' }}
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingCompany(comp)}
                            className="btn btn-ghost"
                            style={{ padding: '0.375rem', minHeight: '36px', width: '36px', color: 'var(--danger)' }}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Modal: Create Company */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle société"
      >
        <CompanyForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
      </BottomSheet>

      {/* Modal: Edit Company */}
      <BottomSheet
        isOpen={!!editingCompany}
        onClose={() => setEditingCompany(undefined)}
        title="Modifier la société"
      >
        <CompanyForm initialData={editingCompany} onSubmit={handleUpdate} onCancel={() => setEditingCompany(undefined)} />
      </BottomSheet>

      {/* Modal: Delete Confirmation */}
      <BottomSheet
        isOpen={!!deletingCompany}
        onClose={() => setDeletingCompany(undefined)}
        title="Supprimer la société"
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244,63,94,0.12)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Trash2 size={24} />
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Êtes-vous sûr de vouloir supprimer <strong>{deletingCompany?.name}</strong> ?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => setDeletingCompany(undefined)} className="btn btn-ghost" style={{ width: '100%' }}>Annuler</button>
            <button onClick={handleDelete} className="btn btn-danger" style={{ width: '100%' }}>Supprimer</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

