import React, { useState } from 'react'
import {
  User,
  GraduationCap,
  MapPin,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { CriancaRecord } from '@/types'
import { GestaoAcessoCriancaCard } from '@/components/GestaoAcessoCriancaCard'
import { EditarCriancaModal } from '@/components/configuracoes/EditarCriancaModal'
import { ExcluirCriancaModal } from '@/components/configuracoes/ExcluirCriancaModal'
import { ControleTempoUsoCard } from '@/components/configuracoes/ControleTempoUsoCard'

interface CriancaConfigCardProps {
  crianca: CriancaRecord
  onAtualizado: () => void
}

export const CriancaConfigCard: React.FC<CriancaConfigCardProps> = ({ crianca, onAtualizado }) => {
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [mostrarGestaoAcesso, setMostrarGestaoAcesso] = useState(false)

  const inicial = crianca.nome?.charAt(0)?.toUpperCase() || 'C'

  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md shadow-amber-500/5 overflow-hidden transition-all hover:border-amber-300">
      {/* Topo do Card com Perfil da Criança */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white border-b border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-orange-500/20 shrink-0">
            {inicial}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-800">{crianca.nome}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {crianca.idade} anos • {crianca.serie}
              </span>
              {crianca.genero && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                  {crianca.genero}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {crianca.escola && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>{crianca.escola}</span>
                </span>
              )}
              {crianca.localidade && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{crianca.localidade}</span>
                </span>
              )}
              {crianca.horarios_aula && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{crianca.horarios_aula}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação do Perfil */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setModalEditarAberto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Editar Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setModalExcluirAberto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Criança</span>
          </button>
        </div>
      </div>

      {/* Conteúdo interno: Detalhes, Tempo de Uso e Acesso */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Observações / Acessibilidade se houver */}
        {(crianca.observacoes || crianca.acessibilidade) && (
          <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 text-xs text-slate-700 space-y-1">
            {crianca.acessibilidade && (
              <p>
                <strong>Apoio de Acessibilidade:</strong> {crianca.acessibilidade}
              </p>
            )}
            {crianca.observacoes && (
              <p className="text-slate-600 italic">"{crianca.observacoes}"</p>
            )}
          </div>
        )}

        {/* Seção 1: Controle de Tempo de Uso Diário */}
        <ControleTempoUsoCard crianca={crianca} onAtualizado={onAtualizado} />

        {/* Seção 2: Acesso da Criança (Login/Senha/Permissões) */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarGestaoAcesso(!mostrarGestaoAcesso)}
            className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Acesso & Senha da Criança (Login no Modo Criança)
                </span>
                <p className="text-[11px] text-slate-500">
                  Gerencie nome de usuário, redefina a senha, pause ou configure permissões por
                  matéria.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
              <span>{mostrarGestaoAcesso ? 'Recolher' : 'Gerenciar Acesso'}</span>
              {mostrarGestaoAcesso ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {mostrarGestaoAcesso && (
            <div className="p-4 bg-white border-t border-slate-200/70">
              <GestaoAcessoCriancaCard crianca={crianca} />
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {modalEditarAberto && (
        <EditarCriancaModal
          isOpen={modalEditarAberto}
          onClose={() => setModalEditarAberto(false)}
          crianca={crianca}
          onAtualizado={onAtualizado}
        />
      )}

      {modalExcluirAberto && (
        <ExcluirCriancaModal
          isOpen={modalExcluirAberto}
          onClose={() => setModalExcluirAberto(false)}
          crianca={crianca}
          onExcluida={onAtualizado}
        />
      )}
    </div>
  )
}
