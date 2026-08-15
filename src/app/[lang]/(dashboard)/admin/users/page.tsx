'use client'

import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { getUsers, getCompanies, createUser, updateUser } from '@/lib/actions/admin'
import type { AppUser, Company } from '@/types'
import UserForm, { type CreateUserFormData } from '@/components/admin/UserForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { formatDate } from '@/lib/utils'
import { Users, Plus, ShieldAlert, X, Power } from 'lucide-react'
import { toast } from 'sonner'
import BottomSheet from '@/components/ui/BottomSheet'
import MobileDataCard from '@/components/ui/MobileDataCard'

export default function UsersAdminPage() {

  const { isSuperAdmin } = usePermissions()
  const [users, setUsers] = useState<AppUser[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const loadData = async () => {
    try {
      const [uList, cList] = await Promise.all([getUsers(), getCompanies()])
      setUsers(uList)
      setCompanies(cList)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement des utilisateurs')
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Seuls les Super Administrateurs peuvent gérer les utilisateurs.</p>
      </div>
    )
  }

  const handleCreate = async (data: CreateUserFormData) => {
    const res = await createUser(data)
    if (res.success) {
      toast.success('Utilisateur créé avec succès !')
      setIsCreateOpen(false)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const toggleUserStatus = async (user: AppUser) => {
    const res = await updateUser(user.id, { isActive: !user.isActive })
    if (res.success) {
      toast.success(`Compte ${!user.isActive ? 'activé' : 'désactivé'}`)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const roleBadges: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Administrateur',
    employee: 'Employé',
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Super Admin Panel — {users.length} utilisateur(s) inscrit(s)
          </p>
        </div>

        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus size={18} /> <span>Ajouter un utilisateur</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : users.length === 0 ? (
        <EmptyState
          title="Aucun utilisateur"
          description="Créez des utilisateurs pour vos sociétés."
          icon={<Users size={28} />}
          action={
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={18} /> Ajouter un utilisateur
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map((u) => {
              const comp = companies.find((c) => c.id === u.companyId)

              return (
                <MobileDataCard
                  key={u.id}
                  title={u.name}
                  subtitle={u.email}
                  badge={
                    <span className={`badge ${u.isActive ? 'badge-active' : 'badge-cancelled'}`}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  }
                  fields={[
                    { label: 'Rôle', value: roleBadges[u.role] || u.role },
                    { label: 'Société', value: comp?.name || u.companyId },
                    { label: 'Créé le', value: formatDate(u.createdAt, 'fr', 'dd/MM/yyyy') },
                  ]}
                  actions={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className="btn btn-ghost"
                        style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem', color: u.isActive ? 'var(--warning)' : 'var(--success)' }}
                      >
                        <Power size={15} /> {u.isActive ? 'Désactiver' : 'Activer'}
                      </button>
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
                    <th>Nom complet</th>
                    <th>E-mail</th>
                    <th>Rôle</th>
                    <th>Société</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId)

                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className="badge badge-active">
                            {roleBadges[u.role] || u.role}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{comp?.name || u.companyId}</td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-active' : 'badge-cancelled'}`}>
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{formatDate(u.createdAt, 'fr', 'dd/MM/yyyy')}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className="btn btn-ghost"
                            style={{ padding: '0.375rem', minHeight: '36px', width: '36px', color: u.isActive ? 'var(--warning)' : 'var(--success)' }}
                            title={u.isActive ? 'Désactiver' : 'Activer'}
                          >
                            <Power size={16} />
                          </button>
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

      {/* Modal: Create User */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouveau compte utilisateur"
      >
        <UserForm companies={companies} onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
      </BottomSheet>
    </div>
  )
}

