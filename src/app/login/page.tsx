'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/.netlify/functions/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      })

      if (res.ok) {
        // Cookie is now set server-side (HttpOnly) – redirect to the app
        window.location.href = '/'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          {/* Icon */}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all pr-12 text-right"
                autoComplete="current-password"
                required
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

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || password.length === 0}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black" />
                  מאמת...
                </span>
              ) : (
                'כניסה למערכת'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
