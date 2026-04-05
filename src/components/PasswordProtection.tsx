'use client'

// Authentication is handled server-side by the Netlify Edge Function (auth-gate).
// The edge function validates the signed HttpOnly session cookie and redirects
// unauthenticated requests to /login/ before any HTML reaches the browser.
// This component now simply renders its children; it is kept only to avoid
// changing the import structure in page.tsx.

interface PasswordProtectionProps {
  children: React.ReactNode
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  return <>{children}</>
}


