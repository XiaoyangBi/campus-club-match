import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { demoOptions } from '../_shared/demoOptions.ts'

declare const Deno: {
  env: {
    get(name: string): string | undefined
  }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}

type ResumeParseSuggestion = {
  college: string
  major: string
  interests: string[]
  skills: string[]
  expectedGain: string[]
  summary: string
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
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

function uniqueTrimmed(values: unknown, maxCount: number) {
  if (!Array.isArray(values)) {
    return []
  }

  return Array.from(
    new Set(
      values
        .map((item) => String(item).trim())
        .filter(Boolean),
    ),
  ).slice(0, maxCount)
}

function matchPresetTags(values: string[], presets: readonly string[], maxCount: number) {
  const presetMatched = values.filter((value) => presets.includes(value)).slice(0, maxCount)
  const customMatched = values.filter((value) => !presets.includes(value)).slice(0, Math.max(0, maxCount - presetMatched.length))
  return [...presetMatched, ...customMatched].slice(0, maxCount)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await getAuthUserId(request)
    const { extractedText } = await request.json()

    if (typeof extractedText !== 'string' || extractedText.trim().length < 80) {
      return jsonResponse({ error: '简历文本不足，暂时无法生成候选画像' }, { status: 400 })
    }

    const apiKey = Deno.env.get('AI_MATCH_API_KEY')
    if (!apiKey) {
      throw new Error('AI_MATCH_API_KEY is missing. Set it with supabase secrets.')
    }

    const apiUrl = Deno.env.get('AI_MATCH_API_URL') ?? 'https://api.aiionly.com/v1/chat/completions'
    const model = Deno.env.get('AI_MATCH_MODEL') ?? 'claude-opus-4-6'

    const systemPrompt = `你是高校社团招新平台的画像辅助分析器，负责把学生简历提取成“候选画像”。

请严格遵守以下规则：
1. 只能根据简历里明确出现的信息做判断，不能编造经历。
2. 你的任务不是评价优劣，而是帮助学生生成一版可确认的画像初稿。
3. 兴趣标签、技能标签、期望收获应优先从给定的预设标签池中选择。
4. 如果证据不足，不要强行填满所有字段；可以返回空字符串或较少标签。
5. summary请用自然中文，像在给学生做简短画像总结，不要空话。
6. evidence请写2到4条，说明你主要依据了哪些经历、项目、关键词。
7. 只能返回JSON，不要返回Markdown或额外解释。

JSON格式必须严格如下：
{
  "college": "string",
  "major": "string",
  "interests": ["兴趣标签1", "兴趣标签2"],
  "skills": ["技能标签1", "技能标签2"],
  "expectedGain": ["期望收获1", "期望收获2"],
  "summary": "一句话画像总结",
  "confidence": "high | medium | low",
  "evidence": ["依据1", "依据2"]
}`

    const userPrompt = JSON.stringify(
      {
        presetTags: {
          collegeOptions: demoOptions.collegeOptions,
          interestOptions: demoOptions.interestOptions,
          skillOptions: demoOptions.skillOptions,
          expectedGainOptions: demoOptions.expectedGainOptions,
        },
        constraints: {
          maxInterests: 5,
          maxSkills: 5,
          maxExpectedGain: 3,
          textLength: extractedText.length,
        },
        extractedResumeText: extractedText.slice(0, 12000),
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
    const parsed = parseJsonFromModel(content) as Partial<ResumeParseSuggestion>

    const suggestion: ResumeParseSuggestion = {
      college: demoOptions.collegeOptions.includes(String(parsed.college ?? '').trim()) ? String(parsed.college).trim() : '',
      major: String(parsed.major ?? '').trim().slice(0, 40),
      interests: matchPresetTags(uniqueTrimmed(parsed.interests, 5), demoOptions.interestOptions, 5),
      skills: matchPresetTags(uniqueTrimmed(parsed.skills, 5), demoOptions.skillOptions, 5),
      expectedGain: matchPresetTags(uniqueTrimmed(parsed.expectedGain, 3), demoOptions.expectedGainOptions, 3),
      summary: String(parsed.summary ?? '').trim().slice(0, 120),
      confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence))
        ? (String(parsed.confidence) as 'high' | 'medium' | 'low')
        : 'medium',
      evidence: uniqueTrimmed(parsed.evidence, 4),
    }

    if (
      !suggestion.college &&
      !suggestion.major &&
      suggestion.interests.length === 0 &&
      suggestion.skills.length === 0 &&
      suggestion.expectedGain.length === 0
    ) {
      return jsonResponse({ error: '未能从简历中提取到足够清晰的画像信息，请尝试更完整的文本型PDF简历' }, { status: 400 })
    }

    return jsonResponse(suggestion)
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to parse resume' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
