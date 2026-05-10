'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// /join?ref={uid} — just redirects to sign-in (no auto group-join in v1)
export default function JoinPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return null
}
