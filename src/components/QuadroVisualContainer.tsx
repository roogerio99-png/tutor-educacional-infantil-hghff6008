import React, { useState } from 'react'
import type { EtapaSocratica } from '@/types'
import { obterExemploTrabalhadoPorMateria } from '@/lib/orquestradorPedagogico'
import {
  SvgMatematica,
  SvgCiencias,
  SvgPortugues,
  SvgHistoria,
  SvgGeografia,
  SvgGeral,
} from './QuadroVisualPedagogico'

export interface QuadroVisualContainerProps {
  materia: string
  etapaSocratica: EtapaSocratica
  acessibilidade?: string
  topicoCustomizado?: string
  onTrocarTopico?: () => void
  onResponderDesafioEspelho?: (resposta: string) => void
}

export const QuadroVisualContainer: React.FC<QuadroVisualContainerProps> = ({
  materia,
  etapaSocratica,
  acessibilidade,
  topicoCustomizado,
  onTrocarTopico,
  onResponderDesafioEspelho,
}) => {
  const [respostaDesafio, setRespostaDesafio] = useState('')
  const [desafioConcluido, setDesafioConcluido] = useState(false)

  const acessibilidadeReforcada =
    (acessibilidade || '').toLowerCase().includes('apoio visual') ||
    (acessibilidade || '').toLowerCase().includes('fonte grande')

  const materiaNorm = (materia || '').toLowerCase()
  const exemploTrabalhado = obterExemploTrabalhadoPorMateria(materiaNorm)

  // Mapeamento de SVG por matéria
  let componenteSvg = <SvgCiencias acessibilidadeReforcada={acessibilidadeReforcada} />
  let tituloPadrao = 'Ciências da Natureza'
  let iconeMateria = '🌱'
  let corBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200'

  if (
    materiaNorm.includes('matematica') ||
    materiaNorm.includes('fração') ||
    materiaNorm.includes('número') ||
    materiaNorm.includes('divis')
  ) {
    componenteSvg = <SvgMatematica acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Matemática Divertida'
    iconeMateria = '🔢'
    corBadge = 'bg-amber-100 text-amber-800 border-amber-200'
  } else if (
    materiaNorm.includes('portugues') ||
    materiaNorm.includes('lingua') ||
    materiaNorm.includes('frase') ||
    materiaNorm.includes('silaba')
  ) {
    componenteSvg = <SvgPortugues acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Palavras e Frases'
    iconeMateria = '📚'
    corBadge = 'bg-rose-100 text-rose-800 border-rose-200'
  } else if (
    materiaNorm.includes('historia') ||
    materiaNorm.includes('tempo') ||
    materiaNorm.includes('seculo')
  ) {
    componenteSvg = <SvgHistoria acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Viagem no Tempo'
    iconeMateria = '📜'
    corBadge = 'bg-orange-100 text-orange-800 border-orange-200'
  } else if (
    materiaNorm.includes('geografia') ||
    materiaNorm.includes('mapa') ||
    materiaNorm.includes('relevo')
  ) {
    componenteSvg = <SvgGeografia acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Explorando o Mundo'
    iconeMateria = '🧭'
    corBadge = 'bg-teal-100 text-teal-800 border-teal-200'
  } else if (
    materiaNorm.includes('geral') ||
    materiaNorm.includes('artes') ||
    materiaNorm.includes('ingles')
  ) {
    componenteSvg = <SvgGeral acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Quadro de Descobertas'
    iconeMateria = '💡'
    corBadge = 'bg-purple-100 text-purple-800 border-purple-200'
  }

  // Dica amigável conforme o momento do aprendizado
  const getDicaAmigavel = () => {
    switch (etapaSocratica) {
      case 'entender':
        return {
          texto: 'Olhe com atenção para o desenho e veja primeiro o Exemplo Resolvido da Lumi!',
          icone: '🔍',
          bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
        }
      case 'contextualizar':
        return {
          texto: 'Isso também acontece no seu dia a dia! Veja como a Lumi resolveu abaixo:',
          icone: '💭',
          bg: 'bg-orange-50/80 border-orange-200 text-orange-900',
        }
      case 'guiar':
        return {
          texto: 'Compare o 1º Passo (Exemplo da Lumi com Resposta) com o 2º Passo (Seu Exemplo)!',
          icone: '✏️',
          bg: 'bg-sky-50/80 border-sky-200 text-sky-900',
        }
      case 'praticar':
        return {
          texto: 'Sua vez no Desafio Espelho: use o modelo resolvido da Lumi para responder!',
          icone: '🧩',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold',
        }
      case 'consolidar':
        return {
          texto: 'Que demais! Você dominou o Exemplo Trabalhado e o Desafio Espelho!',
          icone: '🌟',
          bg: 'bg-purple-50 border-purple-300 text-purple-950 font-semibold',
        }
    }
  }

  const dica = getDicaAmigavel()

  const handleEnviarRespostaEspelho = (e: React.FormEvent) => {
    e.preventDefault()
    if (!respostaDesafio.trim()) return
    setDesafioConcluido(true)
    if (onResponderDesafioEspelho) {
      onResponderDesafioEspelho(respostaDesafio.trim())
    }
  }

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-amber-100/90 flex flex-col gap-3.5">
      {/* Cabeçalho do Quadro */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl">
            {iconeMateria}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
              Quadro Concreto & Visual (Bruner + Sweller)
            </h3>
            <p className="text-[11px] text-slate-500">
              Representação concreta + Exemplo Resolvido da Lumi + Desafio Espelho
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border truncate max-w-[170px] ${corBadge}`}
        >
          {topicoCustomizado || tituloPadrao}
        </span>
      </div>

      {/* Dica da etapa em linguagem de criança */}
      <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${dica.bg}`}>
        <span className="text-xl shrink-0">{dica.icone}</span>
        <span className="leading-snug">{dica.texto}</span>
      </div>

      {/* Renderizador do SVG da matéria */}
      <div
        className={`w-full overflow-hidden rounded-2xl bg-slate-50/40 p-2 sm:p-3 border border-slate-100 transition-all ${
          acessibilidadeReforcada ? 'scale-101 shadow-xs' : ''
        }`}
      >
        {componenteSvg}
      </div>

      {/* BLOCO OBRIGATÓRIO: REPRESENTAÇÃO CONCRETA E VISUAL (BRUNER + SWELLER + VYGOTSKY)
          1º Passo: Exemplo da Lumi (Com Resposta!)
          2º Passo: Seu Exemplo para Responder! */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* 1º Passo: Exemplo da Lumi (Com Resposta!) */}
        <div className="rounded-2xl bg-emerald-50/90 border-2 border-emerald-200 p-3.5 flex flex-col justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wide">
                <span>✅</span>
                <span>{exemploTrabalhado.passo1ExemploLumi.titulo}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Modelo Resolvido
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-emerald-950 leading-snug pt-1">
              {exemploTrabalhado.passo1ExemploLumi.enunciado}
            </p>
            <p className="text-xs text-emerald-900 bg-white/80 rounded-xl p-2.5 border border-emerald-200/80 leading-relaxed">
              {exemploTrabalhado.passo1ExemploLumi.resolucaoPassoAPasso}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs">
            <span className="text-base">🌟</span>
            <span>{exemploTrabalhado.passo1ExemploLumi.respostaCompleta}</span>
          </div>
        </div>

        {/* 2º Passo: Seu Exemplo para Responder! */}
        <div className="rounded-2xl bg-amber-50/90 border-2 border-amber-300 p-3.5 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black uppercase tracking-wide">
                <span>🎯</span>
                <span>{exemploTrabalhado.passo2DesafioCrianca.titulo}</span>
              </span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                Desafio Espelho
              </span>
            </div>

            <p className="text-xs sm:text-sm font-extrabold text-amber-950 leading-snug pt-1">
              {exemploTrabalhado.passo2DesafioCrianca.enunciado}
            </p>

            <p className="text-[11px] font-semibold text-amber-800 bg-white/80 rounded-xl p-2 border border-amber-200">
              {exemploTrabalhado.passo2DesafioCrianca.dicaRapida}
            </p>
          </div>

          <form onSubmit={handleEnviarRespostaEspelho} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={respostaDesafio}
              onChange={(e) => {
                setRespostaDesafio(e.target.value)
                setDesafioConcluido(false)
              }}
              placeholder="Digite sua resposta do 2º Passo..."
              className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
            >
              Responder ✨
            </button>
          </form>

          {desafioConcluido && (
            <div className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-xl px-3 py-1.5">
              🎉 Muito bem! Resposta enviada para a Lumi conferir com você!
            </div>
          )}
        </div>
      </div>

      {/* Rodapé simples com botão de trocar matéria */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <span>🎨</span> Pedagogia Multimodelo: Concreto Visual (Bruner) + Exemplo Resolvido (Sweller)
        </span>
        <button
          type="button"
          onClick={onTrocarTopico}
          className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-all cursor-pointer active:scale-95"
        >
          Mudar Matéria 🔄
        </button>
      </div>
    </div>
  )
}

export default QuadroVisualContainer
