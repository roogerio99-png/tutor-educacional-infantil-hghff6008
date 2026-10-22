import React, { useState } from 'react'
import type { HumorEmocional } from '@/types'
import { Heart, Sparkles, Smile, Meh, Frown } from 'lucide-react'

interface CheckinEmocionalCardProps {
  nomeCrianca: string
  onSelecionarHumor: (humor: HumorEmocional) => Promise<void>
  salvando?: boolean
}

interface OpcaoHumor {
  id: HumorEmocional
  emoji: string
  rotulo: string
  subtitulo: string
  bgHover: string
  borderActive: string
  corIcone: string
}

const OPCOES_HUMOR: OpcaoHumor[] = [
  {
    id: 'muito_feliz',
    emoji: '🌟',
    rotulo: 'Muito feliz',
    subtitulo: 'Super animado(a) e com energia!',
    bgHover: 'hover:bg-amber-50 hover:border-amber-300',
    borderActive: 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-300',
    corIcone: 'text-amber-500',
  },
  {
    id: 'feliz',
    emoji: '😊',
    rotulo: 'Feliz',
    subtitulo: 'Bem, tranquilo(a) e pronto(a)',
    bgHover: 'hover:bg-emerald-50 hover:border-emerald-300',
    borderActive: 'border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-300',
    corIcone: 'text-emerald-500',
  },
  {
    id: 'neutro',
    emoji: '😐',
    rotulo: 'Mais ou menos',
    subtitulo: 'Normal, um pouco pensativo(a)',
    bgHover: 'hover:bg-slate-50 hover:border-slate-300',
    borderActive: 'border-slate-400 bg-slate-50/80 ring-2 ring-slate-300',
    corIcone: 'text-slate-500',
  },
  {
    id: 'triste',
    emoji: '🙁',
    rotulo: 'Triste',
    subtitulo: 'Meio pra baixo ou chateado(a)',
    bgHover: 'hover:bg-indigo-50 hover:border-indigo-300',
    borderActive: 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-300',
    corIcone: 'text-indigo-500',
  },
  {
    id: 'muito_triste',
    emoji: '😢',
    rotulo: 'Muito triste',
    subtitulo: 'Preciso de um abraço e calma',
    bgHover: 'hover:bg-rose-50 hover:border-rose-300',
    borderActive: 'border-rose-400 bg-rose-50/80 ring-2 ring-rose-300',
    corIcone: 'text-rose-500',
  },
]

export const CheckinEmocionalCard: React.FC<CheckinEmocionalCardProps> = ({
  nomeCrianca,
  onSelecionarHumor,
  salvando = false,
}) => {
  const [selecionado, setSelecionado] = useState<HumorEmocional | null>(null)

  const handleEscolher = async (humor: HumorEmocional) => {
    setSelecionado(humor)
    await onSelecionarHumor(humor)
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-6 sm:p-8 shadow-soft border-2 border-amber-200/80 relative overflow-hidden animate-fadeIn">
      {/* Decorações sutis de fundo */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-orange-200/30 blur-2xl pointer-events-none" />

      <div className="max-w-xl mx-auto text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Check-in Emocional do Dia</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-800">
          Como você está se sentindo hoje,{' '}
          <span className="text-amber-600">{nomeCrianca || 'amigo(a)'}</span>?
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          A Lumi quer saber como está o seu coraçãozinho antes de começarmos a investigar e aprender
          juntos. Não há resposta certa ou errada! ✨
        </p>

        {/* 5 opções visuais interativas */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-4">
          {OPCOES_HUMOR.map((opcao) => {
            const isSelected = selecionado === opcao.id
            return (
              <button
                key={opcao.id}
                type="button"
                disabled={salvando}
                onClick={() => handleEscolher(opcao.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center group cursor-pointer ${
                  isSelected ? opcao.borderActive : `border-slate-200/90 bg-white ${opcao.bgHover}`
                } ${salvando ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              >
                <span className="text-3xl mb-1.5 transform transition-transform group-hover:scale-110 block">
                  {opcao.emoji}
                </span>
                <span className="text-xs font-extrabold text-slate-800 block">{opcao.rotulo}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight hidden sm:block">
                  {opcao.subtitulo}
                </span>
              </button>
            )
          })}
        </div>

        {salvando && (
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-amber-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Lumi está preparando a recepção do seu dia...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckinEmocionalCard
