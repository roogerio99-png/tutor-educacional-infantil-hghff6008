import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '../lib/pocketbase/client'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (name: string, email: string, pass: string) => Promise<void>
  logout: () => void
  updateProfileName: (newName: string) => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>((pb.authStore.record as unknown as User) || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const handleAuthChange = () => {
      setUser((pb.authStore.record as unknown as User) || null)
    }

    const unsubscribe = pb.authStore.onChange(handleAuthChange)

    if (pb.authStore.isValid && pb.authStore.record) {
      setUser(pb.authStore.record as unknown as User)
    } else {
      setUser(null)
    }
    setIsLoading(false)

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
    setUser(authData.record as unknown as User)
  }

  const register = async (name: string, email: string, pass: string) => {
    await pb.collection('users').create({
      email: email.trim(),
      password: pass,
      passwordConfirm: pass,
      name: name.trim(),
    })
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const updateProfileName = async (newName: string) => {
    if (!pb.authStore.record?.id) throw new Error('Não autenticado')
    const updated = await pb.collection('users').update(pb.authStore.record.id, {
      name: newName.trim(),
    })
    setUser(updated as unknown as User)
  }

  const refreshUser = () => {
    setUser((pb.authStore.record as unknown as User) || null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && pb.authStore.isValid,
        isLoading,
        login,
        register,
        logout,
        updateProfileName,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
