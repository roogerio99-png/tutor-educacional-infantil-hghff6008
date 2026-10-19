/* Layout autenticado com Header superior, menu suspenso de usuário, transições suaves e rodapé discreto */
import React, { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'
import { Users, AlertCircle, BookOpen, User, LogOut, ChevronDown } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Extrai primeiro nome
  const fullName = user?.name || user?.email?.split('@')[0] || 'Responsável'
  const firstName = fullName.split(' ')[0]
  const initial = firstName.charAt(0).toUpperCase()

  // Fecha menu suspenso ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Fecha menu ao navegar
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/filhos', label: 'Meus Filhos', icon: Users },
    { to: '/dificuldades', label: 'Dificuldades', icon: AlertCircle },
    { to: '/base-de-conhecimento', label: 'Base de Conhecimento', icon: BookOpen },
  ]

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-[#4A3B32]">
      {/* Header superior autenticado */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADBCE] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Lado esquerdo: Logo */}
          <Link
            to="/filhos"
            className="flex items-center gap-2 group transition-transform hover:scale-[1.01]"
          >
            <Logo size="md" />
          </Link>

          {/* Links de navegação principais (desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FBEFE0]/60 p-1 rounded-2xl border border-[#EADBCE]">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive =
                location.pathname === link.to ||
                (link.to === '/filhos' && location.pathname.startsWith('/filhos/'))
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#F28C28] text-white shadow-sm'
                      : 'text-[#4A3B32] hover:bg-white/80 hover:text-[#F28C28]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Lado direito: Usuário logado + Menu suspenso */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#FBEFE0] hover:bg-[#F5E2CE] border border-[#EADBCE] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#F28C28]/40"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F28C28] to-[#E06A10] text-white font-bold text-sm flex items-center justify-center shadow-sm flex-shrink-0">
                {initial}
              </div>
              <span className="text-sm font-semibold text-[#4A3B32] max-w-[130px] truncate hidden sm:inline">
                {firstName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#9C8B7D] transition-transform duration-150 ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Menu suspenso com escala 0.95 -> 1.0 em 120ms */}
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#EADBCE] py-1.5 z-50 animate-dropdown"
                style={{
                  transformOrigin: 'top right',
                }}
              >
                <div className="px-4 py-2.5 border-b border-[#F0E4D8]">
                  <p className="text-xs text-[#9C8B7D] font-medium">Conectado como</p>
                  <p className="text-sm font-bold text-[#4A3B32] truncate">{fullName}</p>
                  <p className="text-xs text-[#9C8B7D] truncate">{user?.email}</p>
                </div>

                {/* Itens do menu para telas móveis */}
                <div className="md:hidden py-1 border-b border-[#F0E4D8]">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = location.pathname === link.to
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#FFF8F0] text-[#F28C28]'
                            : 'text-[#4A3B32] hover:bg-[#FBEFE0]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#F28C28]" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <div className="py-1">
                  <Link
                    to="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#4A3B32] hover:bg-[#FBEFE0] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#F28C28]" />
                    <span>Meus Dados</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#D64545] hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#D64545]" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Barra de navegação inferior rápida em telas móveis */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EADBCE] px-4 py-2 flex items-center justify-around shadow-lg">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive =
            location.pathname === link.to ||
            (link.to === '/filhos' && location.pathname.startsWith('/filhos/'))
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all min-w-[64px] min-h-[44px] justify-center ${
                isActive ? 'text-[#F28C28]' : 'text-[#9C8B7D] hover:text-[#4A3B32]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] leading-tight">{link.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Conteúdo principal centralizado (max 1200px, padding 24-40px) com fade + translateY suave (150ms) */}
      <main
        key={location.pathname}
        className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-20 md:pb-10 transition-opacity duration-150"
      >
        <Outlet />
      </main>

      {/* Rodapé discreto */}
      <footer className="border-t border-[#EADBCE] bg-[#FBEFE0]/40 py-6 text-center text-xs text-[#9C8B7D] hidden md:block">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Aprende+ Tutor — educação personalizada para crianças</span>
          <span>© {currentYear} Aprende+ Tutor. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
