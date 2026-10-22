import React from 'react'
import { Link } from 'react-router-dom'
import type { AcaoLumiExecutada } from '@/types'

export interface CartaoAcaoLumiProps {
  acao: AcaoLumiExecutada
}

export const CartaoAcaoLumi: React.FC<CartaoAcaoLumiProps> = ({ acao }) => {
  if (acao.tipo === 'agenda_criada') {
    return (
      <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-lg shrink-0 shadow-xs">
            📅
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Anotado na agenda!
              </span>
              {acao.materia && (
                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {acao.materia}
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 leading-snug">
              {acao.titulo || 'Novo compromisso'}
            </h4>
            {acao.data && (
              <p className="text-[11px] text-slate-600">
                Marcado para o dia: <strong className="text-amber-800">{acao.data}</strong>
              </p>
            )}
          </div>
        </div>

        <Link
          to="/agenda"
          className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
        >
          <span>Ver</span>
          <span>→</span>
        </Link>
      </div>
    )
  }

  if (acao.tipo === 'agenda_concluida') {
    return (
      <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center text-lg shrink-0 shadow-xs">
            🎉
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Lição concluída!
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 leading-snug">
              {acao.titulo || 'Atividade finalizada'}
            </h4>
            <p className="text-[11px] text-emerald-700 font-medium">
              Muito bem! Você brilhou nessa! 🌟
            </p>
          </div>
        </div>

        <Link
          to="/agenda"
          className="shrink-0 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
        >
          <span>Conferir</span>
          <span>→</span>
        </Link>
      </div>
    )
  }

  if (acao.tipo === 'memoria_registrada') {
    return (
      <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-400 text-purple-950 flex items-center justify-center text-lg shrink-0 shadow-xs">
            💡
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
              Guardei no meu caderninho!
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 leading-snug">
              {acao.titulo || 'Ideia importante'}
            </h4>
            <p className="text-[11px] text-purple-700 font-medium">
              Vou me lembrar disso quando estivermos estudando juntos!
            </p>
          </div>
        </div>

        <Link
          to="/base-conhecimento"
          className="shrink-0 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
        >
          <span>Ver</span>
          <span>→</span>
        </Link>
      </div>
    )
  }

  return null
}

export default CartaoAcaoLumi
