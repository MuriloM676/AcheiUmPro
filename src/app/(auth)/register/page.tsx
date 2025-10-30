'use client'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { toast } from 'react-toastify'

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['client', 'provider'], { message: 'Selecione um tipo de conta' }),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  location: z.string().min(5, 'Localização é obrigatória'),
  services: z.string().optional()
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'client' | 'provider'>('client')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'client' }
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('')
      const response = await api.post('/api/auth/register', data)

      if (response.data.success) {
        toast.success('Conta criada com sucesso!')
        router.push('/login')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao criar conta'
      setError(message)
      toast.error(message)
    }
  }

  const handleRoleChange = (role: 'client' | 'provider') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-900 py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/30">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            Criar Conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Junte-se ao AcheiUmPro
          </p>
        </div>

        <div className="flex space-x-2 p-1 bg-gray-700/50 rounded-lg">
          <button
            type="button"
            onClick={() => handleRoleChange('client')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              selectedRole === 'client'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Preciso de Serviços
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('provider')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              selectedRole === 'provider'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Sou Profissional
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              type="text"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Telefone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="(11) 99999-9999"
            />
            <Input
              label="Localização"
              type="text"
              {...register('location')}
              error={errors.location?.message}
              placeholder="Cidade, Estado"
            />

            {selectedRole === 'provider' && (
              <Input
                label="Serviços Oferecidos"
                type="text"
                {...register('services')}
                error={errors.services?.message}
                placeholder="Ex: Eletricista, Encanador, Pintor"
              />
            )}

            <Input
              label="Senha"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
          >
            Criar Conta
          </Button>

          <p className="text-center text-sm text-gray-400">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Faça login
            </Link>
          </p>

          <p className="text-center">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              ← Voltar para home
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
