import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { redefinirPinPorToken } from '@/services/pinResponsavel'
import { useAuth } from '@/contexts/AuthContext'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import {
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Delete,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

export default function RedefinirPinPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { isAuthenticated, tipoConta } = useAuth()
  const { atualizarStatusPin } = useModoCrianca()

  const [novoPinDigits, setNovoPinDigits] = useState<string[]>([])
  const [confirmacaoDigits, setConfirmacaoDigits] = useState<string[]>([])
  const [etapa, setEtapa] = useState<'digitar' | 'confirmar'>('digitar')

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  // Disparar erro visual com vibração curta
  const acionarErro = (msg: string) => {
    setErro(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // Teclado virtual
  const handleDigit = (d: string) => {
    if (salvando || sucesso) return
    setErro(null)

    if (etapa === 'digitar') {
      if (novoPinDigits.length < 4) {
        const novos = [...novoPinDigits, d]
        setNovoPinDigits(novos)
        if (novos.length === 4) {
          // Avança suavemente para a confirmação
          setTimeout(() => {
            setEtapa('confirmar')
          }, 250)
        }
      }
    } else {
      if (confirmacaoDigits.length < 4) {
        const novos = [...confirmacaoDigits, d]
        setConfirmacaoDigits(novos)
        if (novos.length === 4) {
          // Submeter automaticamente
          submeterRedefinicao(novoPinDigits.join(''), novos.join(''))
        }
      }
    }
  }

  const handleDelete = () => {
    if (salvando || sucesso) return
    setErro(null)
    if (etapa === 'digitar') {
      setNovoPinDigits((prev) => prev.slice(0, -1))
    } else {
      if (confirmacaoDigits.length === 0) {
        // Voltar para a primeira etapa
        setEtapa('digitar')
      } else {
        setConfirmacaoDigits((prev) => prev.slice(0, -1))
      }
    }
  }

  const handleClear = () => {
    if (salvando || sucesso) return
    setErro(null)
    if (etapa === 'digitar') {
      setNovoPinDigits([])
    } else {
      setConfirmacaoDigits([])
    }
  }

  const handleReiniciar = () => {
    setNovoPinDigits([])
    setConfirmacaoDigits([])
    setEtapa('digitar')
    setErro(null)
  }

  const submeterRedefinicao = async (pin1: string, pin2: string) => {
    if (!token) {
      acionarErro('Link de recuperação ausente ou incompleto.')
      return
    }

    if (pin1.length !== 4 || pin2.length !== 4) {
      acionarErro('O PIN deve conter exatamente 4 dígitos.')
      return
    }

    if (pin1 !== pin2) {
      acionarErro('Os números digitados na confirmação não conferem. Vamos tentar de novo!')
      setConfirmacaoDigits([])
      setEtapa('confirmar')
      return
    }

    try {
      setSalvando(true)
      setErro(null)

      const res = await redefinirPinPorToken({
        token,
        novo_pin: pin1,
        confirmacao: pin2,
      })

      setSucesso(res.message || 'Seu novo PIN de 4 dígitos foi configurado com sucesso!')
      toast.success('PIN redefinido com sucesso! 🎉', {
        description: 'Você já pode usar seu novo código para destravar o Modo Criança.',
      })

      // Atualiza o estado global se estiver conectado
      if (isAuthenticated) {
        try {
          await atualizarStatusPin()
        } catch {
          /* intentionally ignored */
        }
      }

      // Redireciona após 2.5s
      setTimeout(() => {
        if (isAuthenticated && tipoConta === 'responsavel') {
          navigate('/conversa')
        } else {
          navigate('/login')
        }
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível redefinir o PIN.'
      acionarErro(msg)
      setConfirmacaoDigits([])
    } finally {
      setSalvando(false)
    }
  }

  // Suporte a teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (salvando || sucesso) return
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      } else if (e.key === 'Escape') {
        handleReiniciar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const pinAtualExibido = etapa === 'digitar' ? novoPinDigits : confirmacaoDigits

  return (
    <AuthLayout
      title="Redefinir PIN do Responsável"
      subtitle="Defina um código numérico de 4 dígitos com carinho e proteção para sua família."
    >
      {!token ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800">Link incompleto ou ausente</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Não encontramos o código de segurança na URL. Por favor, utilize o link recebido no seu
            e-mail ou solicite um novo envio no aplicativo.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-2xl shadow-soft transition-all text-sm"
            >
              Ir para o Login
            </Link>
          </div>
        </div>
      ) : sucesso ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-slate-900">Novo PIN Ativo! 🎉</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {sucesso} Guarde bem esses 4 números para quando precisar sair do Modo Criança.
            </p>
          </div>
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated && tipoConta === 'responsavel') {
                  navigate('/conversa')
                } else {
                  navigate('/login')
                }
              }}
              className="inline-flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft transition-all text-sm cursor-pointer"
            >
              <span>Continuar no Aprendiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center max-w-xs mx-auto py-2">
          {/* Indicador de etapa */}
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold">
            <span
              className={`px-2.5 py-1 rounded-full transition-all ${
                etapa === 'digitar'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              1. Novo PIN
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`px-2.5 py-1 rounded-full transition-all ${
                etapa === 'confirmar'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              2. Confirmação
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center mb-4">
            {etapa === 'digitar'
              ? 'Digite os 4 números do seu novo PIN:'
              : 'Repita os 4 números para confirmar:'}
          </p>

          {/* Círculos dos 4 dígitos */}
          <div className={`flex items-center gap-3.5 mb-5 ${shake ? 'animate-bounce' : ''}`}>
            {[0, 1, 2, 3].map((index) => {
              const preenchido = index < pinAtualExibido.length
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    preenchido
                      ? 'bg-amber-500 scale-125 shadow-md shadow-amber-500/40'
                      : 'bg-slate-200 border-2 border-slate-300'
                  }`}
                />
              )
            })}
          </div>

          {/* Alerta de erro */}
          {erro && (
            <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center flex items-center justify-center gap-2 w-full">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={salvando}
                onClick={() => handleDigit(num.toString())}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-900 font-extrabold text-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer select-none active:scale-95"
              >
                {num}
              </button>
            ))}

            {/* Limpar */}
            <button
              type="button"
              disabled={salvando || pinAtualExibido.length === 0}
              onClick={handleClear}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-500 text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 cursor-pointer select-none"
            >
              Limpar
            </button>

            {/* Zero */}
            <button
              type="button"
              disabled={salvando}
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-900 font-extrabold text-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer select-none active:scale-95"
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              disabled={salvando || pinAtualExibido.length === 0}
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-600 transition-all flex items-center justify-center disabled:opacity-30 cursor-pointer select-none"
              title="Apagar dígito"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback de salvamento ou botão reiniciar */}
          <div className="w-full max-w-[270px] mt-4 flex items-center justify-between text-xs">
            {etapa === 'confirmar' && (
              <button
                type="button"
                disabled={salvando}
                onClick={handleReiniciar}
                className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                ← Digitar outro PIN
              </button>
            )}
            {salvando && (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold mx-auto">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Salvando novo PIN...
              </span>
            )}
          </div>

          {/* Dica de segurança carinhosa */}
          <div className="mt-6 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2 max-w-[270px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              O PIN protege a saída do Modo Criança e garante que só você acesse as configurações e
              relatórios pedagógicos.
            </span>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
              Voltar para o Login
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
