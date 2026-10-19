import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { CheckCircle2, AlertCircle, LogIn } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { confirmVerification } = useAuth()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Token de verificação ausente na URL.')
      return
    }

    let isMounted = true
    confirmVerification(token)
      .then(() => {
        if (isMounted) {
          setSuccess(true)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(
            'Não foi possível verificar a conta. O link pode ter expirado ou já foi utilizado.',
          )
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token, confirmVerification])

  return (
    <AuthLayout
      title="Verificação de E-mail"
      subtitle="Confirmação da sua conta no Aprende+ Tutor."
    >
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F28C28] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#9C8B7D] font-medium">Verificando sua conta...</p>
        </div>
      ) : success ? (
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 bg-green-50 text-[#3DA64C] rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#4A3B32]">Conta verificada com sucesso!</h2>
          <p className="text-sm text-[#9C8B7D]">
            Seu e-mail foi confirmado. Você já pode acessar todas as funcionalidades do Aprende+
            Tutor.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#F28C28] hover:bg-[#D97A1A] text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Fazer login</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 bg-red-50 text-[#D64545] rounded-full flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#4A3B32]">Falha na verificação</h2>
          <p className="text-sm text-[#9C8B7D]">{error}</p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full bg-[#F28C28] hover:bg-[#D97A1A] text-white font-bold py-3 px-4 rounded-2xl shadow-soft transition-all"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
