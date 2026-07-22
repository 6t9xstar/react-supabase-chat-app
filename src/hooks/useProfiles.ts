import { useState, useEffect, useCallback } from 'react'
import { getAllActiveProfiles, searchProfiles } from '../lib/profiles'
import type { Profile } from '../types/database'

/* -------------------------------------------------------------------------- */
/*  useProfiles                                                               */
/*  Loads and searches employee profiles. Used by New Chat, Group Settings,   */
/*  and Admin panels.                                                         */
/* -------------------------------------------------------------------------- */

export function useProfiles(excludeUserId?: string) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllActiveProfiles()
      .then((data) => {
        if (cancelled) return
        setProfiles(data)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Failed to load profiles:', e)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const search = useCallback(
    async (query: string) => {
      try {
        if (!query.trim()) {
          const data = await getAllActiveProfiles()
          setProfiles(data)
          return
        }
        const data = await searchProfiles(query, excludeUserId)
        setProfiles(data)
      } catch (e) {
        console.error('Failed to search profiles:', e)
      }
    },
    [excludeUserId]
  )

  return { profiles, loading, search }
}
