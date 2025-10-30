import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL || ''

const api = axios.create({
  baseURL,
})

// Add request interceptor to attach token from localStorage (only in browser)
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token && config && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor to centralize 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          // clear local auth info and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.replace('/login')
        }
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error)
  }
)

export default api