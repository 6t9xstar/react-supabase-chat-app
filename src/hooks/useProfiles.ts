import { useState, useEffect } from 'react'
import { getAllActiveProfiles, searchProfiles } from '../lib/profiles'
import type { Profile } from '../types/database'

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllActiveProfiles().then((data) => {
      setProfiles(data)
      setLoading(false)
    })
  }, [])

  const search = async (query: string) => {
    if (!query.trim()) {
      const data = await getAllActiveProfiles()
      setProfiles(data)
      return
    }
    const data = await searchProfiles(query)
    setProfiles(data)
  }

  return { profiles, loading, search }
}
