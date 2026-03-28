import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="section-heading">
      <div className="section-copy">
        {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  )
}
