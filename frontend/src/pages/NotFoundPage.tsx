import { EmptyState } from '../components/EmptyState'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="single-column">
      <EmptyState
        panel
        title="页面不存在"
        description="当前访问的页面不存在，可以返回学生端发现页继续浏览。"
        actions={
          <Link to="/discover" className="primary-link">
            返回发现页
          </Link>
        }
      />
    </main>
  )
}
