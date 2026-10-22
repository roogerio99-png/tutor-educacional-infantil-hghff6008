import React from 'react'
import type { EtapaSocratica } from '@/types'
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
}

export const QuadroVisualContainer: React.FC<QuadroVisualContainerProps> = ({
  materia,
  etapaSocratica,
  acessibilidade,
  topicoCustomizado,
  onTrocarTopico,
}) => {
  const acessibilidadeReforcada =
    (acessibilidade || '').toLowerCase().includes('apoio visual') ||
    (acessibilidade || '').toLowerCase().includes('fonte grande')

  const materiaNorm = (materia || '').toLowerCase()

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
          texto: 'Olhe com atenção para o desenho: o que você já reconhece aí?',
          icone: '🔍',
          bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
        }
      case 'contextualizar':
        return {
          texto: 'Isso também acontece no seu dia a dia! Consegue lembrar de onde?',
          icone: '💭',
          bg: 'bg-orange-50/80 border-orange-200 text-orange-900',
        }
      case 'guiar':
        return {
          texto: 'Siga as pistas do desenho com calma, um pedacinho por vez!',
          icone: '✏️',
          bg: 'bg-sky-50/80 border-sky-200 text-sky-900',
        }
      case 'praticar':
        return {
          texto: 'Desafio divertido: tente usar as pistas do desenho para resolver!',
          icone: '🧩',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold',
        }
      case 'consolidar':
        return {
          texto: 'Que demais! Agora conte para a Lumi o que esse desenho te ensinou!',
          icone: '🌟',
          bg: 'bg-purple-50 border-purple-300 text-purple-950 font-semibold',
        }
    }
  }

  const dica = getDicaAmigavel()

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-amber-100/90 flex flex-col gap-3">
      {/* Cabeçalho do Quadro */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl">
            {iconeMateria}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
              Quadro de Desenhos & Pistas
            </h3>
            <p className="text-[11px] text-slate-500">Desenhos para ajudar a entender a matéria</p>
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

      {/* Rodapé simples com botão de trocar matéria */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <span>🎨</span> Feito para você aprender visualmente
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
