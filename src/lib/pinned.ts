const STORAGE_KEY = 'apex-chat-pinned'

export function getPinnedConversationIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function togglePinnedConversation(convId: string): boolean {
  const pinned = getPinnedConversationIds()
  const idx = pinned.indexOf(convId)
  if (idx >= 0) {
    pinned.splice(idx, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned))
    return false
  } else {
    pinned.unshift(convId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned))
    return true
  }
}

export function isPinned(convId: string): boolean {
  return getPinnedConversationIds().includes(convId)
}
