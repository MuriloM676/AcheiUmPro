'use client'

import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

interface Service {
  id: number
  name: string
  price: number | null
}

interface Provider {
  provider_id: number
  user_id: number
  name: string
  email: string
  phone: string | null
  location: string | null
  description: string | null
  photo_url: string | null
  avg_rating: number
  reviews_count: number
  services: Service[]
  is_verified?: boolean
  recommendation_score?: number
  next_availability?: string | null
  is_top_rated?: boolean
}

interface ProvidersResponse {
  providers: Provider[]
}

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [requestDescription, setRequestDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  const { data, isLoading, error } = useQuery<ProvidersResponse>({
    queryKey: ['providers', debouncedQuery, serviceFilter],
    queryFn: async () => {
      const params: any = {}
      if (debouncedQuery) params.q = debouncedQuery
      if (serviceFilter) params.service = serviceFilter
      
      const { data } = await axios.get('/api/providers', { params })
      return data
    },
  })

  const handleSearch = () => {
    setDebouncedQuery(searchQuery)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleOpenRequestModal = (provider: Provider) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.info('Faça login para solicitar serviços')
      router.push('/login')
      return
    }
    setSelectedProvider(provider)
    setSelectedServiceId(provider.services.length > 0 ? provider.services[0].id : null)
    setShowRequestModal(true)
  }

  const handleCloseRequestModal = () => {
    setShowRequestModal(false)
    setSelectedProvider(null)
    setSelectedServiceId(null)
    setRequestDescription('')
    setScheduledDate('')
  }

  const handleSubmitRequest = async () => {
    if (!selectedProvider) return

    try {
      setSubmittingRequest(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.info('Faça login para solicitar serviços')
        router.push('/login')
        return
      }

      await axios.post('/api/requests', {
        provider_id: selectedProvider.provider_id,
        service_id: selectedServiceId,
        description: requestDescription,
        scheduled_at: scheduledDate || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Solicitação enviada com sucesso!')
      handleCloseRequestModal()
      router.push('/dashboard')
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        router.push('/login')
      } else {
        toast.error(error.response?.data?.error || 'Erro ao enviar solicitação')
      }
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Encontre Profissionais
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por nome, localização ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="md:col-span-2"
            />
            <Button onClick={handleSearch} variant="primary">
              Buscar
            </Button>
          </div>
          <div className="mt-4">
            <Input
              placeholder="Filtrar por serviço específico (ex: Encanador)"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Erro ao carregar profissionais. Tente novamente.
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando profissionais...</p>
          </div>
        ) : data?.providers && data.providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.providers.map((provider) => (
              <div
                key={provider.provider_id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  {provider.photo_url ? (
                    <img
                      src={provider.photo_url}
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl text-white">👤</div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {provider.name}
                  </h3>
                  {provider.location && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 flex items-center">
                      <span className="mr-1">📍</span> {provider.location}
                    </p>
                  )}
                  {provider.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                      {provider.description}
                    </p>
                  )}
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(provider.avg_rating) ? 'fill-current' : 'fill-gray-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                      {provider.avg_rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-500 text-sm ml-2">
                      ({provider.reviews_count || 0} avaliações)
                    </span>
                    {typeof provider.recommendation_score === 'number' && (
                      <span className="text-gray-500 dark:text-gray-500 text-sm ml-2">
                        Score {provider.recommendation_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  {provider.services && provider.services.length > 0 && (
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {provider.is_top_rated && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200">
                            ⭐ Top Rated
                          </span>
                        )}
                        {provider.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-200">
                            ✅ Verificado
                          </span>
                        )}
                        {provider.next_availability && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
                            ⏰ Próximo horário: {provider.next_availability}
                          </span>
                        )}
                      </div>

                      {provider.services && provider.services.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Serviços:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {provider.services.map((service) => (
                              <span
                                key={service.id}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium"
                              >
                                {service.name}
                                {service.price && ` - R$ ${service.price.toFixed(2)}`}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {provider.phone && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={`tel:${provider.phone}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                      >
                        <span className="mr-1">📞</span> {provider.phone}
                      </a>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleOpenRequestModal(provider)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Solicitar Serviço
                    </button>
                    <button
                      onClick={() => router.push(`/provider/${provider.provider_id}`)}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Ver perfil do prestador
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Nenhum profissional encontrado. Tente outra busca.
            </p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Solicitar Serviço
              </h2>
              <button
                onClick={handleCloseRequestModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Prestador:</strong> {selectedProvider.name}
              </p>
              {selectedProvider.location && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  📍 {selectedProvider.location}
                </p>
              )}
            </div>

            {selectedProvider.services.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Serviço (opcional)
                </label>
                <select
                  value={selectedServiceId || ''}
                  onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione um serviço</option>
                  {selectedProvider.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} {service.price && `- R$ ${service.price.toFixed(2)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data desejada (opcional)
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição do serviço (opcional)
              </label>
              <textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="Descreva o que você precisa..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseRequestModal}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submittingRequest}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingRequest ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}