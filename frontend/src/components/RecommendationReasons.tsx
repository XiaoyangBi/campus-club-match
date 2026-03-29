type RecommendationReasonsProps = {
  reasons: string[]
  highlights?: string[]
}

export function RecommendationReasons({
  reasons,
  highlights = [],
}: RecommendationReasonsProps) {
  return (
    <div>
      <h3>为什么推荐</h3>
      <ul className="bullet-list">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      {highlights.length > 0 ? (
        <>
          <h3>社团特点</h3>
          <ul className="bullet-list">
            {highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
