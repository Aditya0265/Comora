import { clsx } from 'clsx'

/**
 * Utility function for combining class names
 * Uses clsx for conditional classes
 */
export function cn(...inputs) {
  return clsx(inputs)
}
