import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Logo } from '@/components/Logo'
import { Compass, Home } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.warn('Página não encontrada (404):', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[#FFF8F0] p-6 text-[#4A3B32]">
      <div className="w-full max-w-[1200px] flex justify-start">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </div>

      <div className="text-center max-w-md mx-auto my-auto py-12 bg-white rounded-3xl p-8 border border-[#EADBCE] shadow-soft">
        <div className="w-16 h-16 rounded-2xl bg-[#FBEFE0] text-[#F28C28] flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-[#4A3B32] mb-2 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-[#4A3B32] mb-2">Página não encontrada</h2>
        <p className="text-sm text-[#9C8B7D] mb-6">
          O caminho que você tentou acessar não existe ou foi movido para outro endereço.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-soft transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>
      </div>

      <div className="text-center text-xs text-[#9C8B7D]">
        Aprende+ Tutor &copy; {new Date().getFullYear()}
      </div>
    </div>
  )
}

export default NotFound
