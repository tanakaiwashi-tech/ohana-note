import type { FlowerSuggestion } from '../types/flower'

// モック候補データ（将来的にAI APIに差し替え可能）
// 実際の画像認識では confidence は API が返す値になる
const MOCK_SUGGESTION_SETS: FlowerSuggestion[][] = [
  // 2件（自信あり）
  [
    { id: 's1', name: 'バラ', confidence: 0.86 },
    { id: 's2', name: 'シャクヤク', confidence: 0.68 },
  ],
  // 3件
  [
    { id: 's1', name: 'チューリップ', confidence: 0.91 },
    { id: 's2', name: 'アネモネ', confidence: 0.64 },
    { id: 's3', name: 'ラナンキュラス', confidence: 0.53 },
  ],
  // 2件
  [
    { id: 's1', name: 'コスモス', confidence: 0.88 },
    { id: 's2', name: 'マーガレット', confidence: 0.71 },
  ],
  // 1件（はっきり識別できた）
  [
    { id: 's1', name: 'ひまわり', confidence: 0.94 },
  ],
  // 2件
  [
    { id: 's1', name: 'サクラ', confidence: 0.87 },
    { id: 's2', name: 'ウメ', confidence: 0.74 },
  ],
  // 3件
  [
    { id: 's1', name: 'アジサイ', confidence: 0.89 },
    { id: 's2', name: 'ライラック', confidence: 0.67 },
    { id: 's3', name: 'ブルースター', confidence: 0.55 },
  ],
  // 2件
  [
    { id: 's1', name: 'キキョウ', confidence: 0.83 },
    { id: 's2', name: 'リンドウ', confidence: 0.69 },
  ],
  // 空（見つからなかった）
  [],
]

/**
 * 草花の名前候補を取得する
 * 将来的には photoUrl を AI API（Claude Vision / Google Vision等）に送って候補を得る
 * 現在はモックデータをランダムに返す
 */
export async function getFlowerSuggestions(
  _photoUrl: string
): Promise<FlowerSuggestion[]> {
  // API呼び出しをシミュレート（0.9〜1.6秒のディレイ）
  const delay = 900 + Math.random() * 700
  await new Promise(resolve => setTimeout(resolve, delay))

  const index = Math.floor(Math.random() * MOCK_SUGGESTION_SETS.length)
  return MOCK_SUGGESTION_SETS[index]
}
