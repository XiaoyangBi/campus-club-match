import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createDefaultProfile, getAiMissingFields } from '../_shared/profile.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

declare const Deno: {
  env: {
    get(name: string): string | undefined
  }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}

type AiMatch = {
  clubId: string
  score: number
  reasons: string[]
}

async function createProfileSnapshotHash(profile: {
  college: string
  major: string
  grade: string
  available_time: string
  expected_gain: string[]
  interests: string[]
  skills: string[]
}) {
  const payload = JSON.stringify({
    college: profile.college.trim(),
    major: profile.major.trim(),
    grade: profile.grade.trim(),
    availableTime: profile.available_time,
    expectedGain: [...profile.expected_gain].sort(),
    interests: [...profile.interests].sort(),
    skills: [...profile.skills].sort(),
  })
  const bytes = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

function extractContent(content: unknown) {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === 'object' && item && 'text' in item ? String(item.text) : ''))
      .join('')
  }

  return ''
}

function parseJsonFromModel(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i)
  const jsonText = fenced ? fenced[1] : raw
  return JSON.parse(jsonText)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const { maxResults = 3, refresh = false } = await request.json().catch(() => ({}))
    const supabase = createSupabaseAdmin()

    const [profileResult, clubsResult] = await Promise.all([
      supabase.from('student_profiles').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('clubs').select('*').eq('is_active', true).order('popularity', { ascending: false }),
    ])

    if (profileResult.error) throw profileResult.error
    if (clubsResult.error) throw clubsResult.error

    let profile = profileResult.data
    const clubs = clubsResult.data

    if (!profile) {
      const defaultProfile = createDefaultProfile()
      const insertedProfileResult = await supabase
        .from('student_profiles')
        .insert({
          student_id: studentId,
          ...defaultProfile,
        })
        .select('*')
        .single()

      if (insertedProfileResult.error) throw insertedProfileResult.error
      profile = insertedProfileResult.data
    }

    if (!profile) {
      throw new Error('Student profile is missing')
    }

    const missingFields = getAiMissingFields(profile)
    if (missingFields.length > 0) {
      return jsonResponse(
        {
          error: `画像未填写完整，需先补充：${missingFields.join('、')}`,
          missingFields,
        },
        { status: 400 },
      )
    }

    const profileSnapshotHash = await createProfileSnapshotHash(profile)

    if (!refresh) {
      const { data: latestRun, error: latestRunError } = await supabase
        .from('match_runs')
        .select('matches, created_at')
        .eq('student_id', studentId)
        .eq('profile_snapshot_hash', profileSnapshotHash)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestRunError) throw latestRunError

      if (latestRun?.matches) {
        return jsonResponse({
          matches: Array.isArray(latestRun.matches) ? latestRun.matches : [],
          generatedAt: latestRun.created_at.replace('T', ' ').replace(/:\d{2}(?:\.\d+)?Z$/, ''),
          source: 'cache',
        })
      }
    }

    const apiKey = Deno.env.get('AI_MATCH_API_KEY')
    if (!apiKey) {
      throw new Error('AI_MATCH_API_KEY is missing. Set it with supabase secrets.')
    }

    const apiUrl = Deno.env.get('AI_MATCH_API_URL') ?? 'https://api.aiionly.com/v1/chat/completions'
    const model = Deno.env.get('AI_MATCH_MODEL') ?? 'claude-opus-4-6'

    const systemPrompt = `你是一名非常有经验的高校社团招新顾问，擅长根据学生画像判断“这个人现在最适合先投哪个社团、为什么适合、适合到什么程度”。

你的任务不是泛泛地夸社团，而是站在招生顾问的视角，帮助学生做更真实的选择判断。

请严格遵守以下规则：
1. 你的判断必须同时基于学生画像和社团信息，不能只看其中一方。
2. 推荐理由必须具体，必须落到学生的兴趣、技能、期望收获、可投入时间，或社团的方向、活动频率、适合人群、风格特点上。
3. 推荐理由不要写空话、套话、官话，例如“非常适合你”“可以帮助你成长”“综合来看很匹配”这类没有信息量的话。
4. 每条理由都应该像真实顾问会说的话，能够让学生理解“为什么是这个社团，而不是别的社团”。
5. 优先选择“当前阶段最值得优先投递”的社团，而不是理论上最完美但投入门槛明显不合适的社团。
6. ` + 'score' + `表示当前优先推荐程度，不是绝对能力评分。分数越高，表示越值得这个学生优先了解和投递。
7. reasons请控制在2到3条，每条都要简洁、自然、像人写的建议，不要重复。
8. 如果学生画像和社团之间只是部分匹配，理由里可以体现“适合切入点”，而不是强行说完全匹配。
9. 返回的社团必须来自输入里的clubs，clubId必须完全一致。
10. 你必须只返回JSON，不要返回任何解释、标题、前后缀或Markdown。

推荐理由风格示例：
- “你现在更想通过社团获得技能提升和内容表达机会，这个社团刚好有稳定的采编与设计分工，比较适合作为优先尝试。”
- “你的时间投入是中等强度，而这个社团的活动频率基本在每周1到2次，节奏上更容易长期坚持。”
- “你已经有平面设计和视频剪辑基础，进入这个社团后能较快接上实际工作，不会长期停留在边缘参与状态。”

禁止使用的空泛表达示例：
- “与你高度匹配”
- “能帮助你全面成长”
- “非常值得加入”
- “综合来看是不错的选择”

JSON格式必须严格如下：
{
  "matches": [
    {
      "clubId": "string",
      "score": 0-100的整数,
      "reasons": ["原因1", "原因2", "原因3"]
    }
  ]
}`

    const userPrompt = JSON.stringify(
      {
        student: {
          college: profile.college,
          major: profile.major,
          grade: profile.grade,
          availableTime: profile.available_time,
          expectedGain: profile.expected_gain,
          interests: profile.interests,
          skills: profile.skills,
        },
        clubs: clubs.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.category,
          intro: club.intro,
          tags: club.tags,
          skills: club.skills,
          availableDirections: club.available_directions,
          frequency: club.frequency,
          timeLevel: club.time_level,
          fit: club.fit,
          highlights: club.highlights,
          popularity: club.popularity,
        })),
        requirement: `请返回最多${maxResults}个当前最值得优先投递的社团。reasons必须像真实招生顾问在给建议，具体、自然、可解释，不要写模板化匹配结论。`,
      },
      null,
      2,
    )

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`AI request failed with status ${response.status}`)
    }

    const rawResponse = await response.json()
    const content = extractContent(rawResponse?.choices?.[0]?.message?.content)
    const parsed = parseJsonFromModel(content) as { matches?: AiMatch[] }

    const matches = Array.isArray(parsed.matches)
      ? parsed.matches
          .filter((item) => typeof item.clubId === 'string')
          .slice(0, maxResults)
          .map((item) => ({
            clubId: item.clubId,
            score: Number.isFinite(item.score) ? Math.max(0, Math.min(100, Math.round(item.score))) : 0,
            reasons: Array.isArray(item.reasons) ? item.reasons.slice(0, 3).map(String) : [],
          }))
      : []

    const generatedAt = new Date().toISOString()
    const { error: insertError } = await supabase.from('match_runs').insert({
      student_id: studentId,
      model,
      raw_response: rawResponse,
      matches,
      profile_snapshot_hash: profileSnapshotHash,
      source: 'ai',
      created_at: generatedAt,
    })

    if (insertError) throw insertError

    return jsonResponse({
      matches,
      generatedAt: generatedAt.replace('T', ' ').replace(/:\d{2}\.\d+Z$/, ''),
      source: 'ai',
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to run AI matching' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
