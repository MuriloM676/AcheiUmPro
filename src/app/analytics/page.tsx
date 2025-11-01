'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AnalyticsData {
  totalEarnings: number
  totalServices: number
  averageRating: number
  monthlyEarnings: { month: string; earnings: number }[]
  servicesByCategory: { category: string; count: number }[]
  recentServices: {
    id: number
    title: string
    amount: number
    date: string
    status: string
  }[]
}

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30') // days

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Analytics</h1>

          {/* Period Selector */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 3 meses</option>
              <option value="365">Último ano</option>
            </select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ganhos Totais</p>
                <p className="text-2xl font-semibold text-gray-900">
                  R$ {analytics.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Serviços Realizados</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalServices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.averageRating.toFixed(1)} ⭐
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ganho Médio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  R$ {analytics.totalServices > 0 ? (analytics.totalEarnings / analytics.totalServices).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Earnings Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ganhos Mensais</h3>
            <div className="space-y-4">
              {analytics.monthlyEarnings.map((item, index) => {
                const maxEarnings = Math.max(...analytics.monthlyEarnings.map(m => m.earnings))
                const percentage = maxEarnings > 0 ? (item.earnings / maxEarnings) * 100 : 0

                return (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">{item.month}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-800 text-right">
                      R$ {item.earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Services by Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Serviços por Categoria</h3>
            <div className="space-y-4">
              {analytics.servicesByCategory.map((item, index) => {
                const maxCount = Math.max(...analytics.servicesByCategory.map(s => s.count))
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']
                const color = colors[index % colors.length]

                return (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600 capitalize">{item.category}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className={`${color} h-4 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-800 text-right">
                      {item.count}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Services Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Serviços Recentes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.recentServices.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {service.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.status === 'completed' ? 'bg-green-100 text-green-800' :
                        service.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        service.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {service.status === 'completed' ? 'Concluído' :
                         service.status === 'in_progress' ? 'Em Andamento' :
                         service.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analytics.recentServices.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nenhum serviço encontrado no período selecionado
              </p>
            )}
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Metas e Objetivos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Meta Mensal de Ganhos</span>
                <span className="text-sm text-gray-500">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">R$ 3.750 de R$ 5.000</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Meta de Serviços</span>
                <span className="text-sm text-gray-500">60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">12 de 20 serviços</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
