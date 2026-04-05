// Netlify Function: admin-auth
// Validates the admin password against ADMIN_PASSWORD env var.
// Returns 200 on success so the client can set a timed admin session marker.
// The admin UI is only accessible after the main session gate, so this
// is a second-factor privilege check within the already-authenticated app.

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

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (!ADMIN_PASSWORD) {
    console.error('Missing required environment variable: ADMIN_PASSWORD')
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    }
  }

  // Use timing-safe comparison to prevent timing attacks
  const inputBuf = Buffer.from(typeof password === 'string' ? password : '', 'utf8')
  const expected = Buffer.from(ADMIN_PASSWORD, 'utf8')
  const isMatch =
    inputBuf.length === expected.length &&
    crypto.timingSafeEqual(inputBuf, expected)

  if (!isMatch) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'סיסמת מנהל שגויה' }),
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  }
}
