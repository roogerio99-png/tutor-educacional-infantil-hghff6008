/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/AuthGuard'
import Layout from '@/components/Layout'

// Páginas Públicas
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Cadastro from '@/pages/Cadastro'
import EsqueciSenha from '@/pages/EsqueciSenha'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import ConfirmarEmail from '@/pages/ConfirmarEmail'

// Páginas Autenticadas
import Filhos from '@/pages/Filhos'
import FilhoDetalhe from '@/pages/FilhoDetalhe'
import Dificuldades from '@/pages/Dificuldades'
import BaseDeConhecimento from '@/pages/BaseDeConhecimento'
import Perfil from '@/pages/Perfil'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Landing Page Pública: "/" */}
          <Route path="/" element={<Index />} />

          {/* Rotas Públicas de Autenticação (redirecionam para /filhos se já logado) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          </Route>

          {/* Rotas Protegidas - Requerem Autenticação e usam o Layout com Header + Footer */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/filhos" element={<Filhos />} />
              <Route path="/filhos/:id" element={<FilhoDetalhe />} />
              <Route path="/dificuldades" element={<Dificuldades />} />
              <Route path="/base-de-conhecimento" element={<BaseDeConhecimento />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Route>

          {/* Rota 404 */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
