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
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1,-1)
        if (!process.env[key]) process.env[key] = val
      }
    })
  }
} catch(e){}
const db = require('../src/lib/db')
;(async()=>{
  await db.query('DELETE FROM appointments')
  console.log('cleared all appointments')
  process.exit(0)
})()

