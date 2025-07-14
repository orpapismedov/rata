'use client'

import { useState } from 'react'
import { loginAsAdmin, logoutAdmin, isAdminLoggedIn } from '@/lib/auth'

interface AdminLoginProps {
  onAdminStatusChange?: (isAdmin: boolean) => void
}

export default function AdminLogin({ onAdminStatusChange }: AdminLoginProps) {
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn())
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (loginAsAdmin(password)) {
      setIsAdmin(true)
      setPassword('')
      setShowPasswordInput(false)
      setError('')
      onAdminStatusChange?.(true)
    } else {
      setError('סיסמה שגויה')
      setPassword('')
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    setIsAdmin(false)
    setShowPasswordInput(false)
    setPassword('')
    setError('')
    onAdminStatusChange?.(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  if (isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-600 text-sm font-medium">👤 מנהל מחובר</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          התנתק
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!showPasswordInput ? (
        <button
          onClick={() => setShowPasswordInput(true)}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔐 מנהל
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="סיסמת מנהל"
            className="px-2 py-1 text-xs border rounded w-24 text-right bg-white text-black border-gray-300"
            autoFocus
          />
          <button
            onClick={handleLogin}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            ✓
          </button>
          <button
            onClick={() => {
              setShowPasswordInput(false)
              setPassword('')
              setError('')
            }}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <span className="text-red-500 text-xs">{error}</span>
      )}
    </div>
  )
}
