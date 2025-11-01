import { VALIDATION } from '@/lib/constants'

// Data formatting utilities
export const formatters = {
  // Format phone number to Brazilian standard
  phone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  },

  // Format currency to Brazilian Real
  currency: (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  },

  // Format date to Brazilian format
  date: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR')
  },

  // Format datetime to Brazilian format
  datetime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('pt-BR')
  },

  // Format time only
  time: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // Truncate text with ellipsis
  truncate: (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
  },

  // Capitalize first letter of each word
  capitalize: (text: string): string => {
    return text.replace(/\b\w/g, char => char.toUpperCase())
  },

  // Format file size
  fileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}

// Data validation utilities
export const validators = {
  email: (email: string): boolean => {
    return VALIDATION.EMAIL_PATTERN.test(email)
  },

  phone: (phone: string): boolean => {
    return VALIDATION.PHONE_PATTERN.test(phone)
  },

  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  cpf: (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '')

    if (cleaned.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleaned)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i)
    }

    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned[9])) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i)
    }

    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0

    return remainder === parseInt(cleaned[10])
  },

  cnpj: (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '')

    if (cleaned.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cleaned)) return false

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights1[i]
    }

    let remainder = sum % 11
    const digit1 = remainder < 2 ? 0 : 11 - remainder

    if (digit1 !== parseInt(cleaned[12])) return false

    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weights2[i]
    }

    remainder = sum % 11
    const digit2 = remainder < 2 ? 0 : 11 - remainder

    return digit2 === parseInt(cleaned[13])
  }
}

// Data transformation utilities
export const transformers = {
  // Remove all non-numeric characters
  numbersOnly: (value: string): string => {
    return value.replace(/\D/g, '')
  },

  // Remove all non-alphanumeric characters
  alphanumericOnly: (value: string): string => {
    return value.replace(/[^a-zA-Z0-9]/g, '')
  },

  // Normalize text for search (remove accents, lowercase, etc.)
  normalizeSearch: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
  },

  // Convert string to slug (URL-friendly)
  slug: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '')
  },

  // Extract numbers from string
  extractNumbers: (text: string): number[] => {
    const matches = text.match(/\d+/g)
    return matches ? matches.map(Number) : []
  },

  // Parse price from string
  parsePrice: (price: string): number => {
    const cleaned = price.replace(/[^\d,.-]/g, '')
    const normalized = cleaned.replace(',', '.')
    return parseFloat(normalized) || 0
  }
}

// Mask utilities for input formatting
export const masks = {
  phone: (value: string): string => {
    const cleaned = transformers.numbersOnly(value)
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  },

  cpf: (value: string): string => {
    const cleaned = transformers.numbersOnly(value)
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  },

  cnpj: (value: string): string => {
    const cleaned = transformers.numbersOnly(value)
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  },

  cep: (value: string): string => {
    const cleaned = transformers.numbersOnly(value)
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
  },

  currency: (value: string): string => {
    const cleaned = transformers.numbersOnly(value)
    const number = parseInt(cleaned) / 100
    return formatters.currency(number)
  }
}

// Data comparison utilities
export const comparators = {
  // Deep equality check
  deepEqual: (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true

    if (obj1 == null || obj2 == null) return false

    if (typeof obj1 !== typeof obj2) return false

    if (typeof obj1 !== 'object') return obj1 === obj2

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!comparators.deepEqual(obj1[key], obj2[key])) return false
    }

    return true
  },

  // Check if object has changed
  hasChanged: (original: any, current: any): boolean => {
    return !comparators.deepEqual(original, current)
  },

  // Get changed fields
  getChangedFields: (original: any, current: any): string[] => {
    const changes: string[] = []

    if (typeof original !== 'object' || typeof current !== 'object') {
      return original !== current ? ['value'] : []
    }

    const allKeys = new Set([...Object.keys(original || {}), ...Object.keys(current || {})])

    for (const key of allKeys) {
      if (!comparators.deepEqual(original?.[key], current?.[key])) {
        changes.push(key)
      }
    }

    return changes
  }
}

// Array utilities
export const arrayUtils = {
  // Remove duplicates from array
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)]
  },

  // Group array by key
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      if (!groups[group]) groups[group] = []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  // Sort array by multiple criteria
  sortBy: <T>(array: T[], ...sortKeys: (keyof T)[]): T[] => {
    return [...array].sort((a, b) => {
      for (const key of sortKeys) {
        const aVal = a[key]
        const bVal = b[key]

        if (aVal < bVal) return -1
        if (aVal > bVal) return 1
      }
      return 0
    })
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Export all utilities
export {
  formatters as format,
  validators as validate,
  transformers as transform,
  masks as mask,
  comparators as compare,
  arrayUtils as array
}
