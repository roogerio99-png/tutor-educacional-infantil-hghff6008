import React from 'react'

export const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`flex items-center gap-2.5 font-bold ${className}`}>
      {/* Símbolo de livro aberto com coração */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-br from-[#F28C28] to-[#E06A10] text-white rounded-xl flex items-center justify-center shadow-md relative overflow-hidden flex-shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-white relative z-10"
        >
          {/* Livro aberto */}
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M6 6h10" />
          {/* Coração central */}
          <path
            d="M12 9.5 C12 8.5 13 8 13.7 8.7 C14.5 9.5 14.5 10.5 12 12.5 C9.5 10.5 9.5 9.5 10.3 8.7 C11 8 12 8.5 12 9.5 Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      <span
        className={`${textSizes[size]} text-[#4A3B32] tracking-tight font-extrabold flex items-center gap-1`}
      >
        <span>Aprende</span>
        <span className="text-[#F28C28]">+</span>
        <span className="text-[#9C8B7D] font-semibold text-[0.88em]">Tutor</span>
      </span>
    </div>
  )
}
