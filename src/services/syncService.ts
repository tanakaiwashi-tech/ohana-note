import { supabase } from '../utils/supabase'
import type { FlowerRecord } from '../types/flower'

export type SyncStatus =
  | 'unavailable'  // ローカル環境（同期しない）
  | 'not_setup'    // 初回未設定
  | 'syncing'      // 送信中
  | 'synced'       // 共有できています
  | 'needs_setup'  // セッションリセット等でデバイス未登録
  | 'failed'       // 一時的なネットワーク障害等

export type RegisterResult = 'ok' | 'wrong_code' | 'error'
export type SyncResult = 'ok' | 'needs_setup' | 'failed'

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session.access_token

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('[ohana-sync] signInAnonymously failed:', error.message, error.status)
    return null
  }
  if (!data.session) {
    console.error('[ohana-sync] signInAnonymously: no session returned')
    return null
  }
  return data.session.access_token
}

export async function registerDevice(passcode: string): Promise<RegisterResult> {
  const token = await getAccessToken()
  if (!token) {
    console.error('[ohana-sync] registerDevice: token取得失敗 → Anonymous Auth が有効か確認してください')
    return 'error'
  }
  try {
    const res = await fetch('/api/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ passcode }),
    })
    if (res.ok) return 'ok'
    if (res.status === 403) return 'wrong_code'
    console.error('[ohana-sync] registerDevice: API returned', res.status)
    return 'error'
  } catch (e) {
    console.error('[ohana-sync] registerDevice: fetch失敗', e)
    return 'error'
  }
}

export async function syncRecord(record: FlowerRecord): Promise<SyncResult> {
  const token = await getAccessToken()
  if (!token) return 'failed'
  try {
    const res = await fetch('/api/sync-record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ record }),
    })
    if (res.ok) return 'ok'
    if (res.status === 403) return 'needs_setup'
    console.error('[ohana-sync] syncRecord: API returned', res.status)
    return 'failed'
  } catch (e) {
    console.error('[ohana-sync] syncRecord: fetch失敗', e)
    return 'failed'
  }
}

export async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export function getInitialSyncStatus(): SyncStatus {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return 'unavailable'
  const lastSynced = localStorage.getItem('ohana-sync-last-synced')
  return lastSynced ? 'synced' : 'not_setup'
}
