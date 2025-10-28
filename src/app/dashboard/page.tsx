'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/AuthGuard'
import Link from 'next/link'

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

interface RequestItem {
  id: number
  client_id: number
  provider_id: number
  service_id: number | null
  status: RequestStatus
  scheduled_at: string | null
  description: string | null
  created_at: string
  client_name: string
  client_email: string
  provider_name: string
  provider_phone: string | null
  service_name: string | null
  service_price: string | null
}

const statusLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
  completed: 'Concluída'
}

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-blue-500/20 text-blue-300',
  rejected: 'bg-red-500/20 text-red-300',
  completed: 'bg-green-500/20 text-green-300'
}

function DashboardContent() {
  const { user, token, logout } = useAuth({ requireAuth: true })
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
  const previousPendingIdsRef = useRef<number[]>([])
  const firstLoadRef = useRef(true)

  const isProvider = user?.role === 'provider'

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter((request) => request.status === statusFilter)
  }, [requests, statusFilter])

  const loadRequests = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const { data } = await axios.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setRequests(data.requests || [])
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sessão expirada, faça login novamente.')
        router.replace('/login')
      } else {
        toast.error(error.response?.data?.error || 'Erro ao carregar solicitações')
      }
    } finally {
      setLoading(false)
    }
  }, [router, token])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const loadNotifications = useCallback(async () => {
    if (!token) return

    try {
      const { data } = await axios.get('/api/notifications?status=unread', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setNotifications(data.notifications || [])
      setUnreadNotifications(data.notifications?.length || 0)
    } catch (error) {
      // ignore
    }
  }, [token])

  useEffect(() => {
    loadNotifications()

    const interval = setInterval(() => {
      loadNotifications()
    }, 15000)

    return () => clearInterval(interval)
  }, [loadNotifications])

  useEffect(() => {
    if (!isProvider) return
    const pendingIds = requests.filter((request) => request.status === 'pending').map((request) => request.id)

    if (!firstLoadRef.current) {
      const newIds = pendingIds.filter((id) => !previousPendingIdsRef.current.includes(id))
      if (newIds.length > 0) {
        toast.info(
          newIds.length === 1
            ? 'Você recebeu uma nova solicitação de serviço.'
            : `Você recebeu ${newIds.length} novas solicitações de serviço.`,
          { autoClose: 4000 }
        )
      }
    }

    previousPendingIdsRef.current = pendingIds
    firstLoadRef.current = false
  }, [isProvider, requests])

  const handleUpdateStatus = async (requestId: number, status: RequestStatus) => {
    try {
      await axios.patch(`/api/requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Solicitação atualizada com sucesso')
      loadRequests()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar solicitação')
    }
  }

  const handleOpenReviewModal = async (request: RequestItem) => {
    if (!user) return
    setSelectedRequest(request)
    setReviewRating(5)
    setReviewComment('')
    setReviewModalOpen(true)

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const { data } = await axios.get('/api/reviews', {
        params: { providerId: request.provider_id, clientId: user.id },
        headers
      })

      if (data.reviews && data.reviews.length > 0) {
        setReviewRating(data.reviews[0].rating)
        setReviewComment(data.reviews[0].comment || '')
      }
    } catch (error) {
      // silently ignore if fetching reviews fails
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedRequest) return
    if (!token) {
      toast.error('Sessão expirada, faça login novamente.')
      router.replace('/login')
      return
    }

    try {
      setSavingReview(true)
      await axios.post('/api/reviews', {
        provider_id: selectedRequest.provider_id,
        rating: reviewRating,
        comment: reviewComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Avaliação salva com sucesso!')
      setReviewModalOpen(false)
      setSelectedRequest(null)
      loadRequests()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar avaliação')
    } finally {
      setSavingReview(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AcheiUmPro</h1>
            <p className="text-xs text-gray-300">{isProvider ? 'Painel do prestador' : 'Painel do cliente'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-200">Olá, {user.name || user.email}</span>
            <Link
              href="/notifications"
              className="relative inline-flex items-center justify-center rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              Notificações
              {unreadNotifications > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs">
                  {unreadNotifications}
                </span>
              )}
            </Link>
            <Button
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => router.push('/profile')}
            >
              Meu perfil
            </Button>
            <Button variant="secondary" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 border border-white/10 rounded-xl p-6">
            <p className="text-sm text-gray-300 mb-2">Total de solicitações</p>
            <p className="text-4xl font-bold">{requests.length}</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-6">
            <p className="text-sm text-gray-300 mb-2">Pendentes</p>
            <p className="text-4xl font-bold">{requests.filter((r) => r.status === 'pending').length}</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-6">
            <p className="text-sm text-gray-300 mb-2">Concluídas</p>
            <p className="text-4xl font-bold">{requests.filter((r) => r.status === 'completed').length}</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-6">
            <p className="text-sm text-gray-300 mb-2">Notificações não lidas</p>
            <p className="text-4xl font-bold">{unreadNotifications}</p>
          </div>
        </section>

        <section className="bg-white/10 border border-white/10 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Solicitações recentes</h2>
              <p className="text-gray-300 text-sm">
                {isProvider
                  ? 'Gerencie as solicitações recebidas dos clientes.'
                  : 'Acompanhe o andamento dos seus pedidos.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Filtrar por status:</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as RequestStatus | 'all')}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="accepted">Aceitas</option>
                <option value="completed">Concluídas</option>
                <option value="rejected">Recusadas</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-300">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusColors[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          Criada em {new Date(request.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {request.service_name || 'Serviço sem categoria definida'}
                      </p>
                      {request.description && (
                        <p className="text-sm text-gray-300 max-w-2xl">
                          {request.description}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                        {isProvider ? (
                          <>
                            <p>Cliente: <span className="text-white">{request.client_name}</span></p>
                            <p>Email: {request.client_email}</p>
                          </>
                        ) : (
                          <>
                            <p>Prestador: <span className="text-white">{request.provider_name}</span></p>
                            {request.provider_phone && <p>Contato: {request.provider_phone}</p>}
                          </>
                        )}
                        {request.scheduled_at && (
                          <p>Data agendada: {new Date(request.scheduled_at).toLocaleString('pt-BR')}</p>
                        )}
                        {request.service_price && (
                          <p>Valor estimado: R$ {Number(request.service_price).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      {isProvider ? (
                        <>
                          {request.status === 'pending' && (
                            <>
                              <Button onClick={() => handleUpdateStatus(request.id, 'accepted')}>
                                Aceitar solicitação
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => handleUpdateStatus(request.id, 'rejected')}
                              >
                                Recusar
                              </Button>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <Button onClick={() => handleUpdateStatus(request.id, 'completed')}>
                              Marcar como concluída
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {request.status === 'completed' && (
                            <Button onClick={() => handleOpenReviewModal(request)}>
                              Avaliar prestador
                            </Button>
                          )}
                        </>
                      )}
                      {!isProvider && request.status === 'accepted' && (
                        <p className="text-xs text-gray-400">
                          Serviço em andamento. Aguarde o prestador concluir para avaliar.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!isProvider && (
          <section className="bg-white/10 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Precisa de um novo serviço?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Explore profissionais disponíveis e envie novas solicitações conforme necessário.
            </p>
            <Button onClick={() => router.push('/search')}>Buscar profissionais</Button>
          </section>
        )}

        <section className="bg-white/10 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Mensagens recentes</h3>
              <p className="text-gray-300 text-sm">Acompanhe conversas com seus clientes ou prestadores.</p>
            </div>
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => router.push('/messages')}>
              Abrir chat
            </Button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="bg-black/20 rounded-lg px-4 py-3 text-sm text-gray-200">
                <p className="font-medium text-white">{notif.title}</p>
                <p className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleString('pt-BR')}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma mensagem recente.</p>
            )}
          </div>
        </section>
      </main>

      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-white/10 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-semibold">Avaliar {selectedRequest.provider_name}</h4>
                <p className="text-sm text-gray-400">
                  Conte como foi a experiência, isso ajuda outros clientes.
                </p>
              </div>
              <button
                onClick={() => {
                  setReviewModalOpen(false)
                  setSelectedRequest(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Nota (1 a 5)</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className={`w-10 h-10 rounded-full border transition-colors ${
                      reviewRating >= value
                        ? 'bg-yellow-400 text-black border-yellow-300'
                        : 'border-gray-600 text-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Comentário (opcional)
              </label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva os pontos positivos ou o que pode melhorar..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setReviewModalOpen(false)
                  setSelectedRequest(null)
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitReview}
                isLoading={savingReview}
                className="flex-1"
              >
                Salvar avaliação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
