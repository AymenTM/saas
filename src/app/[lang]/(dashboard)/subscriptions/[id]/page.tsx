'use client'

import { useEffect, useState, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSubscriptions } from '@/lib/actions/subscriptions'
import { getCustomerById } from '@/lib/actions/customers'
import { getVehiclesByCustomer } from '@/lib/actions/vehicles'
import { getCompanyById } from '@/lib/actions/admin'
import type { SubscriptionWithStatus, Customer, Vehicle, Company } from '@/types'
import QRCodeDisplay from '@/components/qr/QRCodeDisplay'
import PDFDownloadButton from '@/components/pdf/PDFDownloadButton'
import { formatDate, formatCurrency, statusColor } from '@/lib/utils'
import { ArrowLeft, ExternalLink, Copy, Check, QrCode, User, Car, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SubscriptionDetailPage({ params }: PageProps) {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const { id } = use(params)
  const { companyId } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionWithStatus | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!companyId || !id) return

    async function loadData() {
      try {
        const [allSubs, comp] = await Promise.all([
          getSubscriptions(companyId!),
          getCompanyById(companyId!),
        ])

        const sub = allSubs.find((s) => s.id === id)
        if (sub) {
          setSubscription(sub)
          setCompany(comp)

          const [cust, vehs] = await Promise.all([
            getCustomerById(sub.customerId, companyId!),
            getVehiclesByCustomer(sub.customerId, companyId!),
          ])
          setCustomer(cust)
          setVehicle(vehs.find((v) => v.id === sub.vehicleId) || null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, companyId])

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Abonnement introuvable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Cet abonnement n&apos;existe pas ou a été supprimé.</p>
        <Link href={`/${locale}/subscriptions`} className="btn btn-primary">
          <ArrowLeft size={16} /> Retour aux abonnements
        </Link>
      </div>
    )
  }

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/subscription/${subscription.token}`
    : `/subscription/${subscription.token}`

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    toast.success('Lien public copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const pdfData = {
    companyName: company?.name || 'ParkSub',
    customerName: customer?.fullName || 'N/A',
    customerPhone: customer?.phone || 'N/A',
    licensePlate: vehicle?.licensePlate || 'N/A',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    price: subscription.price,
    status: subscription.status,
    token: subscription.token,
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Back Link */}
      <div>
        <Link href={`/${locale}/subscriptions`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', minHeight: '38px', padding: '0.375rem 0.75rem' }}>
          <ArrowLeft size={16} /> Retour aux abonnements
        </Link>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Left: QR Code & Link Card */}
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <QrCode size={18} color="var(--brand)" /> QR Code de vérification
          </div>

          <QRCodeDisplay value={subscription.token} size={180} />

          <div style={{ marginTop: '1.25rem', width: '100%' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem', textAlign: 'left' }}>
              URL de vérification publique :
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <input type="text" readOnly className="input-base" value={publicUrl} style={{ fontSize: '0.75rem', fontFamily: 'monospace', minHeight: '40px' }} />
              <button onClick={copyUrl} className="btn btn-ghost btn-icon" style={{ height: '40px', width: '40px' }}>
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon" style={{ height: '40px', width: '40px' }}>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', width: '100%' }}>
            <PDFDownloadButton data={pdfData} className="btn btn-primary" label="Télécharger le PDF" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Right: Details Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Statut actuel
            </span>
            <span className={`badge ${statusColor(subscription.status)}`} style={{ fontSize: '0.8125rem', padding: '0.25rem 0.75rem' }}>
              {subscription.status === 'active' ? 'Actif' : subscription.status === 'expired' ? 'Expiré' : 'Annulé'}
            </span>
          </div>

          {/* Customer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <User size={20} color="var(--brand)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {customer?.fullName || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{customer?.phone}</div>
            </div>
          </div>

          {/* Vehicle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <Car size={20} color="var(--brand)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Véhicule</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand)' }}>
                {vehicle?.licensePlate || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {vehicle?.brand} {vehicle?.model} ({vehicle?.color})
              </div>
            </div>
          </div>

          {/* Dates & Tariff */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Calendar size={13} /> Date de début
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatDate(subscription.startDate, 'fr', 'dd/MM/yyyy')}
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Calendar size={13} /> Date de fin
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: subscription.status === 'expired' ? 'var(--danger)' : 'var(--text-primary)' }}>
                {formatDate(subscription.endDate, 'fr', 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <CreditCard size={18} color="var(--brand)" /> Tarif abonnement
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(subscription.price)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

