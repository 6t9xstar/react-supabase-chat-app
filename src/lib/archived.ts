const STORAGE_KEY = 'apex-chat-archived'

export function getArchivedConversationIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleArchivedConversation(convId: string): boolean {
  const archived = getArchivedConversationIds()
  const idx = archived.indexOf(convId)
  if (idx >= 0) {
    archived.splice(idx, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archived))
    return false
  } else {
    archived.push(convId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archived))
    return true
  }
}

export function isArchived(convId: string): boolean {
  return getArchivedConversationIds().includes(convId)
}
