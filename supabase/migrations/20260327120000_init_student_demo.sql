create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id text primary key,
  name text not null,
  category text not null,
  intro text not null,
  tags jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  available_directions jsonb not null default '[]'::jsonb,
  recruit_deadline timestamptz not null,
  frequency text not null,
  time_level text not null check (time_level in ('low', 'medium', 'high')),
  fit text not null,
  highlights jsonb not null default '[]'::jsonb,
  popularity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_profiles (
  student_id text primary key,
  college text not null,
  grade text not null,
  available_time text not null check (available_time in ('low', 'medium', 'high')),
  expected_gain jsonb not null default '[]'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.favorite_clubs (
  student_id text not null,
  club_id text not null references public.clubs(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (student_id, club_id)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  club_id text not null references public.clubs(id) on delete cascade,
  club_name text not null,
  selected_direction text not null,
  self_intro text not null,
  submitted_at timestamptz not null default timezone('utc', now()),
  status text not null check (status in ('已提交', '待筛选', '待面试', '已录取', '未通过')),
  note text not null default '',
  unique (student_id, club_id)
);

create table if not exists public.match_runs (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  model text not null,
  raw_response jsonb not null default '{}'::jsonb,
  matches jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_applications_student_id on public.applications(student_id);
create index if not exists idx_favorite_clubs_student_id on public.favorite_clubs(student_id);
create index if not exists idx_match_runs_student_id on public.match_runs(student_id);

insert into public.clubs (
  id, name, category, intro, tags, skills, available_directions, recruit_deadline, frequency, time_level, fit, highlights, popularity
) values
  (
    'club-media',
    '青藤融媒体中心',
    '媒体',
    '负责校园内容策划、公众号运营、摄影摄像和活动传播，适合希望提升内容表达和媒体技能的新生。',
    '["媒体运营","摄影摄像","设计创意"]'::jsonb,
    '["文案写作","平面设计","视频剪辑"]'::jsonb,
    '["采编","设计","摄影"]'::jsonb,
    '2026-09-20T18:00:00+08:00',
    '每周1-2次',
    'medium',
    '愿意持续参与校园内容创作的新生',
    '["大型校园活动官方宣传团队","有成熟带新机制","作品可沉淀为个人经历"]'::jsonb,
    92
  ),
  (
    'club-robot',
    '星火机器人社',
    '学术',
    '围绕机器人、嵌入式开发和赛事训练展开，适合希望参与技术实践和竞赛的新生。',
    '["竞赛科研","编程开发","工程实践"]'::jsonb,
    '["编程开发"]'::jsonb,
    '["算法","硬件","软件"]'::jsonb,
    '2026-09-18T22:00:00+08:00',
    '每周2-3次',
    'high',
    '能长期投入技术项目和比赛训练的同学',
    '["竞赛资源多","项目训练体系完整","适合技术成长"]'::jsonb,
    88
  ),
  (
    'club-public',
    '青年公益协会',
    '公益',
    '组织校园志愿服务、社区活动和公益项目，适合希望增强行动力和组织协作能力的新生。',
    '["公益服务","活动策划","运营协作"]'::jsonb,
    '["组织协调","主持表达"]'::jsonb,
    '["活动策划","志愿服务","宣传"]'::jsonb,
    '2026-09-22T20:00:00+08:00',
    '每周1次',
    'low',
    '适合想稳定参与活动、偏好团队协作的同学',
    '["新手友好","活动氛围强","适合建立校园社交圈"]'::jsonb,
    80
  ),
  (
    'club-music',
    '风羽音乐社',
    '文艺',
    '聚焦乐队演出、歌会组织和校园舞台活动，适合热爱音乐表达与舞台体验的同学。',
    '["音乐舞蹈","活动策划","舞台表达"]'::jsonb,
    '["主持表达"]'::jsonb,
    '["演唱","器乐","活动执行"]'::jsonb,
    '2026-09-25T19:00:00+08:00',
    '每周1-2次',
    'medium',
    '喜欢舞台和团队协作、有表达欲的同学',
    '["演出机会多","校园曝光高","社团氛围活跃"]'::jsonb,
    76
  ),
  (
    'club-basketball',
    '逐光篮球社',
    '体育',
    '组织日常训练、院系友谊赛和校级比赛，适合希望保持运动习惯并结识伙伴的同学。',
    '["体育运动","团队协作","比赛参与"]'::jsonb,
    '["组织协调"]'::jsonb,
    '["训练","赛事执行","新媒体宣传"]'::jsonb,
    '2026-09-21T17:30:00+08:00',
    '每周2次',
    'medium',
    '希望规律运动、乐于参与集体活动的同学',
    '["社交属性强","训练节奏稳定","适合融入新环境"]'::jsonb,
    74
  )
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  intro = excluded.intro,
  tags = excluded.tags,
  skills = excluded.skills,
  available_directions = excluded.available_directions,
  recruit_deadline = excluded.recruit_deadline,
  frequency = excluded.frequency,
  time_level = excluded.time_level,
  fit = excluded.fit,
  highlights = excluded.highlights,
  popularity = excluded.popularity,
  updated_at = timezone('utc', now());

insert into public.student_profiles (
  student_id, college, grade, available_time, expected_gain, interests, skills
) values (
  'demo-student',
  '计算机学院',
  concat(extract(year from timezone('Asia/Shanghai', now()))::int, '级'),
  'medium',
  '["技能提升","社交拓展"]'::jsonb,
  '["媒体运营","摄影摄像","设计创意"]'::jsonb,
  '["平面设计","视频剪辑"]'::jsonb
)
on conflict (student_id) do nothing;

insert into public.favorite_clubs (student_id, club_id)
values ('demo-student', 'club-media')
on conflict (student_id, club_id) do nothing;

insert into public.applications (
  student_id, club_id, club_name, selected_direction, self_intro, submitted_at, status, note
) values
  (
    'demo-student',
    'club-media',
    '青藤融媒体中心',
    '摄影',
    '喜欢用镜头记录活动，也有基础海报设计经验。',
    '2026-09-10T09:20:00+08:00',
    '待面试',
    '面试时间：2026-09-12 19:00，大学生活动中心301'
  ),
  (
    'demo-student',
    'club-public',
    '青年公益协会',
    '活动策划',
    '希望通过参与公益活动认识新朋友，也愿意承担执行工作。',
    '2026-09-09T20:15:00+08:00',
    '待筛选',
    '社团已收到报名，预计两天内给出结果。'
  )
on conflict (student_id, club_id) do nothing;
