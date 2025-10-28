import { Input } from '@/components/Input'
import { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'

interface Provider {
  id: string
  name: string
  services: string[]
  location: string
  rating: number
  imageUrl: string | null
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useState({
    service: '',
    location: ''
  })

  const { data: providers, isLoading } = useQuery(
    ['providers', searchParams],
    async () => {
      const { data } = await axios.get<Provider[]>('/api/providers', {
        params: searchParams
      })
      return data
    }
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Tipo de serviço"
              value={searchParams.service}
              onChange={(e) =>
                setSearchParams((prev) => ({ ...prev, service: e.target.value }))
              }
            />
            <Input
              placeholder="Localização"
              value={searchParams.location}
              onChange={(e) =>
                setSearchParams((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers?.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="h-48 bg-gray-200">
                  {provider.imageUrl && (
                    <img
                      src={provider.imageUrl}
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {provider.location}
                  </p>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < provider.rating ? 'fill-current' : 'fill-gray-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm ml-2">
                      {provider.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <span
                        key={service}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}