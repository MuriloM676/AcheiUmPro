'use client'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  userType: z.enum(['client', 'provider'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('')
      await axios.post('/api/auth/register', data)
      toast.success('Conta criada com sucesso! Faça login para continuar.')
      router.push('/login?registered=true')
    } catch (error: any) {
      console.error('Registration error:', error.response?.data)
      const message = error.response?.data?.error || 'Ocorreu um erro ao criar sua conta'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Nome"
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
              label="Senha"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Confirme a senha"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de usuário
              </label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    {...register('userType')}
                    value="client"
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Cliente</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    {...register('userType')}
                    value="provider"
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Prestador</span>
                </label>
              </div>
              {errors.userType && (
                <p className="mt-1 text-sm text-red-600">{errors.userType.message}</p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
          >
            Criar conta
          </Button>

          <p className="text-center text-sm">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Faça login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}