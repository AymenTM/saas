'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '@/lib/actions/vehicles'
import { getCustomers } from '@/lib/actions/customers'
import type { Vehicle, Customer, VehicleFormData } from '@/types'
import VehicleForm from '@/components/vehicles/VehicleForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { usePermissions } from '@/hooks/usePermissions'
import { Car, Plus, Search, Edit, Trash2, X, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BottomSheet from '@/components/ui/BottomSheet'
import MobileDataCard from '@/components/ui/MobileDataCard'

export default function VehiclesPage() {

  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const { companyId } = useAuth()
  const { can } = usePermissions()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>()
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | undefined>()

  const loadData = async () => {
    if (!companyId) {
      setLoading(false)
      return
    }
    try {
      const [vehs, custs] = await Promise.all([
        getVehicles(companyId),
        getCustomers(companyId),
      ])
      setVehicles(vehs)
      setCustomers(custs)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement des véhicules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles
    const q = search.toLowerCase()
    return vehicles.filter(
      (v) =>
        v.licensePlate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    )
  }, [vehicles, search])

  const handleAdd = async (data: VehicleFormData) => {
    if (!companyId) return
    const res = await addVehicle(data, companyId)
    if (res.success) {
      toast.success('Véhicule ajouté avec succès !')
      setIsModalOpen(false)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleUpdate = async (data: VehicleFormData) => {
    if (!companyId || !editingVehicle) return
    const res = await updateVehicle(editingVehicle.id, data, companyId)
    if (res.success) {
      toast.success('Véhicule modifié avec succès !')
      setEditingVehicle(undefined)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async () => {
    if (!companyId || !deletingVehicle) return
    const res = await deleteVehicle(deletingVehicle.id, companyId)
    if (res.success) {
      toast.success('Véhicule supprimé')
      setDeletingVehicle(undefined)
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
          <h1 className="page-title">Gestion des véhicules</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {vehicles.length} véhicule(s) enregistré(s)
          </p>
        </div>

        {can.createVehicle && (
          <button
            onClick={() => {
              setEditingVehicle(undefined)
              setIsModalOpen(true)
            }}
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            <Plus size={18} />
            <span>Ajouter un véhicule</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="input-base"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Rechercher par plaque, marque, modèle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table / Card List */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredVehicles.length === 0 ? (
        <EmptyState
          title="Aucun véhicule trouvé"
          description={search ? "Aucun véhicule ne correspond à votre recherche." : "Commencez par ajouter votre premier véhicule."}
          icon={<Car size={28} />}
          action={
            can.createVehicle && !search ? (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Ajouter un véhicule
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredVehicles.map((vehicle) => {
              const customer = customers.find((c) => c.id === vehicle.customerId)

              return (
                <MobileDataCard
                  key={vehicle.id}
                  title={vehicle.licensePlate}
                  subtitle={`${vehicle.brand} ${vehicle.model}`}
                  fields={[
                    { label: 'Couleur', value: vehicle.color },
                    {
                      label: 'Propriétaire',
                      value: customer ? (
                        <Link href={`/${locale}/customers/${customer.id}`} style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
                          {customer.fullName}
                        </Link>
                      ) : (
                        '-'
                      ),
                    },
                  ]}
                  actions={
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                      {can.editVehicle && (
                        <button
                          onClick={() => setEditingVehicle(vehicle)}
                          className="btn btn-ghost"
                          style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem' }}
                        >
                          <Edit size={15} /> Éditer
                        </button>
                      )}
                      {can.deleteVehicle && (
                        <button
                          onClick={() => setDeletingVehicle(vehicle)}
                          className="btn btn-ghost"
                          style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={15} />
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
                    <th>Plaque d&apos;immatriculation</th>
                    <th>Marque & Modèle</th>
                    <th>Couleur</th>
                    <th>Propriétaire (Client)</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const customer = customers.find((c) => c.id === vehicle.customerId)

                    return (
                      <tr key={vehicle.id}>
                        <td style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--brand)', letterSpacing: '0.05em' }}>
                          {vehicle.licensePlate}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {vehicle.brand} {vehicle.model}
                        </td>
                        <td>{vehicle.color}</td>
                        <td>
                          {customer ? (
                            <Link href={`/${locale}/customers/${customer.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                              <User size={13} color="var(--brand)" />
                              {customer.fullName}
                            </Link>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                            {can.editVehicle && (
                              <button
                                onClick={() => setEditingVehicle(vehicle)}
                                className="btn btn-ghost"
                                style={{ padding: '0.375rem', minHeight: '36px', width: '36px' }}
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {can.deleteVehicle && (
                              <button
                                onClick={() => setDeletingVehicle(vehicle)}
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

      {/* Modal: Add Vehicle */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau véhicule"
      >
        <VehicleForm customers={customers} onSubmit={handleAdd} onCancel={() => setIsModalOpen(false)} />
      </BottomSheet>

      {/* Modal: Edit Vehicle */}
      <BottomSheet
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(undefined)}
        title="Modifier le véhicule"
      >
        <VehicleForm initialData={editingVehicle} customers={customers} onSubmit={handleUpdate} onCancel={() => setEditingVehicle(undefined)} />
      </BottomSheet>

      {/* Modal: Delete Confirmation */}
      <BottomSheet
        isOpen={!!deletingVehicle}
        onClose={() => setDeletingVehicle(undefined)}
        title="Supprimer le véhicule"
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244,63,94,0.12)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Trash2 size={24} />
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Êtes-vous sûr de vouloir supprimer la plaque <strong>{deletingVehicle?.licensePlate}</strong> ?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => setDeletingVehicle(undefined)} className="btn btn-ghost" style={{ width: '100%' }}>
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

