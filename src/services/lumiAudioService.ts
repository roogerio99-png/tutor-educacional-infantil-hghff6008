import pb from '@/lib/pocketbase/client'

export type VozIaNome =
  | 'Kore'
  | 'Zephyr'
  | 'Puck'
  | 'Fenrir'
  | 'Charon'
  | 'nova'
  | 'alloy'
  | 'ash'
  | 'coral'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'sage'
  | 'shimmer'
  | 'verse'

export interface GerarAudioLumiParams {
  text: string
  voice?: VozIaNome
  model?: string
  speed?: number
}

export interface GerarAudioLumiResponse {
  cached: boolean
  format: string
  voice: string
  model: string
  audio_base64?: string
  audio_url?: string | null
}

// Cache em memória na sessão do navegador para velocidade instantânea
const memoryAudioCache = new Map<string, string>()

// Fila e controle de promessas de preload para não disparar requisições duplicadas em voo
const inFlightRequests = new Map<string, Promise<string | null>>()

export const STORAGE_KEY_VOZ_IA_HABILITADA = 'lumi_voz_ia_habilitada'
export const STORAGE_KEY_VOZ_IA_NOME = 'lumi_voz_ia_nome'

/**
 * Obtém o nome da voz real da Lumi (Gemini Live / TTS) salva nas preferências
 */
export function getVozIaLumiPreferida(): 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon' {
  if (typeof window === 'undefined') return 'Kore'
  try {
    const val = localStorage.getItem(STORAGE_KEY_VOZ_IA_NOME)
    if (val === 'Kore' || val === 'Zephyr' || val === 'Puck' || val === 'Fenrir' || val === 'Charon') {
      return val
    }
    return 'Kore'
  } catch {
    return 'Kore'
  }
}

/**
 * Salva o nome da voz real da Lumi (Gemini Live / TTS)
 */
export function setVozIaLumiPreferida(voz: 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon'): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_VOZ_IA_NOME, voz)
  } catch {
    // ignore
  }
}

/**
 * Verifica se a voz verdadeira da Lumi (IA) está ativada nas preferências
 * Default: true (ligado por padrão)
 */
export function isVozIaLumiHabilitada(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const val = localStorage.getItem(STORAGE_KEY_VOZ_IA_HABILITADA)
    if (val === null) return true // Padrão ativado
    return val === 'true'
  } catch {
    return true
  }
}

/**
 * Salva preferência da voz da Lumi (IA ativada/desativada)
 */
export function setVozIaLumiHabilitada(habilitada: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_VOZ_IA_HABILITADA, String(habilitada))
  } catch {
    // ignore
  }
}

/**
 * Limpa metadados e tags técnicas para síntese de áudio limpa
 */
export function limparTextoParaTTS(rawText: string): string {
  if (!rawText) return ''
  return rawText
    .replace(/\[\[ETAPA:[^\]]+\]\]/gi, '')
    .replace(/\[TELEFONE_REMOVIDO\]/g, '')
    .replace(/\[DOCUMENTO_REMOVIDO\]/g, '')
    .replace(/\[EMAIL_REMOVIDO\]/g, '')
    .replace(/\[ENDERECO_REMOVIDO\]/g, '')
    .replace(/\[ESCOLA_REMOVIDA\]/g, 'sua escola')
    .replace(/[*_#`~>]/g, '') // remove markdown decorativo
    .trim()
}

/**
 * Divide uma resposta maior em frases curtas para que o preload e reprodução
 * possam começar logo na primeira frase enquanto as seguintes carregam.
 */
export function dividirEmFrasesParaAudio(texto: string, maxPorLote = 2): string[] {
  const limpo = limparTextoParaTTS(texto)
  if (!limpo) return []
  const matches = limpo.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g) || [limpo]
  const frases = matches.map((f) => f.trim()).filter((f) => f.length > 0)

  if (frases.length <= maxPorLote) return [limpo]

  const lotes: string[] = []
  let acumulado = ''
  let count = 0

  for (const f of frases) {
    if (count < maxPorLote) {
      acumulado = acumulado ? `${acumulado} ${f}` : f
      count++
    } else {
      if (acumulado) lotes.push(acumulado)
      acumulado = f
      count = 1
    }
  }
  if (acumulado) lotes.push(acumulado)

  return lotes
}

function getCacheKey(text: string, voice = 'Kore', model = 'gemini-3.8-flash-lite-tts'): string {
  return `${voice}_${model}_${text.trim().toLowerCase()}`
}

/**
 * Obtém URL reproduzível de áudio (WAV base64 data URI) via Gemini 3.8 TTS no servidor
 */
export async function obterAudioLumiUrl(params: GerarAudioLumiParams): Promise<string | null> {
  const textClean = limparTextoParaTTS(params.text)
  if (!textClean) return null

  const voice =
    params.voice && params.voice !== 'nova' ? params.voice : getVozIaLumiPreferida()
  const model = params.model || 'gemini-3.8-flash-lite-tts'
  const speed = params.speed || 1.05
  const key = getCacheKey(textClean, voice, model)

  // 1. Verifica cache em memória
  if (memoryAudioCache.has(key)) {
    return memoryAudioCache.get(key) || null
  }

  // 2. Se já existe uma requisição em andamento para o mesmo texto, reaproveita a Promise
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!
  }

  const reqPromise = (async () => {
    try {
      const res = await pb.send<GerarAudioLumiResponse>('/backend/v1/lumi/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: textClean,
          voice,
          model,
          speed,
        }),
      })

      const finalUrl = res.audio_base64 || res.audio_url || null
      if (finalUrl) {
        memoryAudioCache.set(key, finalUrl)
        return finalUrl
      }
      return null
    } catch (err) {
      console.warn('[LUMI TTS SERVICE] Falha ao obter áudio do servidor:', err)
      return null
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, reqPromise)
  return reqPromise
}

/**
 * Inicia preload proativo de um texto (ou frases) sem tocar imediatamente
 */
export function preloadAudioLumi(text: string, voice?: VozIaNome): void {
  const lotes = dividirEmFrasesParaAudio(text)
  const vozAlvo = voice && voice !== 'nova' ? voice : getVozIaLumiPreferida()
  lotes.forEach((lote) => {
    obterAudioLumiUrl({ text: lote, voice: vozAlvo }).catch(() => {})
  })
}
