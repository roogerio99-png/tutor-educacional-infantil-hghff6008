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
import type { DificuldadeRecord, CriancaRecord } from '@/types'
import type { DificuldadeInput } from '@/services/dificuldades'

interface DificuldadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dificuldadeParaEditar?: DificuldadeRecord | null
  criancaIdPadrao?: string
  listaCriancas?: CriancaRecord[]
  mostrarSeletorCrianca?: boolean
  onSave: (dados: DificuldadeInput, id?: string) => Promise<void>
}

const MATERIAS_SUGERIDAS = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Artes',
  'Inglês',
  'Educação Física',
]

export const DificuldadeModal: React.FC<DificuldadeModalProps> = ({
  open,
  onOpenChange,
  dificuldadeParaEditar,
  criancaIdPadrao,
  listaCriancas = [],
  mostrarSeletorCrianca = false,
  onSave,
}) => {
  const [criancaId, setCriancaId] = useState(criancaIdPadrao || '')
  const [materia, setMateria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [impacto, setImpacto] = useState('')

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    if (dificuldadeParaEditar) {
      setCriancaId(dificuldadeParaEditar.crianca || criancaIdPadrao || '')
      setMateria(dificuldadeParaEditar.materia || '')
      setDescricao(dificuldadeParaEditar.descricao || '')
      setImpacto(dificuldadeParaEditar.impacto || '')
    } else {
      setCriancaId(criancaIdPadrao || listaCriancas[0]?.id || '')
      setMateria('')
      setDescricao('')
      setImpacto('')
    }
    setFieldErrors({})
    setGeneralError(null)
  }, [dificuldadeParaEditar, criancaIdPadrao, listaCriancas, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!criancaId) errors.crianca = 'Selecione uma criança'
    if (!materia.trim()) errors.materia = 'Informe a matéria escolar'
    if (!descricao.trim()) errors.descricao = 'Descreva a dificuldade observada'
    if (!impacto.trim()) errors.impacto = 'Explique como isso impacta a rotina escolar'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await onSave(
        {
          crianca: criancaId,
          materia: materia.trim(),
          descricao: descricao.trim(),
          impacto: impacto.trim(),
        },
        dificuldadeParaEditar?.id,
      )
      onOpenChange(false)
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError('Não foi possível salvar o registro de dificuldade.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl p-6 sm:p-7 border border-[#EADBCE] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#4A3B32]">
            {dificuldadeParaEditar ? 'Editar Dificuldade' : 'Registrar Dificuldade'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#9C8B7D]">
            Identifique onde a criança trava para que o tutor possa sugerir abordagens diferentes.
          </DialogDescription>
        </DialogHeader>

        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Seletor de Criança quando aplicável */}
          {mostrarSeletorCrianca && (
            <div>
              <label
                className="block text-xs font-bold text-[#4A3B32] mb-1.5"
                htmlFor="dif-crianca"
              >
                Criança *
              </label>
              <select
                id="dif-crianca"
                value={criancaId}
                onChange={(e) => setCriancaId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                  fieldErrors.crianca
                    ? 'border-[#D64545] focus:ring-red-400'
                    : 'border-[#EADBCE] focus:ring-[#F28C28]'
                } text-sm text-[#4A3B32] focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="">Selecione uma criança...</option>
                {listaCriancas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.serie})
                  </option>
                ))}
              </select>
              {fieldErrors.crianca && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.crianca}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="dif-materia">
              Matéria *
            </label>
            <input
              id="dif-materia"
              type="text"
              list="materias-list"
              placeholder="Ex.: Matemática"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.materia
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
            />
            <datalist id="materias-list">
              {MATERIAS_SUGERIDAS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            {fieldErrors.materia && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.materia}</p>
            )}

            {/* Chips rápidos de matérias */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MATERIAS_SUGERIDAS.slice(0, 5).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMateria(m)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FBEFE0] text-[#4A3B32] hover:bg-[#F28C28] hover:text-white transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="dif-desc">
              Descrição do que a criança tem dificuldade *
            </label>
            <textarea
              id="dif-desc"
              rows={3}
              placeholder="Ex.: Tem dificuldade com frações e divisão quando os números ficam maiores que 2 dígitos..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.descricao
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all resize-none`}
            />
            {fieldErrors.descricao && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.descricao}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="dif-impacto">
              Impacto observado *
            </label>
            <textarea
              id="dif-impacto"
              rows={2}
              placeholder="Ex.: Evita fazer as lições de casa de frações e chora quando precisa resolver na frente da turma."
              value={impacto}
              onChange={(e) => setImpacto(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.impacto
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all resize-none`}
            />
            {fieldErrors.impacto && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.impacto}</p>
            )}
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
