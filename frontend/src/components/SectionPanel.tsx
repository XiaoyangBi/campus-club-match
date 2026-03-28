import type { ReactNode } from 'react'
import { PageHeader } from './PageHeader'

type SectionPanelProps = {
  title: string
  description: string
  eyebrow?: string
  tone?: 'default' | 'featured'
  actions?: ReactNode
  children: ReactNode
}

export function SectionPanel({
  title,
  description,
  eyebrow,
  tone = 'default',
  actions,
  children,
}: SectionPanelProps) {
  return (
    <section className={`panel section-panel section-panel-${tone}`}>
      <PageHeader title={title} description={description} eyebrow={eyebrow} actions={actions} />
      {children}
    </section>
  )
}
