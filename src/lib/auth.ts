// Admin authentication system
const ADMIN_PASSWORD = '12891289'
const ADMIN_SESSION_KEY = 'uav_admin_session'
const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

export interface AdminSession {
  isAdmin: boolean
  timestamp: number
}

// Check if user is currently logged in as admin
export const isAdminLoggedIn = (): boolean => {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return false
    
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!sessionData) return false

    const session: AdminSession = JSON.parse(sessionData)
    const now = Date.now()
    
    // Check if session is still valid (within 2 hours)
    if (now - session.timestamp > SESSION_DURATION) {
      // Session expired, remove it
      localStorage.removeItem(ADMIN_SESSION_KEY)
      return false
    }

    return session.isAdmin
  } catch (error) {
    console.error('Error checking admin session:', error)
    return false
  }
}

// Login as admin with password
export const loginAsAdmin = (password: string): boolean => {
  if (password === ADMIN_PASSWORD) {
    const session: AdminSession = {
      isAdmin: true,
      timestamp: Date.now()
    }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
    return true
  }
  return false
}

// Logout from admin session
export const logoutAdmin = (): void => {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

// Refresh admin session (extend time)
export const refreshAdminSession = (): void => {
  if (isAdminLoggedIn()) {
    const session: AdminSession = {
      isAdmin: true,
      timestamp: Date.now()
    }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  }
}
