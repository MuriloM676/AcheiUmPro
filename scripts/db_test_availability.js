// Quick DB test for provider_availability insert
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
        if ((val.startsWith("\'") && val.endsWith("\'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1,-1)
        if (!process.env[key]) process.env[key] = val
      }
    })
  }
} catch(e){}

const db = require('../src/lib/db')
;(async ()=>{
  try{
    const providerId = 3
    const weekday = new Date().getDay()
    const [res] = await db.query('INSERT INTO provider_availability (provider_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)', [providerId, weekday, '09:00:00', '12:00:00'])
    console.log('insert OK', res)
  }catch(err){
    console.error('insert failed:', err)
  }finally{ process.exit(0)}
})()

