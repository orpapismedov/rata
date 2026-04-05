// Netlify Function: authenticate
// Validates the app password against the APP_PASSWORD environment variable.
// Called from GitHub Pages (cross-origin), so CORS headers are required.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://orpapismedov.github.io',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' }
  }

  let password
  try {
    password = JSON.parse(event.body || '{}').password
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body' }),
    }
  }

  const APP_PASSWORD = process.env.APP_PASSWORD

  if (!APP_PASSWORD) {
    console.error('Missing required environment variable: APP_PASSWORD')
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    }
  }

  if (typeof password !== 'string' || password !== APP_PASSWORD) {
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'סיסמה שגויה. אנא נסה שוב.' }),
    }
  }

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  }
}
