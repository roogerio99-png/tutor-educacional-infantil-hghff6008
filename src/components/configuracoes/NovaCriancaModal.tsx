import React, { useState } from 'react'
import { SimpleModal } from '@/components/SimpleModal'
import { criarCrianca, type CriancaInput } from '@/services/criancas'
import type { GeneroCrianca } from '@/types'
import { SERIES } from '@/types'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

interface NovaCriancaModalProps {
  isOpen: boolean
  onClose: () => void
  onCriada: () => void
}

export const NovaCriancaModal: React.FC<NovaCriancaModalProps> = ({
  isOpen,
  onClose,
  onCriada,
}) => {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('8')
  const [serie, setSerie] = useState('3º Ano')
  const [escola, setEscola] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [localidade, setLocalidade] = useState('')
  const [genero, setGenero] = useState<GeneroCrianca>('Prefiro não informar')
  const [horariosAula, setHorariosAula] = useState('')
  const [acessibilidade, setAcessibilidade] = useState('')
  const [tempoLimite, setTempoLimite] = useState('45')
  const [salvando, setSalvando] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('O nome da criança é obrigatório.')
      return
    }

    try {
      setSalvando(true)
      const payload: CriancaInput = {
        nome: nome.trim(),
        idade: parseInt(idade, 10) || 8,
        serie,
        escola: escola.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        localidade: localidade.trim() || undefined,
        genero,
        horarios_aula: horariosAula.trim() || undefined,
        acessibilidade: acessibilidade.trim() || undefined,
        tempo_uso_diario_min: parseInt(tempoLimite, 10) || 0,
      }

      await criarCrianca(payload)
      toast.success(`Criança ${nome} cadastrada com sucesso! 🎉`)
      onCriada()
      onClose()
    } catch (err: unknown) {
      console.error('Erro ao cadastrar criança:', err)
      toast.error('Não foi possível cadastrar a criança.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Nova Criança à Família"
      description="Cadastre a criança para calibrar o acompanhamento socrático com a Lumi."
    >
      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Nome Completo da Criança *
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Sofia Ribeiro"
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
              placeholder="Ex: São Paulo, SP"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Escola / Colégio
            </label>
            <input
              type="text"
              value={escola}
              onChange={(e) => setEscola(e.target.value)}
              placeholder="Ex: Escola Girassol"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tempo Diário Inicial
            </label>
            <select
              value={tempoLimite}
              onChange={(e) => setTempoLimite(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
            >
              <option value="0">Sem Limite</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos (1 hora)</option>
              <option value="90">90 minutos</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Turno de Aula
            </label>
            <input
              type="text"
              value={horariosAula}
              onChange={(e) => setHorariosAula(e.target.value)}
              placeholder="Ex: Matutino (07:30 - 12:00)"
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
              placeholder="Ex: Dificuldade de leitura, TDAH"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Interesses & Observações
          </label>
          <textarea
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Gosta muito de animais, robótica e contação de histórias."
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
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{salvando ? 'Cadastrando...' : 'Cadastrar Criança'}</span>
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
