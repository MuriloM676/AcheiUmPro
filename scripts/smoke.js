const fetch = globalThis.fetch
const fs = require('fs')

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: Object.assign({'Content-Type':'application/json'}, token ? {authorization: 'Bearer ' + token} : {}),
    body: JSON.stringify(body)
  })
  return res.json()
}

async function get(path, token) {
  const res = await fetch(BASE + path, { headers: token ? { authorization: 'Bearer ' + token } : {} })
  return res.json()
}

async function run() {
  console.log('Logging in as client...')
  const login = await post('/api/auth/login', { email: 'client@example.com', password: 'password123' })
  console.log('login:', login)
  const token = login.token
  if (!token) return

  const requests = await get('/api/requests', token)
  console.log('requests:', requests)

  const messages = await get('/api/messages/1', token)
  console.log('messages:', messages)

  const notifications = await get('/api/notifications?status=unread', token)
  console.log('notifications:', notifications)
}

run()
