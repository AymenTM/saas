export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'grid', gap: '0.875rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: '76px',
            width: '100%',
            borderRadius: 'var(--radius)',
          }}
        />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: '100px',
            borderRadius: 'var(--radius)',
          }}
        />
      ))}
    </div>
  )
}

