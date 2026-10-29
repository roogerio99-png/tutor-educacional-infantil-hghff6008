import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { criarCrianca } from '@/services/criancas'
import { salvarAcessoCrianca } from '@/services/criancaAcesso'
import { definirPinResponsavel } from '@/services/pinResponsavel'
import { SERIES } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, UserPlus, ShieldCheck, Lock, Sparkles } from 'lucide-react'

export default function Cadastro() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // 1. Dados do Responsável Legal + PIN Parental
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [pinParental, setPinParental] = useState('1234')

  // 2. Cadeia de Autorizações LGPD (Art. 14) & ECA Digital (Lei 15.211/2025)
  const [consentimentoLgpdDados, setConsentimentoLgpdDados] = useState(false)
  const [consentimentoVozIa, setConsentimentoVozIa] = useState(false)
  const [consentimentoGovernancaPin, setConsentimentoGovernancaPin] = useState(false)

  // 3. Cadastro Inicial da Criança com Senha Infantil Própria
  const [nomeCrianca, setNomeCrianca] = useState('')
  const [idadeCrianca, setIdadeCrianca] = useState('10')
  const [serieCrianca, setSerieCrianca] = useState('5º Ano')
  const [usuarioCrianca, setUsuarioCrianca] = useState('')
  const [senhaCrianca, setSenhaCrianca] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const cadeiaAutorizacoesCompleta =
    consentimentoLgpdDados && consentimentoVozIa && consentimentoGovernancaPin

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!nome.trim()) errors.nome = 'Informe o nome completo do Responsável Legal'
    if (!email.trim()) errors.email = 'Informe o e-mail do Responsável'
    if (!password) {
      errors.password = 'Crie uma senha para o Responsável'
    } else if (password.length < 8) {
      errors.password = 'A senha do responsável deve ter no mínimo 8 caracteres'
    }
    if (password !== passwordConfirm) {
      errors.passwordConfirm = 'As senhas não coincidem'
    }
    if (!/^\d{4}$/.test(pinParental.trim())) {
      errors.pinParental = 'O PIN Parental deve ter exatamente 4 números (ex: 1234)'
    }
    if (!nomeCrianca.trim()) {
      errors.nomeCrianca = 'Informe o nome da criança para configurar o perfil inicial'
    }
    if (!usuarioCrianca.trim()) {
      errors.usuarioCrianca = 'Crie um usuário infantil (ex: anapaula)'
    }
    if (!senhaCrianca || senhaCrianca.length < 6) {
      errors.senhaCrianca = 'A senha infantil própria deve ter pelo menos 6 caracteres'
    }
    if (!cadeiaAutorizacoesCompleta) {
      errors.consentimento =
        'É obrigatório aprovar toda a Cadeia de Autorizações LGPD & ECA Digital para liberar o 1º acesso.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await register(nome, email, password, passwordConfirm, true)

      // Autentica o responsável e cria o PIN + Perfil da Criança + Senha Infantil
      await login(email, password)

      try {
        await definirPinResponsavel({
          novo_pin: pinParental.trim(),
          confirmacao: pinParental.trim(),
        })
      } catch {
        // ignore if already set
      }

      const novaCrianca = await criarCrianca({
        nome: nomeCrianca.trim(),
        idade: parseInt(idadeCrianca, 10) || 10,
        serie: serieCrianca,
      })

      await salvarAcessoCrianca({
        crianca_id: novaCrianca.id,
        nome_exibicao: nomeCrianca.trim(),
        username: usuarioCrianca.trim().toLowerCase(),
        senha: senhaCrianca,
        ativo: true,
        permissoes: {
          conversa: true,
          agenda: true,
          grafo: false,
          conquistas: true,
        },
      })

      toast({
        title: 'Governança Parental configurada com sucesso!',
        description: `Conta do responsável, PIN Parental e acesso infantil (${usuarioCrianca.toLowerCase()}) prontos!`,
      })
      navigate('/conversa')
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError(
          'Não foi possível concluir o cadastro comercial. Verifique os dados informados.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="1º Acesso Exclusivo do Responsável"
      subtitle="Governança Parental Completa: Cadastro do Responsável + Cadeia LGPD/ECA + Cadastro da Criança com Senha Infantil."
    >
      {/* Selo de Governança Comercial */}
      <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs font-bold text-amber-950">
        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Por segurança jurídica (LGPD Art. 14 e ECA Digital), o 1º acesso é exclusivo do adulto
          responsável.
        </span>
      </div>

      {generalError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ETAPA 1: RESPONSÁVEL LEGAL + PIN */}
        <div className="p-3.5 rounded-2xl bg-[#FFF8F0]/70 border border-[#EADBCE] space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#F28C28] flex items-center gap-1.5">
            <span>1. Dados do Responsável Legal & PIN Parental</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="nome">
              Nome completo do Responsável *
            </label>
            <input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Ex.: Mariana Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EADBCE] text-sm text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.nome}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="email">
                E-mail do Responsável *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EADBCE] text-sm text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="pinParental">
                PIN Parental (4 díg.) *
              </label>
              <input
                id="pinParental"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={pinParental}
                onChange={(e) => setPinParental(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EADBCE] text-sm font-black tracking-widest text-center text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
              />
              {fieldErrors.pinParental && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.pinParental}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="password">
                Senha do Responsável *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#EADBCE] text-sm text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32] p-1"
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
                className="block text-xs font-bold text-[#4A3B32] mb-1"
                htmlFor="passwordConfirm"
              >
                Confirmar Senha *
              </label>
              <input
                id="passwordConfirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EADBCE] text-sm text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
              />
              {fieldErrors.passwordConfirm && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">
                  {fieldErrors.passwordConfirm}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ETAPA 2: CADASTRO DA CRIANÇA + SENHA INFANTIL PRÓPRIA */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Cadastro da Criança & Senha Infantil Própria</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="nomeCrianca">
                Nome da Criança *
              </label>
              <input
                id="nomeCrianca"
                type="text"
                placeholder="Ex.: Gabriel Silva"
                value={nomeCrianca}
                onChange={(e) => {
                  setNomeCrianca(e.target.value)
                  if (!usuarioCrianca) {
                    setUsuarioCrianca(
                      e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '')
                        .slice(0, 14),
                    )
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-indigo-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {fieldErrors.nomeCrianca && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.nomeCrianca}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="idadeCrianca">
                Idade / Série *
              </label>
              <div className="flex gap-1.5">
                <input
                  id="idadeCrianca"
                  type="number"
                  min={5}
                  max={16}
                  value={idadeCrianca}
                  onChange={(e) => setIdadeCrianca(e.target.value)}
                  className="w-16 px-2.5 py-2.5 rounded-xl bg-white border border-indigo-200 text-sm font-bold text-slate-800"
                />
                <select
                  aria-label="Série da criança"
                  value={serieCrianca}
                  onChange={(e) => setSerieCrianca(e.target.value)}
                  className="flex-1 px-2 py-2.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-800"
                >
                  {SERIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                className="block text-xs font-bold text-slate-800 mb-1"
                htmlFor="usuarioCrianca"
              >
                Usuário Infantil (Login da Criança) *
              </label>
              <input
                id="usuarioCrianca"
                type="text"
                placeholder="Ex.: gabriel10"
                value={usuarioCrianca}
                onChange={(e) =>
                  setUsuarioCrianca(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-indigo-200 text-sm font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {fieldErrors.usuarioCrianca && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">
                  {fieldErrors.usuarioCrianca}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="senhaCrianca">
                Senha Infantil Própria (mín. 6 caract.) *
              </label>
              <input
                id="senhaCrianca"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ex.: lumi1234"
                value={senhaCrianca}
                onChange={(e) => setSenhaCrianca(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-indigo-200 text-sm font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {fieldErrors.senhaCrianca && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">
                  {fieldErrors.senhaCrianca}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ETAPA 3: CADEIA DE AUTORIZAÇÕES LGPD / ECA DIGITAL */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-[#4A3B32] uppercase tracking-wide">
                3. Cadeia de Autorizações Parental (LGPD Art. 14 & ECA Digital)
              </h4>
              <p className="text-[11px] text-[#7A6A5E] leading-relaxed mt-0.5">
                Para liberar o uso comercial seguro da Lumi IA, confirme as 3 autorizações legais
                abaixo:
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentimentoLgpdDados}
              onChange={(e) => setConsentimentoLgpdDados(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-[#F28C28] focus:ring-[#F28C28] cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#4A3B32]">
              <strong>1. Dados Pedagógicos (LGPD Art. 14):</strong> Autorizo o processamento de
              memórias educacionais exclusivamente para personalizar o ensino multimodelo da
              criança, sem uso publicitário. *
            </span>
          </label>

          <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentimentoVozIa}
              onChange={(e) => setConsentimentoVozIa(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-[#F28C28] focus:ring-[#F28C28] cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#4A3B32]">
              <strong>2. Interação por Voz & Filtros Etários (ECA Digital):</strong> Autorizo o uso
              do modo Lumi Live 2.0 com filtros de segurança ativos para a faixa etária da criança.
              *
            </span>
          </label>

          <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentimentoGovernancaPin}
              onChange={(e) => setConsentimentoGovernancaPin(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-[#F28C28] focus:ring-[#F28C28] cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#4A3B32]">
              <strong>3. Governança Parental por PIN:</strong> Estou ciente de que alterações de
              segurança e saída do acesso infantil são bloqueadas pelo meu PIN Parental de 4
              dígitos. *
            </span>
          </label>

          {fieldErrors.consentimento && (
            <p className="text-xs text-[#D64545] font-medium pl-6">{fieldErrors.consentimento}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !cadeiaAutorizacoesCompleta}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft hover:shadow-soft-hover transition-all duration-150 transform active:scale-[0.99] cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Concluir Governança Parental & Liberar Acesso</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-xs text-[#9C8B7D]">
          Já configurou o 1º acesso?{' '}
          <Link to="/login" className="font-bold text-[#F28C28] hover:underline">
            Acessar como Responsável ou Criança
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
