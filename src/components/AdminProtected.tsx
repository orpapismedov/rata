'use client'

import { isAdminLoggedIn } from '@/lib/auth'

interface AdminProtectedProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorMessage?: string
}

export default function AdminProtected({ 
  children, 
  fallback,
  errorMessage = 'אין לך הרשאות מנהל לביצוע פעולה זו' 
}: AdminProtectedProps) {
  const isAdmin = isAdminLoggedIn()

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="text-red-600 font-medium mb-2">🚫 גישה נדחתה</div>
        <div className="text-red-700 text-sm">{errorMessage}</div>
      </div>
    )
  }

  return <>{children}</>
}
