import type { ReactNode } from 'react'

export type InfoGridItem = {
  label: string
  value: ReactNode
}

type InfoGridProps = {
  items: InfoGridItem[]
}

export function InfoGrid({ items }: InfoGridProps) {
  return (
    <div className="info-grid">
      {items.map((item) => (
        <div key={item.label} className="info-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}
