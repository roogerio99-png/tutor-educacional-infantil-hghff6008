import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord, CriancaUsuarioRecord, TipoConta, PermissoesCrianca } from '@/types'

interface AuthContextType {
  user: UserRecord | null
  criancaUsuario: CriancaUsuarioRecord | null
  tipoConta: TipoConta
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  permissoes: PermissoesCrianca
  login: (email: string, password: string) => Promise<UserRecord>
  loginCrianca: (username: string, password: string) => Promise<CriancaUsuarioRecord>
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirm: string,
    consentimentoLgpd?: boolean,
  ) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string, passwordConfirm: string) => Promise<void>
  requestVerification: (email: string) => Promise<void>
  confirmVerification: (token: string) => Promise<void>
  requestEmailChange: (newEmail: string) => Promise<void>
  confirmEmailChange: (token: string, password: string) => Promise<void>
  updateProfileName: (name: string) => Promise<UserRecord>
  updatePassword: (oldPassword: string, password: string, passwordConfirm: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_TIPO_CONTA = 'lumi_tipo_conta'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tipoConta, setTipoConta] = useState<TipoConta>(() => {
    const saved = localStorage.getItem(STORAGE_TIPO_CONTA)
    return saved === 'crianca' ? 'crianca' : 'responsavel'
  })

  const [user, setUser] = useState<UserRecord | null>(() => {
    const rec = pb.authStore.record
    if (rec && (rec.collectionName === 'users' || !rec.collectionName)) {
      return rec as unknown as UserRecord
    }
    return null
  })

  const [criancaUsuario, setCriancaUsuario] = useState<CriancaUsuarioRecord | null>(() => {
    const rec = pb.authStore.record
    if (rec && rec.collectionName === 'criancas_usuarios') {
      return rec as unknown as CriancaUsuarioRecord
    }
    return null
  })

  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const syncState = useCallback(() => {
    const rec = pb.authStore.record
    if (!rec) {
      setUser(null)
      setCriancaUsuario(null)
      setTipoConta('responsavel')
      localStorage.setItem(STORAGE_TIPO_CONTA, 'responsavel')
    } else if (rec.collectionName === 'criancas_usuarios') {
      setCriancaUsuario(rec as unknown as CriancaUsuarioRecord)
      setUser(null)
      setTipoConta('crianca')
      localStorage.setItem(STORAGE_TIPO_CONTA, 'crianca')
    } else {
      setUser(rec as unknown as UserRecord)
      setCriancaUsuario(null)
      setTipoConta('responsavel')
      localStorage.setItem(STORAGE_TIPO_CONTA, 'responsavel')
    }
    setToken(pb.authStore.token || null)
  }, [])

  useEffect(() => {
    syncState()
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange(() => {
      syncState()
    })

    return () => {
      unsubscribe()
    }
  }, [syncState])

  const login = async (email: string, password: string): Promise<UserRecord> => {
    const authData = await pb.collection('users').authWithPassword(email.trim(), password)
    const userRec = authData.record as unknown as UserRecord
    setUser(userRec)
    setCriancaUsuario(null)
    setTipoConta('responsavel')
    localStorage.setItem(STORAGE_TIPO_CONTA, 'responsavel')
    setToken(authData.token)
    return userRec
  }

  const loginCrianca = async (
    username: string,
    password: string,
  ): Promise<CriancaUsuarioRecord> => {
    const authData = await pb
      .collection('criancas_usuarios')
      .authWithPassword(username.trim().toLowerCase(), password)
    const criancaRec = authData.record as unknown as CriancaUsuarioRecord

    if (!criancaRec.ativo) {
      // Se não estiver ativo, desfaz login
      pb.authStore.clear()
      setUser(null)
      setCriancaUsuario(null)
      setToken(null)
      throw new Error('CONTA_PAUSADA')
    }

    setCriancaUsuario(criancaRec)
    setUser(null)
    setTipoConta('crianca')
    localStorage.setItem(STORAGE_TIPO_CONTA, 'crianca')
    setToken(authData.token)
    return criancaRec
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirm: string,
    consentimentoLgpd?: boolean,
  ): Promise<void> => {
    await pb.collection('users').create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      passwordConfirm,
      consentimento_lgpd: !!consentimentoLgpd,
      consentimento_data: consentimentoLgpd ? new Date().toISOString() : undefined,
    })
    // Envia e-mail de verificação (se SMTP configurado ou em background)
    try {
      await pb.collection('users').requestVerification(email.trim().toLowerCase())
    } catch {
      // Ignora erro de envio de email caso SMTP não esteja ativo
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setCriancaUsuario(null)
    setTipoConta('responsavel')
    localStorage.removeItem(STORAGE_TIPO_CONTA)
    setToken(null)
  }

  const requestPasswordReset = async (email: string): Promise<void> => {
    await pb.collection('users').requestPasswordReset(email.trim().toLowerCase())
  }

  const confirmPasswordReset = async (
    resetToken: string,
    password: string,
    passwordConfirm: string,
  ): Promise<void> => {
    await pb.collection('users').confirmPasswordReset(resetToken, password, passwordConfirm)
  }

  const requestVerification = async (email: string): Promise<void> => {
    await pb.collection('users').requestVerification(email.trim().toLowerCase())
  }

  const confirmVerification = async (verifyToken: string): Promise<void> => {
    await pb.collection('users').confirmVerification(verifyToken)
  }

  const requestEmailChange = async (newEmail: string): Promise<void> => {
    await pb.collection('users').requestEmailChange(newEmail.trim().toLowerCase())
  }

  const confirmEmailChange = async (emailToken: string, password: string): Promise<void> => {
    await pb.collection('users').confirmEmailChange(emailToken, password)
    logout()
  }

  const updateProfileName = async (name: string): Promise<UserRecord> => {
    if (!pb.authStore.record) throw new Error('Não autenticado')
    const updated = await pb.collection('users').update(pb.authStore.record.id, {
      name: name.trim(),
    })
    const userRec = updated as unknown as UserRecord
    setUser(userRec)
    return userRec
  }

  const updatePassword = async (
    oldPassword: string,
    password: string,
    passwordConfirm: string,
  ): Promise<void> => {
    if (!pb.authStore.record) throw new Error('Não autenticado')
    await pb.collection('users').update(pb.authStore.record.id, {
      oldPassword,
      password,
      passwordConfirm,
    })
  }

  const refreshUser = async (): Promise<void> => {
    if (!pb.authStore.isValid) return
    try {
      if (tipoConta === 'crianca' || pb.authStore.record?.collectionName === 'criancas_usuarios') {
        const refreshed = await pb.collection('criancas_usuarios').authRefresh()
        const rec = refreshed.record as unknown as CriancaUsuarioRecord
        if (!rec.ativo) {
          logout()
          return
        }
        setCriancaUsuario(rec)
      } else {
        const refreshed = await pb.collection('users').authRefresh()
        setUser(refreshed.record as unknown as UserRecord)
      }
    } catch {
      logout()
    }
  }

  // Permissões computadas para a criança
  let permissoes: PermissoesCrianca = {
    conversa: true,
    agenda: true,
    grafo: false,
    conquistas: true,
  }

  if (tipoConta === 'crianca' && criancaUsuario) {
    if (criancaUsuario.permissoes) {
      if (typeof criancaUsuario.permissoes === 'string') {
        try {
          permissoes = { ...permissoes, ...JSON.parse(criancaUsuario.permissoes) }
        } catch {
          /* intentionally ignored */
        }
      } else {
        permissoes = { ...permissoes, ...criancaUsuario.permissoes }
      }
    }
  } else if (tipoConta === 'responsavel') {
    // Responsável tem tudo liberado
    permissoes = {
      conversa: true,
      agenda: true,
      grafo: true,
      conquistas: true,
    }
  }

  const isAuthenticated = pb.authStore.isValid && (!!user || !!criancaUsuario)

  return (
    <AuthContext.Provider
      value={{
        user,
        criancaUsuario,
        tipoConta,
        token,
        isAuthenticated,
        isLoading,
        permissoes,
        login,
        loginCrianca,
        register,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        requestVerification,
        confirmVerification,
        requestEmailChange,
        confirmEmailChange,
        updateProfileName,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
