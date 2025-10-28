'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

interface Service {
  id: number
  name: string
  price: number | null
  created_at: string
}

interface Review {
  id: number
  rating: number
  comment: string | null
  created_at: string
  client_name: string
}

interface ProviderDetails {
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
  is_verified?: boolean
  next_availability?: string | null
}

interface ApiResponse {
  provider: ProviderDetails
  services: Service[]
  reviews: Review[]
  availability?: Array<{ weekday: number; start_time: string; end_time: string }>
}

interface ProviderProfileClientProps {
  providerId: string
}

export function ProviderProfileClient({ providerId }: ProviderProfileClientProps) {
  const router = useRouter()
  const { user, token, logout } = useAuth({ requireAuth: false })

  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [error, setError] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [requestDescription, setRequestDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  const numericProviderId = useMemo(() => Number(providerId), [providerId])
  const isClient = user?.role === 'client'
  const isOwnProfile = user?.role === 'provider' && user.id === data?.provider.user_id

  useEffect(() => {
    if (!numericProviderId || Number.isNaN(numericProviderId)) {
      setError('Identificador de prestador inválido.')
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchProvider() {
      try {
        setIsLoading(true)
        const response = await axios.get<ApiResponse>(`/api/providers/${numericProviderId}`)
        if (!cancelled) {
          setData(response.data)
          setSelectedServiceId(response.data.services?.[0]?.id ?? null)
        }
      } catch (err: any) {
        if (!cancelled) {
          const message = err.response?.data?.error || 'Erro ao carregar prestador'
          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchProvider()

    return () => {
      cancelled = true
    }
  }, [numericProviderId])

  const handleOpenRequestModal = () => {
    if (!isClient) {
      toast.info('Entre como cliente para solicitar um serviço.')
      router.push('/login')
      return
    }

    setShowRequestModal(true)
  }

  const handleCloseRequestModal = () => {
    setShowRequestModal(false)
    setRequestDescription('')
    setScheduledDate('')
  }

  const handleSubmitRequest = async () => {
    if (!data?.provider) return

    if (!selectedServiceId && data.services.length > 0) {
      toast.error('Selecione um serviço para continuar.')
      return
    }

    try {
      setSubmittingRequest(true)
      const authToken = token || localStorage.getItem('token')

      if (!authToken) {
        toast.info('Faça login para solicitar serviços')
        router.push('/login')
        return
      }

      await axios.post('/api/requests', {
        provider_id: data.provider.provider_id,
        service_id: selectedServiceId,
        description: requestDescription || null,
        scheduled_at: scheduledDate || null
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      toast.success('Solicitação enviada para o prestador!')
      handleCloseRequestModal()
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar solicitação')
      if (err.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setSubmittingRequest(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando perfil do prestador...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-red-900/30 border border-red-500/70 rounded-lg p-8 max-w-md text-center text-white">
          <p>{error || 'Prestador não encontrado.'}</p>
          <Button className="mt-4" onClick={() => router.push('/search')}>
            Voltar para a busca
          </Button>
        </div>
      </div>
    )
  }

  const { provider, services, reviews } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold uppercase">
                {provider.name?.[0] ?? 'A'}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{provider.name}</h1>
                {provider.location && (
                  <p className="text-white/80 flex items-center gap-2">
                    <span>📍</span>
                    {provider.location}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {provider.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-200">
                      ✅ Prestador verificado
                    </span>
                  )}
                  {provider.next_availability && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-200">
                      ⏰ Próxima disponibilidade: {provider.next_availability}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {provider.description && (
              <p className="text-white/90 max-w-2xl leading-relaxed">
                {provider.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-6 text-white/90 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 text-lg">★</span>
                <span className="font-semibold text-lg">{provider.avg_rating.toFixed(1)}</span>
                <span className="text-white/70">({provider.reviews_count} avaliações)</span>
              </div>
              {provider.phone && <span>📞 {provider.phone}</span>}
              {provider.email && <span>✉️ {provider.email}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isOwnProfile ? (
              <Button variant="secondary" onClick={() => router.push('/services')}>
                Gerenciar meus serviços
              </Button>
            ) : (
              <Button onClick={handleOpenRequestModal}>
                Solicitar serviço
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push('/search')}>
              Voltar para a busca
            </Button>
            {user && (
              <Button variant="outline" onClick={logout}>
                Sair da conta
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Serviços oferecidos</h2>
            {!services.length && <span className="text-white/60 text-sm">Nenhum serviço cadastrado ainda.</span>}
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <div key={service.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                    {service.price ? (
                      <span className="text-sm bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full">
                        R$ {service.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-white/70">Sob consulta</span>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    Atualizado em {new Date(service.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70">Este prestador ainda não cadastrou serviços.</p>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Avaliações</h2>
              <p className="text-white/60 text-sm">Experiências recentes de clientes.</p>
            </div>
            <span className="text-white/70 text-sm">{provider.reviews_count} avaliações no total</span>
          </div>

          {reviews.length === 0 ? (
            <div className="text-white/60">Ainda não há avaliações publicadas para este prestador.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-lg">{review.client_name}</p>
                      <p className="text-xs text-white/60">
                        {new Date(review.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-300">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index}>{index < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="text-white/80 leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-white/50 text-sm italic">Sem comentário adicional.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {data.availability && data.availability.length > 0 && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Disponibilidade</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.availability.map((slot, index) => {
                const weekdayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
                return (
                  <div key={`${slot.weekday}-${slot.start_time}-${index}`} className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm">
                    <p className="font-medium text-white">{weekdayLabels[slot.weekday]}</p>
                    <p className="text-white/70">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Solicitar serviço</h3>
              <button
                onClick={handleCloseRequestModal}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {services.length > 0 ? (
              <div>
                <label className="block text-sm text-white/70 mb-2">Serviço desejado</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  value={selectedServiceId ?? ''}
                  onChange={(event) => setSelectedServiceId(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} {service.price ? `- R$ ${service.price.toFixed(2)}` : '(Sob consulta)'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-white/60 text-sm">O prestador ainda não cadastrou serviços. Descreva sua necessidade abaixo.</p>
            )}

            <div>
              <label className="block text-sm text-white/70 mb-2">Data desejada (opcional)</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Descrição (opcional)</label>
              <textarea
                rows={4}
                value={requestDescription}
                onChange={(event) => setRequestDescription(event.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                placeholder="Descreva o serviço que você precisa"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleCloseRequestModal}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitRequest}
                isLoading={submittingRequest}
              >
                Enviar solicitação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
