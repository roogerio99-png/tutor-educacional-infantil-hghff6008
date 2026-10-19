import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { useToast } from '@/hooks/use-toast'
import { MailCheck, Eye, EyeOff } from 'lucide-react'

export default function ConfirmarEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { confirmEmailChange } = useAuth()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Token de confirmação ausente na URL.')
      return
    }

    if (!password) {
      setError('Informe sua senha para confirmar a troca de e-mail.')
      return
    }

    setLoading(true)
    try {
      await confirmEmailChange(token, password)
      toast({
        title: 'E-mail alterado com sucesso!',
        description: 'Faça login com seu novo endereço de e-mail.',
      })
      navigate('/login')
    } catch {
      setError(
        'Não foi possível confirmar a alteração do e-mail. Verifique a senha ou solicite novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Confirmar novo e-mail"
      subtitle="Digite sua senha atual para validar a alteração de endereço."
    >
      {!token ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[#D64545] font-semibold">Token não encontrado na URL.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full bg-[#F28C28] text-white font-bold py-3 px-4 rounded-2xl shadow-soft"
          >
            Ir para o Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="password">
              Sua senha atual
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FFF8F0]/40 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32] p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
                <MailCheck className="w-4 h-4" />
                <span>Confirmar e-mail</span>
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
