import React, { useState } from 'react'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SimpleModal } from '@/components/SimpleModal'
import { Lock, Delete, Clock, ShieldAlert, Sparkles, KeyRound } from 'lucide-react'

export const SairModoCriancaModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { tentarSairModoCrianca, tempoBloqueioRestante, abrirModalConfigurarPin } = useModoCrianca()

  const [pinDigits, setPinDigits] = useState<string[]>([])
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [shake, setShake] = useState(false)

  const handleDigit = async (d: string) => {
    if (tempoBloqueioRestante > 0 || carregando) return
    if (pinDigits.length >= 4) return

    const novos = [...pinDigits, d]
    setPinDigits(novos)
    setMensagemErro(null)

    if (novos.length === 4) {
      setCarregando(true)
      const pinStr = novos.join('')
      const res = await tentarSairModoCrianca(pinStr)

      if (res.sucesso) {
        setPinDigits([])
        setMensagemErro(null)
        onClose()
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setMensagemErro(res.mensagem || 'Só os adultos podem sair daqui 😊')
        setPinDigits([])
      }
      setCarregando(false)
    }
  }

  const handleDelete = () => {
    if (tempoBloqueioRestante > 0 || carregando) return
    setPinDigits((prev) => prev.slice(0, -1))
    setMensagemErro(null)
  }

  const handleClear = () => {
    if (tempoBloqueioRestante > 0 || carregando) return
    setPinDigits([])
    setMensagemErro(null)
  }

  const handleEsqueciPin = () => {
    onClose()
    abrirModalConfigurarPin()
  }

  return (
    <SimpleModal
      isOpen={isOpen}
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
              <strong className="font-bold">{tempoBloqueioRestante}s</strong> para tentar novamente.
            </span>
          </div>
        ) : mensagemErro ? (
          <div className="p-3 mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{mensagemErro}</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-4 text-center">
            Toque nos números para digitar o código de 4 dígitos
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
              className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-900 font-extrabold text-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer select-none"
            >
              {num}
            </button>
          ))}

          {/* Botão Limpar */}
          <button
            type="button"
            disabled={tempoBloqueioRestante > 0 || carregando || pinDigits.length === 0}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold transition-all flex items-center justify-center disabled:opacity-30 cursor-pointer"
          >
            Limpar
          </button>

          {/* Dígito Zero */}
          <button
            type="button"
            disabled={tempoBloqueioRestante > 0 || carregando}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-900 font-extrabold text-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer select-none"
          >
            0
          </button>

          {/* Botão Backspace */}
          <button
            type="button"
            disabled={tempoBloqueioRestante > 0 || carregando || pinDigits.length === 0}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all flex items-center justify-center disabled:opacity-30 cursor-pointer"
            title="Apagar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Rodapé com link de esqueci o PIN */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleEsqueciPin}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1.5 underline"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Esqueci o PIN (redefinir com senha)</span>
          </button>
        </div>
      </div>
    </SimpleModal>
  )
}
