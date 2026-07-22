const STORAGE_KEY = 'apex-chat-disappearing'

export type DisappearingTimer = 'off' | '1h' | '24h' | '7d'

export function getConversationTimer(convId: string): DisappearingTimer {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 'off'
    const timers = JSON.parse(raw)
    return timers[convId] || 'off'
  } catch {
    return 'off'
  }
}

export function setConversationTimer(convId: string, timer: DisappearingTimer) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const timers = raw ? JSON.parse(raw) : {}
    timers[convId] = timer
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers))
  } catch { /* ignore */ }
}

export function getExpiresAt(timer: DisappearingTimer): string | null {
  if (timer === 'off') return null
  const now = Date.now()
  const ms = timer === '1h' ? 3600000 : timer === '24h' ? 86400000 : 604800000
  return new Date(now + ms).toISOString()
}

export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
}
