'use client';import { Button } from '@/components/Button'

import { useState } from 'react'

import { useEffect, useState } from 'react';import { useQuery } from 'react-query'

import { useRouter } from 'next/navigation';import axios from 'axios'



interface Request {interface Request {

  id: number;  id: string

  client_id: number;  clientName: string

  provider_id: number;  service: string

  service_id: number | null;  status: 'pending' | 'accepted' | 'rejected' | 'completed'

  status: 'pending' | 'accepted' | 'rejected' | 'completed';  createdAt: string

  scheduled_at: string | null;  description: string

  description: string | null;}

  created_at: string;

  client_name: string;export default function DashboardPage() {

  client_email: string;  const [activeTab, setActiveTab] = useState<'requests' | 'profile' | 'reviews'>('requests')

  provider_name: string;

  provider_phone: string | null;  const { data: requests, isLoading } = useQuery('requests', async () => {

  service_name: string | null;    const { data } = await axios.get<Request[]>('/api/provider/requests')

  service_price: string | null;    return data

}  })



interface UserProfile {  const updateRequestStatus = async (requestId: string, status: Request['status']) => {

  id: number;    try {

  email: string;      await axios.patch(`/api/provider/requests/${requestId}`, { status })

  name: string;      // Revalidate requests

  role: 'client' | 'provider';    } catch (error) {

  created_at: string;      console.error('Error updating request status:', error)

  provider_id?: number;    }

  location?: string;  }

  phone?: string;

  description?: string;  return (

  photo_url?: string;    <div className="min-h-screen bg-gray-50">

}      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">

export default function DashboardPage() {          <div className="border-b border-gray-200">

  const router = useRouter();            <nav className="-mb-px flex">

  const [profile, setProfile] = useState<UserProfile | null>(null);              {(['requests', 'profile', 'reviews'] as const).map((tab) => (

  const [requests, setRequests] = useState<Request[]>([]);                <button

  const [loading, setLoading] = useState(true);                  key={tab}

  const [error, setError] = useState('');                  onClick={() => setActiveTab(tab)}

                  className={`

  useEffect(() => {                    py-4 px-6 text-center border-b-2 font-medium text-sm

    // Load profile and requests                    ${

    const loadData = async () => {                      activeTab === tab

      try {                        ? 'border-blue-500 text-blue-600'

        setLoading(true);                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                            }

        // Get JWT token from localStorage (assuming login stores it there)                  `}

        const token = localStorage.getItem('token');                >

        if (!token) {                  {tab.charAt(0).toUpperCase() + tab.slice(1)}

          router.push('/login');                </button>

          return;              ))}

        }            </nav>

          </div>

        // Fetch profile

        const profileRes = await fetch('/api/profile', {          <div className="p-6">

          headers: { Authorization: `Bearer ${token}` }            {activeTab === 'requests' && (

        });              <div className="space-y-6">

                        {isLoading ? (

        if (!profileRes.ok) {                  <div className="text-center py-12">

          if (profileRes.status === 401) {                    <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>

            router.push('/login');                  </div>

            return;                ) : (

          }                  requests?.map((request) => (

          throw new Error('Failed to load profile');                    <div

        }                      key={request.id}

        const profileData = await profileRes.json();                      className="bg-white border rounded-lg p-4 shadow-sm"

        setProfile(profileData.profile);                    >

                      <div className="flex justify-between items-start">

        // Fetch requests                        <div>

        const requestsRes = await fetch('/api/requests', {                          <h3 className="text-lg font-semibold">

          headers: { Authorization: `Bearer ${token}` }                            {request.clientName}

        });                          </h3>

                                  <p className="text-gray-600">{request.service}</p>

        if (!requestsRes.ok) throw new Error('Failed to load requests');                          <p className="text-sm text-gray-500 mt-1">

        const requestsData = await requestsRes.json();                            {new Date(request.createdAt).toLocaleDateString()}

        setRequests(requestsData.requests || []);                          </p>

      } catch (err: any) {                          <p className="text-gray-700 mt-2">

        setError(err.message || 'Failed to load data');                            {request.description}

      } finally {                          </p>

        setLoading(false);                        </div>

      }                        <div className="flex items-center space-x-2">

    };                          {request.status === 'pending' && (

                            <>

    loadData();                              <Button

  }, [router]);                                variant="primary"

                                onClick={() =>

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {                                  updateRequestStatus(request.id, 'accepted')

    try {                                }

      const token = localStorage.getItem('token');                              >

      const res = await fetch(`/api/requests/${requestId}`, {                                Aceitar

        method: 'PATCH',                              </Button>

        headers: {                              <Button

          'Content-Type': 'application/json',                                variant="outline"

          Authorization: `Bearer ${token}`                                onClick={() =>

        },                                  updateRequestStatus(request.id, 'rejected')

        body: JSON.stringify({ status: newStatus })                                }

      });                              >

                                Recusar

      if (!res.ok) throw new Error('Failed to update request');                              </Button>

                            </>

      // Update local state                          )}

      setRequests(requests.map(req =>                           {request.status === 'accepted' && (

        req.id === requestId ? { ...req, status: newStatus as any } : req                            <Button

      ));                              variant="primary"

    } catch (err: any) {                              onClick={() =>

      alert(err.message || 'Failed to update request');                                updateRequestStatus(request.id, 'completed')

    }                              }

  };                            >

                              Concluir

  if (loading) {                            </Button>

    return (                          )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">                        </div>

        <div className="text-center">                      </div>

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>                      <div className="mt-2">

          <p className="text-white">Carregando dashboard...</p>                        <span

        </div>                          className={`

      </div>                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium

    );                            ${

  }                              request.status === 'pending'

                                ? 'bg-yellow-100 text-yellow-800'

  if (error) {                                : request.status === 'accepted'

    return (                                ? 'bg-green-100 text-green-800'

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">                                : request.status === 'rejected'

        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">                                ? 'bg-red-100 text-red-800'

          <p className="text-red-400">{error}</p>                                : 'bg-gray-100 text-gray-800'

          <button                            }

            onClick={() => router.push('/login')}                          `}

            className="mt-4 text-blue-400 hover:text-blue-300 underline"                        >

          >                          {request.status.charAt(0).toUpperCase() +

            Fazer login novamente                            request.status.slice(1)}

          </button>                        </span>

        </div>                      </div>

      </div>                    </div>

    );                  ))

  }                )}

              </div>

  if (!profile) return null;            )}



