import React from 'react'
import { Link } from 'react-router-dom'
import type { AcaoLumiExecutada } from '@/types'

export interface CartaoAcaoLumiProps {
  acao: AcaoLumiExecutada
}

export const CartaoAcaoLumi: React.FC<CartaoAcaoLumiProps> = ({ acao }) => {
  if (acao.tipo === 'agenda_criada') {
    return (
      <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shrink-0 shadow-sm shadow-amber-500/30">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Agenda Atualizada
              </span>
              {acao.materia && (
                <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                  {acao.materia}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
              {acao.titulo || 'Novo compromisso escolar'}
            </h4>
            {acao.data && (
              <p className="text-[11px] text-slate-600 font-medium">
                Data marcada: <span className="font-semibold text-amber-800">{acao.data}</span>
              </p>
            )}
          </div>
        </div>

        <Link
          to="/agenda"
          className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
        >
          <span>Ver Agenda</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    )
  }

  if (acao.tipo === 'agenda_concluida') {
    return (
      <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-base shrink-0 shadow-sm shadow-emerald-500/30">
            ✅
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Tarefa Concluída!
            </span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
              {acao.titulo || 'Atividade escolar finalizada'}
            </h4>
            <p className="text-[11px] text-emerald-700 font-medium">
              Parabéns pelo empenho e dedicação!
            </p>
          </div>
        </div>

        <Link
          to="/agenda"
          className="shrink-0 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
        >
          <span>Conferir</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    )
  }

  if (acao.tipo === 'memoria_registrada') {
    return (
      <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center text-base shrink-0 shadow-sm shadow-purple-500/30">
            💡
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
              Memória de Aprendizagem Guardada
            </span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
              {acao.titulo || 'Nova observação pedagógica'}
            </h4>
            <p className="text-[11px] text-purple-700 italic">
              "Vou lembrar de usar isso nas próximas lições!"
            </p>
          </div>
        </div>

        <Link
          to="/base-conhecimento"
          className="shrink-0 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
        >
          <span>Ver Memória</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    )
  }

  return null
}

export default CartaoAcaoLumi
