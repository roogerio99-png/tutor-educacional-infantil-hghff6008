import React from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { HeaderModoCrianca } from '@/components/modocrianca/HeaderModoCrianca'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'

export const Layout: React.FC = () => {
  const { modoCriancaAtivo } = useModoCrianca()
  const location = useLocation()

  // Se o Modo Criança estiver ativo e o usuário tentar acessar páginas de adulto,
  // redireciona silenciosamente para o chat /conversa
  const rotasAdulto = [
    '/grafo-painel',
    '/prompts',
    '/filhos',
    '/dificuldades',
    '/base-de-conhecimento',
    '/perfil',
  ]
  const tentandoAcessarAdulto = rotasAdulto.some((r) => location.pathname.startsWith(r))

  if (modoCriancaAtivo && tentandoAcessarAdulto) {
    return <Navigate to="/conversa" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800">
      {modoCriancaAtivo ? <HeaderModoCrianca /> : <Header />}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      {!modoCriancaAtivo && (
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5">
              <span className="text-amber-400">✨ Lumi IA</span> — Tutoria Socrática Guiada & Apoio
              Pedagógico
            </p>
            <p className="text-slate-500">
              Nenhuma resposta direta • Autonomia e pensamento crítico para crianças
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Layout