  const getStatusColor = (status: string) => {            {activeTab === 'profile' && (

    switch (status) {              <div>

      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';                <h2 className="text-2xl font-semibold mb-6">Perfil</h2>

      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/50';                {/* Add profile editing form here */}

      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';              </div>

      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';            )}

      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';

    }            {activeTab === 'reviews' && (

  };              <div>

                <h2 className="text-2xl font-semibold mb-6">Avaliações</h2>

  const getStatusLabel = (status: string) => {                {/* Add reviews list here */}

    switch (status) {              </div>

      case 'pending': return 'Pendente';            )}

      case 'accepted': return 'Aceito';          </div>

      case 'rejected': return 'Rejeitado';        </div>

      case 'completed': return 'Concluído';      </div>

      default: return status;    </div>

    }  )

  };}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Bem-vindo, {profile.name}!</p>
          <p className="text-sm text-gray-500">
            {profile.role === 'client' ? 'Cliente' : 'Prestador de Serviços'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/search')}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-6 text-left transition-all border border-white/20"
          >
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold mb-1">Buscar Profissionais</h3>
            <p className="text-sm text-gray-400">Encontre prestadores de serviços</p>
          </button>

          {profile.role === 'provider' && (
            <button
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 text-left transition-all border border-white/20"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold mb-1">Gerenciar Serviços</h3>
              <p className="text-sm text-gray-400">Edite seus serviços oferecidos</p>
            </button>
          )}

          <button
            onClick={() => router.push('/')}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-6 text-left transition-all border border-white/20"
          >
            <div className="text-2xl mb-2">🏠</div>
            <h3 className="font-semibold mb-1">Página Inicial</h3>
            <p className="text-sm text-gray-400">Voltar para home</p>
          </button>
        </div>

        {/* Requests Section */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-6">
            {profile.role === 'client' ? 'Minhas Solicitações' : 'Solicitações Recebidas'}
          </h2>

          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400 mb-2">Nenhuma solicitação ainda</p>
              {profile.role === 'client' && (
                <button
                  onClick={() => router.push('/search')}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Buscar profissionais agora
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {profile.role === 'client' 
                          ? `Solicitação para ${request.provider_name}`
                          : `Solicitação de ${request.client_name}`
                        }
                      </h3>
                      {request.service_name && (
                        <p className="text-blue-400 text-sm">
                          Serviço: {request.service_name}
                          {request.service_price && ` - R$ ${request.service_price}`}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  {request.description && (
                    <p className="text-gray-300 mb-3">{request.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                    {request.scheduled_at && (
                      <span>📅 {new Date(request.scheduled_at).toLocaleString('pt-BR')}</span>
                    )}
                    <span>🕐 {new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                    {profile.role === 'client' && request.provider_phone && (
                      <a 
                        href={`tel:${request.provider_phone}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        📞 {request.provider_phone}
                      </a>
                    )}
                    {profile.role === 'provider' && (
                      <span>✉️ {request.client_email}</span>
                    )}
                  </div>

                  {/* Provider actions */}
                  {profile.role === 'provider' && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✓ Aceitar
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✗ Rejeitar
                      </button>
                    </div>
                  )}

                  {profile.role === 'provider' && request.status === 'accepted' && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'completed')}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✓ Marcar como Concluído
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
