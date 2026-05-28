import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { FlowerRecord } from '../src/types/flower'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function base64ToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // JWT 検証
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = auth.slice(7)

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // デバイス登録確認
  const { data: device } = await supabaseAdmin
    .from('sync_devices')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!device) {
    return res.status(403).json({ error: 'Device not registered', code: 'NOT_REGISTERED' })
  }

  const { record } = req.body as { record?: FlowerRecord }
  if (!record?.id) return res.status(400).json({ error: 'Invalid record' })

  // 写真を Storage へアップロード
  const storagePath = `photos/${record.id}.jpg`
  const parsed = base64ToBuffer(record.photoUrl)

  if (parsed) {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('flower-photos')
      .upload(storagePath, parsed.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })
    if (uploadError) return res.status(500).json({ error: 'Upload failed' })
  }

  // flower_records へ upsert
  const { error: dbError } = await supabaseAdmin
    .from('flower_records')
    .upsert({
      id: record.id,
      flower_name: record.flowerName,
      status: record.status,
      memo: record.memo,
      source_type: record.sourceType ?? null,
      suggestions: record.suggestions ?? null,
      created_at: record.createdAt,
      photo_storage_path: parsed ? storagePath : null,
      synced_at: new Date().toISOString(),
    })

  if (dbError) return res.status(500).json({ error: 'DB error' })

  // last_synced_at 更新
  await supabaseAdmin
    .from('sync_devices')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return res.status(200).json({ ok: true })
}
