import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types'

interface AuthContextType {
  user: UserRecord | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserRecord>
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirm: string,
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(
    (pb.authStore.record as unknown as UserRecord) || null,
  )
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const syncState = useCallback(() => {
    setUser((pb.authStore.record as unknown as UserRecord) || null)
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
    setToken(authData.token)
    return userRec
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirm: string,
  ): Promise<void> => {
    await pb.collection('users').create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      passwordConfirm,
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
      const refreshed = await pb.collection('users').authRefresh()
      setUser(refreshed.record as unknown as UserRecord)
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && pb.authStore.isValid,
        isLoading,
        login,
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
