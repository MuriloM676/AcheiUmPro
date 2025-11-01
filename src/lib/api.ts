import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios'
import { ApiResponse, ApiError } from '@/types'
import { LOCAL_STORAGE_KEYS, API_ENDPOINTS } from '@/lib/constants'
import { logger, createApiError } from '@/lib/utils'

interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

class ApiClient {
  private client: AxiosInstance
  private retryAttempts: number
  private retryDelay: number

  constructor(config: ApiClientConfig = {}) {
    const {
      baseURL = process.env.NEXT_PUBLIC_API_URL || '',
      timeout = 30000,
      retryAttempts = 3,
      retryDelay = 1000
    } = config

    this.retryAttempts = retryAttempts
    this.retryDelay = retryDelay

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        try {
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
            if (token && config.headers) {
              config.headers.Authorization = `Bearer ${token}`
            }
          }
        } catch (error) {
          logger.warn('Failed to add auth token to request:', error)
        }

        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`)
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
          this.handleUnauthorized()
          return Promise.reject(this.createApiError(error))
        }

        // Retry logic for certain errors
        if (this.shouldRetry(error) && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true

          for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
              logger.info(`Retrying request (attempt ${attempt}/${this.retryAttempts})`)
              await this.delay(this.retryDelay * attempt)
              return await this.client.request(originalRequest)
            } catch (retryError) {
              if (attempt === this.retryAttempts) {
                logger.error('All retry attempts failed:', retryError)
                break
              }
            }
          }
        }

        return Promise.reject(this.createApiError(error))
      }
    )
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private handleUnauthorized(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER)

        // Only redirect if not already on auth pages
        const currentPath = window.location.pathname
        const isAuthPage = currentPath === '/login' || currentPath === '/register'

        if (!isAuthPage) {
          logger.info('Unauthorized access, redirecting to login')
          window.location.replace('/login')
        }
      }
    } catch (error) {
      logger.error('Error handling unauthorized response:', error)
    }
  }

  private createApiError(error: AxiosError): ApiError {
    const response = error.response
    const message = response?.data?.message || response?.data?.error || error.message || 'An error occurred'
    const status = response?.status || 500
    const code = response?.data?.code || error.code

    logger.error('API Error:', { message, status, code, url: error.config?.url })

    return createApiError(message, status, code)
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data.data || response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data.data || response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data.data || response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data.data || response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data.data || response.data
  }

  // Convenience methods for file uploads
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    }

    return this.post(url, formData, config)
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health')
      return true
    } catch (error) {
      logger.error('Health check failed:', error)
      return false
    }
  }

  // Get raw axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client
  }
}

// Create singleton instance
const apiClient = new ApiClient()

export default apiClient

// Export convenience methods for backward compatibility
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  uploadFile: apiClient.uploadFile.bind(apiClient),
  healthCheck: apiClient.healthCheck.bind(apiClient)
}
