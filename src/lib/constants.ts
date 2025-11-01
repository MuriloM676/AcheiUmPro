// Application constants

export const APP_CONFIG = {
  NAME: 'AcheiUmPro',
  VERSION: '1.0.0',
  DESCRIPTION: 'Plataforma de Solicitação de Serviços',
  AUTHOR: 'AcheiUmPro Team'
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    SESSION: '/api/auth/session'
  },
  REQUESTS: {
    BASE: '/api/requests',
    BY_ID: (id: number) => `/api/requests/${id}`,
    PROPOSALS: (id: number) => `/api/requests/${id}/proposals`
  },
  PROVIDER: {
    REQUESTS: '/api/provider/requests',
    JOBS: '/api/provider/jobs',
    ACCEPT: '/api/provider/accept'
  },
  PROPOSALS: {
    BY_ID: (id: number) => `/api/proposals/${id}`
  },
  PROFILE: '/api/profile',
  SERVICES: {
    BASE: '/api/services',
    BY_ID: (id: number) => `/api/services/${id}`
  },
  PROVIDERS: {
    BY_ID: (id: number) => `/api/providers/${id}`
  },
  NOTIFICATIONS: '/api/notifications',
  MESSAGES: {
    BY_REQUEST_ID: (requestId: number) => `/api/messages/${requestId}`
  },
  APPOINTMENTS: {
    BASE: '/api/appointments',
    BY_ID: (id: number) => `/api/appointments/${id}`
  },
  ANALYTICS: '/api/analytics',
  REVIEWS: '/api/reviews'
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: {
    BASE: '/dashboard',
    CLIENT: '/dashboard/client',
    PROVIDER: '/dashboard/provider'
  },
  SEARCH: '/search',
  PROFILE: '/profile',
  CALENDAR: '/calendar',
  ANALYTICS: '/analytics',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  SERVICES: '/services',
  PROVIDER_PROFILE: (id: number) => `/provider/${id}`,
  REQUEST_DETAIL: (id: number) => `/requests/${id}`
} as const

export const SERVICE_CATEGORIES = [
  'Eletricista',
  'Encanador',
  'Pintor',
  'Pedreiro',
  'Marceneiro',
  'Jardineiro',
  'Limpeza',
  'Reformas',
  'Ar Condicionado',
  'Outros'
] as const

export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const

export const URGENCY_LABELS = {
  [URGENCY_LEVELS.LOW]: 'Baixa',
  [URGENCY_LEVELS.MEDIUM]: 'Média',
  [URGENCY_LEVELS.HIGH]: 'Urgente'
} as const

export const REQUEST_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.OPEN]: 'Aberta',
  [REQUEST_STATUS.IN_PROGRESS]: 'Em Andamento',
  [REQUEST_STATUS.COMPLETED]: 'Concluída',
  [REQUEST_STATUS.CANCELLED]: 'Cancelada'
} as const

export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
} as const

export const PROPOSAL_STATUS_LABELS = {
  [PROPOSAL_STATUS.PENDING]: 'Pendente',
  [PROPOSAL_STATUS.ACCEPTED]: 'Aceita',
  [PROPOSAL_STATUS.REJECTED]: 'Rejeitada'
} as const

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'Agendado',
  [APPOINTMENT_STATUS.COMPLETED]: 'Concluído',
  [APPOINTMENT_STATUS.CANCELLED]: 'Cancelado'
} as const

export const USER_ROLES = {
  CLIENT: 'client',
  PROVIDER: 'provider',
  ADMIN: 'admin'
} as const

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const

export const NOTIFICATION_CHANNELS = {
  WEBPUSH: 'webpush',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app'
} as const

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 1000,
  PHONE_PATTERN: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const

export const UI = {
  COLORS: {
    PRIMARY: '#2563eb', // blue-600
    SECONDARY: '#6b7280', // gray-500
    SUCCESS: '#10b981', // green-500
    WARNING: '#f59e0b', // yellow-500
    ERROR: '#ef4444', // red-500
    INFO: '#3b82f6' // blue-500
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  },
  ANIMATION: {
    DURATION: {
      FAST: '150ms',
      NORMAL: '300ms',
      SLOW: '500ms'
    }
  }
} as const

export const DATABASE = {
  CONNECTION_LIMIT: 10,
  QUERY_TIMEOUT: 60000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const

export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 5,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_SEARCH_RESULTS: 50
} as const

export const ANALYTICS_PERIODS = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365
} as const

// Type exports for better autocomplete
export type ServiceCategory = typeof SERVICE_CATEGORIES[number]
export type UrgencyLevel = keyof typeof URGENCY_LEVELS
export type RequestStatus = keyof typeof REQUEST_STATUS
export type ProposalStatus = keyof typeof PROPOSAL_STATUS
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS
export type UserRole = keyof typeof USER_ROLES
export type NotificationChannel = keyof typeof NOTIFICATION_CHANNELS
