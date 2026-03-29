import { Link } from 'react-router-dom'
import type { ClubWithScore } from '../utils/recommendation'

type RecommendationCardProps = {
  club: ClubWithScore
  featured?: boolean
}

export function RecommendationCard({ club, featured = false }: RecommendationCardProps) {
  return (
    <article className={featured ? 'club-card recommendation-card featured' : 'club-card recommendation-card'}>
      <div className="club-card-top">
        <div className="club-card-heading">
          <span className="club-card-category">推荐 · {club.category}</span>
          <strong>{club.name}</strong>
        </div>
      </div>

      <p className="club-card-copy">{club.intro}</p>

      <ul className="reason-preview">
        {club.reasons.slice(0, 2).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <div className="club-card-meta">
        <span>截止 {club.recruitDeadline.slice(5, 10)}</span>
        <span>{club.frequency}</span>
      </div>

      <div className="card-actions">
        <Link to={`/clubs/${club.id}`} className="text-link">
          查看详情
        </Link>
        <Link to={`/apply/${club.id}`} className="text-link primary">
          提交报名
        </Link>
      </div>
    </article>
  )
}
