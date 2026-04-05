'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

// Local dev (netlify dev):  leave NEXT_PUBLIC_AUTH_URL unset → uses relative path
// GH Pages production:      set NEXT_PUBLIC_AUTH_URL=https://<your-netlify-site>.netlify.app/.netlify/functions/authenticate
const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || '/.netlify/functions/authenticate'

interface PasswordProtectionProps {
  children: React.ReactNode
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const authStatus = sessionStorage.getItem('uav_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // In local dev (plain `npm run dev`), fall back to the env variable
      // so the app works without needing netlify dev running.
      const devPassword = process.env.NEXT_PUBLIC_DEV_PASSWORD
      if (devPassword) {
        if (password === devPassword) {
          sessionStorage.setItem('uav_authenticated', 'true')
          setIsAuthenticated(true)
        } else {
          setError('סיסמה שגויה. אנא נסה שוב.')
          setPassword('')
          inputRef.current?.focus()
        }
        setIsLoading(false)
        return
      }

      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        sessionStorage.setItem('uav_authenticated', 'true')
        setIsAuthenticated(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'סיסמה שגויה. אנא נסה שוב.')
        setPassword('')
        inputRef.current?.focus()
      }
    } catch {
      setError('שגיאת חיבור. אנא נסה שוב.')
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="bg-white/10 p-4 rounded-full">
                <Lock className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">
              מערכת ניהול רישיונות מטיסים
            </h1>
            <p className="text-gray-400 text-center mb-8">
              אנא הזן סיסמה לגישה למערכת
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="הזן סיסמה"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                    <span>בודק...</span>
                  </>
                ) : (
                  <span>כניסה</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>גישה מוגבלת למשתמשים מורשים בלבד</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


