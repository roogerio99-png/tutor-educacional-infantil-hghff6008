import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  listarDificuldades,
  criarDificuldade,
  atualizarDificuldade,
  excluirDificuldade,
  type DificuldadeInput,
} from '@/services/dificuldades'
import { listarCriancas } from '@/services/criancas'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { DificuldadeModal } from '@/components/DificuldadeModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { DificuldadeRecord, CriancaRecord } from '@/types'
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react'

// Paleta de gradientes acolhedores para avatares infantis
const AVATAR_GRADIENTS = [
  'from-[#F28C28] to-[#E06A10]',
  'from-[#3DA64C] to-[#2E8B3B]',
  'from-[#3B82F6] to-[#1D4ED8]',
  'from-[#EC4899] to-[#BE185D]',
  'from-[#8B5CF6] to-[#6D28D9]',
  'from-[#F59E0B] to-[#D97706]',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

function getInitials(name: string): string {
  if (!name) return 'C'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Dificuldades() {
  const { toast } = useToast()

  const [dificuldades, setDificuldades] = useState<DificuldadeRecord[]>([])
  const [criancas, setCriancas] = useState<CriancaRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [materiaAtiva, setMateriaAtiva] = useState('Todas')

  // Modais
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<DificuldadeRecord | null>(null)

  // Exclusão
  const [excluindo, setExcluindo] = useState<DificuldadeRecord | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Menu de opções aberto
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      const [difList, criancaList] = await Promise.all([listarDificuldades(), listarCriancas()])
      setDificuldades(difList)
      setCriancas(criancaList)
    } catch {
      toast({
        title: 'Erro ao carregar dificuldades',
        description: 'Não foi possível buscar a lista.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Inscrições Realtime
  useRealtime<DificuldadeRecord>('dificuldades', () => {
    carregarDados()
  })
  useRealtime<CriancaRecord>('criancas', () => {
    carregarDados()
  })

  // Fecha menus
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Mapeamento de id da criança -> objeto crianca
  const criancasMap = useMemo(() => {
    const map = new Map<string, CriancaRecord>()
    criancas.forEach((c) => map.set(c.id, c))
    return map
  }, [criancas])

  // Lista única de matérias para os chips
  const materiasDisponiveis = useMemo(() => {
    const set = new Set<string>()
    dificuldades.forEach((d) => {
      if (d.materia?.trim()) set.add(d.materia.trim())
    })
    return ['Todas', ...Array.from(set).sort()]
  }, [dificuldades])

  // Filtro client-side por busca e matéria
  const dificuldadesFiltradas = useMemo(() => {
    const term = search.toLowerCase().trim()
    return dificuldades.filter((d) => {
      const crianca = criancasMap.get(d.crianca) || d.expand?.crianca
      const criancaNome = crianca?.nome?.toLowerCase() || ''
      const materia = d.materia?.toLowerCase() || ''
      const descricao = d.descricao?.toLowerCase() || ''
      const impacto = d.impacto?.toLowerCase() || ''

      const matchesSearch =
        !term ||
        materia.includes(term) ||
        descricao.includes(term) ||
        impacto.includes(term) ||
        criancaNome.includes(term)

      const matchesMateria =
        materiaAtiva === 'Todas' || d.materia?.trim().toLowerCase() === materiaAtiva.toLowerCase()

      return matchesSearch && matchesMateria
    })
  }, [dificuldades, search, materiaAtiva, criancasMap])

  // Agrupamento por criança
  const agrupadoPorCrianca = useMemo(() => {
    const grupos: Record<string, { crianca: CriancaRecord | null; itens: DificuldadeRecord[] }> = {}

    dificuldadesFiltradas.forEach((d) => {
      const crianca = criancasMap.get(d.crianca) || d.expand?.crianca || null
      const chave = d.crianca || 'desconhecido'
      if (!grupos[chave]) {
        grupos[chave] = {
          crianca,
          itens: [],
        }
      }
      grupos[chave].itens.push(d)
    })

    return Object.values(grupos)
  }, [dificuldadesFiltradas, criancasMap])

  // Salvar
  const handleSave = async (dados: DificuldadeInput, id?: string) => {
    if (id) {
      await atualizarDificuldade(id, dados)
      toast({ title: 'Dificuldade atualizada com sucesso!' })
    } else {
      await criarDificuldade(dados)
      toast({ title: 'Dificuldade adicionada com sucesso!' })
    }
    await carregarDados()
  }

  // Excluir
  const handleConfirmDelete = async () => {
    if (!excluindo) return
    setDeleting(true)
    try {
      await excluirDificuldade(excluindo.id)
      toast({ title: 'Dificuldade excluída com sucesso.' })
      setDeleteOpen(false)
      setExcluindo(null)
      await carregarDados()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o registro.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const limparBusca = () => {
    setSearch('')
    setMateriaAtiva('Todas')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Topo da página com Título e Botão Adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4A3B32] tracking-tight">
            Dificuldades
          </h1>
          <p className="text-sm text-[#9C8B7D] font-medium mt-0.5">
            Visão consolidada de todas as dificuldades observadas em cada matéria.
          </p>
        </div>

        <button
          onClick={() => {
            setEditando(null)
            setModalOpen(true)
          }}
          disabled={criancas.length === 0}
          className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-soft transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Dificuldade</span>
        </button>
      </div>

      {/* Barra de Busca + Chips de Matérias */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EADBCE] shadow-soft space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#9C8B7D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por matéria, descrição ou nome da criança…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FFF8F0]/50 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chips de filtro por matéria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {materiasDisponiveis.map((m) => {
            const isActive = materiaAtiva === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMateriaAtiva(m)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#F28C28] text-white shadow-sm'
                    : 'bg-[#FBEFE0] text-[#4A3B32] hover:bg-[#F5E2CE]'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo: Lista agrupada por criança */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-white rounded-3xl border border-[#EADBCE] animate-pulse" />
          <div className="h-32 bg-white rounded-3xl border border-[#EADBCE] animate-pulse" />
        </div>
      ) : criancas.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#EADBCE] shadow-soft max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#F28C28] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-[#4A3B32]">Cadastre primeiro uma criança</h2>
          <p className="text-xs text-[#9C8B7D] mt-1.5 mb-5">
            Para registrar dificuldades, é necessário ter pelo menos um perfil de criança
            cadastrado.
          </p>
          <Link
            to="/filhos"
            className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <span>Ir para Meus Filhos</span>
          </Link>
        </div>
      ) : agrupadoPorCrianca.length === 0 ? (
        /* Estado vazio "Nenhuma dificuldade encontrada" com botão para limpar busca */
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#EADBCE] shadow-soft max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8F0] text-[#9C8B7D] flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-[#4A3B32]">Nenhuma dificuldade encontrada</h2>
          <p className="text-xs text-[#9C8B7D] mt-1.5 mb-5">
            Não encontramos nenhum registro para os termos ou filtro selecionados.
          </p>
          <button
            onClick={limparBusca}
            className="inline-flex items-center gap-2 bg-[#FBEFE0] hover:bg-[#F5E2CE] text-[#4A3B32] px-5 py-2.5 rounded-xl font-bold text-xs border border-[#EADBCE] transition-all"
          >
            <span>Limpar busca e filtros</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {agrupadoPorCrianca.map((grupo) => {
            const { crianca, itens } = grupo
            const nomeCrianca = crianca?.nome || 'Criança'
            const serieCrianca = crianca?.serie || ''

            return (
              <div key={crianca?.id || Math.random()} className="space-y-4">
                {/* Cabeçalho do grupo da criança */}
                <div className="flex items-center justify-between pb-2 border-b border-[#EADBCE]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                        nomeCrianca,
                      )} text-white font-extrabold text-sm flex items-center justify-center shadow-sm`}
                    >
                      {getInitials(nomeCrianca)}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#4A3B32]">{nomeCrianca}</h2>
                      {serieCrianca && (
                        <p className="text-xs text-[#9C8B7D] font-bold">{serieCrianca}</p>
                      )}
                    </div>
                  </div>

                  {crianca && (
                    <Link
                      to={`/filhos/${crianca.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#F28C28] hover:underline"
                    >
                      <span>Ver perfil completo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Cards de dificuldade da criança */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itens.map((dif) => {
                    const isMenuOpen = activeMenuId === dif.id
                    return (
                      <div
                        key={dif.id}
                        className="bg-white rounded-3xl p-5 border border-[#EADBCE] shadow-soft card-hover-lift flex flex-col justify-between relative"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#FBEFE0] text-[#F28C28] border border-[#EADBCE]">
                              {dif.materia}
                            </span>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuId(isMenuOpen ? null : dif.id)
                                }}
                                className="p-1 rounded-lg text-[#9C8B7D] hover:text-[#4A3B32] hover:bg-[#FBEFE0]"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-32 bg-white rounded-2xl shadow-xl border border-[#EADBCE] py-1 z-20 animate-dropdown"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      setEditando(dif)
                                      setModalOpen(true)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#4A3B32] hover:bg-[#FBEFE0] text-left"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-[#F28C28]" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      setExcluindo(dif)
                                      setDeleteOpen(true)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#D64545] hover:bg-red-50 text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-[#D64545]" />
                                    <span>Excluir</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <h3 className="text-sm font-bold text-[#4A3B32] leading-snug mb-2">
                            {dif.descricao}
                          </h3>

                          <div className="mt-3 p-3 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE]/70">
                            <p className="text-[11px] font-bold text-[#9C8B7D] uppercase tracking-wider mb-0.5">
                              Impacto observado:
                            </p>
                            <p className="text-xs text-[#4A3B32] leading-relaxed">{dif.impacto}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Dificuldade */}
      <DificuldadeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dificuldadeParaEditar={editando}
        listaCriancas={criancas}
        mostrarSeletorCrianca={true}
        onSave={handleSave}
      />

      {/* Confirmação de Exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-6 border border-[#EADBCE]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#D64545] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Confirmar exclusão</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-[#4A3B32] pt-2">
              Deseja realmente remover esta dificuldade de <strong>{excluindo?.materia}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#EADBCE] text-[#4A3B32] font-bold text-sm hover:bg-[#FBEFE0]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D64545] hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2"
            >
              {deleting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Excluir</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
