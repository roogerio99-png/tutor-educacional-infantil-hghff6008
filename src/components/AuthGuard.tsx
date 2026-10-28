import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F28C28] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#9C8B7D] font-medium">Carregando Aprende+ Tutor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

/**
 * Guarda de rota exclusiva para o responsável (pais/educadores).
 * A criança logada com sua própria conta não tem acesso a páginas parentais (grafo-painel, prompts, etc.)
 */
export const ResponsavelOnlyRoute: React.FC = () => {
  const { tipoConta, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (tipoConta === 'crianca') {
    // Redireciona a criança carinhosamente para o seu cantinho
    return <Navigate to="/conversa" replace />
  }

  return <Outlet />
}

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/conversa" replace />
  }

  return <Outlet />
}
