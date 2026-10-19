import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { obterCrianca, atualizarCrianca, type CriancaInput } from '@/services/criancas'
import {
  listarDificuldades,
  criarDificuldade,
  atualizarDificuldade,
  excluirDificuldade,
  type DificuldadeInput,
} from '@/services/dificuldades'
import {
  listarConhecimento,
  criarConhecimento,
  atualizarConhecimento,
  excluirConhecimento,
  type ConhecimentoInput,
} from '@/services/conhecimento'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { CriancaModal } from '@/components/CriancaModal'
import { DificuldadeModal } from '@/components/DificuldadeModal'
import { ConhecimentoModal } from '@/components/ConhecimentoModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CriancaRecord, DificuldadeRecord, ConhecimentoRecord } from '@/types'
import {
  ArrowLeft,
  Pencil,
  Plus,
  MoreVertical,
  Trash2,
  AlertCircle,
  BookOpen,
  School,
  Calendar,
  Sparkles,
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

function formatarDataAmigavel(isoDate: string): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  } catch {
    return isoDate
  }
}

export default function FilhoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [crianca, setCrianca] = useState<CriancaRecord | null>(null)
  const [dificuldades, setDificuldades] = useState<DificuldadeRecord[]>([])
  const [conhecimentos, setConhecimentos] = useState<ConhecimentoRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Abas: "Dificuldades" ou "Base de Conhecimento"
  const [activeTab, setActiveTab] = useState<'dificuldades' | 'conhecimento'>('dificuldades')

  // Modais
  const [editCriancaModalOpen, setEditCriancaModalOpen] = useState(false)

  // Dificuldade modal
  const [difModalOpen, setDifModalOpen] = useState(false)
  const [difEditando, setDifEditando] = useState<DificuldadeRecord | null>(null)

  // Conhecimento modal
  const [conhModalOpen, setConhModalOpen] = useState(false)
  const [conhEditando, setConhEditando] = useState<ConhecimentoRecord | null>(null)

  // Confirmação de exclusão genérica
  const [itemParaExcluir, setItemParaExcluir] = useState<{
    tipo: 'dificuldade' | 'conhecimento'
    id: string
    titulo: string
  } | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Menus "⋯"
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    if (!id) return
    try {
      const c = await obterCrianca(id)
      setCrianca(c)

      const [difList, conhList] = await Promise.all([
        listarDificuldades(id),
        listarConhecimento(id),
      ])
      setDificuldades(difList)
      setConhecimentos(conhList)
    } catch {
      toast({
        title: 'Criança não encontrada',
        description: 'Não foi possível carregar as informações deste perfil.',
        variant: 'destructive',
      })
      navigate('/filhos')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, toast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Inscrições em tempo real
  useRealtime<CriancaRecord>('criancas', () => {
    carregarDados()
  })
  useRealtime<DificuldadeRecord>('dificuldades', () => {
    carregarDados()
  })
  useRealtime<ConhecimentoRecord>('conhecimento', () => {
    carregarDados()
  })

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Ações de Crianca
  const handleSaveCrianca = async (dados: CriancaInput) => {
    if (!id) return
    const updated = await atualizarCrianca(id, dados)
    setCrianca(updated)
    toast({
      title: 'Criança salva com sucesso!',
      description: 'As alterações foram salvas.',
    })
  }

  // Ações Dificuldade
  const handleSaveDificuldade = async (dados: DificuldadeInput, difId?: string) => {
    if (difId) {
      await atualizarDificuldade(difId, dados)
      toast({
        title: 'Dificuldade atualizada!',
        description: 'O registro foi atualizado.',
      })
    } else {
      await criarDificuldade(dados)
      toast({
        title: 'Dificuldade registrada!',
        description: 'Nova dificuldade adicionada ao perfil.',
      })
    }
    await carregarDados()
  }

  // Ações Conhecimento
  const handleSaveConhecimento = async (dados: ConhecimentoInput, conhId?: string) => {
    if (conhId) {
      await atualizarConhecimento(conhId, dados)
      toast({
        title: 'Observação atualizada!',
        description: 'A base de conhecimento foi atualizada.',
      })
    } else {
      await criarConhecimento(dados)
      toast({
        title: 'Observação adicionada!',
        description: 'Nova estratégia guardada na base de conhecimento.',
      })
    }
    await carregarDados()
  }

  // Exclusão
  const handleConfirmExclusao = async () => {
    if (!itemParaExcluir) return
    setDeleting(true)
    try {
      if (itemParaExcluir.tipo === 'dificuldade') {
        await excluirDificuldade(itemParaExcluir.id)
        toast({ title: 'Dificuldade excluída com sucesso.' })
      } else {
        await excluirConhecimento(itemParaExcluir.id)
        toast({ title: 'Observação excluída com sucesso.' })
      }
      setDeleteModalOpen(false)
      setItemParaExcluir(null)
      await carregarDados()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o item.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/60 rounded-xl animate-pulse" />
        <div className="h-44 bg-white rounded-3xl border border-[#EADBCE] animate-pulse" />
      </div>
    )
  }

  if (!crianca) {
    return null
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Link de volta */}
      <div>
        <Link
          to="/filhos"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#9C8B7D] hover:text-[#F28C28] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Meus Filhos</span>
        </Link>
      </div>

      {/* CABEÇALHO DO PERFIL DA CRIANÇA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADBCE] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${getAvatarGradient(
              crianca.nome,
            )} text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md flex-shrink-0`}
          >
            {getInitials(crianca.nome)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-[#4A3B32] tracking-tight truncate">
                {crianca.nome}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FBEFE0] text-[#F28C28] border border-[#EADBCE]">
                {crianca.serie}
              </span>
            </div>

            <p className="text-sm text-[#9C8B7D] font-bold mt-1">
              {crianca.idade} {crianca.idade === 1 ? 'ano' : 'anos'}
              {crianca.escola && (
                <>
                  <span className="mx-2 text-[#EADBCE]">•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <School className="w-3.5 h-3.5 text-[#F28C28]" />
                    {crianca.escola}
                  </span>
                </>
              )}
            </p>

            {crianca.observacoes && (
              <p className="text-xs text-[#9C8B7D] mt-2 italic max-w-xl">"{crianca.observacoes}"</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setEditCriancaModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#FBEFE0] hover:bg-[#F5E2CE] text-[#4A3B32] px-4 py-2.5 rounded-2xl font-bold text-sm border border-[#EADBCE] transition-all flex-shrink-0"
        >
          <Pencil className="w-4 h-4 text-[#F28C28]" />
          <span>Editar Perfil</span>
        </button>
      </div>

      {/* ABAS: "Dificuldades" e "Base de Conhecimento" */}
      <div>
        <div className="flex items-center gap-2 border-b border-[#EADBCE] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('dificuldades')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'dificuldades'
                ? 'bg-[#F28C28] text-white shadow-sm'
                : 'text-[#9C8B7D] hover:text-[#4A3B32] hover:bg-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Dificuldades</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'dificuldades'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FBEFE0] text-[#4A3B32]'
              }`}
            >
              {dificuldades.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conhecimento')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'conhecimento'
                ? 'bg-[#F28C28] text-white shadow-sm'
                : 'text-[#9C8B7D] hover:text-[#4A3B32] hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Base de Conhecimento</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'conhecimento'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FBEFE0] text-[#4A3B32]'
              }`}
            >
              {conhecimentos.length}
            </span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA DIFICULDADES */}
        {activeTab === 'dificuldades' && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#4A3B32]">Dificuldades Observadas</h2>
                <p className="text-xs text-[#9C8B7D]">
                  Pontos de atenção para guiar o tutor sem fornecer respostas prontas.
                </p>
              </div>

              <button
                onClick={() => {
                  setDifEditando(null)
                  setDifModalOpen(true)
                }}
                className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-soft transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Dificuldade</span>
              </button>
            </div>

            {dificuldades.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#EADBCE] shadow-soft max-w-md mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#F28C28] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-[#4A3B32]">
                  Nenhuma dificuldade registrada ainda
                </h3>
                <p className="text-xs text-[#9C8B7D] mt-1.5 mb-5">
                  Anote as matérias em que a criança demonstra bloqueio ou resistência nas lições.
                </p>
                <button
                  onClick={() => {
                    setDifEditando(null)
                    setDifModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 bg-[#F28C28] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:bg-[#D97A1A] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Dificuldade</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dificuldades.map((dif) => {
                  const isMenuOpen = activeMenuId === dif.id
                  return (
                    <div
                      key={dif.id}
                      className="bg-white rounded-3xl p-5 border border-[#EADBCE] shadow-soft card-hover-lift flex flex-col justify-between relative"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {/* Chip colorido da matéria */}
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#FBEFE0] text-[#F28C28] border border-[#EADBCE]">
                            {dif.materia}
                          </span>

                          {/* Menu ⋯ */}
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
                                    setDifEditando(dif)
                                    setDifModalOpen(true)
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
                                    setItemParaExcluir({
                                      tipo: 'dificuldade',
                                      id: dif.id,
                                      titulo: `${dif.materia}: ${dif.descricao.slice(0, 30)}...`,
                                    })
                                    setDeleteModalOpen(true)
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
                            Impacto no aprendizado:
                          </p>
                          <p className="text-xs text-[#4A3B32] leading-relaxed">{dif.impacto}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA BASE DE CONHECIMENTO */}
        {activeTab === 'conhecimento' && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#4A3B32]">Base de Conhecimento</h2>
                <p className="text-xs text-[#9C8B7D]">
                  Diário cronológico do que funciona: estratégias, gatilhos de atenção e
                  descobertas.
                </p>
              </div>

              <button
                onClick={() => {
                  setConhEditando(null)
                  setConhModalOpen(true)
                }}
                className="inline-flex items-center gap-2 bg-[#3DA64C] hover:bg-[#2E8B3B] text-white px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-soft transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Observação</span>
              </button>
            </div>

            {conhecimentos.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#EADBCE] shadow-soft max-w-md mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-green-50 text-[#3DA64C] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-[#4A3B32]">
                  Comece a construir a base de conhecimento do seu filho
                </h3>
                <p className="text-xs text-[#9C8B7D] mt-1.5 mb-5">
                  Anote o que fez os olhos dele brilharem: desenhos, metáforas, pausas no tempo
                  certo ou material lúdico.
                </p>
                <button
                  onClick={() => {
                    setConhEditando(null)
                    setConhModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 bg-[#3DA64C] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:bg-[#2E8B3B] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Observação</span>
                </button>
              </div>
            ) : (
              /* Feed cronológico (mais recente primeiro) */
              <div className="space-y-4">
                {conhecimentos.map((conh) => {
                  const isMenuOpen = activeMenuId === conh.id
                  return (
                    <div
                      key={conh.id}
                      className="bg-white rounded-3xl p-6 border border-[#EADBCE] shadow-soft card-hover-lift relative"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9C8B7D] bg-[#FBEFE0] px-3 py-1 rounded-full">
                            <Calendar className="w-3.5 h-3.5 text-[#F28C28]" />
                            {formatarDataAmigavel(conh.created)}
                          </span>
                        </div>

                        {/* Menu ⋯ */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(isMenuOpen ? null : conh.id)
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
                                  setConhEditando(conh)
                                  setConhModalOpen(true)
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
                                  setItemParaExcluir({
                                    tipo: 'conhecimento',
                                    id: conh.id,
                                    titulo: conh.titulo || conh.conteudo.slice(0, 30),
                                  })
                                  setDeleteModalOpen(true)
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

                      {conh.titulo && (
                        <h3 className="text-base font-extrabold text-[#4A3B32] mb-1.5">
                          {conh.titulo}
                        </h3>
                      )}

                      <p className="text-sm text-[#4A3B32] leading-relaxed whitespace-pre-wrap">
                        {conh.conteudo}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAIS */}
      {/* 1. Editar Criança */}
      <CriancaModal
        open={editCriancaModalOpen}
        onOpenChange={setEditCriancaModalOpen}
        criancaParaEditar={crianca}
        onSave={handleSaveCrianca}
      />

      {/* 2. Dificuldade Modal */}
      <DificuldadeModal
        open={difModalOpen}
        onOpenChange={setDifModalOpen}
        dificuldadeParaEditar={difEditando}
        criancaIdPadrao={crianca.id}
        mostrarSeletorCrianca={false}
        onSave={handleSaveDificuldade}
      />

      {/* 3. Conhecimento Modal */}
      <ConhecimentoModal
        open={conhModalOpen}
        onOpenChange={setConhModalOpen}
        conhecimentoParaEditar={conhEditando}
        criancaIdPadrao={crianca.id}
        mostrarSeletorCrianca={false}
        onSave={handleSaveConhecimento}
      />

      {/* 4. Confirmação de exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-6 border border-[#EADBCE]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#D64545] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Confirmar exclusão</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-[#4A3B32] pt-2">
              Deseja realmente remover este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#EADBCE] text-[#4A3B32] font-bold text-sm hover:bg-[#FBEFE0]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmExclusao}
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
