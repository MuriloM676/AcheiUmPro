const fetch = globalThis.fetch || require('node-fetch')
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function run() {
  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email: 'provider@example.com', password: 'password123'})
  })
  const login = await loginRes.json()
  if (!login.token) {
    console.error('login failed', login)
    process.exit(1)
  }
  console.log('token', login.token.slice(0,20) + '...')
  const token = login.token
  const reqRes = await fetch(BASE + '/api/requests/5', { headers: { authorization: 'Bearer ' + token } })
  const data = await reqRes.json()
  console.log('status', reqRes.status)
  console.log(JSON.stringify(data, null, 2))
}

run().catch(e => { console.error(e); process.exit(1) })

