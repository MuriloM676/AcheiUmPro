// Common types used across the application

export interface User {
  id: number
  name: string
  email: string
  role: 'client' | 'provider' | 'admin'
  phone?: string
  location?: string
  status?: 'active' | 'suspended' | 'pending'
  created_at: Date
  updated_at?: Date
}

export interface ServiceRequest {
  id: number
  title: string
  description: string
  category: string
  location: string
  budget?: string
  urgency: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  client_id: number
  created_at: Date
  updated_at?: Date
}

export interface ServiceProposal {
  id: number
  request_id: number
  provider_id: number
  proposed_price: number
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: Date
  updated_at?: Date
}

export interface Appointment {
  id: number
  title: string
  description?: string
  scheduled_date: Date
  client_id: number
  provider_id: number
  request_id?: number
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: Date
  updated_at?: Date
}

export interface Message {
  id: number
  request_id: number
  sender_id: number
  recipient_id: number
  content: string
  attachment_url?: string
  attachment_type?: string
  created_at: Date
}

export interface Notification {
  id: number
  user_id: number
  channel: 'webpush' | 'email' | 'sms' | 'in_app'
  title: string
  body?: string
  metadata?: Record<string, any>
  read_at?: Date
  created_at: Date
}

export interface Service {
  id: number
  provider_id: number
  title: string
  description: string
  category: string
  price: number
  duration?: number
  is_active: boolean
  created_at: Date
  updated_at?: Date
}

export interface Review {
  id: number
  client_id: number
  provider_id: number
  request_id: number
  rating: number
  comment?: string
  created_at: Date
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'client' | 'provider'
  phone?: string
  location?: string
  services?: string[]
}

// Search and filter types
export interface SearchFilters {
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  availability?: boolean
}

export interface ProviderProfile extends User {
  services: Service[]
  reviews: Review[]
  averageRating: number
  totalReviews: number
  completedJobs: number
  availability?: ProviderAvailability[]
}

export interface ProviderAvailability {
  id: number
  provider_id: number
  weekday: number // 0=Sunday, 1=Monday, etc.
  start_time: string // HH:mm format
  end_time: string // HH:mm format
  created_at: Date
}

// Analytics types
export interface AnalyticsData {
  totalEarnings: number
  totalServices: number
  averageRating: number
  monthlyEarnings: { month: string; earnings: number }[]
  servicesByCategory: { category: string; count: number }[]
  recentServices: {
    id: number
    title: string
    amount: number
    date: string
    status: string
  }[]
}

// Error types
export interface ApiError {
  status: number
  message: string
  code?: string
  details?: any
}

// Form types
export interface ServiceRequestForm {
  title: string
  description: string
  category: string
  location: string
  budget?: string
  urgency: 'low' | 'medium' | 'high'
}

export interface AppointmentForm {
  title: string
  description?: string
  scheduled_date: string
  scheduled_time: string
  provider_id?: number
  client_id?: number
}
