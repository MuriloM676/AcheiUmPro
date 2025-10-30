'use client'

import api from '@/lib/api'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'

interface NotificationItem {
  id: number
  channel: 'webpush' | 'email' | 'sms' | 'in_app'
  title: string
  body: string
  metadata?: Record<string, unknown>
  read_at: string | null
  created_at: string
}

function NotificationsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [marking, setMarking] = useState(false)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      // api interceptor will attach token; if not present, redirect to login
      if (!localStorage.getItem('token')) {
        router.replace('/login')
        return
      }

      const { data } = await api.get('/api/notifications')

      setNotifications(data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAll = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (!unreadIds.length) return

    try {
      setMarking(true)
      await api.patch('/api/notifications', { ids: unreadIds })
      setNotifications((prev) => prev.filter((n) => !unreadIds.includes(n.id)))
      toast.success('Notificações marcadas como lidas')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao marcar notificações')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notificações</h1>
            <p className="text-white/60 text-sm">Centralize alertas e atualizações importantes.</p>
          </div>
          <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => router.push('/dashboard')}>
            ← Dashboard
          </Button>
        </div>

        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
          <div>
            <p className="text-sm text-white/70">
              {notifications.filter((n) => !n.read_at).length} notificações não lidas
            </p>
          </div>
          <Button onClick={handleMarkAll} disabled={marking || notifications.every((n) => n.read_at)}>
            Marcar todas como lidas
          </Button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-white/80">Carregando notificações...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-white/80">Nenhuma notificação encontrada.</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-colors ${notification.read_at ? 'bg-transparent' : 'bg-blue-500/5'} `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-white/50">
                        {notification.channel === 'in_app' ? 'In-app' : notification.channel.toUpperCase()}
                      </span>
                      {!notification.read_at && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/30 text-blue-100">
                          Novo
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold">{notification.title}</h2>
                    <p className="text-white/80 text-sm leading-relaxed">{notification.body}</p>
                    {typeof notification.metadata?.requestId === 'number' && (
                      <Button
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 text-xs"
                        onClick={() => router.push(`/requests/${notification.metadata?.requestId}`)}
                      >
                        Ver solicitação relacionada
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-white/50">
                    {new Date(notification.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  )
}
