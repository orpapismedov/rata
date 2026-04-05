// Netlify Edge Function: auth-gate
// Runs on every request BEFORE the static file is served.
// Validates the signed session cookie; redirects to /login/ if invalid/missing.
// This is the real security boundary – the app HTML never reaches the browser
// unless this function approves the request.

export default async function handler(request, context) {
  const url = new URL(request.url)
  const { pathname } = url

  // Allow the login page itself, Netlify internals, and static Next.js assets
  if (
    pathname === '/login' ||
    pathname === '/login/' ||
    pathname.startsWith('/.netlify/') ||
    pathname.startsWith('/_next/') ||
    /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?|ttf|eot|map)$/.test(pathname)
  ) {
    return context.next()
  }

  const SESSION_SECRET = Netlify.env.get('SESSION_SECRET')
  if (!SESSION_SECRET) {
    // Misconfigured – fail closed
    return Response.redirect(new URL('/login/', request.url), 302)
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const rawToken = getCookieValue(cookieHeader, 'uav_session')

  if (!rawToken || !(await isValidToken(rawToken, SESSION_SECRET))) {
    return Response.redirect(new URL('/login/', request.url), 302)
  }

  return context.next()
}

// ── helpers ────────────────────────────────────────────────────────────────

function getCookieValue(cookieHeader, name) {
  const match = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith(name + '='))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=').trim()) : null
}

async function isValidToken(token, secret) {
  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return false

    const payload = token.slice(0, dotIndex)   // expiry timestamp string
    const signature = token.slice(dotIndex + 1)

    // Verify HMAC
    const expectedSig = await hmacSha256(secret, payload)
    if (!timingSafeEqual(signature, expectedSig)) return false

    // Check expiry
    const expires = parseInt(payload, 10)
    if (isNaN(expires) || Date.now() > expires) return false

    return true
  } catch {
    return false
  }
}

async function hmacSha256(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
