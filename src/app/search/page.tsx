'use client'

import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

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
  services: Service[]
}

interface ProvidersResponse {
  providers: Provider[]
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

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
                      {provider.avg_rating.toFixed(1)}
                    </span>
                  </div>
                  
                  {provider.services && provider.services.length > 0 && (
                    <div>
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
    </div>
  )
}