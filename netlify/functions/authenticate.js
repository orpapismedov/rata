// Netlify Function: authenticate
// Validates the app password against the NETLIFY env var APP_PASSWORD.
// On success sets a signed HttpOnly session cookie so the edge function can
// verify it without any client-side exposure of the password.

const crypto = require('crypto')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let password
  try {
    password = JSON.parse(event.body || '{}').password
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body' }),
    }
  }

  const APP_PASSWORD = process.env.APP_PASSWORD
  const SESSION_SECRET = process.env.SESSION_SECRET

  if (!APP_PASSWORD || !SESSION_SECRET) {
    console.error('Missing required environment variables: APP_PASSWORD, SESSION_SECRET')
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    }
  }

  if (typeof password !== 'string' || password !== APP_PASSWORD) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'סיסמה שגויה. אנא נסה שוב.' }),
    }
  }

  // Build a signed token: "<expiry_ms>.<hmac_hex>"
  const expires = (Date.now() + 8 * 60 * 60 * 1000).toString() // 8 hours
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(expires).digest('hex')
  const token = encodeURIComponent(`${expires}.${sig}`)

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': `uav_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  }
}
