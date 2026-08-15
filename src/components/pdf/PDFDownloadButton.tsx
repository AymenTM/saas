'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { generateSubscriptionPDF, type PDFData } from '@/lib/pdf/generatePDF'
import { toast } from 'sonner'

interface PDFDownloadButtonProps {
  data: PDFData
  label?: string
  className?: string
  style?: React.CSSProperties
}

export default function PDFDownloadButton({
  data,
  label = 'Télécharger le PDF',
  className = 'btn btn-ghost',
  style,
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      await generateSubscriptionPDF(data)
      toast.success('PDF généré avec succès !')
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <FileDown size={16} />
      )}
      {label}
    </button>
  )
}

