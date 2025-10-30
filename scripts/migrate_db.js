// migrations script: apply initdb SQL files and ensure required columns/tables
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const dotenv = require('dotenv')
const envLocalPath = path.resolve(__dirname, '..', '.env.local')
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
} else {
  dotenv.config()
}

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 3306
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'acheiumpro'

async function run() {
  const initPath = path.resolve(__dirname, '..', 'initdb', 'init.sql')
  const morePath = path.resolve(__dirname, '..', 'initdb', 'more_tables.sql')

  const initSql = fs.existsSync(initPath) ? fs.readFileSync(initPath, 'utf8') : ''
  const moreSql = fs.existsSync(morePath) ? fs.readFileSync(morePath, 'utf8') : ''

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  })

  try {
    console.log('Applying init.sql...')
    if (initSql.trim()) {
      await connection.query(initSql)
      console.log('init.sql applied')
    }

    console.log('Selecting database', DB_NAME)
    await connection.query('USE `' + DB_NAME + '`')

    // Ensure users.status exists
    console.log('Ensuring users.status column exists...')
    const [cols] = await connection.query(`SHOW COLUMNS FROM users LIKE 'status'`)
    if (!cols || cols.length === 0) {
      console.log('Adding status column to users table')
      await connection.query(`ALTER TABLE users ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active'`)
    } else {
      console.log('users.status column already exists')
    }

    // Apply more_tables.sql (notifications, messages, etc.)
    if (moreSql.trim()) {
      try {
        console.log('Applying more_tables.sql...')
        await connection.query(moreSql)
        console.log('more_tables.sql applied')
      } catch (err) {
        console.warn('Could not apply more_tables.sql entirely:', err.message)
      }
    }

    console.log('Migration completed')
  } catch (err) {
    console.error('Migration error:', err.message)
    process.exitCode = 1
  } finally {
    await connection.end()
  }
}

run().catch(err => {
  console.error('Unhandled error', err)
  process.exit(1)
})
