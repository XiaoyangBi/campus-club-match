import type { ReactNode } from 'react'

type SubmitActionBoxProps = {
  title: string
  description: string
  actions: ReactNode
}

export function SubmitActionBox({ title, description, actions }: SubmitActionBoxProps) {
  return (
    <div className="application-box">
      <h3>{title}</h3>
      <p className="box-copy">{description}</p>
      <div className="stack-actions">{actions}</div>
    </div>
  )
}
