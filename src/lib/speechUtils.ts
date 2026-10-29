// Utilidades para limpeza de texto e fatiamento ágil de síntese de voz (TTS)
// Prioriza voz humana real neural (Gemini TTS) e vozes neurais naturais pt-BR

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

  // Substitui símbolos matemáticos isolados por leitura natural em português
  limpo = limpo.replace(/(\d+)\s*\+\s*(\d+)/g, '$1 mais $2')
  limpo = limpo.replace(/(\d+)\s*=\s*(\d+)/g, '$1 igual a $2')
  limpo = limpo.replace(/(\d+)\s*×\s*(\d+)/g, '$1 vezes $2')
  limpo = limpo.replace(/(\d+)\s*÷\s*(\d+)/g, '$1 dividido por $2')

  // Remove emojis para que o sintetizador não leia descrições técnicas de ícones
  limpo = limpo.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
    ' ',
  )

  // Remove quebras de linha excessivas e espaços múltiplos
  limpo = limpo.replace(/\n+/g, ' ')
  limpo = limpo.replace(/\s{2,}/g, ' ')

  return limpo.trim()
}

/**
 * Divide um texto em blocos ágeis para Voz Real Humana (Gemini Neural TTS):
 * - Bloco 1: A primeira frase curta (30 a 130 caracteres) para disparo imediato (< 550ms).
 * - Bloco 2+: O restante agrupado em parágrafos fluidos (até 320 caracteres) para pré-carregamento paralelo
 *   com prosódia humana contínua e natural.
 */
