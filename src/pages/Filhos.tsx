import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  listarCriancas,
  criarCrianca,
  atualizarCrianca,
  excluirCrianca,
  type CriancaInput,
} from '@/services/criancas'
import { listarDificuldades } from '@/services/dificuldades'
import { listarConhecimento } from '@/services/conhecimento'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { CriancaModal } from '@/components/CriancaModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CriancaRecord } from '@/types'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  BookOpen,
  School,
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

export default function Filhos() {
  const { toast } = useToast()

  const [criancas, setCriancas] = useState<CriancaRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Contadores para chips
  const [dificuldadesCount, setDificuldadesCount] = useState<Record<string, number>>({})
  const [conhecimentoCount, setConhecimentoCount] = useState<Record<string, number>>({})

  // Modal criar/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [criancaEditando, setCriancaEditando] = useState<CriancaRecord | null>(null)

  // Confirmação de exclusão
  const [criancaExcluindo, setCriancaExcluindo] = useState<CriancaRecord | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Menu de opções aberto por ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      const lista = await listarCriancas()
      setCriancas(lista)

      // Carrega contagens de dificuldades e conhecimento
      const [todasDif, todoConh] = await Promise.all([listarDificuldades(), listarConhecimento()])

      const dCount: Record<string, number> = {}
      todasDif.forEach((d) => {
        dCount[d.crianca] = (dCount[d.crianca] || 0) + 1
      })
      setDificuldadesCount(dCount)

      const cCount: Record<string, number> = {}
      todoConh.forEach((c) => {
        cCount[c.crianca] = (cCount[c.crianca] || 0) + 1
      })
      setConhecimentoCount(cCount)
    } catch {
      toast({
        title: 'Erro ao carregar crianças',
        description: 'Não foi possível carregar a lista de perfis.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Inscrições Realtime em criancas, dificuldades e conhecimento
  useRealtime<CriancaRecord>('criancas', () => {
    carregarDados()
  })
  useRealtime('dificuldades', () => {
    carregarDados()
  })
  useRealtime('conhecimento', () => {
    carregarDados()
  })

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleOpenAdd = () => {
    setCriancaEditando(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (c: CriancaRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveMenuId(null)
    setCriancaEditando(c)
    setModalOpen(true)
  }

  const handleOpenDelete = (c: CriancaRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveMenuId(null)
    setCriancaExcluindo(c)
    setDeleteDialogOpen(true)
  }

  const handleSave = async (dados: CriancaInput, id?: string) => {
    if (id) {
      await atualizarCrianca(id, dados)
      toast({
        title: 'Criança salva com sucesso!',
        description: 'Os dados do perfil foram atualizados.',
      })
    } else {
      await criarCrianca(dados)
      toast({
        title: 'Criança salva com sucesso!',
        description: 'Novo perfil adicionado com sucesso.',
      })
    }
    await carregarDados()
  }

  const handleConfirmDelete = async () => {
    if (!criancaExcluindo) return
    setDeleting(true)
    try {
      await excluirCrianca(criancaExcluindo.id)
      toast({
        title: 'Perfil excluído',
        description: `${criancaExcluindo.nome} foi removido(a) com sucesso.`,
      })
      setDeleteDialogOpen(false)
      setCriancaExcluindo(null)
      await carregarDados()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBEFE0] text-xs font-bold text-[#F28C28] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Base personalizada por criança</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4A3B32] tracking-tight">
            Meus Filhos
          </h1>
          <p className="text-sm text-[#9C8B7D] font-medium mt-0.5">
            Acompanhe o ritmo, as dificuldades e as melhores estratégias de aprendizado de cada
            criança.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-soft hover:shadow-soft-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Criança</span>
        </button>
      </div>

      {/* Grid de cartões */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl bg-white/60 border border-[#EADBCE] animate-pulse p-6"
            />
          ))}
        </div>
      ) : criancas.length === 0 ? (
        /* Estado vazio ilustrado e amigável */
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-[#EADBCE] shadow-soft max-w-xl mx-auto my-6">
          <div className="w-20 h-20 rounded-3xl bg-[#FFF8F0] border-2 border-dashed border-[#F28C28] text-[#F28C28] flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-10 h-10 stroke-[1.8]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#4A3B32]">
            Ainda não há crianças cadastradas
          </h2>
          <p className="text-sm text-[#9C8B7D] font-medium mt-2 max-w-md mx-auto">
            Comece cadastrando o perfil do seu filho para acompanhar suas atividades escolares e
            registrar o que melhor funciona com ele.
          </p>
          <div className="pt-6">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-soft hover:shadow-soft-hover transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar primeira criança</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cartões de Crianças */}
          {criancas.map((crianca) => {
            const difCount = dificuldadesCount[crianca.id] || 0
            const conCount = conhecimentoCount[crianca.id] || 0
            const isMenuOpen = activeMenuId === crianca.id

            return (
              <div
                key={crianca.id}
                className="group relative bg-white rounded-3xl p-6 border border-[#EADBCE] shadow-soft card-hover-lift flex flex-col justify-between"
              >
                <div>
                  {/* Topo do cartão: Avatar + Nome + Menu */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <Link
                      to={`/filhos/${crianca.id}`}
                      className="flex items-center gap-3.5 flex-1 min-w-0"
                    >
                      <div
                        className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                          crianca.nome,
                        )} text-white font-extrabold text-lg flex items-center justify-center shadow-sm flex-shrink-0`}
                      >
                        {getInitials(crianca.nome)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-black text-[#4A3B32] group-hover:text-[#F28C28] transition-colors truncate">
                          {crianca.nome}
                        </h2>
                        <p className="text-xs text-[#9C8B7D] font-bold">
                          {crianca.idade} {crianca.idade === 1 ? 'ano' : 'anos'} • {crianca.serie}
                        </p>
                      </div>
                    </Link>

                    {/* Menu "⋯" com Editar e Excluir */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuId(isMenuOpen ? null : crianca.id)
                        }}
                        className="p-1.5 rounded-xl hover:bg-[#FBEFE0] text-[#9C8B7D] hover:text-[#4A3B32] transition-colors"
                        aria-label="Opções da criança"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1 w-36 bg-white rounded-2xl shadow-xl border border-[#EADBCE] py-1.5 z-20 animate-dropdown"
                        >
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(crianca, e)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#4A3B32] hover:bg-[#FBEFE0] transition-colors text-left"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#F28C28]" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(crianca, e)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#D64545] hover:bg-red-50 transition-colors text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#D64545]" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Escola */}
                  {crianca.escola && (
                    <div className="flex items-center gap-1.5 text-xs text-[#9C8B7D] font-medium mb-3 truncate">
                      <School className="w-3.5 h-3.5 text-[#F28C28] flex-shrink-0" />
                      <span className="truncate">{crianca.escola}</span>
                    </div>
                  )}

                  {/* Observações resumidas se houver */}
                  {crianca.observacoes && (
                    <p className="text-xs text-[#9C8B7D] line-clamp-2 italic mb-4">
                      "{crianca.observacoes}"
                    </p>
                  )}
                </div>

                {/* Rodapé do cartão: Chips de contagem e botão de abrir */}
                <div className="pt-4 border-t border-[#F0E4D8] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Chip Dificuldades */}
                    <span
                      title={`${difCount} dificuldade(s) registrada(s)`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D64545]/10 text-[#D64545]"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{difCount}</span>
                    </span>

                    {/* Chip Conhecimento */}
                    <span
                      title={`${conCount} anotação(ões) na base de conhecimento`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#3DA64C]/10 text-[#3DA64C]"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{conCount}</span>
                    </span>
                  </div>

                  <Link
                    to={`/filhos/${crianca.id}`}
                    className="text-xs font-bold text-[#F28C28] hover:text-[#D97A1A] hover:underline"
                  >
                    Ver perfil →
                  </Link>
                </div>
              </div>
            )
          })}

          {/* Cartão de borda tracejada "Adicionar Criança" */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="group min-h-[200px] rounded-3xl border-2 border-dashed border-[#EADBCE] hover:border-[#F28C28] bg-white/40 hover:bg-[#FBEFE0]/40 p-6 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-white border border-[#EADBCE] group-hover:border-[#F28C28] group-hover:bg-[#F28C28] text-[#9C8B7D] group-hover:text-white flex items-center justify-center transition-all shadow-sm">
              <Plus className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-center">
              <span className="font-extrabold text-sm text-[#4A3B32] group-hover:text-[#F28C28] transition-colors block">
                Adicionar Criança
              </span>
              <span className="text-xs text-[#9C8B7D] font-medium">Cadastre um novo perfil</span>
            </div>
          </button>
        </div>
      )}

      {/* Modal Criar/Editar */}
      <CriancaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        criancaParaEditar={criancaEditando}
        onSave={handleSave}
      />

      {/* Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-6 border border-[#EADBCE]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#D64545] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Confirmar exclusão</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-[#4A3B32] pt-2">
              Tem certeza que deseja excluir <strong>{criancaExcluindo?.nome}</strong>? Todas as
              dificuldades e dados serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#EADBCE] text-[#4A3B32] font-bold text-sm hover:bg-[#FBEFE0] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D64545] hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-all inline-flex items-center justify-center gap-2"
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
