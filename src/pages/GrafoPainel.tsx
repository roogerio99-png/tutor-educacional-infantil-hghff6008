import React, { useState, useEffect } from 'react'
import { useCrianca } from '@/contexts/CriancaContext'
import { listarDificuldades, criarDificuldade, excluirDificuldade } from '@/services/dificuldades'
import { listarConhecimento, criarConhecimento, excluirConhecimento } from '@/services/conhecimento'
import { listarEventosAgenda } from '@/services/agenda'
import type { DificuldadeRecord, ConhecimentoRecord, AgendaRecord, Impacto } from '@/types'
import { SimpleModal } from '@/components/SimpleModal'
import { MATERIAS, IMPACTOS } from '@/types'

export const GrafoPainel: React.FC = () => {
  const { criancaSelecionada, recarregarCriancas } = useCrianca()

  const [dificuldades, setDificuldades] = useState<DificuldadeRecord[]>([])
  const [conhecimentos, setConhecimentos] = useState<ConhecimentoRecord[]>([])
  const [eventos, setEventos] = useState<AgendaRecord[]>([])
  const [carregando, setCarregando] = useState(true)

  // Modais
  const [modalDif, setModalDif] = useState(false)
  const [modalConhec, setModalConhec] = useState(false)

  // Formulário Dificuldade
  const [difMateria, setDifMateria] = useState('Matemática')
  const [difDesc, setDifDesc] = useState('')
  const [difImpacto, setDifImpacto] = useState<Impacto>('Moderado')
  const [salvandoDif, setSalvandoDif] = useState(false)

  // Formulário Conhecimento
  const [conhecTitulo, setConhecTitulo] = useState('')
  const [conhecConteudo, setConhecConteudo] = useState('')
  const [salvandoConhec, setSalvandoConhec] = useState(false)

  // Elemento selecionado no Grafo
  const [noSelecionado, setNoSelecionado] = useState<string | null>('crianca')

  const carregarDados = async () => {
    if (!criancaSelecionada) {
      setDificuldades([])
      setConhecimentos([])
      setEventos([])
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      const [dList, cList, aList] = await Promise.all([
        listarDificuldades(criancaSelecionada.id),
        listarConhecimento(criancaSelecionada.id),
        listarEventosAgenda(criancaSelecionada.id),
      ])
      setDificuldades(dList)
      setConhecimentos(cList)
      setEventos(aList)
    } catch (err) {
      console.error('Erro ao carregar grafo do aluno:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [criancaSelecionada])

  const handleSalvarDificuldade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!criancaSelecionada || !difDesc.trim()) return

    try {
      setSalvandoDif(true)
      await criarDificuldade({
        crianca: criancaSelecionada.id,
        materia: difMateria,
        descricao: difDesc.trim(),
        impacto: difImpacto,
      })
      await carregarDados()
      setModalDif(false)
      setDifDesc('')
    } catch (err) {
      console.error('Erro ao salvar dificuldade:', err)
      alert('Não foi possível registrar a dificuldade.')
    } finally {
      setSalvandoDif(false)
    }
  }

  const handleSalvarConhecimento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!criancaSelecionada || !conhecConteudo.trim()) return

    try {
      setSalvandoConhec(true)
      await criarConhecimento({
        crianca: criancaSelecionada.id,
        titulo: conhecTitulo.trim() || undefined,
        conteudo: conhecConteudo.trim(),
      })
      await carregarDados()
      setModalConhec(false)
      setConhecTitulo('')
      setConhecConteudo('')
    } catch (err) {
      console.error('Erro ao salvar conhecimento:', err)
      alert('Não foi possível registrar na base de conhecimento.')
    } finally {
      setSalvandoConhec(false)
    }
  }

  const handleExcluirDif = async (id: string) => {
    if (!confirm('Deseja remover esta dificuldade do mapa cognitivo?')) return
    try {
      await excluirDificuldade(id)
      setDificuldades((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  const handleExcluirConhec = async (id: string) => {
    if (!confirm('Deseja remover este item da base de conhecimento?')) return
    try {
      await excluirConhecimento(id)
      setConhecimentos((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  // Agrupamento de matérias para nós do Grafo
  const materiasMap = Array.from(new Set(dificuldades.map((d) => d.materia)))

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Painel Parental */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-black text-slate-800">Grafo Cognitivo & Painel Parental</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mapeamento vivo das capacidades, travas atencionais e estratégias de sucesso de{' '}
            <span className="font-semibold text-slate-700">
              {criancaSelecionada?.nome || 'Aluno'}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalDif(true)}
            className="px-4 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors"
          >
            + Ponto de Atenção
          </button>
          <button
            type="button"
            onClick={() => setModalConhec(true)}
            className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            + Estratégia de Sucesso
          </button>
        </div>
      </div>

      {/* VISUALIZAÇÃO INTERATIVA DO GRAFO COGNITIVO */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>🕸️</span> Grafo Relacional de Aprendizagem
            </h3>
            <p className="text-xs text-slate-400">
              Clique nos nós para inspecionar conexões pedagógicas com a Lumi
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
            {dificuldades.length} travas • {conhecimentos.length} alavancas
          </span>
        </div>

        {/* Área Visual do Grafo com Nós Conectados */}
        <div className="min-h-[280px] flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 relative">
          {/* Nó Central: Criança */}
          <div
            onClick={() => setNoSelecionado('crianca')}
            className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all z-10 ${
              noSelecionado === 'crianca'
                ? 'bg-amber-500 text-slate-950 font-black ring-4 ring-amber-400/40 shadow-xl shadow-amber-500/30 scale-105'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600'
            }`}
          >
            <span className="text-2xl mb-1">👦</span>
            <span className="text-xs font-bold text-center px-2 truncate w-full">
              {criancaSelecionada?.nome.split(' ')[0] || 'Criança'}
            </span>
            <span className="text-[9px] opacity-80 uppercase tracking-wider font-semibold">
              {criancaSelecionada?.serie || 'Aluno'}
            </span>
          </div>

          {/* Nós periféricos orbitando */}
          <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {/* Disciplinas com dificuldades */}
            {materiasMap.map((mat) => {
              const qtd = dificuldades.filter((d) => d.materia === mat).length
              return (
                <div
                  key={mat}
                  onClick={() => setNoSelecionado(`mat_${mat}`)}
                  className={`p-3 rounded-2xl cursor-pointer border transition-all text-center ${
                    noSelecionado === `mat_${mat}`
                      ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/40 shadow-lg'
                      : 'bg-slate-900/90 text-rose-300 border-rose-900/50 hover:border-rose-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{mat}</span>
                  <span className="text-[10px] opacity-80">{qtd} ponto(s) de atenção</span>
                </div>
              )
            })}

            {/* Nó de Alavancas de Conhecimento */}
            <div
              onClick={() => setNoSelecionado('conhecimento')}
              className={`p-3 rounded-2xl cursor-pointer border transition-all text-center ${
                noSelecionado === 'conhecimento'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                  : 'bg-slate-900/90 text-emerald-300 border-emerald-900/50 hover:border-emerald-700'
              }`}
            >
              <span className="text-xs font-bold block">Estratégias de Sucesso</span>
              <span className="text-[10px] opacity-80">{conhecimentos.length} catalisadores</span>
            </div>

            {/* Nó de Agenda e Avaliações */}
            <div
              onClick={() => setNoSelecionado('agenda')}
              className={`p-3 rounded-2xl cursor-pointer border transition-all text-center ${
                noSelecionado === 'agenda'
                  ? 'bg-sky-500 text-white font-bold border-sky-400 ring-2 ring-sky-400/40 shadow-lg'
                  : 'bg-slate-900/90 text-sky-300 border-sky-900/50 hover:border-sky-700'
              }`}
            >
              <span className="text-xs font-bold block">Próximos Compromissos</span>
              <span className="text-[10px] opacity-80">{eventos.length} no calendário</span>
            </div>
          </div>
        </div>
      </div>

      {/* DUAS COLUNAS DETALHADAS: DIFICULDADES vs BASE DE CONHECIMENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Pontos de Atenção & Dificuldades */}
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Dificuldades & Desafios Mapeados
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Alimentam o raciocínio socrático da Lumi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDif(true)}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                + Adicionar
              </button>
            </div>

            {carregando ? (
              <p className="text-xs text-slate-400 py-6 text-center">Carregando desafios...</p>
            ) : dificuldades.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                Nenhuma dificuldade cadastrada para esta criança.
              </p>
            ) : (
              <div className="space-y-3">
                {dificuldades.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start justify-between gap-3 group hover:border-rose-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md">
                          {d.materia}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            d.impacto === 'Alto'
                              ? 'bg-rose-200 text-rose-800'
                              : d.impacto === 'Moderado'
                                ? 'bg-amber-200 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Impacto {d.impacto}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{d.descricao}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExcluirDif(d.id)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Excluir"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Base de Conhecimento da Criança (Estratégias que Funcionam) */}
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Base de Conhecimento & Alavancas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    O que desperta o interesse e facilita a retenção
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConhec(true)}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                + Adicionar
              </button>
            </div>

            {carregando ? (
              <p className="text-xs text-slate-400 py-6 text-center">Carregando estratégias...</p>
            ) : conhecimentos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                Nenhuma estratégia registrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {conhecimentos.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start justify-between gap-3 group hover:border-emerald-200 transition-colors"
                  >
                    <div>
                      {c.titulo && (
                        <h4 className="text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                          <span>✨</span> {c.titulo}
                        </h4>
                      )}
                      <p className="text-xs text-slate-700 leading-relaxed">{c.conteudo}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExcluirConhec(c.id)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Excluir"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Dificuldade */}
      <SimpleModal
        isOpen={modalDif}
        onClose={() => setModalDif(false)}
        title="Registrar Ponto de Atenção"
        description="Descreva um conteúdo ou habilidade que a criança está enfrentando dificuldades."
      >
        <form onSubmit={handleSalvarDificuldade} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Matéria *
              </label>
              <select
                aria-label="Matéria da dificuldade"
                value={difMateria}
                onChange={(e) => setDifMateria(e.target.value)}
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Impacto *
              </label>
              <select
                aria-label="Impacto da dificuldade"
                value={difImpacto}
                onChange={(e) => setDifImpacto(e.target.value as Impacto)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                {IMPACTOS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Descrição da Dificuldade *
            </label>
            <textarea
              rows={3}
              required
              value={difDesc}
              onChange={(e) => setDifDesc(e.target.value)}
              placeholder="Ex: Confunde divisão com vírgula e esquece de posicionar os zeros no quociente..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalDif(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoDif}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
            >
              {salvandoDif ? 'Salvando...' : 'Salvar Desafio'}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Modal Novo Conhecimento */}
      <SimpleModal
        isOpen={modalConhec}
        onClose={() => setModalConhec(false)}
        title="Registrar Estratégia de Aprendizagem"
        description="Técnicas, metáforas ou abordagens que comprovadamente funcionam com a criança."
      >
        <form onSubmit={handleSalvarConhecimento} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Título da Estratégia
            </label>
            <input
              type="text"
              value={conhecTitulo}
              onChange={(e) => setConhecTitulo(e.target.value)}
              placeholder="Ex: Uso de blocos de montar para frações"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Como funciona na prática? *
            </label>
            <textarea
              rows={3}
              required
              value={conhecConteudo}
              onChange={(e) => setConhecConteudo(e.target.value)}
              placeholder="Ex: Montar torres de peças de cores iguais ajuda a enxergar que 2/4 é do mesmo tamanho que 1/2..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalConhec(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoConhec}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {salvandoConhec ? 'Salvando...' : 'Salvar Alavanca'}
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  )
}

export default GrafoPainel
