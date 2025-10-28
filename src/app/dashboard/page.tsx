import { Button } from '@/components/Button'
import { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'

interface Request {
  id: string
  clientName: string
  service: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: string
  description: string
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'profile' | 'reviews'>('requests')

  const { data: requests, isLoading } = useQuery('requests', async () => {
    const { data } = await axios.get<Request[]>('/api/provider/requests')
    return data
  })

  const updateRequestStatus = async (requestId: string, status: Request['status']) => {
    try {
      await axios.patch(`/api/provider/requests/${requestId}`, { status })
      // Revalidate requests
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {(['requests', 'profile', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-4 px-6 text-center border-b-2 font-medium text-sm
                    ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  requests?.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white border rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {request.clientName}
                          </h3>
                          <p className="text-gray-600">{request.service}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700 mt-2">
                            {request.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="primary"
                                onClick={() =>
                                  updateRequestStatus(request.id, 'accepted')
                                }
                              >
                                Aceitar
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  updateRequestStatus(request.id, 'rejected')
                                }
                              >
                                Recusar
                              </Button>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <Button
                              variant="primary"
                              onClick={() =>
                                updateRequestStatus(request.id, 'completed')
                              }
                            >
                              Concluir
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          `}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Perfil</h2>
                {/* Add profile editing form here */}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Avaliações</h2>
                {/* Add reviews list here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}