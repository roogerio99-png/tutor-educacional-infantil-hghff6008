import React, { useState } from 'react'
import type { EtapaSocratica } from '@/types'

export interface TrilhaEtapasProps {
  etapaAtiva: EtapaSocratica
  onSelecionarEtapa?: (etapa: EtapaSocratica) => void
}

export interface EtapaInfantilInfo {
  id: EtapaSocratica
  numero: number
  nomeCrianca: string
  fraseStatus: string
  icone: string
  corBola: string
  corBg: string
}

export const ETAPAS_INFANTIS: EtapaInfantilInfo[] = [
  {
    id: 'entender',
    numero: 1,
    nomeCrianca: 'Vamos descobrir?',
    fraseStatus: 'Estamos descobrindo juntos 🔍',
    icone: '🔍',
    corBola: 'bg-amber-400 text-amber-950 border-amber-300 shadow-amber-200',
    corBg: 'from-amber-50 to-amber-100/60 text-amber-900 border-amber-200',
  },
  {
    id: 'contextualizar',
    numero: 2,
    nomeCrianca: 'Pensando junto',
    fraseStatus: 'Pensando onde isso aparece no seu dia a dia 💭',
    icone: '💭',
    corBola: 'bg-orange-400 text-orange-950 border-orange-300 shadow-orange-200',
    corBg: 'from-orange-50 to-orange-100/60 text-orange-900 border-orange-200',
  },
  {
    id: 'guiar',
    numero: 3,
    nomeCrianca: 'Sua vez de tentar',
    fraseStatus: 'Dando pistas passo a passo com você ✏️',
    icone: '✏️',
    corBola: 'bg-sky-400 text-sky-950 border-sky-300 shadow-sky-200',
    corBg: 'from-sky-50 to-sky-100/60 text-sky-900 border-sky-200',
  },
  {
    id: 'praticar',
    numero: 4,
    nomeCrianca: 'Brincando de aprender',
    fraseStatus: 'Hora de um joguinho de desafio 🧩',
    icone: '🧩',
    corBola: 'bg-emerald-400 text-emerald-950 border-emerald-300 shadow-emerald-200',
    corBg: 'from-emerald-50 to-emerald-100/60 text-emerald-900 border-emerald-200',
  },
  {
    id: 'consolidar',
    numero: 5,
    nomeCrianca: 'Você conseguiu!',
    fraseStatus: 'Parabéns, você é demais! Conte como aprendeu 🌟',
    icone: '🌟',
    corBola: 'bg-purple-400 text-purple-950 border-purple-300 shadow-purple-200',
    corBg: 'from-purple-50 to-purple-100/60 text-purple-900 border-purple-200',
  },
]

// Mantemos o alias ETAPAS_SOCRATICAS para compatibilidade retroativa caso algo importe
export const ETAPAS_SOCRATICAS = ETAPAS_INFANTIS.map((e) => ({
  id: e.id,
  numero: e.numero,
  nomeAmigavel: e.nomeCrianca,
  subtitulo: e.fraseStatus,
  icone: e.icone,
  corAtiva: `${e.corBola} shadow-md`,
  corBorda: 'border-amber-300',
}))

export const TrilhaEtapasSocraticas: React.FC<TrilhaEtapasProps> = ({
  etapaAtiva,
  onSelecionarEtapa,
}) => {
  const [expandida, setExpandida] = useState(false)
  const indiceAtivo = ETAPAS_INFANTIS.findIndex((e) => e.id === etapaAtiva)
  const indiceSeguro = indiceAtivo >= 0 ? indiceAtivo : 0
  const etapaAtualObj = ETAPAS_INFANTIS[indiceSeguro]

  return (
    <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-amber-200/70 p-2 sm:p-2.5 shadow-xs transition-all">
      {/* Linha principal compacta: Trilha de pedrinhas + frase da etapa atual */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Caminho lúdico de pedrinhas */}
        <div
          className="flex items-center gap-1 sm:gap-1.5"
          role="navigation"
          aria-label="Jornada de aprendizado"
        >
          {ETAPAS_INFANTIS.map((etapa, idx) => {
            const isAtiva = etapa.id === etapaAtiva
            const isPassada = idx < indiceSeguro

            return (
              <React.Fragment key={etapa.id}>
                <button
                  type="button"
                  onClick={() => onSelecionarEtapa?.(etapa.id)}
                  title={`${etapa.numero}. ${etapa.nomeCrianca}`}
                  className={`relative flex items-center justify-center transition-all select-none rounded-full cursor-pointer ${
                    isAtiva
                      ? 'w-9 h-9 sm:w-10 sm:h-10 ring-4 ring-amber-300/60 shadow-md scale-105 font-black text-base sm:text-lg ' +
                        etapa.corBola
                      : isPassada
                        ? 'w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 border border-emerald-300 text-emerald-700 hover:scale-105 font-bold text-xs sm:text-sm'
                        : 'w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-400 text-xs sm:text-sm'
                  }`}
                  aria-current={isAtiva ? 'step' : undefined}
                >
                  {isAtiva ? (
                    <span>{etapa.icone}</span>
                  ) : isPassada ? (
                    <span className="text-emerald-700 font-extrabold">✓</span>
                  ) : (
                    <span className="font-bold text-slate-400">{etapa.numero}</span>
                  )}
                </button>

                {/* Conector pontilhado entre as pedrinhas */}
                {idx < ETAPAS_INFANTIS.length - 1 && (
                  <div
                    className={`h-1 w-2 sm:w-3.5 rounded-full transition-colors ${
                      idx < indiceSeguro ? 'bg-emerald-300' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Chip da etapa atual com frase amigável */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs sm:text-sm font-bold bg-gradient-to-r ${etapaAtualObj.corBg}`}
          >
            <span>{etapaAtualObj.icone}</span>
            <span className="font-extrabold">{etapaAtualObj.nomeCrianca}</span>
          </div>

          <button
            type="button"
            onClick={() => setExpandida(!expandida)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition-colors"
            aria-expanded={expandida}
          >
            {expandida ? 'Menos ▲' : 'Ver caminho ▼'}
          </button>
        </div>
      </div>

      {/* Frase amigável de status logo abaixo da trilha */}
      <div className="mt-1.5 pt-1.5 border-t border-amber-100/60 flex items-center justify-between text-xs text-slate-600 px-1">
        <p className="font-medium flex items-center gap-1.5 text-amber-900/90 text-[11px] sm:text-xs">
          <span>✨</span>
          <span>{etapaAtualObj.fraseStatus}</span>
        </p>
        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
          Passo {indiceSeguro + 1} de 5
        </span>
      </div>

      {/* Visão expandida opcional (cartõezinhos fofos para entender os passos) */}
      {expandida && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-100 grid grid-cols-2 sm:grid-cols-5 gap-1.5 animate-fadeIn">
          {ETAPAS_INFANTIS.map((etapa, idx) => {
            const isAtiva = etapa.id === etapaAtiva
            const isPassada = idx < indiceSeguro

            return (
              <button
                key={etapa.id}
                type="button"
                onClick={() => {
                  onSelecionarEtapa?.(etapa.id)
                }}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isAtiva
                    ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                    : isPassada
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{etapa.icone}</span>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    {idx + 1}º Passo
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-800 leading-tight">
                  {etapa.nomeCrianca}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TrilhaEtapasSocraticas
