'use client'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { toast } from 'react-toastify'

const serviceRequestSchema = z.object({
  title: z.string().min(10, 'Título deve ter no mínimo 10 caracteres'),
  description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
  location: z.string().min(5, 'Localização é obrigatória'),
  budget: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high'])
})

type ServiceRequestForm = z.infer<typeof serviceRequestSchema>

const categories = [
  'Eletricista', 'Encanador', 'Pintor', 'Pedreiro', 'Marceneiro',
  'Jardineiro', 'Limpeza', 'Reformas', 'Ar Condicionado', 'Outros'
]

export default function ClientDashboard() {
  useAuth({ requireAuth: true, allowedRoles: ['client'] })
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ServiceRequestForm>({
    resolver: zodResolver(serviceRequestSchema)
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/requests')
      setRequests(response.data)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  const deleteRequest = async (requestId: number) => {
    if (!confirm('Deseja realmente excluir esta solicitação?')) return
    try {
      await api.delete(`/api/requests/${requestId}`)
      toast.success('Solicitação excluída')
      fetchRequests()
    } catch (error) {
      toast.error('Erro ao excluir solicitação')
    }
  }

  const viewProposals = async (request: any) => {
    try {
      const response = await api.get(`/api/requests/${request.id}`)
      setSelectedRequest(request)
      setProposals(response.data.proposals || [])
    } catch (error) {
      toast.error('Erro ao carregar propostas')
    }
  }

  const acceptProposal = async (proposalId: number) => {
    if (!confirm('Deseja aceitar esta proposta? As outras serão rejeitadas automaticamente.')) return
    try {
      await api.patch(`/api/proposals/${proposalId}`, { action: 'accept' })
      toast.success('Proposta aceita com sucesso!')
      setSelectedRequest(null)
      setProposals([])
      fetchRequests()
    } catch (error) {
      toast.error('Erro ao aceitar proposta')
    }
  }

  const rejectProposal = async (proposalId: number) => {
    if (!confirm('Deseja rejeitar esta proposta?')) return
    try {
      await api.patch(`/api/proposals/${proposalId}`, { action: 'reject' })
      toast.success('Proposta rejeitada')
      viewProposals(selectedRequest)
    } catch (error) {
      toast.error('Erro ao rejeitar proposta')
    }
  }

  const onSubmit = async (data: ServiceRequestForm) => {
    try {
      await api.post('/api/requests', data)
      toast.success('Solicitação criada com sucesso!')
      reset()
      setShowForm(false)
      fetchRequests()
    } catch (error) {
      toast.error('Erro ao criar solicitação')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard do Cliente</h1>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Minhas Solicitações</h2>
              <div className="flex gap-4">
                <Button
                  onClick={() => window.location.href = '/calendar'}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Calendário
                </Button>
                <Button onClick={() => setShowForm(true)}>
                  Nova Solicitação
                </Button>
              </div>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-4">Criar Nova Solicitação</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Título do Serviço"
                    {...register('title')}
                    error={errors.title?.message}
                    placeholder="Ex: Trocar resistência do chuveiro"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      {...register('category')}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição Detalhada
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva o problema ou serviço necessário..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                  </div>

                  <Input
                    label="Localização"
                    {...register('location')}
                    error={errors.location?.message}
                    placeholder="Endereço ou região"
                  />

                  <Input
                    label="Orçamento Esperado (opcional)"
                    {...register('budget')}
                    placeholder="Ex: R$ 100 - R$ 200"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgência
                    </label>
                    <select
                      {...register('urgency')}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Baixa - Posso aguardar</option>
                      <option value="medium">Média - Alguns dias</option>
                      <option value="high">Alta - Urgente</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <Button type="submit" isLoading={isSubmitting}>
                      Criar Solicitação
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma solicitação encontrada</p>
                  <p className="text-sm text-gray-400">Crie sua primeira solicitação clicando no botão acima</p>
                </div>
              ) : (
                requests.map((request: any) => (
                  <div key={request.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                        <p className="text-gray-600 mt-1">{request.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
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
                          {request.proposalCount > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              {request.proposalCount} {request.proposalCount === 1 ? 'Proposta' : 'Propostas'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col space-y-2 items-end">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            request.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                            request.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status === 'pending' ? 'Aguardando' :
                             request.status === 'in_progress' ? 'Em Andamento' :
                             request.status === 'completed' ? 'Finalizado' : request.status}
                          </span>
                          {request.proposalCount > 0 && (
                            <Button
                              onClick={() => viewProposals(request)}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Ver Propostas
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteRequest(request.id)}
                            variant="outline"
                            size="sm"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal de Propostas */}
            {selectedRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.title}</h2>
                        <p className="text-gray-600 mt-1">{selectedRequest.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(null)
                          setProposals([])
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Propostas Recebidas ({proposals.length})
                    </h3>

                    {proposals.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma proposta recebida ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {proposals.map((proposal: any) => (
                          <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h4 className="text-lg font-medium text-gray-900">{proposal.provider_name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {proposal.status === 'pending' ? 'Pendente' :
                                     proposal.status === 'accepted' ? 'Aceita' : 'Rejeitada'}
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                  R$ {parseFloat(proposal.proposed_price).toFixed(2)}
                                </p>
                                {proposal.message && (
                                  <p className="text-gray-600 mt-2">{proposal.message}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  <span>📧 {proposal.provider_email}</span>
                                  {proposal.provider_phone && (
                                    <span>📱 {proposal.provider_phone}</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  Enviado em: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              {proposal.status === 'pending' && (
                                <div className="flex space-x-2 ml-4">
                                  <Button
                                    onClick={() => acceptProposal(proposal.id)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Aceitar
                                  </Button>
                                  <Button
                                    onClick={() => rejectProposal(proposal.id)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
