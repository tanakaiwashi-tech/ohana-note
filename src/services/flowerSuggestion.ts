import Anthropic from '@anthropic-ai/sdk'
import type { FlowerSuggestion } from '../types/flower'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  }
  return client
}

type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const SUPPORTED_TYPES: SupportedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function parseDataUrl(dataUrl: string): { mediaType: SupportedMediaType; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const mediaType = match[1] as SupportedMediaType
  if (!SUPPORTED_TYPES.includes(mediaType)) return null
  return { mediaType, data: match[2] }
}

export type SuggestionOptions = {
  month?: number
  sourceType?: 'home' | 'outing'
  knownNames?: string[]
}

function buildPrompt(options: SuggestionOptions): string {
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
    lines.push(`・このユーザーの周辺で過去に記録された植物: ${knownNames.slice(0, 12).join('、')}`)
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

/**
 * Claude Vision で草花の名前候補を取得する
 * - 上位3候補まで、日本語名＋確信度を返す
 * - API キーなし・エラー時は空配列を返してアプリを止めない
 */
export async function getFlowerSuggestions(
  photoUrl: string,
  options: SuggestionOptions = {}
): Promise<FlowerSuggestion[]> {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    return []
  }

  const parsed = parseDataUrl(photoUrl)
  if (!parsed) return []

  try {
    const response = await getClient().messages.create({
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
              text: buildPrompt(options),
            },
          ],
        },
      ],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []

    const result = JSON.parse(jsonMatch[0]) as {
      candidates: { name: string; confidence: number }[]
    }

    return (result.candidates ?? []).slice(0, 3).map((c, i) => ({
      id: `s${i + 1}`,
      name: c.name,
      confidence: Math.min(1, Math.max(0, c.confidence)),
    }))
  } catch {
    return []
  }
}
