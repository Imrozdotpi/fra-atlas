// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names
 * - clsx: handles conditional classes
 * - twMerge: ensures Tailwind utility classes don't conflict
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
