import { supabase } from '../utils/supabase'
import type { FlowerSuggestion } from '../types/flower'

export type SuggestionOptions = {
  month?: number
  sourceType?: 'home' | 'outing'
  knownNames?: string[]
}

/**
 * Anonymous Auth のトークンを取得する（セッションがあれば再利用）
 * 失敗した場合は null を返す（呼び出し元が [] を返してアプリを止めない）
 */
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session.access_token
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.session) return null
  return data.session.access_token
}

/**
 * サーバーサイドの /api/identify-flower 経由で草花名候補を取得する
 *
 * 以下のすべてのケースで [] を返してアプリを止めない：
 * - 未認証 / Anonymous Auth 失敗
 * - 未登録端末（403）
 * - サーバーエラー（500）
 * - ネットワーク障害
 * - ローカル開発（/api が存在しない）
 */
export async function getFlowerSuggestions(
  photoUrl: string,
  options: SuggestionOptions = {}
): Promise<FlowerSuggestion[]> {
  const token = await getAccessToken()
  if (!token) return []

  try {
    const res = await fetch('/api/identify-flower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ photoUrl, options }),
    })
    if (!res.ok) return []
    const data = await res.json() as { suggestions?: FlowerSuggestion[] }
    return data.suggestions ?? []
  } catch {
    return []
  }
}
