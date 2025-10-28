// Load .env.local if present (simple parser)
const fs = require('fs')
const path = require('path')
try {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([^#=]+)=\s*(.*)\s*$/)
      if (m) {
        const key = m[1].trim()
        let val = m[2].trim()
        if ((val.startsWith("\'") && val.endsWith("\'")) || (val.startsWith('"') && val.endsWith('"'))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    })
  }
} catch (err) {
  // ignore
}

const fetch = globalThis.fetch
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'

async function post(path, body, token) {
  const res = await fetch(BASE + path, { method: 'POST', headers: Object.assign({'Content-Type':'application/json'}, token ? {authorization: 'Bearer ' + token} : {}), body: JSON.stringify(body) })
  return res.json()
}
async function get(path, token) { const res = await fetch(BASE + path, { headers: token ? { authorization: 'Bearer ' + token } : {} }); return res.json() }

async function run() {
  console.log('Login provider...')
  const p = await post('/api/auth/login', { email: 'provider@example.com', password: 'password123' })
  console.log('provider login', p)
  const ptoken = p.token
  if (!ptoken) return

  // determine provider_id directly from DB (lookup providers table by user email)
  const db = require('../src/lib/db')
  const [provRows] = await db.query('SELECT p.id FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = ? LIMIT 1', [p.user.email])
  const providerId = provRows.length ? provRows[0].id : null
  console.log('identified providerId (db):', providerId)
  if (!providerId) {
    console.error('Could not map provider user to provider id in DB; aborting')
    return
  }

  // create availability slot (weekday: today)
  const slot = { weekday: new Date().getDay(), start_time: '09:00:00', end_time: '12:00:00' }
  const create = await post('/api/availability', slot, ptoken)
  console.log('create availability', create)

  // get availability
  const avail = await get(`/api/availability?provider_id=${providerId}`)
  console.log('availability list', avail)

  // Login client
  console.log('Login client...')
  const c = await post('/api/auth/login', { email: 'client@example.com', password: 'password123' })
  const ctoken = c.token
  console.log('client login', c)
  if (!ctoken) return

  // create request by client to provider
  const req = await post('/api/requests', { provider_id: providerId, service_id: 1, description: 'Teste agendamento' }, ctoken)
  console.log('create request', req)
  if (!req.requestId) return

  // schedule appointment at today 09:00
  const now = new Date(); now.setHours(9,0,0,0)
  const scheduled = now.toISOString()
  const appt = await post('/api/appointments', { request_id: req.requestId, scheduled_for: scheduled }, ctoken)
  console.log('create appointment', appt)
}

run()
