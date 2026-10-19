import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { KeyRound, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { confirmPasswordReset } = useAuth()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!token) {
      setError('Token de recuperação inválido ou expirado. Solicite outro link.')
      return
    }

    if (!password || password.length < 8) {
      setFieldErrors({ password: 'A nova senha deve ter no mínimo 8 caracteres' })
      return
    }

    if (password !== passwordConfirm) {
      setFieldErrors({ passwordConfirm: 'As senhas não coincidem' })
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset(token, password, passwordConfirm)
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi alterada com sucesso. Faça login com a nova senha.',
      })
      navigate('/login')
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setError('Não foi possível redefinir a senha. O link pode ter expirado.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Redefinir senha" subtitle="Escolha uma nova senha segura para sua conta.">
      {!token ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[#D64545] font-semibold">
            Token de redefinição não encontrado na URL.
          </p>
          <Link
            to="/esqueci-senha"
            className="inline-flex items-center justify-center w-full bg-[#F28C28] text-white font-bold py-3 px-4 rounded-2xl shadow-soft"
          >
            Solicitar novo link
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
              Nova senha (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Sua nova senha"
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
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label
              className="block text-xs font-bold text-[#4A3B32] mb-1.5"
              htmlFor="passwordConfirm"
            >
              Confirmar nova senha
            </label>
            <input
              id="passwordConfirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.passwordConfirm
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
            />
            {fieldErrors.passwordConfirm && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">
                {fieldErrors.passwordConfirm}
              </p>
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
                <KeyRound className="w-4 h-4" />
                <span>Redefinir senha</span>
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
