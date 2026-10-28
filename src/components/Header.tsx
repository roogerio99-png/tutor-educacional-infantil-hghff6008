import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCrianca } from '@/contexts/CriancaContext'
import { SimpleModal } from '@/components/SimpleModal'
import { criarCrianca } from '@/services/criancas'
import { SERIES } from '@/types'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { AtivarModoCriancaModal } from '@/components/modocrianca/AtivarModoCriancaModal'
import { ConfigurarPinModal } from '@/components/modocrianca/ConfigurarPinModal'

const TABS = [
  {
    id: 'conversa',
    path: '/conversa',
    label: 'Conversa & Quadro',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
  {
    id: 'agenda',
    path: '/agenda',
    label: 'Agenda Escolar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: 'grafo',
    path: '/grafo-painel',
    label: 'Grafo & Painel',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: 'prompts',
    path: '/prompts',
    label: 'Studio de Prompts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
  },
  {
    id: 'configuracoes',
    path: '/configuracoes',
    label: 'Família & Uso',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
]
export const Header: React.FC = () => {
  const { user, logout, tipoConta } = useAuth()
  const { criancas, criancaSelecionada, selecionarCrianca, recarregarCriancas } = useCrianca()
  const {
    pinConfigurado,
    modalConfigurarPinAberto,
    abrirModalConfigurarPin,
    fecharModalConfigurarPin,
  } = useModoCrianca()
  const location = useLocation()
  const navigate = useNavigate()

  const [modalAtivarModoCrianca, setModalAtivarModoCrianca] = useState(false)
  const [modalNovaCrianca, setModalNovaCrianca] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaIdade, setNovaIdade] = useState('8')
  const [novaSerie, setNovaSerie] = useState('3º Ano')
  const [novaEscola, setNovaEscola] = useState('')
  const [novasObs, setNovasObs] = useState('')
  const [salvandoCrianca, setSalvandoCrianca] = useState(false)

  const handleCriarCrianca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoNome.trim()) return

    try {
      setSalvandoCrianca(true)
      const nova = await criarCrianca({
        nome: novoNome.trim(),
        idade: parseInt(novaIdade, 10) || 8,
        serie: novaSerie,
        escola: novaEscola.trim() || undefined,
        observacoes: novasObs.trim() || undefined,
      })
      await recarregarCriancas()
      selecionarCrianca(nova)
      setModalNovaCrianca(false)
      setNovoNome('')
      setNovaEscola('')
      setNovasObs('')
    } catch (err) {
      console.error('Erro ao criar criança:', err)
      alert('Não foi possível cadastrar a criança.')
    } finally {
      setSalvandoCrianca(false)
    }
  }

  return (
    <>
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <Link to="/conversa" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    Lumi IA
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    Socrática
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Tutoria & Inteligência Educacional</p>
              </div>
            </Link>
          </div>

          {/* Seletor de Criança */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Aluno:</span>
            {criancas.length > 0 ? (
              <select
                aria-label="Selecionar aluno"
                value={criancaSelecionada?.id || ''}
                onChange={(e) => {
                  const target = criancas.find((c) => c.id === e.target.value) || null
                  selecionarCrianca(target)
                }}
                className="bg-transparent text-sm font-semibold text-amber-300 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {criancas.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                    {c.nome} ({c.serie || `${c.idade} anos`})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-amber-400 italic">Nenhum cadastrado</span>
            )}

            <button
              type="button"
              onClick={() => setModalNovaCrianca(true)}
              className="text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors ml-1 font-medium"
              title="Cadastrar nova criança"
            >
              + Novo
            </button>
          </div>

          {/* Acesso da Criança e Modo Criança */}
          <Link
            to="/grafo-painel"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
            title="Gerenciar usuário, senha e permissões da criança"
          >
            <span>🔐</span>
            <span>Acesso Criança</span>
          </Link>

          {/* Botão de Destaque: Ativar Modo Criança */}
          <button
            type="button"
            onClick={() => setModalAtivarModoCrianca(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-md shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Ativar experiência protegida para a criança usar no celular"
          >
            <span>🧒</span>
            <span>Modo Criança</span>
          </button>

          {/* Usuário e Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user?.name || user?.email}</p>
              <p className="text-[10px] text-slate-400">Responsável</p>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="text-xs text-slate-400 hover:text-rose-300 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Encerrar sessão"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 4 Abas do Protótipo Lumi IA */}
        <div className="bg-slate-800/90 border-t border-slate-700/60">
          <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto custom-scroll">
            {TABS.filter((tab) => {
              if (
                (tab.id === 'prompts' || tab.id === 'grafo-painel' || tab.id === 'configuracoes') &&
                tipoConta === 'crianca'
              ) {
                return false
              }
              return true
            }).map((tab) => {
              const isActive = location.pathname === tab.path
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isActive
                      ? 'border-amber-400 text-amber-300 bg-slate-700/40'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/20'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              )
            })}{' '}
          </div>
        </div>
      </header>

      {/* Modal de Ativação do Modo Criança */}
      <AtivarModoCriancaModal
        isOpen={modalAtivarModoCrianca}
        onClose={() => setModalAtivarModoCrianca(false)}
      />

      {/* Modal de Configuração do PIN */}
      <ConfigurarPinModal isOpen={modalConfigurarPinAberto} onClose={fecharModalConfigurarPin} />

      {/* Modal para cadastrar criança */}
      <SimpleModal
        isOpen={modalNovaCrianca}
        onClose={() => setModalNovaCrianca(false)}
        title="Cadastrar Criança"
        description="Adicione as informações do aluno para que a Lumi personalize as perguntas e o ritmo socrático."
      >
        <form onSubmit={handleCriarCrianca} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Gabriel Souza"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Idade (anos) *
              </label>
              <input
                type="number"
                min="4"
                max="18"
                required
                value={novaIdade}
                onChange={(e) => setNovaIdade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Série / Ano *
              </label>
              <select
                aria-label="Série ou Ano Escolar"
                value={novaSerie}
                onChange={(e) => setNovaSerie(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                {SERIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Escola / Colégio
            </label>
            <input
              type="text"
              value={novaEscola}
              onChange={(e) => setNovaEscola(e.target.value)}
              placeholder="Ex: Escola Estadual Machado de Assis"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Observações & Estilo de Aprendizagem
            </label>
            <textarea
              rows={3}
              value={novasObs}
              onChange={(e) => setNovasObs(e.target.value)}
              placeholder="Ex: Gosta muito de futebol e desenhos; aprende melhor com analogias visuais; cansa após 20 minutos de estudo."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalNovaCrianca(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoCrianca}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {salvandoCrianca ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </form>
      </SimpleModal>
    </>
  )
}
