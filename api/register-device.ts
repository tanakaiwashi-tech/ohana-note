import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const setupPasscode = process.env.SETUP_PASSCODE

// 起動時に環境変数の有無だけ確認（値は出力しない）
console.log('[register-device] env check:', {
  VITE_SUPABASE_URL: !!supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey,
  SETUP_PASSCODE: !!setupPasscode,
})

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // JWT 検証
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const jwt = auth.slice(7)

  let user: { id: string } | null = null
  try {
    const { data, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    if (authError) {
      console.error('[register-device] auth.getUser error:', authError.message, authError.status)
      return res.status(401).json({ error: 'Invalid token' })
    }
    user = data.user
  } catch (e) {
    console.error('[register-device] auth.getUser threw:', e)
    return res.status(500).json({ error: 'Auth check failed' })
  }

  if (!user) return res.status(401).json({ error: 'No user' })

  // 設定コード確認
  const { passcode } = req.body as { passcode?: string }
  if (!passcode || passcode !== setupPasscode) {
    return res.status(403).json({ error: 'Invalid passcode' })
  }

  // デバイス登録（同じ user.id なら上書き）
  const { error } = await supabaseAdmin
    .from('sync_devices')
    .upsert({ user_id: user.id, registered_at: new Date().toISOString() })

  if (error) {
    console.error('[register-device] upsert error:', error.message, error.code)
    return res.status(500).json({ error: 'Registration failed' })
  }

  return res.status(200).json({ ok: true })
}
