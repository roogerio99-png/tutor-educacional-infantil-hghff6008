import React, { useState } from 'react'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SimpleModal } from '@/components/SimpleModal'
import { KeyRound, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react'

export const ConfigurarPinModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSucessoAtivarModo?: boolean
}> = ({ isOpen, onClose, onSucessoAtivarModo }) => {
  const { pinConfigurado, salvarNovoPin, redefinirPinSenha, ativarModoCrianca } = useModoCrianca()

  const [modoRedefinirSenha, setModoRedefinirSenha] = useState(false)
  const [novoPin, setNovoPin] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [pinAtual, setPinAtual] = useState('')
  const [senhaConta, setSenhaConta] = useState('')

  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const resetForm = () => {
    setNovoPin('')
    setConfirmacao('')
    setPinAtual('')
    setSenhaConta('')
    setErro(null)
    setSucesso(null)
    setModoRedefinirSenha(false)
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
      if (modoRedefinirSenha) {
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
        modoRedefinirSenha
          ? 'Redefinir PIN com Senha'
          : pinConfigurado
            ? 'Alterar PIN do Responsável'
            : 'Criar PIN de 4 Dígitos'
      }
      description="Este PIN será exigido para sair do Modo Criança e proteger os painéis de adulto."
    >
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

        {/* Modo Redefinir PIN via senha da conta (esqueci o PIN) */}
        {modoRedefinirSenha ? (
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
                  onClick={() => setModoRedefinirSenha(true)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Esqueci meu PIN (usar senha da conta)</span>
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

        {modoRedefinirSenha && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setModoRedefinirSenha(false)}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              ← Voltar para alteração com PIN atual
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || novoPin.length !== 4 || confirmacao.length !== 4}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{salvando ? 'Salvando...' : 'Salvar PIN'}</span>
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
