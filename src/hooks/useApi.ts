
export function useDeleteResource(options: UseApiOptions = {}) {
  return useApi<{ message: string }>({
    ...options,
    showSuccessToast: true
  })
}

export function useFetchData<T = any>(options: UseApiOptions = {}) {
  return useApi<T>({
    ...options,
    showErrorToast: true
  })
}
'use client'

import { useState, useCallback } from 'react'
import { ApiError } from '@/types'
import { logger } from '@/lib/utils'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const { onSuccess, onError, showSuccessToast = false, showErrorToast = true } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()

      setState({
        data: result,
        loading: false,
        error: null
      })

      if (onSuccess) {
        onSuccess(result)
      }

      if (showSuccessToast && successMessage) {
        // Toast notification would go here
        logger.info(successMessage)
      }

      return result
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred'

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))

      logger.error('API call failed:', error)

      if (onError) {
        onError(error)
      }

      if (showErrorToast) {
        // Toast notification would go here
        logger.error(errorMessage)
      }

      return null
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading,
    hasError: Boolean(state.error),
    hasData: Boolean(state.data)
  }
}

// Specialized hooks for common operations

export function useAsyncOperation<T = any>(options: UseApiOptions = {}) {
  return useApi<T>(options)
}

export function useCreateResource<T = any>(options: UseApiOptions = {}) {
  return useApi<T>({
    ...options,
    showSuccessToast: true
  })
}

export function useUpdateResource<T = any>(options: UseApiOptions = {}) {
  return useApi<T>({
    ...options,
    showSuccessToast: true
  })
}
