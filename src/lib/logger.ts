/**
 * Advanced Logging System
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  userId?: number
  requestId?: string
  ip?: string
  userAgent?: string
  method?: string
  path?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: any
}

class Logger {
  private level: LogLevel
  private context: LogContext = {}

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase()
    this.level = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO
  }

  /**
   * Set global context that will be included in all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {}
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger()
    child.level = this.level
    child.context = { ...this.context, ...context }
    return child
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse)
      return JSON.stringify(entry)
    } else {
      // Human-readable format for development
      const timestamp = new Date(entry.timestamp).toLocaleString('pt-BR')
      let output = `[${timestamp}] [${entry.level}] ${entry.message}`

      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
      }

      if (entry.metadata) {
        output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`
      }

      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`
        }
      }

      return output
    }
  }

  /**
   * Write log entry
   */
  private log(level: LogLevel, levelName: string, message: string, metadata?: any, error?: Error): void {
    if (level > this.level) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      ...(Object.keys(this.context).length > 0 && { context: this.context }),
      ...(metadata && { metadata }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
      })
    }

    const formatted = this.formatLog(entry)

    // Output based on level
    if (level === LogLevel.ERROR) {
      console.error(formatted)
    } else if (level === LogLevel.WARN) {
      console.warn(formatted)
    } else {
      console.log(formatted)
    }

    // In production, you could send to external logging service here
    // Example: sendToDatadog(entry), sendToSentry(entry), etc.
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error | unknown, metadata?: any): void {
    const err = error instanceof Error ? error : undefined
    const meta = error instanceof Error ? metadata : error
    this.log(LogLevel.ERROR, 'ERROR', message, meta, err)
  }

  /**
   * Log warning level message
   */
  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, metadata)
  }

  /**
   * Log info level message
   */
  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, metadata)
  }

  /**
   * Log debug level message
   */
  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, metadata)
  }

  /**
   * Log trace level message (very verbose)
   */
  trace(message: string, metadata?: any): void {
    this.log(LogLevel.TRACE, 'TRACE', message, metadata)
  }

  /**
   * Log HTTP request
   */
  request(method: string, path: string, metadata?: any): void {
    this.info(`${method} ${path}`, metadata)
  }

  /**
   * Log HTTP response
   */
  response(method: string, path: string, status: number, duration: number): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO
    const levelName = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'

    this.log(level, levelName, `${method} ${path} ${status}`, { duration: `${duration}ms` })
  }

  /**
   * Log database query
   */
  query(sql: string, params?: any[], duration?: number): void {
    this.debug('Database query', {
      sql: sql.trim().replace(/\s+/g, ' '),
      params,
      ...(duration && { duration: `${duration}ms` })
    })
  }

  /**
   * Log authentication event
   */
  auth(event: 'login' | 'logout' | 'register' | 'failed', userId?: number, metadata?: any): void {
    this.info(`Auth: ${event}`, { userId, ...metadata })
  }

  /**
   * Log business event
   */
  event(eventName: string, metadata?: any): void {
    this.info(`Event: ${eventName}`, metadata)
  }

  /**
   * Measure execution time of a function
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.debug(`${label} completed`, { duration: `${duration}ms` })
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.error(`${label} failed`, error instanceof Error ? error : new Error(String(error)), {
        duration: `${duration}ms`
      })
      throw error
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export logger class for creating child loggers
export { Logger }

