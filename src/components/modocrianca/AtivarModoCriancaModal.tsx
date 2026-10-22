import React, { useState } from 'react'
import { useCrianca } from '@/contexts/CriancaContext'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SimpleModal } from '@/components/SimpleModal'
import { Sparkles, ShieldCheck, UserCheck } from 'lucide-react'

export const AtivarModoCriancaModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { criancas, criancaSelecionada, selecionarCrianca } = useCrianca()
  const { pinConfigurado, abrirModalConfigurarPin, ativarModoCrianca } = useModoCrianca()
  const [criancaEscolhidaId, setCriancaEscolhidaId] = useState<string>(
    criancaSelecionada?.id || (criancas[0]?.id ?? ''),
  )

  const handleConfirmar = () => {
    if (!pinConfigurado) {
      onClose()
      abrirModalConfigurarPin()
      return
    }

    const c =
      criancas.find((item) => item.id === criancaEscolhidaId) || criancaSelecionada || criancas[0]
    if (c) {
      selecionarCrianca(c)
    }
    ativarModoCrianca(c)
    onClose()
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ativar Modo Criança 🧒"
      description="Uma experiência segura, lúdica e focada apenas no aprendizado com a Lumi."
    >
      <div className="space-y-5">
        {/* Banner Explicativo */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>O que acontece no Modo Criança?</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Navegação de adulto (Painel Parental, Prompts e Configurações) fica escondida.</li>
            <li>Acesso direto ao chat com a Lumi, ao quadro e à agenda escolar adaptada.</li>
            <li>Para voltar ao painel de adulto, será exigido o seu PIN numérico de 4 dígitos.</li>
          </ul>
        </div>

        {/* Aviso se ainda não tiver PIN */}
        {!pinConfigurado && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">PIN do responsável ainda não configurado</p>
              <p className="mt-0.5">
                Você precisará definir um PIN de 4 dígitos antes para garantir que a criança não
                saia do modo sem permissão.
              </p>
            </div>
          </div>
        )}

        {/* Escolha da Criança */}
        {criancas.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Quem vai usar o Aprende+ agora?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {criancas.map((c) => {
                const isSelected = (criancaEscolhidaId || criancaSelecionada?.id) === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCriancaEscolhidaId(c.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800">{c.nome}</p>
                      <p className="text-xs text-slate-500">
                        {c.serie || `${c.idade} anos`}
                        {c.escola ? ` • ${c.escola}` : ''}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25 transition-all flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>{pinConfigurado ? 'Iniciar Modo Criança' : 'Criar PIN e Ativar'}</span>
          </button>
        </div>
      </div>
    </SimpleModal>
  )
}
