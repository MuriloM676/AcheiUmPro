'use client'

import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-toastify'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  useAuth({ requireAuth: true })
  const [request, setRequest] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [proposedPrice, setProposedPrice] = useState('')
  const [message, setMessage] = useState('')

  const requestId = Number(params.id)

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/requests/${requestId}`)
      setRequest(res.data.request)
      setProposals(res.data.proposals || [])
    } catch (err) {
      console.error('Error loading request detail', err)
      toast.error('Erro ao carregar detalhes da solicitação')
    } finally {
      setLoading(false)
    }
  }

  const submitProposal = async () => {
    if (!proposedPrice) return toast.error('Digite um preço')
    try {
      // prefer RESTful route
      await api.post(`/api/requests/${requestId}/proposals`, { proposedPrice, message })
      toast.success('Proposta enviada')
      setProposedPrice('')
      setMessage('')
      fetchData()
    } catch (err) {
      console.error(err)
      // fallback to legacy
      try {
        await api.post('/api/provider/accept', { requestId, proposedPrice, message })
        toast.success('Proposta enviada')
        setProposedPrice('')
        setMessage('')
        fetchData()
      } catch (e) {
        console.error(e)
        toast.error('Erro ao enviar proposta')
      }
    }
  }

  const handleAction = async (proposalId: number, action: 'accept' | 'reject') => {
    try {
      await api.patch(`/api/proposals/${proposalId}`, { action })
      toast.success('Ação realizada')
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao realizar ação')
    }
  }

  if (loading) return <div>Carregando...</div>
  if (!request) return <div>Solicitação não encontrada</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">{request.title}</h1>
      <p className="text-gray-700 mb-2">{request.description}</p>
      <div className="mb-4">
        <strong>Local:</strong> {request.location} • <strong>Categoria:</strong> {request.category}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-blue-600">Propostas</h2>
        {proposals.length === 0 && <div className="text-gray-500">Ainda não há propostas</div>}
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="p-4 bg-white rounded shadow-sm flex justify-between">
              <div>
                <div className="font-medium">{p.provider_name} {p.provider_email ? `(${p.provider_email})` : ''}</div>
                <div className="text-sm text-gray-600">R$ {p.proposed_price}</div>
                {p.message && <div className="text-sm text-gray-500 mt-1">{p.message}</div>}
                <div className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleString()}</div>
              </div>
              <div className="flex flex-col space-y-2">
                {request.client_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string).id : -1) && (
                  <>
                    <Button onClick={() => handleAction(p.id, 'accept')} size="sm">Aceitar</Button>
                    <Button onClick={() => handleAction(p.id, 'reject')} variant="outline" size="sm">Rejeitar</Button>
                  </>
                )}
                <div className={`px-2 py-1 rounded text-sm ${p.status === 'accepted' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-blue-600">Enviar Proposta (para profissionais)</h2>
        <div className="flex space-x-2 items-start">
          <input type="text" placeholder="Seu preço (R$)" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Mensagem (opcional)" value={message} onChange={(e) => setMessage(e.target.value)} className="p-2 border rounded flex-1" />
          <Button onClick={submitProposal} variant="primary">Enviar</Button>
        </div>
      </div>
    </div>
  )
}
