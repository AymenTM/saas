import { getSubscriptionByToken } from '@/lib/actions/subscriptions'
import { getCustomerById } from '@/lib/actions/customers'
import { getVehiclesByCustomer } from '@/lib/actions/vehicles'
import { getCompanyById } from '@/lib/actions/admin'
import QRCodeDisplay from '@/components/qr/QRCodeDisplay'
import PDFDownloadButton from '@/components/pdf/PDFDownloadButton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Car, CheckCircle2, XCircle, AlertTriangle, Building2, Calendar, CreditCard, User } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  return {
    title: `Vérification Abonnement ${token.slice(0, 8)} | ParkSub`,
    description: 'Vérification publique du statut d\'abonnement de stationnement',
  }
}

export default async function PublicSubscriptionPage({ params }: PageProps) {
  const { token } = await params
  const subscription = await getSubscriptionByToken(token)

  if (!subscription) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: '1.5rem',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(244,63,94,0.12)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Abonnement introuvable
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Ce QR code est invalide ou l&apos;abonnement correspondant n&apos;existe plus dans le système.
          </p>
        </div>
      </div>
    )
  }

  // Fetch associated documents using companyId
  const [customer, company] = await Promise.all([
    getCustomerById(subscription.customerId, subscription.companyId),
    getCompanyById(subscription.companyId),
  ])

  const vehicles = customer ? await getVehiclesByCustomer(customer.id, subscription.companyId) : []
  const vehicle = vehicles.find((v) => v.id === subscription.vehicleId) || vehicles[0]

  const isExpired = subscription.status === 'expired'
  const isCancelled = subscription.status === 'cancelled'
  const isActive = subscription.status === 'active'

  const statusConfig = {
    active: {
      label: 'ABONNEMENT VALIDE',
      bgColor: 'rgba(16,185,129,0.12)',
      borderColor: '#10b981',
      textColor: '#10b981',
      icon: <CheckCircle2 size={24} color="#10b981" />,
    },
    expired: {
      label: 'ABONNEMENT EXPIRÉ',
      bgColor: 'rgba(244,63,94,0.12)',
      borderColor: '#f43f5e',
      textColor: '#f43f5e',
      icon: <XCircle size={24} color="#f43f5e" />,
    },
    cancelled: {
      label: 'ABONNEMENT ANNULÉ',
      bgColor: 'rgba(148,163,184,0.12)',
      borderColor: '#94a3b8',
      textColor: '#94a3b8',
      icon: <AlertTriangle size={24} color="#94a3b8" />,
    },
  }

  const currentStatus = statusConfig[subscription.status]

  const pdfData = {
    companyName: company?.name || 'ParkSub',
    customerName: customer?.fullName || 'Client inconnu',
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
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        padding: '1.25rem 0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-fade-in"
        style={{ width: '100%', maxWidth: '440px' }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--brand)',
              fontWeight: 800,
              fontSize: '1.125rem',
              marginBottom: '0.25rem',
            }}
          >
            <Building2 size={20} />
            {company?.name || 'ParkSub Parking'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Vérification officielle d&apos;abonnement
          </div>
        </div>

        {/* Status Card */}
        <div
          className="card"
          style={{
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          }}
        >
          {/* Status Banner */}
          <div
            style={{
              padding: '1rem',
              background: currentStatus.bgColor,
              borderBottom: `2px solid ${currentStatus.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
            }}
          >
            {currentStatus.icon}
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                color: currentStatus.textColor,
                letterSpacing: '0.05em',
              }}
            >
              {currentStatus.label}
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem' }}>
            {/* QR Code section */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <QRCodeDisplay value={token} size={160} />
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.5rem',
                  fontFamily: 'monospace',
                }}
              >
                Réf : {token.slice(0, 13)}…
              </div>
            </div>

            {/* Information Grid */}
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              {/* Customer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <User size={18} color="var(--brand)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {customer?.fullName || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <Car size={18} color="var(--brand)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Véhicule</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand)' }}>
                    {vehicle?.licensePlate || 'N/A'}
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {vehicle?.brand} {vehicle?.model}
                </div>
              </div>

              {/* Dates */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <Calendar size={13} /> Date début
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatDate(subscription.startDate, 'fr', 'dd/MM/yyyy')}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: isExpired ? '1px solid var(--danger)' : '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: isExpired ? 'var(--danger)' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <Calendar size={13} /> Date fin
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isExpired ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {formatDate(subscription.endDate, 'fr', 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>

              {/* Tariff */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <CreditCard size={16} color="var(--brand)" />
                  Tarif abonnement
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(subscription.price)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: '1.25rem', width: '100%' }}>
              <PDFDownloadButton
                data={pdfData}
                className="btn btn-primary"
                label="Télécharger la fiche PDF"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          Powered by ParkSub — Parking Subscription Management
        </p>
      </div>
    </div>
  )
}

