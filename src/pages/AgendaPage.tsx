import React, { useState, useEffect } from 'react'
import { useCrianca } from '@/contexts/CriancaContext'
import {
  listarEventosAgenda,
  criarEventoAgenda,
  alternarConcluidoAgenda,
  excluirEventoAgenda,
} from '@/services/agenda'
import type { AgendaRecord, TipoEventoAgenda } from '@/types'
import { SimpleModal } from '@/components/SimpleModal'
import { MATERIAS } from '@/types'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'

import { useAuth } from '@/contexts/AuthContext'
import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export const AgendaPage: React.FC = () => {
  const { tipoConta, permissoes } = useAuth()
  const { criancaSelecionada } = useCrianca()
  const { modoCriancaAtivo } = useModoCrianca()
  const [eventos, setEventos] = useState<AgendaRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)

  // Formulário de novo evento
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [horario, setHorario] = useState('14:00')
  const [materia, setMateria] = useState('Ciências')
  const [tipo, setTipo] = useState<TipoEventoAgenda>('tarefa')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Filtro
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const carregarEventos = async () => {
    if (!criancaSelecionada) {
      setEventos([])
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      const lista = await listarEventosAgenda(criancaSelecionada.id)
      setEventos(lista)
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarEventos()
  }, [criancaSelecionada])

  // Recarregar agenda também quando a janela ganha foco ou visibilidade volta (ex: voltou da aba Conversa após evento criado pela Lumi)
  useEffect(() => {
    const onFocus = () => carregarEventos()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [criancaSelecionada])

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!criancaSelecionada || !titulo.trim() || !data) return

    try {
      setSalvando(true)
      await criarEventoAgenda({
        crianca: criancaSelecionada.id,
        titulo: titulo.trim(),
        data,
        horario: horario.trim() || undefined,
        materia,
        tipo,
        descricao: descricao.trim() || undefined,
        concluido: false,
      })
      await carregarEventos()
      setModalNovo(false)
      setTitulo('')
      setDescricao('')
    } catch (err) {
      console.error('Erro ao salvar evento:', err)
      alert('Não foi possível salvar o compromisso na agenda.')
    } finally {
      setSalvando(false)
    }
  }

  const handleToggle = async (item: AgendaRecord) => {
    try {
      await alternarConcluidoAgenda(item.id, !!item.concluido)
      setEventos((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, concluido: !item.concluido } : e)),
      )
    } catch (err) {
      console.error('Erro ao alternar status:', err)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente remover este compromisso da agenda?')) return
    try {
      await excluirEventoAgenda(id)
      setEventos((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Erro ao excluir item:', err)
    }
  }

  const getTipoBadge = (t?: string) => {
    switch (t) {
      case 'prova':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            📝 Prova
          </span>
        )
      case 'tarefa':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            📚 Tarefa
          </span>
        )
      case 'revisao':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
            🔍 Revisão
          </span>
        )
      case 'projeto':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            🚀 Projeto
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            📌 Geral
          </span>
        )
    }
  }

  const eventosFiltrados = eventos.filter((ev) => {
    if (filtroTipo === 'todos') return true
    if (filtroTipo === 'pendentes') return !ev.concluido
    if (filtroTipo === 'concluidos') return ev.concluido
    return ev.tipo === filtroTipo
  })

  // Se for conta de criança e a permissão de agenda estiver bloqueada:
  if (tipoConta === 'crianca' && !permissoes.agenda) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-[#F0E4D8] shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mb-4 shadow-sm">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-extrabold text-[#4A3B32]">Agenda Guardada 💛</h2>
        <p className="text-sm text-[#8A796C] max-w-md mt-2">
          Esse cantinho está guardado pelo seu responsável 💛. Quando ele liberar, você poderá
          acompanhar suas tarefas escolares por aqui!
        </p>
        <Link
          to="/conversa"
          className="mt-6 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20"
        >
          Voltar para conversar com a Lumi ✨
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Agenda Adaptado (Modo Criança vs Modo Adulto) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft border border-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">📅</span>
            <h1 className="text-lg sm:text-xl font-black text-slate-800">
              {modoCriancaAtivo
                ? 'Minha Agenda Escolar & Desafios'
                : 'Agenda Escolar & Cronograma Socrático'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {modoCriancaAtivo ? (
              <>
                Oi,{' '}
                <strong className="font-bold text-slate-700">
                  {criancaSelecionada?.nome || 'Amigo(a)'}
                </strong>
                ! Aqui estão suas tarefas, provinhas e compromissos para você estudar com a Lumi.
              </>
            ) : (
              <>
                Planejamento pedagógico de{' '}
                <strong className="font-semibold text-slate-700">
                  {criancaSelecionada?.nome || 'Criança'}
                </strong>
                . Acompanhe provas, tarefas de fixação e revisões guiadas com a Lumi.
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovo(true)}
          className="px-4 sm:px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>+ {modoCriancaAtivo ? 'Anotar Tarefinha' : 'Novo Compromisso'}</span>
        </button>
      </div>

      {/* Barra de Filtros e Contadores */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 p-3 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll">
          <span className="font-bold text-slate-500 mr-1">Filtrar:</span>
          {['todos', 'pendentes', 'concluidos', 'prova', 'tarefa', 'revisao'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltroTipo(f)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-colors ${
                filtroTipo === f
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="text-slate-500 font-medium">
          {modoCriancaAtivo ? (
            <span>
              Você tem{' '}
              <strong className="font-bold text-amber-600">
                {eventos.filter((e) => !e.concluido).length}
              </strong>{' '}
              {eventos.filter((e) => !e.concluido).length === 1
                ? 'tarefinha pendente'
                : 'tarefinhas pendentes'}
              !
            </span>
          ) : (
            <span>
              Total: <span className="font-bold text-slate-700">{eventos.length}</span> eventos |
              Pendentes:{' '}
              <span className="font-bold text-amber-600">
                {eventos.filter((e) => !e.concluido).length}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Lista de Atividades */}
      {carregando ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-sm">
          Carregando calendário de atividades...
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-dashed border-amber-200">
          <span className="text-4xl sm:text-5xl block mb-2">🌟</span>
          <h3 className="text-base font-bold text-slate-700 mb-1">
            {modoCriancaAtivo
              ? 'Tudo limpo por aqui!'
              : 'Nenhum compromisso encontrado nesta visualização'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {modoCriancaAtivo
              ? 'Você não tem nenhuma tarefa pendente aqui. Que tal pedir uma lição divertida para a Lumi?'
              : 'Cadastre as datas de provas, trabalhos e tarefas escolares para que a Lumi possa sugerir revisões graduais nos dias certos.'}
          </p>
          <button
            type="button"
            onClick={() => setModalNovo(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs"
          >
            {modoCriancaAtivo ? 'Anotar Primeira Tarefa' : 'Adicionar Primeiro Evento'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventosFiltrados.map((ev) => (
            <div
              key={ev.id}
              className={`p-5 rounded-3xl bg-white border transition-all card-hover-lift flex flex-col justify-between ${
                ev.concluido
                  ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                  : 'border-slate-200/80 shadow-soft'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getTipoBadge(ev.tipo)}
                    {ev.materia && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ev.materia}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(ev)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg flex items-center justify-center gap-1 border text-xs font-bold transition-all ${
                      ev.concluido
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-slate-300 hover:border-amber-500 text-slate-400 hover:text-amber-600 bg-slate-50'
                    }`}
                    title={ev.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                  >
                    <span>{ev.concluido ? '✓ Feito!' : 'Concluir'}</span>
                  </button>
                </div>

                <h3
                  className={`text-base font-bold text-slate-800 mb-1 leading-snug ${
                    ev.concluido ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {ev.titulo}
                </h3>

                {ev.descricao && (
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">{ev.descricao}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <span>📅</span>
                  <span>{ev.data}</span>
                  {ev.horario && (
                    <span className="font-semibold text-slate-600">• {ev.horario}</span>
                  )}
                </div>

                {!modoCriancaAtivo && (
                  <button
                    type="button"
                    onClick={() => handleExcluir(ev.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                    title="Excluir evento"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Novo Evento */}
      <SimpleModal
        isOpen={modalNovo}
        onClose={() => setModalNovo(false)}
        title="Agendar Atividade Escolar"
        description="Organize avaliações e temas de estudo com antecedência."
      >
        <form onSubmit={handleCriar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Título da Atividade *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Prova de Ciências - Reino Vegetal"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Horário
              </label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Matéria / Disciplina
              </label>
              <select
                aria-label="Matéria ou Disciplina"
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo</label>
              <select
                aria-label="Tipo de atividade escolar"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoEventoAgenda)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                <option value="prova">Prova / Avaliação</option>
                <option value="tarefa">Tarefa de Casa</option>
                <option value="revisao">Revisão com Lumi</option>
                <option value="projeto">Trabalho / Projeto</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Orientações ou Tópicos a Cobrir
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Focar na diferença entre respiração celular e fotossíntese..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalNovo(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {salvando ? 'Agendando...' : 'Salvar na Agenda'}
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  )
}

export default AgendaPage
