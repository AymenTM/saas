import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { formatDate, formatCurrency } from '@/lib/utils'

export interface PDFData {
  companyName: string
  companyLogoUrl?: string
  customerName: string
  customerPhone: string
  licensePlate: string
  brand: string
  model: string
  startDate: any
  endDate: any
  price: number
  status: string
  token: string
}

export async function generateSubscriptionPDF(data: PDFData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Colors
  const primaryColor = '#4f46e5'
  const textColor = '#1e293b'
  const mutedColor = '#64748b'
  const activeColor = '#10b981'
  const expiredColor = '#f43f5e'

  // Header Banner
  doc.setFillColor(primaryColor)
  doc.rect(0, 0, 210, 32, 'F')

  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(data.companyName || 'ParkSub', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ABONNEMENT DE STATIONNEMENT / PARKING SUBSCRIPTION', 14, 25)

  // Status Badge
  const isExpired = data.status === 'expired'
  doc.setFillColor(isExpired ? expiredColor : activeColor)
  doc.roundedRect(155, 10, 40, 12, 3, 3, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(isExpired ? 'EXPIRÉ' : 'ACTIF', 175, 17.5, { align: 'center' })

  let y = 45

  // Section 1: Customer Details
  doc.setTextColor(primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('CLIENT / CUSTOMER', 14, y)
  y += 3
  doc.setDrawColor('#e2e8f0')
  doc.line(14, y, 196, y)
  y += 7

  doc.setTextColor(textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Nom / Name:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.customerName, 55, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Téléphone / Phone:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.customerPhone || 'N/A', 55, y)

  y += 12

  // Section 2: Vehicle Details
  doc.setTextColor(primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('VÉHICULE / VEHICLE', 14, y)
  y += 3
  doc.line(14, y, 196, y)
  y += 7

  doc.setTextColor(textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Immatriculation / Plate:', 14, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor)
  doc.text(data.licensePlate, 55, y)

  y += 6
  doc.setTextColor(textColor)
  doc.setFont('helvetica', 'bold')
  doc.text('Marque & Modèle:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.brand} ${data.model}`, 55, y)

  y += 12

  // Section 3: Subscription Details
  doc.setTextColor(primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('ABONNEMENT / SUBSCRIPTION DETAILS', 14, y)
  y += 3
  doc.line(14, y, 196, y)
  y += 7

  doc.setTextColor(textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Date de début / Start:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(data.startDate, 'fr'), 55, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Date de fin / End:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(data.endDate, 'fr'), 55, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Prix / Price:', 14, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(data.price).replace(/[\s\u202F\u00A0]/g, ' '), 55, y)

  y += 15

  // QR Code
  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/subscription/${data.token}`
    : `/subscription/${data.token}`

  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 140, margin: 1 })
    doc.addImage(qrDataUrl, 'PNG', 140, 48, 50, 50)
  } catch (err) {
    console.error('Failed to add QR code to PDF:', err)
  }

  // Footer / Generation Date
  doc.setFontSize(8)
  doc.setTextColor(mutedColor)
  doc.setFont('helvetica', 'normal')

  const now = new Date()
  doc.text(`Document généré le : ${formatDate(now, 'fr', 'dd/MM/yyyy HH:mm')}`, 14, 275)
  doc.text('Powered by Parking Subscription SaaS (ParkSub)', 196, 275, { align: 'right' })

  // Download trigger
  doc.save(`Abonnement_${data.licensePlate}_${data.token.slice(0, 8)}.pdf`)
}
