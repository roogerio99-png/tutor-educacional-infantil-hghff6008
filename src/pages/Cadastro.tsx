import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react'

export default function Cadastro() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [consentimentoLgpd, setConsentimentoLgpd] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!nome.trim()) errors.nome = 'Informe seu nome completo'
    if (!email.trim()) errors.email = 'Informe seu e-mail'
    if (!password) {
      errors.password = 'Crie uma senha'
    } else if (password.length < 8) {
      errors.password = 'A senha deve ter no mínimo 8 caracteres'
    }
    if (password !== passwordConfirm) {
      errors.passwordConfirm = 'As senhas não coincidem'
    }
    if (!consentimentoLgpd) {
      errors.consentimento =
        'É obrigatório autorizar o tratamento parental de dados para criar a conta.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await register(nome, email, password, passwordConfirm, consentimentoLgpd)

      // Loga automaticamente
      try {
        await login(email, password)
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Bem-vindo ao Aprende+ Tutor. Verifique seu e-mail para confirmar a conta.',
        })
        navigate('/filhos')
      } catch {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Faça login com seu e-mail e senha cadastrados.',
        })
        navigate('/login')
      }
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError(
          'Não foi possível criar sua conta. Verifique os dados ou tente outro e-mail.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Junte-se ao Aprende+ Tutor para transformar o estudo em um momento de afeto e progresso."
    >
      {generalError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="nome">
            Nome completo
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            placeholder="Ex.: Mariana Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl bg-[#FFF8F0]/40 border ${
              fieldErrors.nome
                ? 'border-[#D64545] focus:ring-red-400'
                : 'border-[#EADBCE] focus:ring-[#F28C28]'
            } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
          />
          {fieldErrors.nome && (
            <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.nome}</p>
          )}
        </div>

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
          <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="password">
            Senha (mínimo 8 caracteres)
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="No mínimo 8 caracteres"
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
            Confirmar senha
          </label>
          <input
            id="passwordConfirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repita sua senha"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl bg-[#FFF8F0]/40 border ${
              fieldErrors.passwordConfirm
                ? 'border-[#D64545] focus:ring-red-400'
                : 'border-[#EADBCE] focus:ring-[#F28C28]'
            } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
          />
          {fieldErrors.passwordConfirm && (
            <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.passwordConfirm}</p>
          )}
        </div>

        {/* Bloco de Consentimento Parental LGPD / ECA Digital */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-[#4A3B32]">
                Consentimento Parental (LGPD & ECA Digital)
              </h4>
              <p className="text-[11px] text-[#7A6A5E] leading-relaxed mt-1">
                Como responsável legal, declaro que os dados fornecidos sobre a criança serão
                utilizados
                <strong> exclusivamente para personalizar o apoio pedagógico socrático</strong>. Os
                dados
                <strong> nunca serão vendidos</strong>, compartilhados para publicidade ou usados
                para fins comerciais. Você tem o direito assegurado de visualizar, exportar e{' '}
                <strong>excluir todas as memórias e dados a qualquer momento</strong> no painel de
                privacidade.
              </p>
              <p className="text-[10px] text-amber-700/80 font-medium mt-1">
                Conforme Lei 13.709/2018 (LGPD, Art. 14) e Lei 15.211/2025 (ECA Digital).
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 pt-2 border-t border-amber-200/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentimentoLgpd}
              onChange={(e) => setConsentimentoLgpd(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-[#F28C28] focus:ring-[#F28C28] cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#4A3B32]">
              Li e autorizo expressamente o tratamento dos dados educacionais da criança pelo tutor
              inteligente nos termos da LGPD e ECA Digital. *
            </span>
          </label>
          {fieldErrors.consentimento && (
            <p className="text-xs text-[#D64545] font-medium pl-7">{fieldErrors.consentimento}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !consentimentoLgpd}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft hover:shadow-soft-hover transition-all duration-150 transform active:scale-[0.99]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Criar conta</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-[#9C8B7D]">
          Já tenho conta —{' '}
          <Link to="/login" className="font-bold text-[#F28C28] hover:underline">
            entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
