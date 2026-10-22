import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CriancaRecord } from '@/types'
import { listarCriancas } from '@/services/criancas'
import { useAuth } from '@/contexts/AuthContext'

interface CriancaContextType {
  criancas: CriancaRecord[]
  criancaSelecionada: CriancaRecord | null
  carregando: boolean
  selecionarCrianca: (crianca: CriancaRecord | null) => void
  recarregarCriancas: () => Promise<void>
}

const CriancaContext = createContext<CriancaContextType | undefined>(undefined)

const STORAGE_KEY = 'lumi_crianca_selecionada_id'

export const CriancaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [criancas, setCriancas] = useState<CriancaRecord[]>([])
  const [criancaSelecionada, setCriancaSelecionada] = useState<CriancaRecord | null>(null)
  const [carregando, setCarregando] = useState<boolean>(true)

  const recarregarCriancas = useCallback(async () => {
    if (!isAuthenticated) {
      setCriancas([])
      setCriancaSelecionada(null)
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      const list = await listarCriancas()
      setCriancas(list)

      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId && list.some((c) => c.id === savedId)) {
        const found = list.find((c) => c.id === savedId) || null
        setCriancaSelecionada(found)
      } else if (list.length > 0) {
        setCriancaSelecionada(list[0])
        localStorage.setItem(STORAGE_KEY, list[0].id)
      } else {
        setCriancaSelecionada(null)
      }
    } catch (err) {
      console.error('Erro ao carregar crianças:', err)
    } finally {
      setCarregando(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    recarregarCriancas()
  }, [recarregarCriancas])

  const selecionarCrianca = (crianca: CriancaRecord | null) => {
    setCriancaSelecionada(crianca)
    if (crianca) {
      localStorage.setItem(STORAGE_KEY, crianca.id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <CriancaContext.Provider
      value={{
        criancas,
        criancaSelecionada,
        carregando,
        selecionarCrianca,
        recarregarCriancas,
      }}
    >
      {children}
    </CriancaContext.Provider>
  )
}

export const useCrianca = () => {
  const context = useContext(CriancaContext)
  if (!context) {
    throw new Error('useCrianca deve ser usado dentro de CriancaProvider')
  }
  return context
}
