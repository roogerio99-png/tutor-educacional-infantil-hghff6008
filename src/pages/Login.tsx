import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/conversa'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!email.trim()) errors.email = 'Informe seu e-mail'
    if (!password) errors.password = 'Informe sua senha'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError('E-mail ou senha incorretos. Verifique e tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('roogerio99@gmail.com')
    setPassword('Skip@Pass')
    setFieldErrors({})
    setGeneralError(null)
  }

  return (
    <AuthLayout
      title="Acesse sua conta"
      subtitle="Entre para acompanhar e apoiar a jornada de aprendizado do seu filho."
    >
      {generalError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold flex items-center gap-2">
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl bg-[#FFF8F0]/40 border ${
              fieldErrors.email
                ? 'border-[#D64545] focus:ring-red-400'
                : 'border-[#EADBCE] focus:ring-[#F28C28]'
            } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#4A3B32]" htmlFor="password">
              Senha
            </label>
            <Link
              to="/esqueci-senha"
              className="text-xs font-semibold text-[#F28C28] hover:text-[#D97A1A] transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha secreta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 pr-11 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.password
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32] p-1"
              aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft hover:shadow-soft-hover transition-all duration-150 transform active:scale-[0.99]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </>
          )}
        </button>
      </form>

      {/* Preenchimento rápido para teste */}
      <div className="mt-5 pt-4 border-t border-[#F0E4D8] text-center">
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="text-xs font-semibold text-[#F28C28] hover:underline"
        >
          Preencher com conta de demonstração (Professor Rogério)
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-[#9C8B7D]">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-bold text-[#F28C28] hover:underline">
            Criar minha conta
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
