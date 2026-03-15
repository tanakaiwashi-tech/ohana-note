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

/**
 * Claude Vision で草花の名前候補を取得する
 * - 上位3候補まで、日本語名＋確信度を返す
 * - API キーなし・エラー時は空配列を返してアプリを止めない
 */
export async function getFlowerSuggestions(
  photoUrl: string
): Promise<FlowerSuggestion[]> {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    return []
  }

  const parsed = parseDataUrl(photoUrl)
  if (!parsed) return []

  try {
    const response = await getClient().messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
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
              text: `この写真に写っている草花・植物の名前を日本語で教えてください。
上位3つまでの候補を確信度（0〜1）とともに、以下のJSON形式のみで返してください。
植物が写っていない場合は candidates を空配列にしてください。

{"candidates":[{"name":"植物名","confidence":0.9}]}`,
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
