import { FaseDesenvolvimentoConfig, FaseDesenvolvimentoId } from '@/types'

export const FASES_DESENVOLVIMENTO: Record<FaseDesenvolvimentoId, FaseDesenvolvimentoConfig> = {
  fase_1: {
    id: 'fase_1',
    titulo: 'O Ninho das Descobertas',
    subtitulo: 'Fase Inicial (Alfabetização & Sensorial)',
    faixaEtaria: '5 a 8 anos',
    idadeMin: 5,
    idadeMax: 8,
    ttsObrigatorio: true,
    estilo: {
      themeClass: 'fase-ninho-descobertas',
      primaryColor: '#F28C28',
      accentColor: '#FDE68A',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
      badgeText: 'text-amber-800 dark:text-amber-200 border-amber-300',
      cardClass:
        'bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-3xl shadow-md transition-all',
      buttonClass:
        'h-14 px-6 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-transform bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500',
      inputClass:
        'h-14 text-lg rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-white/90 dark:bg-amber-950/40 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-900/40',
      fontClass: 'font-sans tracking-wide',
    },
    tomIA: 'Mascote Acolhedor',
    diretrizTom:
      'Analogias lúdicas, incentivo positivo direto, frases muito curtas e leitura em áudio (TTS) de apoio.',
  },
  fase_2: {
    id: 'fase_2',
    titulo: 'A Central de Missões',
    subtitulo: 'Fase Investigativa (Lógica & Exploração)',
    faixaEtaria: '9 a 12 anos',
    idadeMin: 9,
    idadeMax: 12,
    ttsObrigatorio: false,
    estilo: {
      themeClass: 'fase-central-missoes',
      primaryColor: '#8B5CF6',
      accentColor: '#06B6D4',
      badgeBg: 'bg-purple-900/60 dark:bg-purple-950/80',
      badgeText: 'text-purple-300 dark:text-purple-200 border-purple-500/50',
      cardClass:
        'bg-slate-900/90 dark:bg-slate-950/90 border border-purple-500/40 rounded-2xl shadow-xl shadow-purple-950/20 text-slate-100',
      buttonClass:
        'h-12 px-5 rounded-xl font-semibold shadow-lg shadow-purple-600/30 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30',
      inputClass:
        'h-12 rounded-xl border border-purple-500/50 bg-slate-900/80 text-purple-100 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400',
      fontClass: 'font-sans tracking-normal',
    },
    tomIA: 'Copiloto de Videogame Inteligente',
    diretrizTom:
      'Desafia sem infantilizar, espírito de missão espacial, raciocínio lógico, hipóteses e engrenagens.',
  },
  fase_3: {
    id: 'fase_3',
    titulo: 'O Workspace / HUB',
    subtitulo: 'Fase Avançada (Pensamento Crítico & Dialética)',
    faixaEtaria: '13 a 16 anos',
    idadeMin: 13,
    idadeMax: 18,
    ttsObrigatorio: false,
    estilo: {
      themeClass: 'fase-workspace-hub',
      primaryColor: '#3B82F6',
      accentColor: '#64748B',
      badgeBg: 'bg-slate-800 text-slate-200',
      badgeText: 'text-slate-300 border-slate-700',
      cardClass:
        'bg-zinc-900/95 dark:bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 shadow-sm backdrop-blur',
      buttonClass:
        'h-10 px-4 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors',
      inputClass:
        'h-10 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 text-sm',
      fontClass: 'font-sans antialiased text-sm md:text-base',
    },
    tomIA: 'Mentor Intelectual & Consultor',
    diretrizTom:
      'Comunicação direta, analítica e madura. Sem mascotes, debates conceituais de alto nível e filtro neutro socrático.',
  },
}

export function obterFasePorIdade(idade?: number | null): FaseDesenvolvimentoConfig {
  const i = typeof idade === 'number' && !isNaN(idade) ? idade : 8
  if (i >= 13) return FASES_DESENVOLVIMENTO.fase_3
  if (i >= 9) return FASES_DESENVOLVIMENTO.fase_2
  return FASES_DESENVOLVIMENTO.fase_1
}
