// Utilidades para limpeza de texto antes de síntese de voz (TTS)
// Remove cartões técnicos, markdown, emojis em excesso ou metadados da Lumi

export function limparTextoParaVoz(texto: string): string {
  if (!texto) return ''

  let limpo = texto

  // Remove metadados técnicos socráticos ([[ETAPA: ... | MATERIA: ...]]) para não serem falados
  limpo = limpo.replace(/\[\[ETAPA:[^\]]*\]\]/gi, '')
  limpo = limpo.replace(/\[\[[^\]]*\]\]/g, '')

  // Remove blocos de código markdown ```...```
  limpo = limpo.replace(/```[\s\S]*?```/g, '')

  // Remove código inline `...`
  limpo = limpo.replace(/`([^`]+)`/g, '$1')

  // Remove tags markdown de cabeçalhos (# Titulo), negritos (**texto** ou *texto*)
  limpo = limpo.replace(/#{1,6}\s+/g, '')
  limpo = limpo.replace(/\*\*([^*]+)\*\*/g, '$1')
  limpo = limpo.replace(/\*([^*]+)\*/g, '$1')
  limpo = limpo.replace(/__([^_]+)__/g, '$1')
  limpo = limpo.replace(/_([^_]+)_/g, '$1')
  limpo = limpo.replace(/~~([^~]+)~~/g, '$1')

  // Remove links markdown [texto](url)
  limpo = limpo.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove marcações de listas -, *, +, números no início de linha
  limpo = limpo.replace(/^\s*[-*+]\s+/gm, '')
  limpo = limpo.replace(/^\s*\d+\.\s+/gm, '')

  // Substitui emojis mais comuns por pausas naturais, preservando pontuação
  limpo = limpo.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')

  // Remove quebras de linha excessivas e espaços múltiplos
  limpo = limpo.replace(/\n+/g, ' ')
  limpo = limpo.replace(/\s{2,}/g, ' ')

  return limpo.trim()
}

/**
 * Segmento de fala com prosódia ajustada dinamicamente
 */
export interface SegmentoFala {
  texto: string
  tipo: 'abertura' | 'pergunta' | 'exclamacao' | 'padrao'
  deltaPitch: number
  deltaRate: number
  pausaAposMs: number
}

// Palavras/expressões típicas de abertura afetuosa e elogio infantil
const REGEX_ABERTURA =
  /^(olá|ola|oi|oba|uau|parabéns|parabens|muito bem|que legal|que demais|adorei|ótimo|otimo|maravilha|boa|certinho|olha só|olha so|vamos lá|vamos la)\b/i

const REGEX_ELOGIO =
  /\b(parabéns|parabens|muito bem|arrasou|mandou bem|excelente|que legal|uau|sensacional|certíssimo|certissimo|incrível|incrivel|orgulho)\b/i

/**
 * Divide o texto limpo em segmentos oracionais naturais com prosódia calibrada.
 * Permite musicalidade e entonação viva (pitch/rate dinâmico) dentro da Web Speech API.
 */
export function dividirTextoEmSegmentos(
  texto: string,
  baseRate = 1.05,
  basePitch = 1.05,
): SegmentoFala[] {
  const limpo = limparTextoParaVoz(texto)
  if (!limpo) return []

  // Divide por pontuação delimitadora de frases (. ! ? ; e quebras) mantendo o pontuador
  // Exemplo: "Olá, Bia! Você sabia disso? Vamos testar." -> ["Olá, Bia!", "Você sabia disso?", "Vamos testar."]
  const regexFrases = /[^.!?;\n]+[.!?;\n]*/g
  const matches = limpo.match(regexFrases) || [limpo]

  const partesBrutas: string[] = []
  for (const match of matches) {
    const trimmed = match.trim()
    if (!trimmed) continue

    // Se uma frase for muito longa (> 140 caracteres), subdivide em vírgulas para evitar travamentos do Web Speech API
    if (trimmed.length > 140 && /[,:]/.test(trimmed)) {
      const subpartes = trimmed.split(/([,:]\s+)/)
      let buffer = ''
      for (const sp of subpartes) {
        if (!sp) continue
        buffer += sp
        if (buffer.length >= 70 || buffer.endsWith(',') || buffer.endsWith(':')) {
          if (buffer.trim()) partesBrutas.push(buffer.trim())
          buffer = ''
        }
      }
      if (buffer.trim()) partesBrutas.push(buffer.trim())
    } else {
      partesBrutas.push(trimmed)
    }
  }

  if (partesBrutas.length === 0) return []

  return partesBrutas.map((frase, idx) => {
    const isPrimeira = idx === 0
    const terminaComPergunta = /\?\s*$/.test(frase)
    const terminaComExclamacao = /!\s*$/.test(frase)
    const ehAbertura = isPrimeira && (REGEX_ABERTURA.test(frase) || frase.length < 35)
    const ehElogio = REGEX_ELOGIO.test(frase)

    let tipo: SegmentoFala['tipo'] = 'padrao'
    let deltaPitch = 0
    let deltaRate = 0
    let pausaAposMs = 80 // Pequena respiração natural entre frases

    if (ehAbertura || ehElogio) {
      tipo = 'abertura'
      // Frase de abertura ou celebração: tom mais alegre e entusiasmado (+0.08 a +0.12 pitch)
      deltaPitch = 0.1
      deltaRate = 0.02
      pausaAposMs = 120
    } else if (terminaComPergunta) {
      tipo = 'pergunta'
      // Pergunta socrática: pitch ascendente (+0.09) convidando a criança a pensar
      deltaPitch = 0.08
      deltaRate = -0.02 // Levemente mais pausado para dar clareza à dúvida
      pausaAposMs = 150
    } else if (terminaComExclamacao) {
      tipo = 'exclamacao'
      // Exclamação vibrante: tom animado e entusiasmado
      deltaPitch = 0.08
      deltaRate = 0.04
      pausaAposMs = 100
    } else {
      // Corpo explicativo da Lumi: cadência calma e acolhedora
      deltaPitch = 0
      deltaRate = 0
      pausaAposMs = 90
    }

    return {
      texto: frase,
      tipo,
      deltaPitch,
      deltaRate,
      pausaAposMs,
    }
  })
}

/**
 * Lista prioritária de vozes pt-BR conhecidas por alta qualidade e naturalidade
 */
export const PADROES_VOZES_NATURAIS_PT = [
  // Vozes neurais / online da Microsoft (Edge / Windows 11)
  /Francisca.*Natural/i,
  /Ana.*Natural/i,
  /Antonio.*Natural/i,
  /Natural.*pt-BR/i,
  /pt-BR.*Natural/i,
  /Neural.*pt-BR/i,
  /pt-BR.*Neural/i,
  /Microsoft Francisca/i,
  /Microsoft Ana/i,
  // Google TTS pt-BR (Chrome Android/Desktop)
  /Google português do Brasil/i,
  /Google.*pt-BR/i,
  // Vozes iOS / macOS de alta qualidade
  /Luciana/i,
  /Letícia|Leticia/i,
  /Maria/i,
  /Heloisa/i,
  /Vitória|Vitoria/i,
  /Enhanced/i,
  /Premium/i,
]

/**
 * Seleciona a melhor voz pt-BR disponível com base em qualidade neural/natural e preferências do usuário
 */
export function selecionarMelhorVozPt(
  vozes: SpeechSynthesisVoice[],
  vozPreferidaNome?: string | null,
): SpeechSynthesisVoice | null {
  if (!vozes || vozes.length === 0) return null

  // 1. Se o usuário salvou uma voz específica e ela existe
  if (vozPreferidaNome) {
    const encontrada = vozes.find((v) => v.name === vozPreferidaNome)
    if (encontrada) return encontrada
  }

  // 2. Filtra vozes brasileiras
  const vozesPtBr = vozes.filter((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR')
  const vozesQualquerPt =
    vozesPtBr.length > 0 ? vozesPtBr : vozes.filter((v) => v.lang.startsWith('pt'))

  if (vozesQualquerPt.length === 0) {
    // Fallback absoluto se nenhuma pt existir
    return vozes[0] || null
  }

  // 3. Procura na ordem de prioridade de vozes naturais/neurais
  for (const regex of PADROES_VOZES_NATURAIS_PT) {
    const vozMatch = vozesQualquerPt.find((v) => regex.test(v.name))
    if (vozMatch) return vozMatch
  }

  // 4. Procura por voz feminina ou pt-BR local
  const vozFeminina = vozesQualquerPt.find((v) => /female|mulher|feminino/i.test(v.name))
  if (vozFeminina) return vozFeminina

  // 5. Primeira voz pt-BR encontrada
  return vozesPtBr[0] || vozesQualquerPt[0] || null
}
