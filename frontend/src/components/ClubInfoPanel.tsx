import type { ReactNode } from 'react'
import { InfoGrid } from './InfoGrid'
import { RecommendationReasons } from './RecommendationReasons'
import type { ClubWithScore } from '../utils/recommendation'

type ClubInfoPanelProps = {
  club: ClubWithScore
  sideContent?: ReactNode
}

export function ClubInfoPanel({ club, sideContent }: ClubInfoPanelProps) {
  const infoItems = [
    { label: '报名截止', value: club.recruitDeadline },
    { label: '活动频率', value: club.frequency },
    { label: '适合人群', value: club.fit },
    { label: '可报名方向', value: club.availableDirections.join('、') },
  ]

  return (
    <>
      <p className="detail-intro">{club.intro}</p>

      <InfoGrid items={infoItems} />

      <div className={sideContent ? 'detail-columns' : 'detail-columns single'}>
        <RecommendationReasons reasons={club.reasons} highlights={club.highlights} />

        {sideContent ? sideContent : null}
      </div>
    </>
  )
}
