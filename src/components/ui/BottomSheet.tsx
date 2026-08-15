'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '480px',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="bottom-sheet-backdrop"
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Content Sheet / Modal */}
      <div
        className="bottom-sheet-content"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet-drag-handle" />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <h2
            id="sheet-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ width: '36px', height: '36px', padding: 0 }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  )
}
