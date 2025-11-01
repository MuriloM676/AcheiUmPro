'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface Appointment {
  id: number
  title: string
  description: string
  scheduled_date: string
  status: 'scheduled' | 'completed' | 'cancelled'
  client_name?: string
  provider_name?: string
}

const CalendarPage = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: ''
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const createAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const datetime = `${newAppointment.scheduled_date} ${newAppointment.scheduled_time}:00`

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAppointment,
          scheduled_date: datetime
        })
      })

      if (response.ok) {
        fetchAppointments()
        setShowForm(false)
        setNewAppointment({ title: '', description: '', scheduled_date: '', scheduled_time: '' })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  const updateAppointmentStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter(apt =>
      apt.scheduled_date.split('T')[0] === date
    )
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  const [currentDate, setCurrentDate] = useState(new Date())
  const days = getDaysInMonth(currentDate)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Calendário de Agendamentos</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Novo Agendamento
            </button>
          </div>

          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              &#8249; Anterior
            </button>
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              Próximo &#8250;
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 border-b">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const dateStr = day.toISOString().split('T')[0]
              const dayAppointments = getAppointmentsForDate(dateStr)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = dateStr === new Date().toISOString().split('T')[0]

              return (
                <div
                  key={index}
                  className={`p-2 min-h-[80px] border cursor-pointer hover:bg-gray-50 ${
                    !isCurrentMonth ? 'text-gray-400 bg-gray-100' : ''
                  } ${isToday ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className="font-medium">{day.getDate()}</div>
                  {dayAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className={`text-xs p-1 mt-1 rounded ${
                        apt.status === 'scheduled' ? 'bg-blue-200 text-blue-800' :
                        apt.status === 'completed' ? 'bg-green-200 text-green-800' :
                        'bg-red-200 text-red-800'
                      }`}
                    >
                      {apt.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Appointments List for Selected Date */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Agendamentos para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </h3>
            <div className="space-y-3">
              {getAppointmentsForDate(selectedDate).map(appointment => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{appointment.title}</h4>
                      <p className="text-gray-600 text-sm">{appointment.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {appointment.client_name && (
                        <p className="text-sm text-blue-600">Cliente: {appointment.client_name}</p>
                      )}
                      {appointment.provider_name && (
                        <p className="text-sm text-green-600">Profissional: {appointment.provider_name}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status === 'scheduled' ? 'Agendado' :
                         appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {getAppointmentsForDate(selectedDate).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Nenhum agendamento para esta data
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Agendamento</h3>
            <form onSubmit={createAppointment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={newAppointment.scheduled_date}
                  onChange={(e) => setNewAppointment({...newAppointment, scheduled_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  value={newAppointment.scheduled_time}
                  onChange={(e) => setNewAppointment({...newAppointment, scheduled_time: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPage
