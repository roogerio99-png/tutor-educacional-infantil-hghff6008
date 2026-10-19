import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header com Logo */}
      <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>
        <Link
          to="/"
          className="text-sm font-semibold text-[#9C8B7D] hover:text-[#F28C28] transition-colors"
        >
          ← Voltar para o início
        </Link>
      </div>

      {/* Conteúdo Central */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-[#EADBCE]">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A3B32] tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-[#9C8B7D] mt-1.5 font-medium">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      {/* Footer simples */}
      <div className="text-center text-xs text-[#9C8B7D] py-4">
        Aprende+ Tutor — educação personalizada para crianças &copy; {new Date().getFullYear()}
      </div>
    </div>
  )
}
