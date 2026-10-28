import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { login, loginCrianca } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Aba selecionada: 'responsavel' ou 'crianca'
  const [abaLogin, setAbaLogin] = useState<'responsavel' | 'crianca'>('responsavel')

  // Campos do responsável
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Campos da criança
  const [usernameCrianca, setUsernameCrianca] = useState('')
  const [passwordCrianca, setPasswordCrianca] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/conversa'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    if (abaLogin === 'responsavel') {
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
    } else {
      // Fluxo da Criança
      const errors: Record<string, string> = {}
      if (!usernameCrianca.trim()) errors.username = 'Qual é o seu nome de usuário?'
      if (!passwordCrianca) errors.password = 'Digite sua senha'

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }

      setLoading(true)
      try {
        await loginCrianca(usernameCrianca, passwordCrianca)
        // Criança vai SEMPRE direto para a conversa com a Lumi
        navigate('/conversa', { replace: true })
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'CONTA_PAUSADA') {
          setGeneralError('Seu acesso está pausado. Converse com o responsável 💛')
        } else {
          const extracted = extractFieldErrors(err)
          if (Object.keys(extracted).length > 0) {
            setFieldErrors(extracted)
          } else {
            setGeneralError(
              'Usuário ou senha da criança não encontrados. Peça ajuda ao seu responsável 💛',
            )
          }
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const fillDemoCredentials = () => {
    if (abaLogin === 'responsavel') {
      setEmail('roogerio99@gmail.com')
      setPassword('Skip@Pass')
    } else {
      setUsernameCrianca('anapaula')
      setPasswordCrianca('lumi1234')
    }
    setFieldErrors({})
    setGeneralError(null)
  }

  return (
    <AuthLayout
      title={abaLogin === 'responsavel' ? 'Acesse sua conta' : 'Oi, vamos aprender? ✨'}
      subtitle={
        abaLogin === 'responsavel'
          ? 'Entre para acompanhar e apoiar a jornada de aprendizado do seu filho.'
          : 'Entre com seu usuário e senha para conversar com a Lumi!'
      }
    >
      {/* Seletor Claro de Papel: Responsável vs Criança */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F6EDE3] rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setAbaLogin('responsavel')
            setFieldErrors({})
            setGeneralError(null)
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            abaLogin === 'responsavel'
              ? 'bg-white text-[#4A3B32] shadow-sm'
              : 'text-[#8A796C] hover:text-[#4A3B32]'
          }`}
        >
          <span>👨‍👩‍👧</span>
          <span>Sou responsável</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAbaLogin('crianca')
            setFieldErrors({})
            setGeneralError(null)
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            abaLogin === 'crianca'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
              : 'text-[#8A796C] hover:text-[#4A3B32]'
          }`}
        >
          <span>🧒</span>
          <span>Sou criança</span>
        </button>
      </div>

      {generalError && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-900 font-semibold flex items-center gap-2">
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {abaLogin === 'responsavel' ? (
          /* Formulário do Responsável */
          <>
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
          </>
        ) : (
          /* Formulário da Criança */
          <>
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="username">
                Meu Usuário 🧒
              </label>
              <input
                id="username"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                placeholder="Ex: anapaula"
                value={usernameCrianca}
                onChange={(e) => setUsernameCrianca(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                  fieldErrors.username
                    ? 'border-[#D64545] focus:ring-red-400'
                    : 'border-[#EADBCE] focus:ring-[#F28C28]'
                } text-base font-bold text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-bold text-[#4A3B32] mb-1.5"
                htmlFor="childPassword"
              >
                Minha Senha 🔐
              </label>
              <div className="relative">
                <input
                  id="childPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={passwordCrianca}
                  onChange={(e) => setPasswordCrianca(e.target.value)}
                  className={`w-full px-4 py-3.5 pr-11 rounded-2xl bg-[#FFF8F0]/40 border ${
                    fieldErrors.password
                      ? 'border-[#D64545] focus:ring-red-400'
                      : 'border-[#EADBCE] focus:ring-[#F28C28]'
                  } text-base font-bold text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
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
          </>
        )}
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
              <span>{abaLogin === 'responsavel' ? 'Entrar' : 'Começar a conversar ✨'}</span>
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
          {abaLogin === 'responsavel'
            ? 'Preencher com conta de responsável demo (Professor Rogério)'
            : 'Preencher com login demo da criança (Ana Paula / lumi1234)'}
        </button>
      </div>

      {abaLogin === 'responsavel' ? (
        <div className="mt-4 text-center">
          <p className="text-xs text-[#9C8B7D]">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-bold text-[#F28C28] hover:underline">
              Criar minha conta
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-xs text-[#9C8B7D]">
            Esqueceu seu usuário ou senha?{' '}
            <button
              type="button"
              onClick={() => setAbaLogin('responsavel')}
              className="font-bold text-[#F28C28] hover:underline ml-1"
            >
              Pedir ao responsável
            </button>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
