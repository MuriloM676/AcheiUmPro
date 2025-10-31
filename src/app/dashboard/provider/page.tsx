'use client'

import { Button } from '@/components/Button'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { toast } from 'react-toastify'

export default function ProviderDashboard() {
  useAuth({ requireAuth: true, allowedRoles: ['provider'] })
  const [availableRequests, setAvailableRequests] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [selectedTab, setSelectedTab] = useState('available')

  useEffect(() => {
    fetchAvailableRequests()
    fetchMyJobs()
  }, [])

  const fetchAvailableRequests = async () => {
    try {
      const response = await api.get('/api/provider/requests')
      setAvailableRequests(response.data)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  const fetchMyJobs = async () => {
    try {
      const response = await api.get('/api/provider/jobs')
      setMyJobs(response.data)
    } catch (error) {
      console.error('Erro ao carregar meus trabalhos:', error)
    }
  }

  const handleAcceptRequest = async (requestId: number, proposedPrice: string) => {
    try {
      // Prefer RESTful endpoint under requests/{id}/proposals
      try {
        await api.post(`/api/requests/${requestId}/proposals`, { proposedPrice })
      } catch (err) {
        // fallback to older compatibility route
        await api.post('/api/provider/accept', { requestId, proposedPrice })
      }

      toast.success('Proposta enviada com sucesso!')
      fetchAvailableRequests()
      fetchMyJobs()
    } catch (error) {
      toast.error('Erro ao enviar proposta')
    }
  }

  const RequestCard = ({ request, isMyJob = false }: { request: any, isMyJob?: boolean }) => {
    const [showPriceForm, setShowPriceForm] = useState(false)
    const [proposedPrice, setProposedPrice] = useState('')

    const submitProposal = () => {
      if (!proposedPrice) {
        toast.error('Digite um valor para a proposta')
        return
      }
      handleAcceptRequest(request.id, proposedPrice)
      setShowPriceForm(false)
      setProposedPrice('')
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
            <p className="text-gray-600 mt-1">{request.description}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span>📍 {request.location}</span>
              <span>🏷️ {request.category}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {request.urgency === 'high' ? 'Urgente' :
                 request.urgency === 'medium' ? 'Média' : 'Baixa'}
              </span>
              {request.budget && <span>💰 {request.budget}</span>}
            </div>
            {isMyJob && request.proposedPrice && (
              <div className="mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  Sua proposta: R$ {request.proposedPrice}
                </span>
              </div>
            )}
          </div>

          <div className="ml-4">
            {!isMyJob && !showPriceForm && (
              <Button onClick={() => setShowPriceForm(true)} size="sm">
                Fazer Proposta
              </Button>
            )}

            {showPriceForm && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Seu preço (R$)"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="w-32 p-2 border rounded text-sm"
                />
                <div className="flex space-x-1">
                  <Button onClick={submitProposal} size="sm">
                    Enviar
                  </Button>
                  <Button
                    onClick={() => setShowPriceForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {isMyJob && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.status === 'pending' ? 'Aguardando' :
                 request.status === 'accepted' ? 'Aceito' : 'Finalizado'}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard do Profissional</h1>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSelectedTab('available')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'available'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Solicitações Disponíveis ({availableRequests.length})
                </button>
                <button
                  onClick={() => setSelectedTab('my-jobs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'my-jobs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Meus Trabalhos ({myJobs.length})
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {selectedTab === 'available' && (
                <div className="space-y-4">
                  {availableRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma solicitação disponível no momento</p>
                      <p className="text-sm text-gray-400">Volte mais tarde para ver novas oportunidades</p>
                    </div>
                  ) : (
                    availableRequests.map((request: any) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  )}
                </div>
              )}

              {selectedTab === 'my-jobs' && (
                <div className="space-y-4">
                  {myJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Você ainda não possui trabalhos</p>
                      <p className="text-sm text-gray-400">Faça propostas nas solicitações disponíveis</p>
                    </div>
                  ) : (
                    myJobs.map((job: any) => (
                      <RequestCard key={job.id} request={job} isMyJob={true} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
