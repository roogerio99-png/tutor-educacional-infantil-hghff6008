import React from 'react'
import { Sparkles, Mic, Volume2 } from 'lucide-react'

export interface ToggleModoConversacaoProps {
  ativo: boolean
  onToggle: () => void
  disabled?: boolean
  acessibilidadeReforcada?: boolean
}

export const ToggleModoConversacao: React.FC<ToggleModoConversacaoProps> = ({
  ativo,
  onToggle,
  disabled = false,
  acessibilidadeReforcada = false,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={ativo}
      title={
        ativo
          ? 'Modo Conversação por Voz ativado (Lumi lê e você fala)'
          : 'Ativar Modo Conversação por Voz'
      }
      className={`relative inline-flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-2xl font-black transition-all cursor-pointer select-none border min-h-[44px] active:scale-95 disabled:opacity-50 ${
        acessibilidadeReforcada ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
      } ${
        ativo
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-300/80'
          : 'bg-white hover:bg-amber-50/70 text-slate-700 hover:text-amber-900 border-amber-200/90 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {ativo ? (
          <span className="flex items-center gap-1 text-amber-200">
            <Mic className="w-4 h-4 text-white animate-pulse" />
            <Volume2 className="w-4 h-4 text-white" />
          </span>
        ) : (
          <span className="text-base sm:text-lg">🗣️</span>
        )}
      </div>

      <div className="flex flex-col items-start text-left leading-tight">
        <span className="font-extrabold flex items-center gap-1">
          <span>Modo Conversar por Voz</span>
          {ativo && <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
        </span>
        <span
          className={`text-[10px] font-medium ${
            ativo ? 'text-amber-100 font-bold' : 'text-slate-500'
          }`}
        >
          {ativo ? 'Fale e ouça a Lumi! 🌟' : 'Toque para conversar em voz'}
        </span>
      </div>

      {/* Indicador tipo chave toggle */}
      <span
        className={`ml-1 w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
          ativo ? 'bg-amber-200 justify-end' : 'bg-slate-200 justify-start'
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full shadow-xs transition-transform transform ${
            ativo ? 'bg-amber-700' : 'bg-white'
          }`}
        />
      </span>
    </button>
  )
}

export default ToggleModoConversacao
