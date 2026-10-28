import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCrianca } from '@/contexts/CriancaContext'
import {
  obterStatusPin,
  verificarPinResponsavel,
  definirPinResponsavel,
  redefinirPinComSenha,
} from '@/services/pinResponsavel'
import type { CriancaRecord } from '@/types'

interface ModoCriancaContextType {
  modoCriancaAtivo: boolean
  pinConfigurado: boolean
  carregandoPin: boolean
  modalConfigurarPinAberto: boolean
  modalSairModoAberto: boolean
  modalSelecionarCriancaAberto: boolean
  abrirModalConfigurarPin: () => void
  fecharModalConfigurarPin: () => void
  abrirModalSairModo: () => void
  fecharModalSairModo: () => void
  ativarModoCrianca: (crianca?: CriancaRecord | null) => void
  tentarSairModoCrianca: (pin: string) => Promise<{
    sucesso: boolean
    mensagem?: string
    bloqueado?: boolean
    segundosRestantes?: number
  }>
  desativarModoCriancaForcado: () => void
  atualizarStatusPin: () => Promise<boolean>
  salvarNovoPin: (
    novoPin: string,
    confirmacao: string,
    pinAtual?: string,
    senhaConta?: string,
  ) => Promise<void>
  redefinirPinSenha: (senhaConta: string, novoPin: string, confirmacao: string) => Promise<void>
  // Bloqueio temporário por tentativas incorretas
  tentativasFalhas: number
  tempoBloqueioRestante: number
}

const ModoCriancaContext = createContext<ModoCriancaContextType | undefined>(undefined)

const STORAGE_MODO_CRIANCA = 'lumi_modo_crianca_ativo'
const MAX_TENTATIVAS = 5
const TEMPO_BLOQUEIO_SEGUNDOS = 30

