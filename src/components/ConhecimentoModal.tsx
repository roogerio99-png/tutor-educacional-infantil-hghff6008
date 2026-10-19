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
import type { ConhecimentoRecord, CriancaRecord } from '@/types'
import type { ConhecimentoInput } from '@/services/conhecimento'

interface ConhecimentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conhecimentoParaEditar?: ConhecimentoRecord | null
  criancaIdPadrao?: string
  listaCriancas?: CriancaRecord[]
  mostrarSeletorCrianca?: boolean
  onSave: (dados: ConhecimentoInput, id?: string) => Promise<void>
}

export const ConhecimentoModal: React.FC<ConhecimentoModalProps> = ({
  open,
  onOpenChange,
  conhecimentoParaEditar,
  criancaIdPadrao,
  listaCriancas = [],
  mostrarSeletorCrianca = false,
  onSave,
}) => {
  const [criancaId, setCriancaId] = useState(criancaIdPadrao || '')
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    if (conhecimentoParaEditar) {
      setCriancaId(conhecimentoParaEditar.crianca || criancaIdPadrao || '')
      setTitulo(conhecimentoParaEditar.titulo || '')
      setConteudo(conhecimentoParaEditar.conteudo || '')
    } else {
      setCriancaId(criancaIdPadrao || listaCriancas[0]?.id || '')
      setTitulo('')
      setConteudo('')
    }
    setFieldErrors({})
    setGeneralError(null)
  }, [conhecimentoParaEditar, criancaIdPadrao, listaCriancas, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!criancaId) errors.crianca = 'Selecione uma criança'
    if (!conteudo.trim()) errors.conteudo = 'Descreva o que você observou no aprendizado'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await onSave(
        {
          crianca: criancaId,
          titulo: titulo.trim() || undefined,
          conteudo: conteudo.trim(),
        },
        conhecimentoParaEditar?.id,
      )
      onOpenChange(false)
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError('Não foi possível salvar a observação.')
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
            {conhecimentoParaEditar ? 'Editar Observação' : 'Adicionar Observação'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#9C8B7D]">
            Guarde o que funciona para o seu filho: métodos, pausas, metáforas e gatilhos de
            interesse.
          </DialogDescription>
        </DialogHeader>

        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Seletor de Criança */}
          {mostrarSeletorCrianca && (
            <div>
              <label
                className="block text-xs font-bold text-[#4A3B32] mb-1.5"
                htmlFor="conh-crianca"
              >
                Criança *
              </label>
              <select
                id="conh-crianca"
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
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="conh-titulo">
              Título ou tema (opcional)
            </label>
            <input
              id="conh-titulo"
              type="text"
              placeholder="Ex.: Material concreto para matemática"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all"
            />
          </div>

          <div>
            <label
              className="block text-xs font-bold text-[#4A3B32] mb-1.5"
              htmlFor="conh-conteudo"
            >
              O que você observou? *
            </label>
            <textarea
              id="conh-conteudo"
              rows={4}
              placeholder="Ex.: Aprende muito melhor com material concreto, como pedaços de fruta para frações. Quando usamos maçãs para dividir, ela compreendeu na hora!"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                fieldErrors.conteudo
                  ? 'border-[#D64545] focus:ring-red-400'
                  : 'border-[#EADBCE] focus:ring-[#F28C28]'
              } text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all resize-none`}
            />
            {fieldErrors.conteudo && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">{fieldErrors.conteudo}</p>
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
              <span>Salvar observação</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
