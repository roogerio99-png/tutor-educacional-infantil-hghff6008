import React, { useState } from 'react'
import { SimpleModal } from '@/components/SimpleModal'
import { atualizarCrianca, type CriancaInput } from '@/services/criancas'
import type { CriancaRecord, GeneroCrianca } from '@/types'
import { SERIES } from '@/types'
import { toast } from 'sonner'

interface EditarCriancaModalProps {
  isOpen: boolean
  onClose: () => void
  crianca: CriancaRecord
  onAtualizado: () => void
}

export const EditarCriancaModal: React.FC<EditarCriancaModalProps> = ({
  isOpen,
  onClose,
  crianca,
  onAtualizado,
}) => {
  const [nome, setNome] = useState(crianca.nome)
  const [idade, setIdade] = useState(crianca.idade.toString())
  const [serie, setSerie] = useState(crianca.serie || '3º Ano')
  const [escola, setEscola] = useState(crianca.escola || '')
  const [observacoes, setObservacoes] = useState(crianca.observacoes || '')
  const [localidade, setLocalidade] = useState(crianca.localidade || '')
  const [genero, setGenero] = useState<GeneroCrianca>(crianca.genero || 'Prefiro não informar')
  const [horariosAula, setHorariosAula] = useState(crianca.horarios_aula || '')
  const [acessibilidade, setAcessibilidade] = useState(crianca.acessibilidade || '')
  const [salvando, setSalvando] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('O nome da criança é obrigatório.')
      return
    }

    try {
      setSalvando(true)
      const payload: Partial<CriancaInput> = {
        nome: nome.trim(),
        idade: parseInt(idade, 10) || 8,
        serie,
        escola: escola.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        localidade: localidade.trim() || undefined,
        genero,
        horarios_aula: horariosAula.trim() || undefined,
        acessibilidade: acessibilidade.trim() || undefined,
      }

      await atualizarCrianca(crianca.id, payload)
      toast.success('Dados da criança atualizados com sucesso! ✨')
      onAtualizado()
      onClose()
    } catch (err: unknown) {
      console.error('Erro ao atualizar criança:', err)
      toast.error('Não foi possível salvar as alterações da criança.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Perfil: ${crianca.nome.split(' ')[0]}`}
      description="Atualize as informações escolares e de aprendizagem para a Lumi calibrar o ritmo socrático."
    >
      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
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
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Série / Ano *
            </label>
            <select
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gênero</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value as GeneroCrianca)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
            >
              <option value="Menina">Menina</option>
              <option value="Menino">Menino</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cidade / Estado
            </label>
            <input
              type="text"
              value={localidade}
              onChange={(e) => setLocalidade(e.target.value)}
              placeholder="Ex: Curitiba, PR"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Escola / Colégio
          </label>
          <input
            type="text"
            value={escola}
            onChange={(e) => setEscola(e.target.value)}
            placeholder="Ex: Colégio Estadual Santos Dumont"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Turno / Horário de Aula
            </label>
            <input
              type="text"
              value={horariosAula}
              onChange={(e) => setHorariosAula(e.target.value)}
              placeholder="Ex: Matutino (07:30 às 12:00)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Apoio de Acessibilidade
            </label>
            <input
              type="text"
              value={acessibilidade}
              onChange={(e) => setAcessibilidade(e.target.value)}
              placeholder="Ex: Apoio visual, fonte grande"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Observações Pedagógicas & Interesses
          </label>
          <textarea
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Tem facilidade em matemática e curiosidade por dinossauros. Aprende melhor com metáforas visuais."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
