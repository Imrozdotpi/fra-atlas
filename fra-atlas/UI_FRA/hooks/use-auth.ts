"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken, clearToken } from "@/lib/api"

interface User {
  id: string
  username: string
  name: string
  role: string
  department: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (token) {
      // In a real app, you'd validate the token with the server
      // For now, we'll set a mock user
      setUser({
        id: "OFF001",
        username: "officer@fra.gov.in",
        name: "Forest Officer",
        role: "Officer",
        department: "Forest Rights Division",
      })
    }
    setIsLoading(false)
  }, [])

  const logout = () => {
    clearToken()
    setUser(null)
    router.push("/login")
  }

  const requireAuth = () => {
    if (!user && !isLoading) {
      router.push("/login")
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    requireAuth,
  }
}
