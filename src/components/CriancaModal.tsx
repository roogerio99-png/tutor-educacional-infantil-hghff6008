import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import type { CriancaRecord } from '@/types'
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
    } else {
      setNome('')
      setIdade('')
      setSerie('')
      setEscola('')
      setObservacoes('')
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
      await onSave(
        {
          nome: nome.trim(),
          idade: Number(idade),
          serie: serie.trim(),
          escola: escola.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-3xl p-6 sm:p-7 border border-[#EADBCE] shadow-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold text-[#4A3B32]">
            {criancaParaEditar ? 'Editar Criança' : 'Adicionar Criança'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#9C8B7D]">
            {criancaParaEditar
              ? 'Atualize os dados e a rotina escolar do seu filho.'
              : 'Cadastre seu filho para começar a registrar dificuldades e o que funciona no aprendizado.'}
          </DialogDescription>
        </DialogHeader>

        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="crianca-nome">
              Nome da criança *
            </label>
            <input
              id="crianca-nome"
              type="text"
              placeholder="Ex.: Lucas Mendes"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.nome
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.nome}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-bold text-[#4A3B32] mb-1.5"
                htmlFor="crianca-idade"
              >
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
                className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                  fieldErrors.idade
                    ? 'border-[#D64545] focus:ring-red-400'
                    : 'border-[#EADBCE] focus:ring-[#F28C28]'
                } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
              />
              {fieldErrors.idade && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.idade}</p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-bold text-[#4A3B32] mb-1.5"
                htmlFor="crianca-serie"
              >
                Série *
              </label>
              <input
                id="crianca-serie"
                type="text"
                placeholder="Ex.: 3º ano"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                  fieldErrors.serie
                    ? 'border-[#D64545] focus:ring-red-400'
                    : 'border-[#EADBCE] focus:ring-[#F28C28]'
                } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
              />
              {fieldErrors.serie && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.serie}</p>
              )}
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold text-[#4A3B32] mb-1.5"
              htmlFor="crianca-escola"
            >
              Escola (opcional)
            </label>
            <input
              id="crianca-escola"
              type="text"
              placeholder="Ex.: Escola Caminho do Saber"
              value={escola}
              onChange={(e) => setEscola(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="crianca-obs">
              Observações gerais (opcional)
            </label>
            <textarea
              id="crianca-obs"
              rows={3}
              placeholder="Ex.: Tem muita facilidade com artes, mas se distrai facilmente com ruídos..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#EADBCE] text-[#4A3B32] font-bold text-sm hover:bg-[#FBEFE0] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Salvar</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
