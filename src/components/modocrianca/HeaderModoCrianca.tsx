import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCrianca } from '@/contexts/CriancaContext'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SairModoCriancaModal } from '@/components/modocrianca/SairModoCriancaModal'
import { ConfigurarPinModal } from '@/components/modocrianca/ConfigurarPinModal'
import { MessageSquare, Calendar, Lock, Sparkles, ChevronDown } from 'lucide-react'

export const HeaderModoCrianca: React.FC = () => {
  const { criancaSelecionada, criancas, selecionarCrianca } = useCrianca()
  const {
    abrirModalSairModo,
    modalSairModoAberto,
    fecharModalSairModo,
    modalConfigurarPinAberto,
    fecharModalConfigurarPin,
  } = useModoCrianca()

  const location = useLocation()
  const [menuTrocaAluno, setMenuTrocaAluno] = useState(false)

  const isConversa = location.pathname.startsWith('/conversa')
  const isAgenda = location.pathname.startsWith('/agenda')

  return (
    <>
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-white shadow-md sticky top-0 z-30 select-none">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Logo infantil fofo com Lumi */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/conversa"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-xs px-3 py-1.5 rounded-2xl transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white text-amber-500 flex items-center justify-center text-lg shadow-sm font-black">
                ✨
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-white block">
                  Lumi
                </span>
                <span className="text-[10px] text-amber-100 font-bold leading-none">
                  Modo Criança 🧒
                </span>
              </div>
            </Link>
          </div>

          {/* Abas Infantis Exclusivas: Chat Lumi & Agenda Divertida */}
          <nav className="flex items-center gap-1.5 bg-black/10 p-1 rounded-2xl">
            <Link
              to="/conversa"
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                isConversa
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversar com a Lumi</span>
            </Link>

            <Link
              to="/agenda"
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                isAgenda
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Minha Agenda 📅</span>
            </Link>
          </nav>

          {/* Criança Ativa + Botão Discreto de Sair (com PIN) */}
          <div className="flex items-center gap-2">
            {/* Seletor simplificado se tiver mais de uma criança */}
            {criancas.length > 1 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuTrocaAluno(!menuTrocaAluno)}
                  className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                >
                  <span className="max-w-[100px] truncate">
                    {criancaSelecionada?.nome.split(' ')[0] || 'Aluno'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {menuTrocaAluno && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-amber-100 py-1 z-40 text-slate-800">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      Trocar de aluno
                    </p>
                    {criancas.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selecionarCrianca(c)
                          setMenuTrocaAluno(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 flex items-center justify-between ${
                          c.id === criancaSelecionada?.id
                            ? 'text-amber-600 bg-amber-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{c.nome}</span>
                        {c.id === criancaSelecionada?.id && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-xl text-xs font-bold">
                <span>⭐</span>
                <span className="max-w-[100px] truncate">
                  {criancaSelecionada?.nome.split(' ')[0] || 'Aluno'}
                </span>
              </div>
            )}

            {/* Botão Discreto de Sair do Modo Criança (Exige PIN) */}
            <button
              type="button"
              onClick={abrirModalSairModo}
              className="bg-black/20 hover:bg-black/35 active:bg-black/45 text-white/90 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-inner cursor-pointer"
              title="Sair do Modo Criança (Exige PIN do responsável)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair do Modo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modais de Controle */}
      <SairModoCriancaModal isOpen={modalSairModoAberto} onClose={fecharModalSairModo} />

      <ConfigurarPinModal isOpen={modalConfigurarPinAberto} onClose={fecharModalConfigurarPin} />
    </>
  )
}
