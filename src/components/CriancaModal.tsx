import React, { useState, useEffect } from 'react'
import { SimpleModal } from '@/components/SimpleModal'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import type { CriancaRecord, GeneroCrianca } from '@/types'
import type { CriancaInput } from '@/services/criancas'

interface CriancaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criancaParaEditar?: CriancaRecord | null
  onSave: (dados: CriancaInput, id?: string) => Promise<void>
}

export const CriancaModal: React.FC<CriancaModalProps> = ({
  open,
  onOpenChange,
  criancaParaEditar,
  onSave,
}) => {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState<number | ''>('')
  const [serie, setSerie] = useState('')
  const [escola, setEscola] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Novos campos da Camada 1: Perfil Base
  const [localidade, setLocalidade] = useState('')
  const [genero, setGenero] = useState<GeneroCrianca>('Prefiro não informar')
  const [turnoAula, setTurnoAula] = useState('Manhã')
  const [horarioDetalhe, setHorarioDetalhe] = useState('')
  const [acessLeituraGrande, setAcessLeituraGrande] = useState(false)
  const [acessApoioVisual, setAcessApoioVisual] = useState(false)

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    if (criancaParaEditar) {
      setNome(criancaParaEditar.nome || '')
      setIdade(criancaParaEditar.idade ?? '')
      setSerie(criancaParaEditar.serie || '')
      setEscola(criancaParaEditar.escola || '')
      setObservacoes(criancaParaEditar.observacoes || '')
      setLocalidade(criancaParaEditar.localidade || '')
      setGenero(criancaParaEditar.genero || 'Prefiro não informar')

      // Separa turno e horário se já existir formato
      const hStr = criancaParaEditar.horarios_aula || ''
      if (hStr.includes('Tarde')) setTurnoAula('Tarde')
      else if (hStr.includes('Integral')) setTurnoAula('Integral')
      else setTurnoAula('Manhã')
      setHorarioDetalhe(hStr)

      const acessStr = criancaParaEditar.acessibilidade || ''
      setAcessLeituraGrande(acessStr.includes('fonte grande'))
      setAcessApoioVisual(acessStr.includes('Apoio visual'))
    } else {
      setNome('')
      setIdade('')
      setSerie('')
      setEscola('')
      setObservacoes('')
      setLocalidade('')
      setGenero('Prefiro não informar')
      setTurnoAula('Manhã')
      setHorarioDetalhe('')
      setAcessLeituraGrande(false)
      setAcessApoioVisual(false)
    }
    setFieldErrors({})
    setGeneralError(null)
  }, [criancaParaEditar, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!nome.trim()) errors.nome = 'Informe o nome da criança'
    if (idade === '' || Number(idade) <= 0 || Number(idade) > 18) {
      errors.idade = 'Informe uma idade válida (1 a 18 anos)'
    }
    if (!serie.trim()) errors.serie = 'Informe a série (ex.: 3º ano)'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      // Monta texto de acessibilidade
      const acessList: string[] = []
      if (acessLeituraGrande) acessList.push('Leitura com fonte grande')
      if (acessApoioVisual) acessList.push('Apoio visual reforçado')
      const acessFinal = acessList.length > 0 ? acessList.join(', ') : 'Nenhuma'

      // Monta texto de horário de aula
      const horarioFinal = horarioDetalhe.trim()
        ? `${turnoAula} (${horarioDetalhe.trim()})`
        : turnoAula

      await onSave(
        {
          nome: nome.trim(),
          idade: Number(idade),
          serie: serie.trim(),
          escola: escola.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          localidade: localidade.trim() || undefined,
          genero,
          horarios_aula: horarioFinal,
          acessibilidade: acessFinal,
        },
        criancaParaEditar?.id,
      )
      onOpenChange(false)
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError('Não foi possível salvar os dados da criança.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SimpleModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={criancaParaEditar ? 'Editar Criança' : 'Adicionar Criança'}
      description={
        criancaParaEditar
          ? 'Atualize o perfil base e rotina escolar para guiar o suporte da Lumi.'
          : 'Cadastre a criança com seu perfil base e preferências de aprendizagem.'
      }
      maxWidth="lg"
    >
      {generalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bloco 1: Identificação Básica */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-nome">
              Nome completo da criança *
            </label>
            <input
              id="crianca-nome"
              type="text"
              placeholder="Ex.: Lucas Gabriel Silveira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/40 border ${
                fieldErrors.nome ? 'border-[#D64545]' : 'border-[#EADBCE]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]`}
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.nome}</p>
            )}
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-idade">
              Idade *
            </label>
            <input
              id="crianca-idade"
              type="number"
              min="1"
              max="18"
              placeholder="Ex.: 8"
              value={idade}
              onChange={(e) => setIdade(e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/40 border ${
                fieldErrors.idade ? 'border-[#D64545]' : 'border-[#EADBCE]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]`}
            />
            {fieldErrors.idade && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.idade}</p>
            )}
          </div>
        </div>

        {/* Bloco 2: Série, Gênero e Localidade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-serie">
              Série escolar *
            </label>
            <input
              id="crianca-serie"
              type="text"
              placeholder="Ex.: 3º ano"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/40 border ${
                fieldErrors.serie ? 'border-[#D64545]' : 'border-[#EADBCE]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]`}
            />
            {fieldErrors.serie && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.serie}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-genero">
              Gênero
            </label>
            <select
              id="crianca-genero"
              value={genero}
              onChange={(e) => setGenero(e.target.value as GeneroCrianca)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#EADBCE] text-sm text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
            >
              <option value="Menina">Menina</option>
              <option value="Menino">Menino</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-loc">
              Localidade (Município/UF)
            </label>
            <input
              id="crianca-loc"
              type="text"
              placeholder="Ex.: São Paulo, SP"
              value={localidade}
              onChange={(e) => setLocalidade(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/40 border border-[#EADBCE] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
            />
          </div>
        </div>

        {/* Bloco 3: Escola e Horários de Aula */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-escola">
              Escola (opcional)
            </label>
            <input
              id="crianca-escola"
              type="text"
              placeholder="Ex.: Colégio Horizonte"
              value={escola}
              onChange={(e) => setEscola(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/40 border border-[#EADBCE] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Horários de aula & Turno
            </label>
            <div className="flex gap-2">
              <select
                value={turnoAula}
                onChange={(e) => setTurnoAula(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-[#EADBCE] text-xs font-bold text-[#4A3B32] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Integral">Integral</option>
              </select>
              <input
                type="text"
                placeholder="Ex.: 07h15 às 12h00"
                value={horarioDetalhe}
                onChange={(e) => setHorarioDetalhe(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#FFF8F0]/40 border border-[#EADBCE] text-xs text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Preferências de Acessibilidade */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <label className="block text-xs font-bold text-[#4A3B32]">
            Preferências de acessibilidade
          </label>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={acessLeituraGrande}
                onChange={(e) => setAcessLeituraGrande(e.target.checked)}
                className="rounded border-slate-300 text-[#F28C28] focus:ring-[#F28C28]"
              />
              <span>Leitura com fonte grande</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={acessApoioVisual}
                onChange={(e) => setAcessApoioVisual(e.target.checked)}
                className="rounded border-slate-300 text-[#F28C28] focus:ring-[#F28C28]"
              />
              <span>Apoio visual reforçado</span>
            </label>
          </div>
        </div>

        {/* Bloco 5: Observações Gerais */}
        <div>
          <label className="block text-xs font-bold text-[#4A3B32] mb-1" htmlFor="crianca-obs">
            Observações pedagógicas gerais (opcional)
          </label>
          <textarea
            id="crianca-obs"
            rows={2}
            placeholder="Ex.: Muito curiosa e comunicativa. Aprende melhor com metáforas práticas e desafios."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/40 border border-[#EADBCE] text-xs text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#EADBCE] text-[#4A3B32] font-bold text-xs hover:bg-[#FBEFE0] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center justify-center gap-1.5"
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Salvar Perfil</span>
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
