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
 * Fatiador em tempo real para Lumi Live 2.0 (< 220ms):
 * Extrai micro-sentenças prontas do buffer de streaming assim que encontra pontuação (. ! ? : ; \n)
 * ou cláusulas longas com vírgula (> 48 caracteres), permitindo iniciar a 1ª frase imediatamente.
 */
export function extrairMicroSentencasStream(
  textoAcumulado: string,
  offsetProcessado: number,
): { novasSentencas: string[]; novoOffset: number } {
  if (!textoAcumulado || offsetProcessado >= textoAcumulado.length) {
    return { novasSentencas: [], novoOffset: offsetProcessado }
  }

  const fatia = textoAcumulado.slice(offsetProcessado)
  const novasSentencas: string[] = []
  let consumidoNaFatia = 0

  // Procura delimitadores de frase (. ! ? ; : \n) seguidos de espaço ou fim, ou vírgula após 48+ chars
  const regexMicroSentenca =
    /([^.!?;:\n]{4,}[.!?;:\n]+(?:\s+|$)|[^,]{48,},\s+)/g

  let match: RegExpExecArray | null
  while ((match = regexMicroSentenca.exec(fatia)) !== null) {
    if (match.index > consumidoNaFatia) {
      // Havia texto antes do match atual
      const anterior = fatia.slice(consumidoNaFatia, match.index).trim()
      if (anterior) {
        novasSentencas.push(anterior)
      }
    }
    const sentencaBruta = match[0]
    const limpa = limparTextoParaVoz(sentencaBruta)
    if (limpa) {
      novasSentencas.push(limpa)
    }
    consumidoNaFatia = match.index + sentencaBruta.length
  }

  return {
    novasSentencas,
    novoOffset: offsetProcessado + consumidoNaFatia,
  }
}

/**
 * Divide o texto limpo em segmentos oracionais naturais com prosódia calibrada.
 */
export function dividirTextoEmSegmentos(
  texto: string,
  _baseRate = 1.05,
  _basePitch = 1.05,
): SegmentoFala[] {
  const limpo = limparTextoParaVoz(texto)
  if (!limpo) return []

  const regexFrases = /[^.!?;\n]+[.!?;\n]*/g
  const matches = limpo.match(regexFrases) || [limpo]

  const partesBrutas: string[] = []
  for (const match of matches) {
    const trimmed = match.trim()
    if (!trimmed) continue

    if (trimmed.length > 95 && /[,:]/.test(trimmed)) {
      const subpartes = trimmed.split(/([,:]\s+)/)
      let buffer = ''
      for (const sp of subpartes) {
        if (!sp) continue
        buffer += sp
        if (buffer.length >= 45 || buffer.endsWith(',') || buffer.endsWith(':')) {
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
    let pausaAposMs = 55

    if (ehAbertura || ehElogio) {
      tipo = 'abertura'
      deltaPitch = 0.1
      deltaRate = 0.03
      pausaAposMs = 70
    } else if (terminaComPergunta) {
      tipo = 'pergunta'
      deltaPitch = 0.08
      deltaRate = -0.01
      pausaAposMs = 95
    } else if (terminaComExclamacao) {
      tipo = 'exclamacao'
      deltaPitch = 0.08
      deltaRate = 0.04
      pausaAposMs = 65
    } else {
      deltaPitch = 0
      deltaRate = 0
      pausaAposMs = 55
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

export const PADROES_VOZES_NATURAIS_PT = [
  /Francisca.*Natural/i,
  /Ana.*Natural/i,
  /Luciana/i,
  /Letícia|Leticia/i,
  /Vitória|Vitoria/i,
  /Maria/i,
  /Heloisa/i,
  /Google português do Brasil/i,
  /Google.*pt-BR/i,
  /Natural.*pt-BR/i,
  /pt-BR.*Natural/i,
  /Neural.*pt-BR/i,
  /Microsoft Francisca/i,
  /Microsoft Ana/i,
]

/**
 * Seleciona a melhor voz pt-BR disponível priorizando `localService === true`
 * para latência ultra-baixa (< 220ms) no Lumi Live 2.0.
 */
export function selecionarMelhorVozPt(
  vozes: SpeechSynthesisVoice[],
  vozPreferidaNome?: string | null,
): SpeechSynthesisVoice | null {
  if (!vozes || vozes.length === 0) return null

  if (vozPreferidaNome) {
    const encontrada = vozes.find((v) => v.name === vozPreferidaNome)
    if (encontrada) return encontrada
  }

  const vozesPtBr = vozes.filter(
    (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.toLowerCase() === 'pt-br',
  )
  const vozesQualquerPt =
    vozesPtBr.length > 0 ? vozesPtBr : vozes.filter((v) => v.lang.toLowerCase().startsWith('pt'))

  if (vozesQualquerPt.length === 0) {
    return vozes[0] || null
  }

  // 1. Prioriza vozes pt-BR com localService === true E que batam com padrões naturais/femininos (< 220ms)
  const vozesLocaisPtBr = vozesQualquerPt.filter((v) => v.localService === true)
  if (vozesLocaisPtBr.length > 0) {
    for (const regex of PADROES_VOZES_NATURAIS_PT) {
      const matchLocal = vozesLocaisPtBr.find((v) => regex.test(v.name))
      if (matchLocal) return matchLocal
    }
    const localFeminina = vozesLocaisPtBr.find((v) => /female|mulher|feminino|luciana|maria|francisca|ana/i.test(v.name))
    if (localFeminina) return localFeminina
    return vozesLocaisPtBr[0]
  }

  // 2. Caso o navegador só exponha vozes de rede, escolhe a melhor neural pt-BR
  for (const regex of PADROES_VOZES_NATURAIS_PT) {
    const vozMatch = vozesQualquerPt.find((v) => regex.test(v.name))
    if (vozMatch) return vozMatch
  }

  const vozFeminina = vozesQualquerPt.find((v) => /female|mulher|feminino/i.test(v.name))
  if (vozFeminina) return vozFeminina

  return vozesPtBr[0] || vozesQualquerPt[0] || null
}
