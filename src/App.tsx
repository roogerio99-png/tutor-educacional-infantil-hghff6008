/* Main App Component - Handles routing (using react-router-dom) with Lumi IA 4 tabs */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { CriancaProvider } from '@/contexts/CriancaContext'
import { ProtectedRoute, PublicOnlyRoute, ResponsavelOnlyRoute } from '@/components/AuthGuard'
import { ModoCriancaProvider } from '@/contexts/ModoCriancaContext'
import Layout from '@/components/Layout'

// Páginas Públicas
import Login from '@/pages/Login'
import Cadastro from '@/pages/Cadastro'
import EsqueciSenha from '@/pages/EsqueciSenha'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import ConfirmarEmail from '@/pages/ConfirmarEmail'

// 4 Abas do Protótipo Lumi IA
import ConversaQuadro from '@/pages/ConversaQuadro'
import AgendaPage from '@/pages/AgendaPage'
import GrafoPainel from '@/pages/GrafoPainel'
import StudioPrompts from '@/pages/StudioPrompts'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CriancaProvider>
        <ModoCriancaProvider>
          <Toaster />
          <Routes>
            {/* Rotas Públicas de Autenticação */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/confirmar-email" element={<ConfirmarEmail />} />
            </Route>

            {/* Rotas Protegidas - 4 Abas do Protótipo Lumi IA */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/conversa" replace />} />
                <Route path="/conversa" element={<ConversaQuadro />} />
                <Route path="/agenda" element={<AgendaPage />} />

                {/* Rotas exclusivas do Responsável */}
                <Route element={<ResponsavelOnlyRoute />}>
                  <Route path="/grafo-painel" element={<GrafoPainel />} />
                  <Route path="/prompts" element={<StudioPrompts />} />

                  {/* Redirecionamentos de retrocompatibilidade */}
                  <Route path="/filhos" element={<Navigate to="/grafo-painel" replace />} />
                  <Route path="/filhos/:id" element={<Navigate to="/grafo-painel" replace />} />
                  <Route path="/dificuldades" element={<Navigate to="/grafo-painel" replace />} />
                  <Route
                    path="/base-de-conhecimento"
                    element={<Navigate to="/grafo-painel" replace />}
                  />
                  <Route path="/perfil" element={<Navigate to="/prompts" replace />} />
                </Route>
              </Route>
            </Route>

            {/* Rota 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ModoCriancaProvider>
      </CriancaProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
