import { Link } from 'react-router-dom'
import type { ClubWithScore } from '../utils/recommendation'

type ClubCardProps = {
  club: ClubWithScore
}

export function ClubCard({ club }: ClubCardProps) {
  return (
    <article className="club-card">
      <div className="club-card-top">
        <div className="club-card-heading">
          <span className="club-card-category">{club.category}</span>
          <strong>{club.name}</strong>
        </div>
      </div>

      <p className="club-card-copy">{club.intro}</p>

      <div className="tag-list">
        {club.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

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
