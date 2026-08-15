import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className="card"
      style={{
        padding: '2.5rem 1.25rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--bg-card-hover)',
          color: 'var(--brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        {icon || <FolderOpen size={28} />}
      </div>
      <h3
        style={{
          fontSize: '1.0625rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.375rem',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            maxWidth: '360px',
            lineHeight: 1.5,
            marginBottom: action ? '1.5rem' : 0,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ width: '100%', maxWidth: '280px' }}>
          {action}
        </div>
      )}
    </div>
  )
}

