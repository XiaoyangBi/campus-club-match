export type MutationFeedbackState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

type MutationFeedbackProps = {
  feedback: MutationFeedbackState
}

export function MutationFeedback({ feedback }: MutationFeedbackProps) {
  if (feedback.status === 'idle' || !feedback.message) {
    return null
  }

  return (
    <div className={`mutation-feedback ${feedback.status}`}>
      {feedback.message}
    </div>
  )
}
