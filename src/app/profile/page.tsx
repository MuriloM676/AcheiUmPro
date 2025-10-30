'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

type UserRole = 'client' | 'provider'

interface ProfilePayload {
  id: number
  email: string
  name: string
  role: UserRole
  created_at: string
  provider_id?: number
  location?: string | null
  phone?: string | null
  description?: string | null
  photo_url?: string | null
}

interface FormState {
  name: string
  phone: string
  location: string
  description: string
  photo_url: string
}

function ProfileContent() {
  const router = useRouter()
  const { token, user, logout } = useAuth({ requireAuth: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [formState, setFormState] = useState<FormState>({
    name: '',
    phone: '',
    location: '',
    description: '',
    photo_url: ''
  })

  const isProvider = profile?.role === 'provider'

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return

      try {
        setLoading(true)
        const { data } = await api.get('/api/profile')

        const fetchedProfile: ProfilePayload = data.profile
        setProfile(fetchedProfile)
        setFormState({
          name: fetchedProfile.name || '',
          phone: fetchedProfile.phone || '',
          location: fetchedProfile.location || '',
          description: fetchedProfile.description || '',
          photo_url: fetchedProfile.photo_url || ''
        })
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.')
          logout()
        } else {
          toast.error(error.response?.data?.error || 'Erro ao carregar perfil')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [logout, token])

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return

    if (!formState.name.trim()) {
      toast.error('Informe um nome válido.')
      return
    }

    try {
      setSaving(true)
      const payload: Record<string, string> = {
        name: formState.name,
        phone: formState.phone,
        location: formState.location
      }

      if (isProvider) {
        payload.description = formState.description
        payload.photo_url = formState.photo_url
      }

      const { data } = await api.put('/api/profile', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      const updatedProfile: ProfilePayload = data.profile
      setProfile(updatedProfile)
      setFormState({
        name: updatedProfile.name || '',
        phone: updatedProfile.phone || '',
        location: updatedProfile.location || '',
        description: updatedProfile.description || '',
        photo_url: updatedProfile.photo_url || ''
      })

      if (user) {
        const updatedUser = {
          ...user,
          name: updatedProfile.name,
          phone: updatedProfile.phone ?? null,
          location: updatedProfile.location ?? null
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        logout()
      } else {
        toast.error(error.response?.data?.error || 'Erro ao atualizar perfil')
      }
    } finally {
      setSaving(false)
    }
  }

  const createdAtLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR')
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Voltar
          </button>
          <p className="text-sm text-gray-400">
            {createdAtLabel ? `Conta criada em ${createdAtLabel}` : ''}
          </p>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Configurações do perfil</h1>
          <p className="text-gray-300">
            Atualize suas informações de contato e apresentação.
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                <p className="text-gray-300">Carregando perfil...</p>
              </div>
            </div>
          ) : profile ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome completo *</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={handleChange('name')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={handleChange('phone')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 90000-0000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Localização</label>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={handleChange('location')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cidade - UF"
                  />
                </div>
              </div>

              {isProvider && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Descrição profissional</label>
                    <textarea
                      rows={4}
                      value={formState.description}
                      onChange={handleChange('description')}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Conte mais sobre sua experiência e diferenciais."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Foto (URL)</label>
                    <input
                      type="url"
                      value={formState.photo_url}
                      onChange={handleChange('photo_url')}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/5">
                <p className="text-sm text-gray-400">
                  Tipo de conta: {isProvider ? 'Prestador' : 'Cliente'}
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push(isProvider ? '/services' : '/search')}
                  >
                    {isProvider ? 'Gerenciar serviços' : 'Buscar profissionais'}
                  </Button>
                  <Button type="submit" isLoading={saving}>
                    Salvar alterações
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-gray-300">
              Não foi possível carregar as informações do perfil.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
