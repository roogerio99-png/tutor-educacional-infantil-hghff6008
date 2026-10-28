import React, { useState } from 'react'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SimpleModal } from '@/components/SimpleModal'
import {
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Mail,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

export const ConfigurarPinModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSucessoAtivarModo?: boolean
}> = ({ isOpen, onClose, onSucessoAtivarModo }) => {
  const {
    pinConfigurado,
    salvarNovoPin,
    redefinirPinSenha,
    ativarModoCrianca,
    solicitarEmailResetPin,
  } = useModoCrianca()

  const [modoRecuperacao, setModoRecuperacao] = useState<
    'nenhum' | 'escolha' | 'senha' | 'email_sucesso'
  >('nenhum')
  const [novoPin, setNovoPin] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [pinAtual, setPinAtual] = useState('')
  const [senhaConta, setSenhaConta] = useState('')

  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [mensagemEmailSucesso, setMensagemEmailSucesso] = useState<string | null>(null)

  const resetForm = () => {
    setNovoPin('')
    setConfirmacao('')
    setPinAtual('')
    setSenhaConta('')
    setErro(null)
    setSucesso(null)
    setModoRecuperacao('nenhum')
    setEnviandoEmail(false)
    setMensagemEmailSucesso(null)
  }

  const handleEnviarEmailRecuperacao = async () => {
    setErro(null)
    setEnviandoEmail(true)
    try {
      const res = await solicitarEmailResetPin()
      setMensagemEmailSucesso(res.message || 'E-mail enviado com sucesso!')
      setModoRecuperacao('email_sucesso')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível enviar o e-mail no momento.'
      setErro(msg)
    } finally {
      setEnviandoEmail(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    if (!/^\d{4}$/.test(novoPin)) {
      setErro('O PIN deve conter exatamente 4 números.')
      return
    }

    if (novoPin !== confirmacao) {
      setErro('Os números digitados na confirmação não conferem.')
      return
    }

    try {
      setSalvando(true)
      if (modoRecuperacao === 'senha') {
        if (!senhaConta.trim()) {
          setErro('Digite a senha da sua conta para redefinir.')
          setSalvando(false)
          return
        }
        await redefinirPinSenha(senhaConta, novoPin, confirmacao)
      } else {
        await salvarNovoPin(novoPin, confirmacao, pinAtual || undefined, senhaConta || undefined)
      }

      setSucesso('PIN configurado com sucesso!')
      setTimeout(() => {
        handleClose()
        if (onSucessoAtivarModo) {
          ativarModoCrianca()
        }
      }, 700)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível salvar o PIN.'
      setErro(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        modoRecuperacao === 'escolha'
          ? 'Recuperar PIN do Responsável 💛'
          : modoRecuperacao === 'email_sucesso'
            ? 'E-mail Enviado! ✉️'
            : modoRecuperacao === 'senha'
              ? 'Redefinir PIN com Senha'
              : pinConfigurado
                ? 'Alterar PIN do Responsável'
                : 'Criar PIN de 4 Dígitos'
      }
      description={
        modoRecuperacao === 'escolha'
          ? 'Escolha como prefere recuperar o seu código de acesso de adulto.'
          : 'Este PIN será exigido para sair do Modo Criança e proteger os painéis de adulto.'
      }
    >
      {modoRecuperacao === 'escolha' ? (
        <div className="space-y-4 py-1">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{erro}</span>
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
              onClick={handleEnviarEmailRecuperacao}
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
                  Enviaremos um link temporário para o e-mail da sua conta para redefinir o PIN sem
                  precisar digitar sua senha.
                </p>
              </div>
            </button>

            {/* Opção A: Redefinir com senha da conta */}
            <button
              type="button"
              disabled={enviandoEmail}
              onClick={() => {
                setErro(null)
                setModoRecuperacao('senha')
              }}
              className="w-full text-left p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-800">Redefinir com minha senha</div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Digite a senha de login da sua conta de responsável para criar um novo PIN agora
                  mesmo na tela.
                </p>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setErro(null)
                setModoRecuperacao('nenhum')
              }}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium px-3 py-2 rounded-lg"
            >
              ← Voltar para alteração com PIN atual
            </button>
          </div>
        </div>
      ) : modoRecuperacao === 'email_sucesso' ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto text-xl">
            ✉️
          </div>
          <h4 className="font-bold text-sm text-amber-950">Link enviado com carinho!</h4>
          <p className="text-xs leading-relaxed text-amber-800">
            {mensagemEmailSucesso ||
              'Enviamos um link seguro para o seu e-mail cadastrado. Abra o link para definir seu novo PIN em poucos segundos (válido por 30 minutos).'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              Entendi, vou checar meu e-mail
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{sucesso}</span>
            </div>
          )}

          {/* Modo Redefinir PIN via senha da conta */}
          {modoRecuperacao === 'senha' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Senha da sua conta do responsável *
              </label>
              <input
                type="password"
                required
                value={senhaConta}
                onChange={(e) => setSenhaConta(e.target.value)}
                placeholder="Digite a senha de login do Aprende+"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Para sua segurança, informe sua senha da conta para definir um novo PIN.
              </p>
            </div>
          ) : (
            pinConfigurado && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  PIN Atual (4 dígitos) *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={pinAtual}
                  onChange={(e) => setPinAtual(e.target.value.replace(/\D/g, ''))}
                  placeholder="****"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-center tracking-[0.3em] font-mono text-base"
                />
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setErro(null)
                      setModoRecuperacao('escolha')
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Esqueci meu PIN</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* Novo PIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Novo PIN (4 dígitos) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                value={novoPin}
                onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-center tracking-[0.3em] font-mono text-base font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Confirmar PIN *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-center tracking-[0.3em] font-mono text-base font-bold"
              />
            </div>
          </div>

          {modoRecuperacao === 'senha' && (
            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setModoRecuperacao('escolha')}
                className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                ← Voltar às opções de recuperação
              </button>
              <button
                type="button"
                disabled={enviandoEmail}
                onClick={handleEnviarEmailRecuperacao}
                className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Mail className="w-3 h-3" />
                <span>Prefiro receber no e-mail</span>
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || novoPin.length !== 4 || confirmacao.length !== 4}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar PIN'}</span>
            </button>
          </div>
        </form>
      )}
    </SimpleModal>
  )
}
