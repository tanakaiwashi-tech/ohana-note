import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // JWT 検証
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = auth.slice(7)

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // 設定コード確認
  const { passcode } = req.body as { passcode?: string }
  if (!passcode || passcode !== process.env.SETUP_PASSCODE) {
    return res.status(403).json({ error: 'Invalid passcode' })
  }

  // デバイス登録（同じ user.id なら上書き）
  const { error } = await supabaseAdmin
    .from('sync_devices')
    .upsert({ user_id: user.id, registered_at: new Date().toISOString() })

  if (error) return res.status(500).json({ error: 'Registration failed' })

  return res.status(200).json({ ok: true })
}
