const FILEKIWI_API = 'https://api.file.kiwi/v2'
const FILEKIWI_WEB = 'https://file.kiwi'
const KIWI_URL_RE = /^https:\/\/file\.kiwi\/([a-z0-9]+)#/

export function extractKiwiUrl(text: string): { folderUrl: string; folderId: string } | null {
  const m = text.trim().match(KIWI_URL_RE)
  if (!m) return null
  return { folderUrl: text.trim(), folderId: m[1] }
}

interface CreateFolderResult {
  folderId: string
  folderUrl: string
  folderUrlBase: string
  mode: string
}

export async function createEmptyFolder(title?: string, mode: 'send' | 'share' = 'send', retries = 3): Promise<CreateFolderResult> {
  const body: Record<string, unknown> = {
    mode,
    encryption: { keyStrategy: 'server_generated' },
  }
  if (title) body.title = title.slice(0, 200)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const apiKey = import.meta.env.PUBLIC_FILEKIWI_API_KEY as string | undefined
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(`${FILEKIWI_API}/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (res.status === 429) {
    if (retries <= 0) throw new Error('file.kiwi: rate limited after 3 retries')
    await new Promise((r) => setTimeout(r, 1000))
    return createEmptyFolder(title, mode, retries - 1)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`file.kiwi: ${res.status} ${text}`)
  }

  const data = await res.json()
  return {
    folderId: data.folderId,
    folderUrl: data.folderUrl,
    folderUrlBase: data.folderUrlBase,
    mode: data.mode,
  }
}
