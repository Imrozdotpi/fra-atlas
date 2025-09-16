// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import ErrorBoundary from "@/components/error-boundary"
import ToastProvider from "@/components/toast-provider"
import { Suspense } from "react"
import "./globals.css"

// ✅ Language provider import
import { LanguageProvider } from "@/components/LanguageProvider"

// ✅ Shared header + footer import
import HeaderClient from "@/components/HeaderClient"
import SiteFooter from "@/components/SiteFooter"

export const metadata: Metadata = {
  title: "FRA Atlas - Forest Rights Act Portal",
  description:
    "Government of India - Ministry of Tribal Affairs - Forest Rights Act Atlas Portal",
  generator: "FRA Atlas Portal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ErrorBoundary>
            {/* Wrap the app with LanguageProvider so useLanguage() works everywhere */}
            <LanguageProvider>
              {/* ✅ Global Header */}
              <HeaderClient />

              {/* ✅ Page content */}
              {children}

              {/* ✅ Global Footer */}
              <SiteFooter />

              {/* Keep ToastProvider inside LanguageProvider so toasts respect selected language */}
              <ToastProvider />
            </LanguageProvider>
          </ErrorBoundary>
        </Suspense>

        <Analytics />
      </body>
    </html>
  )
}
