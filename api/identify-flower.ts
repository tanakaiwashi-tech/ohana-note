import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type SupportedMediaType = typeof SUPPORTED_MEDIA_TYPES[number]

// base64 文字列の最大長: 4M 文字 ≒ デコード後 3MB, JSON 全体で 4.5MB 以内に収まる
const MAX_BASE64_LENGTH = 4 * 1024 * 1024

function parseDataUrl(dataUrl: string): { mediaType: SupportedMediaType; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const rawType = match[1]
  if (!(SUPPORTED_MEDIA_TYPES as readonly string[]).includes(rawType)) return null
  return { mediaType: rawType as SupportedMediaType, data: match[2] }
}

function buildPrompt(options: {
  month?: number
  sourceType?: 'home' | 'outing'
  knownNames?: string[]
}): string {
  const { month, sourceType, knownNames = [] } = options
  const lines: string[] = []
  if (month != null) {
    lines.push(`・撮影時期: ${month}月（季節に合った開花植物を優先してください）`)
  }
  if (sourceType === 'home') {
    lines.push('・場所: 庭やベランダで栽培・管理されている植物です')
  } else if (sourceType === 'outing') {
    lines.push('・場所: 野外・公園・道端などで見かけた植物です（野草・街路樹なども候補に）')
  }
  if (knownNames.length > 0) {
    lines.push(`・このユーザーの周辺で過去に記録された植物: ${knownNames.join('、')}`)
  }
  const contextBlock = lines.length > 0
    ? `\n参考情報:\n${lines.join('\n')}\n`
    : ''
  return `この写真に写っている草花・植物の名前を日本語で答えてください。
花びら・葉の形・茎・全体の樹形を総合的に観察して判断してください。
同じ植物でも品種・変種がある場合は最も可能性の高いものを答えてください。
${contextBlock}
植物が写っていない、または判別が困難な場合は confidence を低く設定するか candidates を空配列にしてください。
上位3つまでの候補を確信度（0〜1）とともに、以下のJSON形式のみで返してください。

{"candidates":[{"name":"植物名","confidence":0.9}]}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // ── JWT 検証 ──────────────────────────────────────────────────────────────
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = auth.slice(7)

  let userId: string | null = null
  try {
    const { data, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError) {
      console.error('[identify-flower] auth error:', authError.message, authError.status)
      return res.status(401).json({ error: 'Invalid token' })
    }
    userId = data.user?.id ?? null
  } catch (e) {
    console.error('[identify-flower] auth threw:', (e as Error).message)
    return res.status(500).json({ error: 'Auth check failed' })
  }
  if (!userId) return res.status(401).json({ error: 'No user' })

  // ── sync_devices 確認（登録済み端末のみ許可）───────────────────────────────
  const { data: device } = await supabaseAdmin
    .from('sync_devices')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!device) {
    return res.status(403).json({ error: 'Device not registered', code: 'NOT_REGISTERED' })
  }

  // ── リクエストボディ取得 ─────────────────────────────────────────────────
  const body = req.body as { photoUrl?: unknown; options?: Record<string, unknown> }

  // photoUrl バリデーション
  if (typeof body.photoUrl !== 'string' || !body.photoUrl) {
    return res.status(400).json({ error: 'photoUrl is required' })
  }
  const parsed = parseDataUrl(body.photoUrl)
  if (!parsed) {
    return res.status(400).json({ error: 'Unsupported image format' })
  }
  if (parsed.data.length > MAX_BASE64_LENGTH) {
    console.error('[identify-flower] image too large:', parsed.data.length, 'chars')
    return res.status(400).json({ error: 'Image too large' })
  }

  // options バリデーション
  const rawOpts: Record<string, unknown> = body.options ?? {}

  let month: number | undefined
  if (rawOpts.month !== undefined) {
    const m = rawOpts.month
    if (typeof m !== 'number' || !Number.isInteger(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Invalid month: must be integer 1–12' })
    }
    month = m
  }

  let sourceType: 'home' | 'outing' | undefined
  if (rawOpts.sourceType !== undefined) {
    if (rawOpts.sourceType !== 'home' && rawOpts.sourceType !== 'outing') {
      return res.status(400).json({ error: 'Invalid sourceType' })
    }
    sourceType = rawOpts.sourceType as 'home' | 'outing'
  }

  const knownNames: string[] = []
  if (rawOpts.knownNames !== undefined) {
    if (!Array.isArray(rawOpts.knownNames)) {
      return res.status(400).json({ error: 'knownNames must be an array' })
    }
    for (const n of (rawOpts.knownNames as unknown[]).slice(0, 12)) {
      if (typeof n === 'string' && n.trim()) knownNames.push(n.trim())
    }
  }

  // ── Anthropic Vision 呼び出し ─────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[identify-flower] ANTHROPIC_API_KEY is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: parsed.mediaType,
                data: parsed.data,
              },
            },
            {
              type: 'text',
              text: buildPrompt({ month, sourceType, knownNames }),
            },
          ],
        },
      ],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[identify-flower] no JSON in Anthropic response')
      return res.status(200).json({ suggestions: [] })
    }

    const result = JSON.parse(jsonMatch[0]) as {
      candidates?: { name: string; confidence: number }[]
    }

    const suggestions = (result.candidates ?? []).slice(0, 3).map((c, i) => ({
      id: `s${i + 1}`,
      name: String(c.name),
      confidence: Math.min(1, Math.max(0, Number(c.confidence))),
    }))

    return res.status(200).json({ suggestions })
  } catch (e) {
    console.error('[identify-flower] Anthropic error:', (e as Error).message)
    return res.status(500).json({ error: 'AI processing failed' })
  }
}
