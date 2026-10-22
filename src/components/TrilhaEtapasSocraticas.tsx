import React from 'react'
import type { EtapaSocratica } from '@/types'

export interface TrilhaEtapasProps {
  etapaAtiva: EtapaSocratica
  onSelecionarEtapa?: (etapa: EtapaSocratica) => void
}

export const ETAPAS_SOCRATICAS: Array<{
  id: EtapaSocratica
  numero: number
  nomeAmigavel: string
  subtitulo: string
  icone: string
  corAtiva: string
  corBorda: string
}> = [
  {
    id: 'entender',
    numero: 1,
    nomeAmigavel: 'Entendendo',
    subtitulo: 'Investigando onde travou',
    icone: '🔍',
    corAtiva: 'bg-amber-500 text-white shadow-amber-500/30',
    corBorda: 'border-amber-300',
  },
  {
    id: 'contextualizar',
    numero: 2,
    nomeAmigavel: 'Contextualizando',
    subtitulo: 'Ligando ao seu dia a dia',
    icone: '🌍',
    corAtiva: 'bg-orange-500 text-white shadow-orange-500/30',
    corBorda: 'border-orange-300',
  },
  {
    id: 'guiar',
    numero: 3,
    nomeAmigavel: 'Guiando',
    subtitulo: 'Passo a passo com perguntas',
    icone: '🧭',
    corAtiva: 'bg-sky-500 text-white shadow-sky-500/30',
    corBorda: 'border-sky-300',
  },
  {
    id: 'praticar',
    numero: 4,
    nomeAmigavel: 'Praticando',
    subtitulo: 'Exercício para você tentar',
    icone: '✏️',
    corAtiva: 'bg-emerald-500 text-white shadow-emerald-500/30',
    corBorda: 'border-emerald-300',
  },
  {
    id: 'consolidar',
    numero: 5,
    nomeAmigavel: 'Consolidando',
    subtitulo: 'Ensinando com suas palavras',
    icone: '🏆',
    corAtiva: 'bg-purple-500 text-white shadow-purple-500/30',
    corBorda: 'border-purple-300',
  },
]

export const TrilhaEtapasSocraticas: React.FC<TrilhaEtapasProps> = ({
  etapaAtiva,
  onSelecionarEtapa,
}) => {
  const indiceAtivo = ETAPAS_SOCRATICAS.findIndex((e) => e.id === etapaAtiva)
  const indiceSeguro = indiceAtivo >= 0 ? indiceAtivo : 0

  return (
    <div className="bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80 p-3 rounded-2xl border border-amber-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
            <span>✨</span> Trilha Socrática Anti-Spoiler
          </span>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-full">
            Etapa {indiceSeguro + 1} de 5: {ETAPAS_SOCRATICAS[indiceSeguro]?.nomeAmigavel}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Aprender construindo o raciocínio
        </span>
      </div>

      {/* Barra de progresso visual */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${((indiceSeguro + 1) / 5) * 100}%` }}
        />
      </div>

      {/* Etapas em cards responsivos */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {ETAPAS_SOCRATICAS.map((etapa, idx) => {
          const isAtivo = etapa.id === etapaAtiva
          const isConcluido = idx < indiceSeguro

          return (
            <button
              key={etapa.id}
              type="button"
              onClick={() => onSelecionarEtapa?.(etapa.id)}
              className={`p-1.5 sm:p-2 rounded-xl text-left transition-all border flex flex-col justify-between ${
                isAtivo
                  ? `${etapa.corAtiva} ring-2 ring-amber-400 shadow-md scale-102`
                  : isConcluido
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 opacity-90'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className="text-xs sm:text-sm">{etapa.icone}</span>
                <span
                  className={`text-[9px] font-black px-1 rounded-full ${
                    isAtivo
                      ? 'bg-white/30 text-white'
                      : isConcluido
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isConcluido ? '✓' : etapa.numero}
                </span>
              </div>
              <div>
                <p
                  className={`text-[10px] sm:text-[11px] font-bold leading-tight truncate ${
                    isAtivo ? 'text-white' : ''
                  }`}
                >
                  {etapa.nomeAmigavel}
                </p>
                <p
                  className={`text-[8px] sm:text-[9px] leading-none hidden md:block truncate mt-0.5 ${
                    isAtivo ? 'text-white/80' : 'text-slate-400'
                  }`}
                >
                  {etapa.subtitulo}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TrilhaEtapasSocraticas
