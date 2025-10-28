'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

interface ConversationPreview {
  request_id: number
  counterpart_name: string
  last_message: string | null
  updated_at: string
  last_sender_name: string | null
}

interface MessageItem {
  id: number
  request_id: number
  sender_id: number
  recipient_id: number
  content: string | null
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
  sender_name: string
}

function MessagesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const { user, token } = useAuth({ requireAuth: true })
  const userId = useMemo(() => user?.id ?? null, [user])

  const loadConversations = async () => {
    try {
      setLoading(true)
      if (!token || !user) {
        router.replace('/login')
        return
      }

      const { data } = await axios.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const previews: ConversationPreview[] = (data.requests || []).map((request: any) => {
        let counterpartName = request.provider_name || request.client_name

        if (user?.role === 'provider') {
          counterpartName = request.client_name
        } else if (user?.role === 'admin') {
          counterpartName = `${request.client_name} -> ${request.provider_name}`
        }

        if (!counterpartName) {
          counterpartName = 'Contato'
        }

        return {
          request_id: request.id,
          counterpart_name: counterpartName,
          last_message: request.last_message || request.description,
          last_sender_name: request.last_sender_name || null,
          updated_at: request.last_message_at || request.created_at
        }
      })

      setConversations(previews)

      const hasSelected = selectedRequest ? previews.some((item) => item.request_id === selectedRequest) : false

      if (!selectedRequest && previews.length) {
        setSelectedRequest(previews[0].request_id)
      } else if (selectedRequest && !hasSelected) {
        setSelectedRequest(previews.length ? previews[0].request_id : null)
      } else if (!previews.length) {
        setSelectedRequest(null)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar conversas')
      if (error.response?.status === 401) {
        router.replace('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (requestId: number) => {
    try {
      if (!token) return
      const { data } = await axios.get(`/api/messages/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(data.messages || [])
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar mensagens')
    }
  }

  useEffect(() => {
    if (!token || !user) {
      return
    }
    loadConversations()
  }, [token, user])

  useEffect(() => {
    if (!token || !selectedRequest) {
      return
    }
    loadMessages(selectedRequest)
  }, [selectedRequest, token])

  useEffect(() => {
    if (selectedRequest === null) {
      setMessages([])
    }
  }, [selectedRequest])

  useEffect(() => {
    if (selectedRequest) {
      setMessageText('')
    }
  }, [selectedRequest])

  useEffect(() => {
    if (!selectedRequest || !token) return

    const interval = setInterval(() => {
      loadMessages(selectedRequest)
    }, 7000)

    return () => clearInterval(interval)
  }, [selectedRequest, token])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRequest || !token) return

    try {
      setSending(true)
      const { data } = await axios.post(`/api/messages/${selectedRequest}`, {
        content: messageText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

  setMessages((prev) => [...prev, data.message])
  setMessageText('')
  loadConversations().catch(() => null)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-xs" onClick={() => router.push('/dashboard')}>
              ← Voltar
            </Button>
          </div>
          {loading ? (
            <p className="text-white/60 text-sm">Carregando...</p>
          ) : conversations.length === 0 ? (
            <p className="text-white/60 text-sm">Nenhuma conversa disponível.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.request_id}
                className={`w-full text-left px-3 py-2 rounded-lg border border-transparent transition-colors ${selectedRequest === conversation.request_id ? 'bg-blue-500/20 border-blue-400/40' : 'hover:bg-white/10'}`}
                onClick={() => setSelectedRequest(conversation.request_id)}
              >
                <p className="font-semibold text-sm">{conversation.counterpart_name}</p>
                {conversation.last_message && (
                  <p className="text-xs text-white/60 line-clamp-1">
                    {conversation.last_sender_name ? `${conversation.last_sender_name}: ` : ''}
                    {conversation.last_message}
                  </p>
                )}
                <p className="text-[10px] text-white/40 mt-1">
                  {new Date(conversation.updated_at).toLocaleString('pt-BR')}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-[70vh]">
          {!selectedRequest ? (
            <div className="flex-1 flex items-center justify-center text-white/60">
              Selecione uma conversa para começar.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {messages.map((message) => {
                  const isOwnMessage = userId !== null && message.sender_id === userId
                  return (
                    <div
                      key={message.id}
                      className={`max-w-md rounded-xl px-4 py-3 ${isOwnMessage ? 'ml-auto bg-blue-600/40 border border-blue-400/40' : 'bg-white/10 border border-white/10'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/60">{message.sender_name}</p>
                        <span className="text-[10px] text-white/40">
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {message.content && (
                        <p className="text-sm text-white/90 whitespace-pre-line">{message.content}</p>
                      )}
                      {message.attachment_url && (
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-300 underline mt-2 inline-block"
                        >
                          Ver anexo
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Digite uma mensagem"
                    rows={2}
                    className="flex-1 bg-gray-900 border border-white/20 rounded-xl px-3 py-2 text-sm"
                  />
                  <Button onClick={handleSendMessage} isLoading={sending} disabled={!messageText.trim()}>
                    Enviar
                  </Button>
                </div>
                <p className="text-xs text-white/40 mt-2">Envie anexos compartilhando um link para a imagem ou arquivo.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesContent />
    </AuthGuard>
  )
}
