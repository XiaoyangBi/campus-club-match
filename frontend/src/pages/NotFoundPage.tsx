import { EmptyState } from '../components/EmptyState'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="single-column">
      <EmptyState
        panel
        title="页面不存在"
        description="你访问的页面不存在，回到发现页继续看看吧。"
        actions={
          <Link to="/discover" className="primary-link">
            回到发现页
          </Link>
        }
      />
    </main>
  )
}
