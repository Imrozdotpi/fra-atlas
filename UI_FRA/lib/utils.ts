import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for Indian locale
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  })
}

// Format coordinates for display
export function formatCoordinates(lat: number, lon: number, precision = 4): string {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate officer ID format (example: OFF001, ADM123, etc.)
export function isValidOfficerId(id: string): boolean {
  const officerIdRegex = /^[A-Z]{3}\d{3,}$/
  return officerIdRegex.test(id)
}

// Generate status badge color classes
export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "verified":
      return "bg-green-100 text-green-800 border-green-200"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200"
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Convert file size to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate random ID for temporary use
export function generateTempId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Check if user is on mobile device
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return window.innerWidth < 768
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    return false
  }
}

// Download file from URL
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Validate Indian phone number
export function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s+/g, ""))
}

// Format Indian phone number
export function formatIndianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`
  }
  return phone
}
