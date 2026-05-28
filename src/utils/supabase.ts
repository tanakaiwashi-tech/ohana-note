import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || supabaseUrl === 'https://YOUR_PROJECT.supabase.co') {
  console.error('[ohana-sync] VITE_SUPABASE_URL が設定されていません')
}
if (!supabaseAnonKey || supabaseAnonKey.startsWith('eyJ...')) {
  console.error('[ohana-sync] VITE_SUPABASE_ANON_KEY が設定されていません')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
