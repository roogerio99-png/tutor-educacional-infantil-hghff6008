import React from 'react'
import { ShieldCheck, Cpu, Database, Calendar, Eye, Activity } from 'lucide-react'
import type { EtapaSocratica, AcaoLumiExecutada } from '@/types'

export interface EventoTelemetria {
  id: string
  horario: string
  tipo: 'guardrail' | 'subsunçor' | 'agenda' | 'quadro' | 'piaget' | 'socratica'
  titulo: string
  detalhe: string
  status?: 'ativo' | 'executado' | 'bloqueado'
}

export interface TelemetriaCerebroProps {
  etapaAtual: EtapaSocratica
  materiaAtual: string
  estagioPiaget: {
    nome: string
    faixa: string
    descricao: string
  }
  acoesRecentes: AcaoLumiExecutada[]
  eventos: EventoTelemetria[]
  guardrailAtivo?: boolean
}

export const TelemetriaCerebro: React.FC<TelemetriaCerebroProps> = ({
  etapaAtual,
  materiaAtual,
  estagioPiaget,
  acoesRecentes,
  eventos,
  guardrailAtivo = true,
}) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-soft border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h4 className="text-xs sm:text-sm font-black text-white">
            Telemetria do Cérebro Conversacional
          </h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Tempo Real
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-white">{estagioPiaget.nome}</strong> ({estagioPiaget.faixa})
          </span>
        </div>
      </div>

      {/* Indicadores-chave dos 4 pilares em tempo real */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
        {/* Guardrail */}
        <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Guardrail</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-black text-emerald-400 mt-1">
            {guardrailAtivo ? '100% Protegido (ECA)' : 'Inativo'}
          </div>
          <span className="text-[10px] text-slate-400">Pré-áudio + PII Scrubber</span>
        </div>

        {/* Etapa Socrática */}
        <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Passo em Curso</span>
            <Eye className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xs font-black text-amber-300 capitalize mt-1">
            {etapaAtual === 'entender' && '🔍 Entender'}
            {etapaAtual === 'contextualizar' && '💭 Contextualizar'}
            {etapaAtual === 'guiar' && '✏️ Guiar'}
            {etapaAtual === 'praticar' && '🧩 Praticar'}
            {etapaAtual === 'consolidar' && '🌟 Consolidar'}
          </div>
          <span className="text-[10px] text-slate-400">
            {etapaAtual === 'entender' && 'Explorando o que sabe'}
            {etapaAtual === 'contextualizar' && 'Ligando ao dia a dia'}
            {etapaAtual === 'guiar' && 'Dando pistas passo a passo'}
            {etapaAtual === 'praticar' && 'Desafio prático rápido'}
            {etapaAtual === 'consolidar' && 'Comemoração & explicação'}
          </span>
        </div>

        {/* Quadro Visual / Co-Speech */}
        <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Co-Speech</span>
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xs font-black text-sky-300 mt-1">Quadro Bruner</div>
          <span className="text-[10px] text-slate-400">Sincronizado na fala</span>
        </div>

        {/* Subsunçores / Memória */}
        <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Ausubel</span>
            <Database className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xs font-black text-purple-300 mt-1">Subsunçores</div>
          <span className="text-[10px] text-slate-400">{acoesRecentes.length} ações no turno</span>
        </div>
      </div>

      {/* Feed de Eventos Recentes da Conversa */}
      <div className="space-y-1.5 mt-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Histórico de Eventos do Turno:
        </span>

        {eventos.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1">
            Nenhum evento registrado ainda. Inicie a conversa ou clique em um cenário de teste
            acima!
          </p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scroll pr-1">
            {eventos.map((ev) => (
              <div
                key={ev.id}
                className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0">
                    {ev.tipo === 'guardrail' && '🛡️'}
                    {ev.tipo === 'subsunçor' && '🧠'}
                    {ev.tipo === 'agenda' && '📅'}
                    {ev.tipo === 'quadro' && '🎨'}
                    {ev.tipo === 'piaget' && '🌱'}
                    {ev.tipo === 'socratica' && '❓'}
                  </span>
                  <div>
                    <div className="font-bold text-slate-200 leading-tight">{ev.titulo}</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {ev.detalhe}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono block">{ev.horario}</span>
                  {ev.status && (
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                        ev.status === 'executado'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ev.status === 'bloqueado'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ev.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TelemetriaCerebro
