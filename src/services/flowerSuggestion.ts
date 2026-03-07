import type { FlowerSuggestion } from '../types/flower'

// モック候補データ（将来的にAI APIに差し替え可能）
const MOCK_SUGGESTION_SETS: FlowerSuggestion[][] = [
  [
    { id: 's1', name: 'バラ', confidence: 0.85 },
    { id: 's2', name: 'シャクヤク', confidence: 0.70 },
    { id: 's3', name: 'ボタン', confidence: 0.60 },
  ],
  [
    { id: 's1', name: 'チューリップ', confidence: 0.90 },
    { id: 's2', name: 'アネモネ', confidence: 0.65 },
    { id: 's3', name: 'ラナンキュラス', confidence: 0.55 },
  ],
  [
    { id: 's1', name: 'コスモス', confidence: 0.88 },
    { id: 's2', name: 'マーガレット', confidence: 0.72 },
    { id: 's3', name: 'デイジー', confidence: 0.60 },
  ],
  [
    { id: 's1', name: 'ひまわり', confidence: 0.92 },
    { id: 's2', name: 'ルドベキア', confidence: 0.68 },
    { id: 's3', name: 'キク', confidence: 0.50 },
  ],
  [
    { id: 's1', name: 'サクラ', confidence: 0.87 },
    { id: 's2', name: 'ウメ', confidence: 0.73 },
    { id: 's3', name: 'モモ', confidence: 0.65 },
    { id: 's4', name: 'アーモンド', confidence: 0.50 },
  ],
  [
    { id: 's1', name: 'アジサイ', confidence: 0.89 },
    { id: 's2', name: 'ライラック', confidence: 0.67 },
    { id: 's3', name: 'ブルースター', confidence: 0.55 },
  ],
  [
    { id: 's1', name: 'キキョウ', confidence: 0.84 },
    { id: 's2', name: 'リンドウ', confidence: 0.70 },
    { id: 's3', name: 'ラベンダー', confidence: 0.58 },
  ],
]

/**
 * 花の名前候補を取得する
 * 将来的にはphotoUrlをAI APIに送って候補を得る
 * 現在はモックデータをランダムに返す
 */
export async function getFlowerSuggestions(
  _photoUrl: string
): Promise<FlowerSuggestion[]> {
  // API呼び出しをシミュレート（0.8〜1.5秒のディレイ）
  const delay = 800 + Math.random() * 700
  await new Promise(resolve => setTimeout(resolve, delay))

  const index = Math.floor(Math.random() * MOCK_SUGGESTION_SETS.length)
  return MOCK_SUGGESTION_SETS[index]
}
