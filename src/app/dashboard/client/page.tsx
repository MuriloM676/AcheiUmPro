'use client'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'
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
  const { user, logout } = useAuth({ requireAuth: true, allowedRoles: ['client'] })
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)

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
      const response = await axios.get('/api/requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setRequests(response.data)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  const onSubmit = async (data: ServiceRequestForm) => {
    try {
      await axios.post('/api/requests', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
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
              <Button onClick={() => setShowForm(true)}>
                Nova Solicitação
              </Button>
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
                      <div>
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
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          request.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status === 'pending' ? 'Aguardando' :
                           request.status === 'accepted' ? 'Aceito' : 'Finalizado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
