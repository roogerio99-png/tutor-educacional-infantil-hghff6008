import { limparTextoParaVoz } from '@/lib/speechUtils'

export interface GerarAudioLumiParams {
  text: string
  voice?: string
}

export interface GerarAudioLumiResponse {
  cached: boolean
  rate_limited?: boolean
  retry_after_ms?: number
  format: string
  voice: string
  model?: string
  audio_base64: string
  audio_url: string | null
}

// Cache em memória no frontend para reprodução instantânea (0ms) de frases já geradas
const audioCache = new Map<string, string>()
// Deduplicação de requisições em andamento para que o prefetch paralelo compartilhe a mesma Promise
const inFlightRequests = new Map<string, Promise<string | null>>()

const STORAGE_VOZ_IA_KEY = 'lumi_voz_ia_preferida'
const STORAGE_USAR_VOZ_IA_KEY = 'lumi_usar_voz_ia'

export interface OpcaoVozIaLumi {
  id: string
  nome: string
  descricao: string
}

export const VOZES_IA_LUMI: OpcaoVozIaLumi[] = [
  {
    id: 'Kore',
    nome: 'Kore (Voz Humana Acolhedora)',
    descricao: 'Voz feminina calorosa, carinhosa e natural (Recomendada)',
  },
  {
    id: 'Zephyr',
    nome: 'Zephyr (Voz Humana Suave)',
    descricao: 'Voz feminina serena, paciente e cristalina',
  },
  {
    id: 'Puck',
    nome: 'Puck (Voz Humana Animada)',
    descricao: 'Voz jovem, divertida, energética e curiosa',
  },
  {
    id: 'Fenrir',
    nome: 'Fenrir (Voz Humana Calma)',
    descricao: 'Voz tranquila e segura para foco profundo',
  },
  {
    id: 'Charon',
    nome: 'Charon (Voz Humana Narradora)',
    descricao: 'Cadência expressiva de contação de histórias',
  },
]

const MAPA_VOZES_LEGADAS: Record<string, string> = {
  nova: 'Kore',
  coral: 'Kore',
  shimmer: 'Kore',
  alloy: 'Zephyr',
  sage: 'Zephyr',
  fable: 'Puck',
  verse: 'Puck',
  onyx: 'Fenrir',
  echo: 'Charon',
}

export function getVozIaLumiPreferida(): string {
  try {
    const salva = localStorage.getItem(STORAGE_VOZ_IA_KEY)
    if (!salva) return 'Kore'
    if (MAPA_VOZES_LEGADAS[salva]) {
      const migrada = MAPA_VOZES_LEGADAS[salva]
      localStorage.setItem(STORAGE_VOZ_IA_KEY, migrada)
      return migrada
    }
    if (VOZES_IA_LUMI.some((v) => v.id === salva)) {
      return salva
    }
    return 'Kore'
  } catch {
    return 'Kore'
  }
}

export function setVozIaLumiPreferida(voiceId: string): void {
  try {
    const resolved = MAPA_VOZES_LEGADAS[voiceId] || voiceId
    localStorage.setItem(STORAGE_VOZ_IA_KEY, resolved)
  } catch {
    // ignore
  }
}

export function getUsarVozIaLumi(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_USAR_VOZ_IA_KEY)
    return val === null ? true : val === 'true'
  } catch {
    return true
  }
}

export function setUsarVozIaLumi(usar: boolean): void {
  try {
    localStorage.setItem(STORAGE_USAR_VOZ_IA_KEY, String(usar))
  } catch {
    // ignore
  }
}

export const isVozIaLumiHabilitada = getUsarVozIaLumi
export const setVozIaLumiHabilitada = setUsarVozIaLumi

function normalizarUrlAudio(rawBase64OrUrl: string, format = 'wav'): string {
  if (
    rawBase64OrUrl.startsWith('data:') ||
    rawBase64OrUrl.startsWith('http') ||
    rawBase64OrUrl.startsWith('blob:')
  ) {
    return rawBase64OrUrl
  }
  const mime = format === 'wav' ? 'audio/wav' : 'audio/mpeg'
  return `data:${mime};base64,${rawBase64OrUrl}`
}

/**
 * Solicita a síntese de voz humana real da Lumi diretamente na rota Express (/api/lumi/tts)
 * com cache em memória e deduplicação de chamadas paralelas.
 */
export async function obterAudioLumiUrl(params: GerarAudioLumiParams): Promise<string | null> {
  const textoLimpo = limparTextoParaVoz(params.text)
  if (!textoLimpo) return null

  const rawVoice = params.voice || getVozIaLumiPreferida()
  const voice = MAPA_VOZES_LEGADAS[rawVoice] || rawVoice
  const cacheKey = `${voice}:${textoLimpo.toLowerCase()}`

  const cached = audioCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const emAndamento = inFlightRequests.get(cacheKey)
  if (emAndamento) {
    return emAndamento
  }

  const requestPromise = (async (): Promise<string | null> => {
    try {
      const nativeFetch =
        typeof window !== 'undefined' && (window as any).__lumiNativeFetch
          ? (window as any).__lumiNativeFetch
          : fetch

      const response = await nativeFetch('/api/lumi/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textoLimpo,
          voice,
        }),
      })

      if (!response.ok) return null
      const res: GerarAudioLumiResponse = await response.json()

      if (res?.audio_base64) {
        const dataUri = normalizarUrlAudio(res.audio_base64, res.format || 'wav')
        if (audioCache.size > 80) {
          const firstKey = audioCache.keys().next().value
          if (firstKey) audioCache.delete(firstKey)
        }
        audioCache.set(cacheKey, dataUri)
        return dataUri
      }

      if (res?.audio_url) {
        audioCache.set(cacheKey, res.audio_url)
        return res.audio_url
      }

      return null
    } catch {
      return null
    } finally {
      inFlightRequests.delete(cacheKey)
    }
  })()

  inFlightRequests.set(cacheKey, requestPromise)
  return requestPromise
}

/**
 * Pré-carrega o áudio humano real em segundo plano para que a próxima frase toque com latência 0ms.
 */
export function precarregarAudioLumi(text: string, voice?: string): void {
  const limpo = limparTextoParaVoz(text)
  if (!limpo) return
  void obterAudioLumiUrl({ text: limpo, voice })
}
