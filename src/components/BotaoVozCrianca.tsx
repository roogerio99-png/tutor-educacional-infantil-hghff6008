import React from 'react'
import { Mic, MicOff } from 'lucide-react'

export interface BotaoVozCriancaProps {
  isListening: boolean
  isSupported: boolean
  disabled?: boolean
  onClick: () => void
  acessibilidadeReforcada?: boolean
  tamanho?: 'normal' | 'grande'
  permissionDenied?: boolean
}

export const BotaoVozCrianca: React.FC<BotaoVozCriancaProps> = ({
  isListening,
  isSupported,
  disabled = false,
  onClick,
  acessibilidadeReforcada = false,
  tamanho = 'normal',
  permissionDenied = false,
}) => {
  if (!isSupported) {
    return (
      <div
        className="inline-flex items-center justify-center text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-1.5 border border-slate-200"
        title="Voz não suportada neste navegador. Use o Chrome ou Edge para falar com a Lumi."
      >
        <span className="text-sm mr-1">🎤❌</span>
        <span className="hidden sm:inline">Sem suporte de voz</span>
      </div>
    )
  }

  const dimensoes =
    tamanho === 'grande' || acessibilidadeReforcada
      ? 'w-16 h-16 min-w-[64px] min-h-[64px]'
      : 'w-14 h-14 min-w-[56px] min-h-[56px]'

  const iconeTamanho = tamanho === 'grande' || acessibilidadeReforcada ? 'w-7 h-7' : 'w-6 h-6'

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      {/* Ondas sonoras pulsantes quando está gravando */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-pulse pointer-events-none" />
        </>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={
          permissionDenied
            ? 'Permissão de microfone necessária'
            : isListening
              ? 'Parar de falar'
              : 'Falar com a Lumi por voz'
        }
        title={
          permissionDenied
            ? 'Permissão de microfone bloqueada. Clique para liberar no navegador.'
            : isListening
              ? 'Toque para finalizar fala'
              : 'Toque para falar com a Lumi'
        }
        className={`relative z-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${dimensoes} ${
          permissionDenied
            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 ring-2 ring-amber-300'
            : isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 ring-4 ring-red-200'
              : 'bg-gradient-to-tr from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white shadow-amber-500/30 ring-2 ring-amber-200/80 hover:scale-105'
        }`}
      >
        {isListening ? (
          <MicOff className={`${iconeTamanho} animate-pulse`} />
        ) : (
          <Mic className={iconeTamanho} />
        )}
      </button>
    </div>
  )
}

export default BotaoVozCrianca
