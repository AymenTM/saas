'use client'

import React from 'react'

interface DataCardField {
  label: string
  value: React.ReactNode
}

interface MobileDataCardProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  fields: DataCardField[]
  actions?: React.ReactNode
  onClick?: () => void
}

export default function MobileDataCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
  onClick,
}: MobileDataCardProps) {
  return (
    <div
      className="data-card mobile-only"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="data-card-header">
        <div>
          <div className="data-card-title">{title}</div>
          {subtitle && <div className="data-card-subtitle">{subtitle}</div>}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {fields.length > 0 && (
        <div className="data-card-grid">
          {fields.map((field, idx) => (
            <div key={idx} className="data-card-item">
              <span className="data-card-label">{field.label}</span>
              <span className="data-card-value">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="data-card-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  )
}
