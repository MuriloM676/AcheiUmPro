// Run SQL file `initdb/more_tables.sql` statements sequentially using existing DB config
const fs = require('fs');
const path = require('path');

// load .env.local
try {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([^#=]+)=\s*(.*)\s*$/);
      if (m) {
        const key = m[1].trim();
        let val = m[2].trim();
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1,-1);
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
} catch (err) {}

const pool = require('../src/lib/db');
(async ()=>{
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, '..', 'initdb', 'more_tables.sql'), 'utf8');
    // naive split by semicolon
    const statements = sql.split(';').map(s=>s.trim()).filter(s=>s.length>0);
    for (const stmt of statements) {
      console.log('Executing statement...', stmt.split('\n')[0].slice(0,200));
      await pool.query(stmt);
    }
    console.log('All statements executed');
    process.exit(0);
  } catch (err) {
    console.error('Failed to run SQL file:', err);
    process.exit(1);
  }
})();

