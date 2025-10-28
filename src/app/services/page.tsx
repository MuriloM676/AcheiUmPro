'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/Button'

interface Service {
  id: number
  provider_id: number
  name: string
  price: number | null
  created_at: string
}

function ServicesContent() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadServices = async () => {
    try {
      setLoading(true)
      const authToken = localStorage.getItem('token')

      if (!authToken) {
        router.replace('/login')
        return
      }

      const { data } = await axios.get('/api/services', {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      setServices(data.services || [])
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Sessão expirada. Faça login novamente.')
        router.replace('/login')
      } else {
        toast.error(err.response?.data?.error || 'Erro ao carregar serviços')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setServiceName(service.name)
      setServicePrice(service.price ? service.price.toString() : '')
    } else {
      setEditingService(null)
      setServiceName('')
      setServicePrice('')
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingService(null)
    setServiceName('')
    setServicePrice('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceName.trim()) {
      toast.error('O nome do serviço é obrigatório')
      return
    }

    try {
      setSubmitting(true)
      const authToken = localStorage.getItem('token')
      const payload = {
        name: serviceName.trim(),
        price: servicePrice ? parseFloat(servicePrice) : null
      }

      if (editingService) {
        await axios.patch(`/api/services/${editingService.id}`, payload, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        toast.success('Serviço atualizado com sucesso')
      } else {
        await axios.post('/api/services', payload, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        toast.success('Serviço criado com sucesso')
      }

      handleCloseModal()
      loadServices()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar serviço')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) {
      return
    }

    try {
      const authToken = localStorage.getItem('token')
      await axios.delete(`/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      toast.success('Serviço excluído com sucesso')
      loadServices()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir serviço')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-white">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Serviços</h1>
            <p className="text-gray-400">Gerencie os serviços que você oferece</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-300"
          >
            ← Voltar
          </button>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="mb-6 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Adicionar Novo Serviço
        </Button>

        {services.length === 0 ? (
          <div className="bg-white/5 rounded-lg border border-white/10 p-12 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <p className="text-gray-400 mb-4">Você ainda não cadastrou nenhum serviço</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Adicionar primeiro serviço
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white/5 rounded-lg border border-white/10 p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {service.price ? (
                        <>💰 R$ {service.price.toFixed(2)}</>
                      ) : (
                        <>💬 Preço sob consulta</>
                      )}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Criado em {new Date(service.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Instalação Elétrica"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="Deixe em branco para 'sob consulta'"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deixe vazio se o preço for sob consulta
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  return (
    <AuthGuard roles={['provider']}>
      <ServicesContent />
    </AuthGuard>
  )
}
