export type FlowerStatus =
  | 'bud'       // つぼみ
  | 'starting'  // 咲き始め
  | 'best'      // 見ごろ
  | 'full'      // 満開
  | 'ending'    // 散り始め
  | 'finished'  // 終わり

export const STATUS_LABELS: Record<FlowerStatus, string> = {
  bud: 'つぼみ',
  starting: '咲き始め',
  best: '見ごろ',
  full: '満開',
  ending: '散り始め',
  finished: '終わり',
}

export type FlowerSuggestion = {
  id: string
  name: string
  confidence?: number
}

export type FlowerRecord = {
  id: string
  photoUrl: string
  createdAt: string
  flowerName: string
  suggestions?: FlowerSuggestion[]
  status: FlowerStatus
  memo: string
  sourceType?: 'home' | 'outing'
}
