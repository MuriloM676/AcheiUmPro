import mysql, { Pool, PoolOptions } from 'mysql2/promise'

interface DatabaseConfig extends PoolOptions {
  host: string
  port: number
  user: string
  password: string
  database: string
  waitForConnections: boolean
  connectionLimit: number
  queueLimit: number
  acquireTimeout: number
  timeout: number
  reconnect: boolean
  namedPlaceholders: boolean
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'acheiumpro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  timezone: 'Z'
}

let pool: Pool

// Singleton pattern for database connection
const getPool = (): Pool => {
  if (!pool) {
    pool = mysql.createPool(config)

    // Test connection on initialization
    pool.on('connection', (connection) => {
      console.log('Database connected as id ' + connection.threadId)
    })

    pool.on('error', (err) => {
      console.error('Database pool error:', err)
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Reconnect will be handled automatically by the pool
        console.log('Database connection lost, reconnecting...')
      }
    })
  }
  return pool
}

// Health check function
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await getPool().getConnection()
    await connection.ping()
    connection.release()
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    console.log('Database pool closed')
  }
}

export default getPool()
