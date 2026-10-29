import React, { useState } from 'react'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SimpleModal } from '@/components/SimpleModal'
import {
  Lock,
  Delete,
  Clock,
  ShieldAlert,
  Check,
  RefreshCw,
  KeyRound,
  Mail,
  Sparkles,
} from 'lucide-react'

export const SairModoCriancaModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const {
    tentarSairModoCrianca,
    tempoBloqueioRestante,
    abrirModalConfigurarPin,
    solicitarEmailResetPin,
  } = useModoCrianca()
  const [modalEscolhaEsqueciAberto, setModalEscolhaEsqueciAberto] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [emailEnviadoSucesso, setEmailEnviadoSucesso] = useState<string | null>(null)
  const [erroEnvioEmail, setErroEnvioEmail] = useState<string | null>(null)

  const [pinDigits, setPinDigits] = useState<string[]>([])
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [shake, setShake] = useState(false)
  const isSubmittingRef = React.useRef(false)

  // Submissão centralizada (evita duplicidade entre auto-submit e clique no botão OK)
  const submeterPin = React.useCallback(
    async (pinParaTestar: string) => {
      if (isSubmittingRef.current || tempoBloqueioRestante > 0) return
      if (pinParaTestar.length !== 4) return

      try {
        isSubmittingRef.current = true
        setCarregando(true)
        setMensagemErro(null)

        const res = await tentarSairModoCrianca(pinParaTestar)

        if (res.sucesso) {
          setPinDigits([])
          setMensagemErro(null)
          onClose()
        } else {
          setShake(true)
          setTimeout(() => setShake(false), 500)
          setMensagemErro(
            res.mensagem || 'PIN incorreto. Só os adultos responsáveis podem sair daqui 😊',
          )
          setPinDigits([])
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Não foi possível validar o PIN. Tente novamente.'
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setMensagemErro(msg)
        setPinDigits([])
      } finally {
        setCarregando(false)
        isSubmittingRef.current = false
      }
    },
    [tentarSairModoCrianca, tempoBloqueioRestante, onClose],
  )

  const handleDigit = (d: string) => {
    if (tempoBloqueioRestante > 0 || carregando || isSubmittingRef.current) return
    if (pinDigits.length >= 4) return

    const novos = [...pinDigits, d]
    setPinDigits(novos)
    setMensagemErro(null)

    // Auto-submit amigável ao completar o 4º dígito
    if (novos.length === 4) {
      submeterPin(novos.join(''))
    }
  }

  const handleDelete = () => {
    if (tempoBloqueioRestante > 0 || carregando || isSubmittingRef.current) return
    setPinDigits((prev) => prev.slice(0, -1))
    setMensagemErro(null)
  }

  const handleClear = () => {
    if (tempoBloqueioRestante > 0 || carregando || isSubmittingRef.current) return
    setPinDigits([])
    setMensagemErro(null)
  }

  const handleConfirmar = () => {
    if (pinDigits.length === 4) {
      submeterPin(pinDigits.join(''))
    }
  }

  // Suporte a teclado físico quando o modal estiver aberto
  React.useEffect(() => {
    if (!isOpen) {
      setPinDigits([])
      setMensagemErro(null)
      setCarregando(false)
      isSubmittingRef.current = false
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (tempoBloqueioRestante > 0 || carregando || isSubmittingRef.current) return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirmar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, tempoBloqueioRestante, carregando, pinDigits, submeterPin, onClose])

  const handleEsqueciPin = () => {
    setModalEscolhaEsqueciAberto(true)
  }

  const handleEscolherSenha = () => {
    setModalEscolhaEsqueciAberto(false)
    onClose()
    abrirModalConfigurarPin()
  }

  const handleEnviarEmail = async () => {
    setErroEnvioEmail(null)
    setEmailEnviadoSucesso(null)
    setEnviandoEmail(true)
    try {
      const res = await solicitarEmailResetPin()
      setEmailEnviadoSucesso(res.message || 'E-mail enviado com sucesso!')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível enviar o e-mail no momento.'
      setErroEnvioEmail(msg)
    } finally {
      setEnviandoEmail(false)
    }
  }

  return (
    <>
      <SimpleModal
        isOpen={isOpen && !modalEscolhaEsqueciAberto}
        onClose={onClose}
        title="Sair do Modo Criança 🔒"
        description="Digite o PIN de 4 dígitos do responsável para destravar o painel completo."
      >
        <div className="flex flex-col items-center max-w-xs mx-auto py-2">
          {/* Ícone e Indicador */}
          <div className="w-14 h-14 rounded-3xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center text-2xl shadow-inner mb-4">
            <Lock className="w-7 h-7" />
          </div>

          {/* Círculos dos 4 dígitos */}
          <div className={`flex items-center gap-3.5 mb-5 ${shake ? 'animate-bounce' : ''}`}>
            {[0, 1, 2, 3].map((index) => {
              const preenchido = index < pinDigits.length
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

          {/* Mensagem de Bloqueio ou Erro Amigável */}
          {tempoBloqueioRestante > 0 ? (
            <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-rose-500 animate-spin" />
              <span>
                Muitas tentativas incorretas. Aguarde{' '}
                <strong className="font-bold">{tempoBloqueioRestante}s</strong> para tentar
                novamente.
              </span>
            </div>
          ) : mensagemErro ? (
            <div className="p-3 mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{mensagemErro}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mb-4 text-center">
              Toque nos números para digitar o código de 4 dígitos (Demo: <strong>1234</strong>)
            </p>
          )}

          {/* Teclado Numérico Amigável e Grande */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={tempoBloqueioRestante > 0 || carregando}
                onClick={() => handleDigit(num.toString())}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-900 font-extrabold text-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer select-none active:scale-95"
              >
                {num}
              </button>
            ))}

            {/* Botão Limpar */}
            <button
              type="button"
              disabled={tempoBloqueioRestante > 0 || carregando || pinDigits.length === 0}
              onClick={handleClear}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-500 text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 cursor-pointer select-none"
            >
              Limpar
            </button>

            {/* Dígito Zero */}
            <button
              type="button"
              disabled={tempoBloqueioRestante > 0 || carregando}
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-900 font-extrabold text-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer select-none active:scale-95"
            >
              0
            </button>

            {/* Botão Backspace */}
            <button
              type="button"
              disabled={tempoBloqueioRestante > 0 || carregando || pinDigits.length === 0}
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-600 transition-all flex items-center justify-center disabled:opacity-30 cursor-pointer select-none"
              title="Apagar dígito"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Botão Claro de Confirmação OK / Confirmar */}
          <div className="w-full max-w-[270px] mt-3">
            <button
              type="button"
              disabled={tempoBloqueioRestante > 0 || carregando || pinDigits.length !== 4}
              onClick={handleConfirmar}
              className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm select-none ${
                pinDigits.length === 4 && !carregando && tempoBloqueioRestante <= 0
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-98 text-white shadow-amber-500/30 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              {carregando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando PIN...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar OK</span>
                </>
              )}
            </button>
          </div>

          {/* Rodapé com link de esqueci o PIN */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleEsqueciPin}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1.5 underline cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Esqueci meu PIN</span>
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Sub-modal carinhoso para escolha de recuperação do PIN */}
      <SimpleModal
        isOpen={modalEscolhaEsqueciAberto}
        onClose={() => {
          setModalEscolhaEsqueciAberto(false)
          setEmailEnviadoSucesso(null)
          setErroEnvioEmail(null)
        }}
        title="Recuperar PIN do Responsável 💛"
        description="Escolha a forma mais tranquila para você definir um novo código de 4 dígitos."
      >
        <div className="space-y-4 py-1">
          {emailEnviadoSucesso ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto text-xl">
                ✉️
              </div>
              <h4 className="font-bold text-sm text-amber-950">Link enviado com carinho!</h4>
              <p className="text-xs leading-relaxed text-amber-800">
                Enviamos um link seguro para o seu e-mail cadastrado. Abra o link para definir seu
                novo PIN em poucos segundos (válido por 30 minutos).
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalEscolhaEsqueciAberto(false)
                    setEmailEnviadoSucesso(null)
                    onClose()
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Entendi, vou checar meu e-mail
                </button>
              </div>
            </div>
          ) : (
            <>
              {erroEnvioEmail && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{erroEnvioEmail}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Como você prefere redefinir o seu PIN agora?
              </p>

              <div className="space-y-3">
                {/* Opção B: Receber link no e-mail */}
                <button
                  type="button"
                  disabled={enviandoEmail}
                  onClick={handleEnviarEmail}
                  className="w-full text-left p-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-all cursor-pointer group flex items-start gap-3 disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {enviandoEmail ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-amber-950">
                      <span>Receber link no meu e-mail</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      Enviaremos um link temporário para o e-mail da sua conta para redefinir o PIN
                      sem precisar digitar sua senha.
                    </p>
                  </div>
                </button>

                {/* Opção A: Redefinir com senha da conta */}
                <button
                  type="button"
                  disabled={enviandoEmail}
                  onClick={handleEscolherSenha}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800">
                      Redefinir com minha senha
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      Digite a senha de login da sua conta de responsável para criar um novo PIN
                      agora mesmo na tela.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setModalEscolhaEsqueciAberto(false)
                    setErroEnvioEmail(null)
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium px-3 py-2 rounded-lg"
                >
                  Voltar ao teclado de PIN
                </button>
              </div>
            </>
          )}
        </div>
      </SimpleModal>
    </>
  )
}