export function dividirParaVozRealAgil(texto: string): string[] {
  const limpo = limparTextoParaVoz(texto)
  if (!limpo) return []

  if (limpo.length <= 140) {
    return [limpo]
  }

  const frases = (limpo.match(/[^.!?;\n]+[.!?;\n]*/g) || [limpo])
    .map((f) => f.trim())
    .filter(Boolean)

  if (frases.length <= 1) {
    return [limpo]
  }

  const blocos: string[] = []
  // 1º bloco curto para início ultra-rápido da voz real
  let primeiroBloco = frases[0]
  let idx = 1
  if (primeiroBloco.length < 32 && frases.length > 1) {
    primeiroBloco = `${primeiroBloco} ${frases[1]}`.trim()
    idx = 2
  }
  blocos.push(primeiroBloco)

  // Agrupa o restante em blocos de até ~340 caracteres para manter entonação humana fluida
  let acumulador = ''
  for (let i = idx; i < frases.length; i++) {
    const f = frases[i]
    if (!acumulador) {
      acumulador = f
    } else if ((acumulador + ' ' + f).length <= 340) {
      acumulador = `${acumulador} ${f}`
    } else {
      blocos.push(acumulador)
      acumulador = f
    }
  }
  if (acumulador) {
    blocos.push(acumulador)
  }

  return blocos
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
 * Fatiador em tempo real para Lumi Live 2.0:
 * Extrai sentenças prontas do buffer de streaming assim que encontra pontuação final (. ! ? \n),
 * permitindo iniciar a 1ª frase com voz humana real imediatamente enquanto o restante é pré-carregado.
 */
export function extrairMicroSentencasStream(
  textoAcumulado: string,
  offsetProcessado: number,
): { novasSentencas: string[]; sentencasProntas: string[]; novoOffset: number } {
  if (!textoAcumulado || offsetProcessado >= textoAcumulado.length) {
    return { novasSentencas: [], sentencasProntas: [], novoOffset: offsetProcessado }
  }

  const fatia = textoAcumulado.slice(offsetProcessado)
  const novasSentencas: string[] = []
  let consumidoNaFatia = 0

  // Extrai frases completas terminadas em . ! ? ou quebra de linha com pelo menos 18 caracteres
  const regexSentenca = /([^.!?\n]{14,}[.!?]+(?:\s+|$)|[^\n]{20,}\n+)/g

  let match: RegExpExecArray | null
  while ((match = regexSentenca.exec(fatia)) !== null) {
    if (match.index > consumidoNaFatia) {
      const anterior = limparTextoParaVoz(fatia.slice(consumidoNaFatia, match.index))
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
    sentencasProntas: novasSentencas,
    novoOffset: offsetProcessado + consumidoNaFatia,
  }
}

/**
 * Divide o texto limpo em segmentos oracionais naturais com prosódia calibrada.
 */
export function dividirTextoEmSegmentos(
  texto: string,
  _baseRate = 1.02,
  _basePitch = 1.02,
): SegmentoFala[] {
  const limpo = limparTextoParaVoz(texto)
  if (!limpo) return []

  const regexFrases = /[^.!?;\n]+[.!?;\n]*/g
  const matches = limpo.match(regexFrases) || [limpo]

  const partesBrutas: string[] = []
  for (const match of matches) {
    const trimmed = match.trim()
    if (trimmed) partesBrutas.push(trimmed)
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
    let pausaAposMs = 45

    if (ehAbertura || ehElogio) {
      tipo = 'abertura'
      deltaPitch = 0.04
      deltaRate = 0.02
      pausaAposMs = 55
    } else if (terminaComPergunta) {
      tipo = 'pergunta'
      deltaPitch = 0.04
      deltaRate = -0.01
      pausaAposMs = 70
    } else if (terminaComExclamacao) {
      tipo = 'exclamacao'
      deltaPitch = 0.04
      deltaRate = 0.02
      pausaAposMs = 50
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
  /Thalita.*Natural/i,
  /Giovanna.*Natural/i,
  /Leila.*Natural/i,
  /Brenda.*Natural/i,
  /Yara.*Natural/i,
  /Google português do Brasil/i,
  /Google.*pt-BR/i,
  /Microsoft Francisca Online/i,
  /Microsoft Thalita Online/i,
  /Natural.*pt-BR/i,
  /pt-BR.*Natural/i,
  /Neural.*pt-BR/i,
  /Luciana/i,
  /Joana/i,
  /Vitória|Vitoria/i,
  /Camila/i,
  /Fernanda/i,
  /Francisca/i,
]

/**
 * Seleciona a voz pt-BR mais humana e natural disponível no navegador
 * (priorizando vozes Neurais / Online / Natural como Microsoft Francisca Natural e Google português do Brasil,
 * evitando vozes Desktop offline robóticas).
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

  // Pontuação de qualidade humana (prioriza vozes Neurais/Naturais/Online sobre Desktop robótico)
  let melhorVoz: SpeechSynthesisVoice | null = null
  let maiorScore = -9999

  for (const v of vozesQualquerPt) {
    let score = 0
    const nome = v.name

    // Altíssima prioridade para vozes Online Natural / Neural / Google
    if (/Natural|Neural|Online|Multilingual/i.test(nome)) score += 350
    if (/Google português do Brasil|Google.*pt-BR/i.test(nome)) score += 310
    if (/Francisca|Thalita|Giovanna|Luciana|Vitória|Vitoria|Camila/i.test(nome)) score += 220

    // Bônus pela ordem da lista de padrões naturais
    const idxPadrao = PADROES_VOZES_NATURAIS_PT.findIndex((regex) => regex.test(nome))
    if (idxPadrao !== -1) {
      score += 200 - idxPadrao * 8
    }

    // Preferência por pt-BR nativo
    if (v.lang.toLowerCase().includes('br')) score += 80

    // Vozes de nuvem/rede nos navegadores modernos são neurais (muito mais humanas)
    if (v.localService === false) score += 90

    // Penaliza vozes antigas SAPI5 Desktop (ex: "Microsoft Maria Desktop") se houver opção melhor
    if (/Desktop|Compact|eSpeak/i.test(nome)) score -= 180

    if (score > maiorScore) {
      maiorScore = score
      melhorVoz = v
    }
  }

  return melhorVoz || vozesPtBr[0] || vozesQualquerPt[0] || null
}
