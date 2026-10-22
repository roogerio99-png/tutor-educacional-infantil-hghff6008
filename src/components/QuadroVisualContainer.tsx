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

  // Mapeamento determinístico de SVG por matéria
  let componenteSvg = <SvgCiencias acessibilidadeReforcada={acessibilidadeReforcada} />
  let tituloPadrao = 'Ciências Naturais & Ciclo Vegetal'
  let iconeMateria = '🌱'
  let corBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200'

  if (
    materiaNorm.includes('matematica') ||
    materiaNorm.includes('fração') ||
    materiaNorm.includes('número') ||
    materiaNorm.includes('divis')
  ) {
    componenteSvg = <SvgMatematica acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Matemática: Frações & Reta Numérica'
    iconeMateria = '🔢'
    corBadge = 'bg-amber-100 text-amber-800 border-amber-200'
  } else if (
    materiaNorm.includes('portugues') ||
    materiaNorm.includes('lingua') ||
    materiaNorm.includes('frase') ||
    materiaNorm.includes('silaba')
  ) {
    componenteSvg = <SvgPortugues acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Português: Sílabas & Estrutura de Frases'
    iconeMateria = '📚'
    corBadge = 'bg-rose-100 text-rose-800 border-rose-200'
  } else if (
    materiaNorm.includes('historia') ||
    materiaNorm.includes('tempo') ||
    materiaNorm.includes('seculo')
  ) {
    componenteSvg = <SvgHistoria acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'História: Linha do Tempo & Povos'
    iconeMateria = '📜'
    corBadge = 'bg-orange-100 text-orange-800 border-orange-200'
  } else if (
    materiaNorm.includes('geografia') ||
    materiaNorm.includes('mapa') ||
    materiaNorm.includes('relevo')
  ) {
    componenteSvg = <SvgGeografia acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Geografia: Rosa dos Ventos & Relevo'
    iconeMateria = '🧭'
    corBadge = 'bg-teal-100 text-teal-800 border-teal-200'
  } else if (
    materiaNorm.includes('geral') ||
    materiaNorm.includes('artes') ||
    materiaNorm.includes('ingles')
  ) {
    componenteSvg = <SvgGeral acessibilidadeReforcada={acessibilidadeReforcada} />
    tituloPadrao = 'Mapa Mental Socrático de Descobertas'
    iconeMateria = '💡'
    corBadge = 'bg-purple-100 text-purple-800 border-purple-200'
  }

  // Bloco dinâmico conforme a etapa socrática (Barreira 3 do escopo):
  // na etapa "Praticar" mostra o desafio proposto; na "Consolidar" o resumo visual
  const getBannerEtapa = () => {
    switch (etapaSocratica) {
      case 'entender':
        return {
          texto: 'Investigando onde surgiu a dúvida e quais partes você já domina!',
          icone: '🔍',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
        }
      case 'contextualizar':
        return {
          texto: 'Conectando o conteúdo a coisas do seu cotidiano, brinquedos e jogos.',
          icone: '🌍',
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
        }
      case 'guiar':
        return {
          texto: 'Seguindo pistas graduais no esquema acima. Cada detalhe importa!',
          icone: '🧭',
          bg: 'bg-sky-50 border-sky-200 text-sky-800',
        }
      case 'praticar':
        return {
          texto: 'Desafio Prático Ativo: Aplique o raciocínio no esquema para resolver sozinho(a)!',
          icone: '✏️',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-2 ring-emerald-300',
        }
      case 'consolidar':
        return {
          texto:
            'Resumo de Consolidação: Agora é a sua vez de ensinar o que aprendeu com suas palavras!',
          icone: '🏆',
          bg: 'bg-purple-50 border-purple-300 text-purple-900 font-bold ring-2 ring-purple-300',
        }
    }
  }

  const banner = getBannerEtapa()

  return (
    <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3">
      {/* Cabeçalho do Quadro */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{iconeMateria}</span>
          <div>
            <h3
              className={`font-bold text-slate-800 leading-tight ${
                acessibilidadeReforcada ? 'text-base' : 'text-sm'
              }`}
            >
              Quadro Visual Pedagógico
            </h3>
            <p className="text-[11px] text-slate-500">
              Esquemas SVG determinísticos e seguros por matéria
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border truncate max-w-[170px] ${corBadge}`}
          title={topicoCustomizado || tituloPadrao}
        >
          {topicoCustomizado || tituloPadrao}
        </span>
      </div>

      {/* Banner de apoio à etapa do protocolo */}
      <div
        className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 ${banner.bg}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{banner.icone}</span>
          <span className="leading-snug">{banner.texto}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider shrink-0 opacity-80">
          Etapa: {etapaSocratica}
        </span>
      </div>

      {/* Renderizador do SVG determinístico da matéria */}
      <div
        className={`w-full overflow-hidden transition-all ${
          acessibilidadeReforcada ? 'scale-101 shadow-sm' : ''
        }`}
      >
        {componenteSvg}
      </div>

      {/* Rodapé com controle determinístico de troca */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1 text-[11px]">
          <span>🛡️</span> Visual determinístico (sem alucinações de IA)
        </span>
        <button
          type="button"
          onClick={onTrocarTopico}
          className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
        >
          Alternar Matéria
        </button>
      </div>
    </div>
  )
}

export default QuadroVisualContainer
