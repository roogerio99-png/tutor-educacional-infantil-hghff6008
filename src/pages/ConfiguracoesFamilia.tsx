import React, { useState } from 'react'
import { Users, Plus, ShieldCheck, Clock, Sparkles, Heart, Baby } from 'lucide-react'
import { useCrianca } from '@/contexts/CriancaContext'
import { CriancaConfigCard } from '@/components/configuracoes/CriancaConfigCard'
import { NovaCriancaModal } from '@/components/configuracoes/NovaCriancaModal'

export const ConfiguracoesFamiliaPage: React.FC = () => {
  const { criancas, recarregarCriancas, carregando } = useCrianca()
  const [modalNovaCriancaAberto, setModalNovaCriancaAberto] = useState(false)

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Cabeçalho acolhedor com tons quentes */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white shadow-lg shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-amber-200" />
            <span>Área do Responsável • Controle Familiar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Família & Controle de Uso
          </h1>
          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-medium">
            Gerencie o perfil das crianças, senhas e logins independentes, permissões pedagógicas e
            estabeleça limites saudáveis de tempo de uso diário com a Lumi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovaCriancaAberto(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-orange-900 font-extrabold text-sm shadow-md hover:bg-amber-50 hover:shadow-lg transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-5 h-5 text-orange-600" />
          <span>+ Adicionar Criança</span>
        </button>
      </div>

      {/* Destaques Rápidos de Boas Práticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-950">Tempo Saudável</h4>
            <p className="text-[11px] text-amber-900/80">
              A Sociedade de Pediatria recomenda pausas a cada 30-45 minutos de tela.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-200/60 text-orange-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-orange-950">Ambiente Seguro</h4>
            <p className="text-[11px] text-orange-900/80">
              Acesso exclusivo sem anúncios e com moderação pedagógica ativa contínua.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-rose-600" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-950">Apoio Afetivo</h4>
            <p className="text-[11px] text-amber-900/80">
              Check-ins diários e acolhimento socioemocional em cada conversa.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Crianças Cadastradas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-slate-800">
              Crianças da Família ({criancas.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Clique para gerenciar senhas, limites e permissões
          </span>
        </div>

        {carregando ? (
          <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Carregando dados da família...</span>
          </div>
        ) : criancas.length === 0 ? (
          <div className="py-14 px-6 rounded-3xl bg-white border-2 border-dashed border-amber-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl">
              <Baby className="w-8 h-8 text-amber-600" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Nenhuma criança cadastrada ainda
              </h3>
              <p className="text-xs text-slate-500">
                Adicione a primeira criança para liberar o Modo Criança, o tutor socrático da Lumi e
                a agenda escolar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalNovaCriancaAberto(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeira Criança</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {criancas.map((crianca) => (
              <CriancaConfigCard
                key={crianca.id}
                crianca={crianca}
                onAtualizado={recarregarCriancas}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal para Adicionar Criança */}
      {modalNovaCriancaAberto && (
        <NovaCriancaModal
          isOpen={modalNovaCriancaAberto}
          onClose={() => setModalNovaCriancaAberto(false)}
          onCriada={recarregarCriancas}
        />
      )}
    </div>
  )
}
