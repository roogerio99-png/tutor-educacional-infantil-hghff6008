import React from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export interface BotaoOuvirLumiProps {
  isSpeaking: boolean
  onClick: () => void
  disabled?: boolean
  label?: string
  tamanho?: 'sm' | 'md'
}

export const BotaoOuvirLumi: React.FC<BotaoOuvirLumiProps> = ({
  isSpeaking,
  onClick,
  disabled = false,
  label,
  tamanho = 'sm',
}) => {
  const isSm = tamanho === 'sm'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={isSpeaking ? 'Pausar leitura em voz' : 'Ouvir a Lumi falar'}
      aria-label={isSpeaking ? 'Pausar voz da Lumi' : 'Ouvir a Lumi falar'}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40 select-none ${
        isSm ? 'px-2.5 py-1 text-xs min-h-[32px]' : 'px-3.5 py-1.5 text-xs sm:text-sm min-h-[38px]'
      } ${
        isSpeaking
          ? 'bg-amber-500 text-white shadow-xs animate-pulse ring-2 ring-amber-300'
          : 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80 hover:border-amber-400'
      }`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          <span>{label || 'Pausar Lumi'}</span>
        </>
      ) : (
        <>
          <Volume2 className={isSm ? 'w-3.5 h-3.5 text-amber-700' : 'w-4 h-4 text-amber-700'} />
          <span>{label || 'Ouvir a Lumi 🔊'}</span>
        </>
      )}
    </button>
  )
}

export default BotaoOuvirLumi
