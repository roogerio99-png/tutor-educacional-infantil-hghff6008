import React, { useState } from 'react'
import { SimpleModal } from '@/components/SimpleModal'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { excluirCriancaCompleto } from '@/services/criancas'
import type { CriancaRecord } from '@/types'

interface ExcluirCriancaModalProps {
  isOpen: boolean
  onClose: () => void
  crianca: CriancaRecord
  onExcluida: () => void
}

export const ExcluirCriancaModal: React.FC<ExcluirCriancaModalProps> = ({
  isOpen,
  onClose,
  crianca,
  onExcluida,
}) => {
  const [confirmacaoNome, setConfirmacaoNome] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  const nomeEsperado = crianca.nome.trim()
  const podeExcluir = confirmacaoNome.trim().toLowerCase() === nomeEsperado.toLowerCase()

  const handleExcluir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!podeExcluir || excluindo) return

    try {
      setExcluindo(true)
      await excluirCriancaCompleto(crianca.id)
      toast.success(
        `Perfil de ${crianca.nome} e todos os dados vinculados foram excluídos com sucesso.`,
      )
      onExcluida()
      onClose()
    } catch (err: unknown) {
      console.error('Erro ao excluir criança:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao excluir criança'
      toast.error(msg)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Perfil da Criança"
      description="Esta ação é irreversível e excluirá permanentemente todos os dados vinculados."
    >
      <form onSubmit={handleExcluir} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-rose-950">Atenção: Ação destrutiva permanente!</p>
            <p className="leading-relaxed">
              Ao excluir o perfil de <strong>{crianca.nome}</strong>, serão apagados todos os dados:
              dificuldades mapeadas, memórias socioemocionais, eventos da agenda escolar, check-ins
              diários, histórico de tempo de uso e a conta de login da criança.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Para confirmar, digite exatamente o nome:{' '}
            <strong className="text-rose-700 select-all">{nomeEsperado}</strong>
          </label>
          <input
            type="text"
            required
            value={confirmacaoNome}
            onChange={(e) => setConfirmacaoNome(e.target.value)}
            placeholder={`Digite "${nomeEsperado}" aqui`}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm font-bold text-slate-800"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!podeExcluir || excluindo}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{excluindo ? 'Excluindo...' : 'Sim, Excluir Criança'}</span>
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
