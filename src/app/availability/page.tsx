'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

interface AvailabilitySlot {
  id: number
  provider_id: number
  weekday: number
  start_time: string
  end_time: string
}

export default function AvailabilityManagementPage() {
  const router = useRouter()
  const { user, token } = useAuth({ requireAuth: true })
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [providerId, setProviderId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSlot, setNewSlot] = useState({ weekday: 1, start_time: '09:00', end_time: '17:00' })
  const [submitting, setSubmitting] = useState(false)

  const weekdayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  useEffect(() => {
    if (user?.role !== 'provider') {
      toast.error('Apenas prestadores podem gerenciar disponibilidade')
      router.push('/dashboard')
      return
    }

    async function fetchData() {
      try {
        const authToken = token || localStorage.getItem('token')
        if (!authToken) {
          router.push('/login')
          return
        }

        const provRes = await axios.get('/api/providers', { headers: { Authorization: `Bearer ${authToken}` } })
        const myProvider = provRes.data.providers?.find((p: any) => p.user_id === user.id)
        if (!myProvider) {
          toast.error('Perfil de prestador não encontrado')
          return
        }
        setProviderId(myProvider.provider_id)

        const availRes = await axios.get(`/api/availability?provider_id=${myProvider.provider_id}`)
        setSlots(availRes.data.availability || [])
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Erro ao carregar disponibilidade')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, token, router])

  const handleAddSlot = async () => {
    if (!providerId) return
    try {
      setSubmitting(true)
      const authToken = token || localStorage.getItem('token')
      if (!authToken) {
        router.push('/login')
        return
      }

      await axios.post('/api/availability', { weekday: Number(newSlot.weekday), start_time: newSlot.start_time + ':00', end_time: newSlot.end_time + ':00' }, { headers: { Authorization: `Bearer ${authToken}` } })
      toast.success('Horário adicionado')
      setShowAddModal(false)
      setNewSlot({ weekday: 1, start_time: '09:00', end_time: '17:00' })
      const availRes = await axios.get(`/api/availability?provider_id=${providerId}`)
      setSlots(availRes.data.availability || [])
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar horário')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSlot = async (id: number) => {
    try {
      const authToken = token || localStorage.getItem('token')
      if (!authToken) return
      await axios.delete('/api/availability', { headers: { Authorization: `Bearer ${authToken}` }, data: { id } })
      toast.success('Horário removido')
      setSlots(slots.filter(s => s.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover horário')
    }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Disponibilidade</h1>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>Voltar</Button>
            <Button onClick={() => setShowAddModal(true)}>Adicionar Horário</Button>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/70 mb-4">Você ainda não cadastrou horários de disponibilidade.</p>
            <Button onClick={() => setShowAddModal(true)}>Adicionar primeiro horário</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slots.map((slot) => (
              <div key={slot.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-lg">{weekdayLabels[slot.weekday]}</p>
                  <p className="text-white/70">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</p>
                </div>
                <Button variant="secondary" onClick={() => handleDeleteSlot(slot.id)}>Remover</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Adicionar Horário</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Dia da semana</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" value={newSlot.weekday} onChange={(e) => setNewSlot({ ...newSlot, weekday: Number(e.target.value) })}>
                {weekdayLabels.map((label, idx) => (
                  <option key={idx} value={idx}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Hora início</label>
                <input type="time" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Hora fim</label>
                <input type="time" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAddSlot} isLoading={submitting}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
