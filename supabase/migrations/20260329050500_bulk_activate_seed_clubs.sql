update public.clubs
set
  review_status = 'approved',
  is_active = true,
  review_note = '',
  updated_at = timezone('utc', now())
where id in (
  'club-media',
  'club-robot',
  'club-public',
  'club-music',
  'club-basketball',
  'club-guitar',
  'club-acapella',
  'club-kunqu',
  'club-drama',
  'club-streetdance',
  'club-photo',
  'club-movie',
  'club-astronomy',
  'club-linux',
  'club-tax',
  'club-planning',
  'club-scifi',
  'club-health',
  'club-rural',
  'club-governance',
  'club-floorball',
  'club-mountaineering',
  'club-tabletennis',
  'club-flying'
);
