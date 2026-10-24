import React from 'react'
import { Mic, MicOff } from 'lucide-react'

export interface BotaoVozCriancaProps {
  isListening: boolean
  isSupported: boolean
  disabled?: boolean
  onClick: () => void
  acessibilidadeReforcada?: boolean
  tamanho?: 'normal' | 'grande'
}

export const BotaoVozCrianca: React.FC<BotaoVozCriancaProps> = ({
  isListening,
  isSupported,
  disabled = false,
  onClick,
  acessibilidadeReforcada = false,
  tamanho = 'normal',
}) => {
  if (!isSupported) {
    return null
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
        aria-label={isListening ? 'Parar de falar' : 'Falar com a Lumi por voz'}
        title={isListening ? 'Toque para finalizar fala' : 'Toque para falar com a Lumi'}
        className={`relative z-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${dimensoes} ${
          isListening
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
