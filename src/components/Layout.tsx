import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
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
    </div>
  )
}

export default Layout
