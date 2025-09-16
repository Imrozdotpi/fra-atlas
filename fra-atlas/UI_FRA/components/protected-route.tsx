"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Dev bypass: set NEXT_PUBLIC_BYPASS_AUTH=true in .env.local to enable
  const bypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"

  // <<< ADD THE LOG HERE to verify the runtime env value
  console.info("[ProtectedRoute] BYPASS value at runtime:", process.env.NEXT_PUBLIC_BYPASS_AUTH)

  const pathname = usePathname() ?? "/"

  // Paths that should be public (no auth redirect). Add more prefixes if needed.
  const PUBLIC_PATH_PREFIXES = ["/dashboard"]
  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  const { isAuthenticated, isLoading, requireAuth } = useAuth()

  useEffect(() => {
    if (bypass) {
      // no-op when bypassing
      console.info("[ProtectedRoute] BYPASS AUTH ENABLED (dev)")
      return
    }

    if (isPublicPath) {
      // skip requireAuth for public paths like /dashboard
      console.info("[ProtectedRoute] Public path detected, skipping auth:", pathname)
      return
    }

    // Only call requireAuth once the auth hook has finished loading
    if (!isLoading && !isAuthenticated) {
      requireAuth()
    }
  }, [isLoading, isAuthenticated, requireAuth, bypass, isPublicPath, pathname])

  // If dev bypass is active, render children immediately
  if (bypass) {
    return <>{children}</>
  }

  // If this is a public path (like /dashboard), render children immediately (no redirect).
  if (isPublicPath) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gov-blue" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // requireAuth() handles redirect when appropriate
  }

  return <>{children}</>
}
