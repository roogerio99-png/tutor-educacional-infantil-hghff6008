import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function EsqueciSenha() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!email.trim()) {
      setFieldErrors({ email: 'Informe seu e-mail cadastrado' })
      return
    }

    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setError('Ocorreu um erro ao enviar o link. Verifique o e-mail informado.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail cadastrado para enviarmos as instruções de recuperação."
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 bg-green-50 text-[#3DA64C] rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#4A3B32]">Link enviado!</h2>
          <p className="text-sm text-[#9C8B7D]">
            Se houver uma conta associada a <strong className="text-[#4A3B32]">{email}</strong>,
            enviamos um link para redefinir sua senha. Verifique também sua pasta de spam.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full bg-[#F28C28] hover:bg-[#D97A1A] text-white font-bold py-3 px-4 rounded-2xl shadow-soft transition-all"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="email">
              E-mail cadastrado
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft hover:shadow-soft-hover transition-all duration-150 transform active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Enviar link de recuperação</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs font-semibold text-[#9C8B7D] hover:text-[#F28C28]">
              Lembrei minha senha — Fazer login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