export const ModoCriancaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, tipoConta } = useAuth()
  const { criancaSelecionada, selecionarCrianca, criancas } = useCrianca()

  const [modoCriancaAtivoStorage, setModoCriancaAtivoStorage] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_MODO_CRIANCA) === 'true'
  })

  // Se a conta for de criança, o Modo Criança é SEMPRE ativo automaticamente
  const modoCriancaAtivo = tipoConta === 'crianca' || modoCriancaAtivoStorage

  const [pinConfigurado, setPinConfigurado] = useState<boolean>(false)
  const [carregandoPin, setCarregandoPin] = useState<boolean>(true)

  // Modais de controle
  const [modalConfigurarPinAberto, setModalConfigurarPinAberto] = useState(false)
  const [modalSairModoAberto, setModalSairModoAberto] = useState(false)
  const [modalSelecionarCriancaAberto, setModalSelecionarCriancaAberto] = useState(false)

  // Controle de tentativas e brute-force lock
  const [tentativasFalhas, setTentativasFalhas] = useState<number>(0)
  const [tempoBloqueioRestante, setTempoBloqueioRestante] = useState<number>(0)

  // Atualizar contagem regressiva se bloqueado
  useEffect(() => {
    if (tempoBloqueioRestante <= 0) return

    const interval = setInterval(() => {
      setTempoBloqueioRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTentativasFalhas(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [tempoBloqueioRestante])

  const atualizarStatusPin = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      setPinConfigurado(false)
      setCarregandoPin(false)
      return false
    }

    try {
      setCarregandoPin(true)
      const configurado = await obterStatusPin()
      setPinConfigurado(configurado)
      return configurado
    } catch {
      setPinConfigurado(false)
      return false
    } finally {
      setCarregandoPin(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    atualizarStatusPin()
  }, [atualizarStatusPin, user])

  // Desativa automaticamente se fizer logout
  useEffect(() => {
    if (!isAuthenticated) {
      setModoCriancaAtivoStorage(false)
      localStorage.removeItem(STORAGE_MODO_CRIANCA)
    }
  }, [isAuthenticated])

  const abrirModalConfigurarPin = () => setModalConfigurarPinAberto(true)
  const fecharModalConfigurarPin = () => setModalConfigurarPinAberto(false)

  const abrirModalSairModo = () => setModalSairModoAberto(true)
  const fecharModalSairModo = () => setModalSairModoAberto(false)

  const ativarModoCrianca = (crianca?: CriancaRecord | null) => {
    if (crianca) {
      selecionarCrianca(crianca)
    } else if (!criancaSelecionada && criancas.length > 0) {
      selecionarCrianca(criancas[0])
    }

    setModoCriancaAtivoStorage(true)
    localStorage.setItem(STORAGE_MODO_CRIANCA, 'true')
  }

  const desativarModoCriancaForcado = () => {
    setModoCriancaAtivoStorage(false)
    localStorage.removeItem(STORAGE_MODO_CRIANCA)
    setModalSairModoAberto(false)
    setTentativasFalhas(0)
    setTempoBloqueioRestante(0)
  }

  const tentarSairModoCrianca = async (
    pin: string,
  ): Promise<{
    sucesso: boolean
    mensagem?: string
    bloqueado?: boolean
    segundosRestantes?: number
  }> => {
    if (tempoBloqueioRestante > 0) {
      return {
        sucesso: false,
        bloqueado: true,
        segundosRestantes: tempoBloqueioRestante,
        mensagem: `Muitas tentativas! Por favor, aguarde ${tempoBloqueioRestante}s para tentar novamente.`,
      }
    }

    try {
      const valido = await verificarPinResponsavel(pin)
      if (valido) {
        desativarModoCriancaForcado()
        return { sucesso: true }
      }

      const novasFalhas = tentativasFalhas + 1
      setTentativasFalhas(novasFalhas)

      if (novasFalhas >= MAX_TENTATIVAS) {
        setTempoBloqueioRestante(TEMPO_BLOQUEIO_SEGUNDOS)
        return {
          sucesso: false,
          bloqueado: true,
          segundosRestantes: TEMPO_BLOQUEIO_SEGUNDOS,
          mensagem: `Limite de tentativas atingido. Aguarde ${TEMPO_BLOQUEIO_SEGUNDOS} segundos para tentar novamente.`,
        }
      }

      return {
        sucesso: false,
        mensagem: `Só os adultos podem sair daqui 😊 (Tentativa ${novasFalhas} de ${MAX_TENTATIVAS})`,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao verificar PIN'
      return {
        sucesso: false,
        mensagem: msg,
      }
    }
  }

  const salvarNovoPin = async (
    novoPin: string,
    confirmacao: string,
    pinAtual?: string,
    senhaConta?: string,
  ) => {
    await definirPinResponsavel({
      novo_pin: novoPin,
      confirmacao,
      pin_atual: pinAtual,
      senha_conta: senhaConta,
    })
    setPinConfigurado(true)
    setModalConfigurarPinAberto(false)
  }

  const redefinirPinSenha = async (senhaConta: string, novoPin: string, confirmacao: string) => {
    await redefinirPinComSenha({
      senha_conta: senhaConta,
      novo_pin: novoPin,
      confirmacao,
    })
    setPinConfigurado(true)
    setModalConfigurarPinAberto(false)
  }

  return (
    <ModoCriancaContext.Provider
      value={{
        modoCriancaAtivo,
        pinConfigurado,
        carregandoPin,
        modalConfigurarPinAberto,
        modalSairModoAberto,
        modalSelecionarCriancaAberto,
        abrirModalConfigurarPin,
        fecharModalConfigurarPin,
        abrirModalSairModo,
        fecharModalSairModo,
        ativarModoCrianca,
        tentarSairModoCrianca,
        desativarModoCriancaForcado,
        atualizarStatusPin,
        salvarNovoPin,
        redefinirPinSenha,
        tentativasFalhas,
        tempoBloqueioRestante,
      }}
    >
      {children}
    </ModoCriancaContext.Provider>
  )
}

export const useModoCrianca = () => {
  const context = useContext(ModoCriancaContext)
  if (!context) {
    throw new Error('useModoCrianca deve ser usado dentro de ModoCriancaProvider')
  }
  return context
}
