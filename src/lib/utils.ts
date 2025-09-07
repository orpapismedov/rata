import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Convert DD/MM/YYYY to YYYY-MM-DD for HTML input
export function dateToInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Convert YYYY-MM-DD from HTML input to Date
export function inputValueToDate(value: string): Date {
  return new Date(value)
}

// Format date for display in DD/MM/YYYY format
export function formatDateForInput(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const timeDiff = expiry.getTime() - today.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

export function getExpiryStatus(expiryDate: Date): 'expired' | 'critical' | 'warning' | 'good' {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
  
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 7) return 'critical'
  if (daysUntilExpiry <= 30) return 'warning'
  return 'good'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-300'
    case 'warning':
      return 'bg-yellow-50 text-yellow-700 border-yellow-300'
    case 'good':
      return 'bg-green-50 text-green-700 border-green-300'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-300'
  }
}
