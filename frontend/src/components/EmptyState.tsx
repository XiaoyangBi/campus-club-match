import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  actions?: ReactNode
  panel?: boolean
}

export function EmptyState({ title, description, actions, panel = false }: EmptyStateProps) {
  return (
    <section className={panel ? 'panel empty-state' : 'empty-state'}>
      <div className="empty-state-inner">
        <h2>{title}</h2>
        <p>{description}</p>
        {actions ? <div className="stack-actions">{actions}</div> : null}
      </div>
    </section>
  )
}
