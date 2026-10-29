import { useState, useEffect, useRef, useCallback } from 'react'
import {
  limparTextoParaVoz,
  dividirTextoEmSegmentos,
  selecionarMelhorVozPt,
  SegmentoFala,
} from '@/lib/speechUtils'

export interface UseSpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  voiceName?: string | null
  usarVozIa?: boolean
  vozIaNome?:
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
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: unknown) => void
  onSegmentStart?: (segmento: SegmentoFala, indice: number, total: number) => void
}

const STORAGE_VOZ_KEY = 'lumi_voz_nome_preferida'

export function useSpeechSynthesis({
  lang = 'pt-BR',
  rate = 1.05,
  pitch = 1.05,
  voiceName,
  usarVozIa = true,
  vozIaNome = 'Kore',
  onStart,
  onEnd,
  onError,
  onSegmentStart,
}: UseSpeechSynthesisOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isUsingIaVoice, setIsUsingIaVoice] = useState(false)
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [currentSegmentText, setCurrentSegmentText] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const callbacksRef = useRef({ onStart, onEnd, onError, onSegmentStart })
  useEffect(() => {
    callbacksRef.current = { onStart, onEnd, onError, onSegmentStart }
  }, [onStart, onEnd, onError, onSegmentStart])

  const cancelRequestedRef = useRef(false)
  const timerPausaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fila de Streaming Frase a Frase (Lumi Live 2.0 < 220ms)
  const streamingQueueRef = useRef<SegmentoFala[]>([])
  const isStreamingSessionActiveRef = useRef(false)
  const isStreamingPumpRunningRef = useRef(false)
  const hasStartedStreamingCallbackRef = useRef(false)

  // Carrega e atualiza vozes do sistema priorizando pt-BR com localService === true
  const atualizarVozes = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      const lista = window.speechSynthesis.getVoices()
      if (lista && lista.length > 0) {
        setVoices(lista)

        let vozDesejada = voiceName
        if (!vozDesejada) {
          try {
            vozDesejada = localStorage.getItem(STORAGE_VOZ_KEY)
          } catch {
            // ignore
          }
        }

        const melhorVoz = selecionarMelhorVozPt(lista, vozDesejada)
        setSelectedVoice(melhorVoz)
      }
    } catch (err) {
      console.warn('Erro ao carregar vozes do sintetizador:', err)
    }
  }, [voiceName])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      atualizarVozes()

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = atualizarVozes
      }
    } else {
      setIsSupported(false)
    }
  }, [atualizarVozes])

  const limparTimers = useCallback(() => {
    if (timerPausaRef.current) {
      clearTimeout(timerPausaRef.current)
      timerPausaRef.current = null
    }
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current)
      watchdogIntervalRef.current = null
    }
  }, [])

  // Watchdog com speechSynthesis.resume() para evitar congelamento do motor de voz em frases seguidas
  const iniciarWatchdogResume = useCallback(() => {
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current)
    }
    watchdogIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.paused || window.speechSynthesis.speaking) {
            window.speechSynthesis.resume()
          }
        } catch {
          // ignore
        }
      }
    }, 1800)
  }, [])

  const obterMelhorVozAtual = useCallback((): SpeechSynthesisVoice | null => {
    if (selectedVoice && selectedVoice.localService) return selectedVoice
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const lista = window.speechSynthesis.getVoices()
      if (lista && lista.length > 0) {
        let vozSalva: string | null = null
        try {
          vozSalva = localStorage.getItem(STORAGE_VOZ_KEY)
        } catch {
          // ignore
        }
        const melhor = selecionarMelhorVozPt(lista, voiceName || vozSalva)
        if (melhor) {
          setSelectedVoice(melhor)
          return melhor
        }
      }
    }
    return selectedVoice
  }, [selectedVoice, voiceName])

  // Parada total imediata (barge-in < 50ms)
  const stop = useCallback(() => {
    cancelRequestedRef.current = true
    streamingQueueRef.current = []
    isStreamingSessionActiveRef.current = false
    isStreamingPumpRunningRef.current = false
    hasStartedStreamingCallbackRef.current = false
    limparTimers()

    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause()
        audioElementRef.current.currentTime = 0
        audioElementRef.current.src = ''
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
      } catch {
        // ignore
      }
    }

    setIsSpeaking(false)
    setIsUsingIaVoice(false)
    setCurrentText(null)
    setCurrentSegmentText(null)
  }, [limparTimers])

  const warmUp = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0.01
      u.rate = 2
      window.speechSynthesis.speak(u)
    } catch {
      // ignore
    }
  }, [])

  const definirVozPreferida = useCallback(
    (nomeVoz: string) => {
      try {
        localStorage.setItem(STORAGE_VOZ_KEY, nomeVoz)
      } catch {
        // ignore
      }
      const encontrada = voices.find((v) => v.name === nomeVoz)
      if (encontrada) {
        setSelectedVoice(encontrada)
      }
    },
    [voices],
  )

  // ===========================================================================
  // FILA DE STREAMING DE VOZ FRASE A FRASE (< 220ms) — MODO LUMI LIVE 2.0
  // ===========================================================================
  const processarFilaStreaming = useCallback(() => {
    if (cancelRequestedRef.current) {
      isStreamingPumpRunningRef.current = false
      return
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      isStreamingPumpRunningRef.current = false
      setIsSpeaking(false)
      callbacksRef.current.onEnd?.()
      return
    }

    const proximoSegmento = streamingQueueRef.current.shift()

    if (!proximoSegmento) {
      isStreamingPumpRunningRef.current = false
      // Se o stream de texto já terminou e a fila esvaziou, conclui a sessão de fala!
      if (!isStreamingSessionActiveRef.current) {
        limparTimers()
        setIsSpeaking(false)
        setCurrentText(null)
        setCurrentSegmentText(null)
        callbacksRef.current.onEnd?.()
      }
      return
    }

    isStreamingPumpRunningRef.current = true
    setIsSpeaking(true)
    setIsUsingIaVoice(false)

    if (!hasStartedStreamingCallbackRef.current) {
      hasStartedStreamingCallbackRef.current = true
      iniciarWatchdogResume()
      callbacksRef.current.onStart?.()
    }

    const vozAlvo = obterMelhorVozAtual()
    const utterance = new SpeechSynthesisUtterance(proximoSegmento.texto)
    utterance.lang = lang
    utterance.pitch = Math.max(0.75, Math.min(1.35, pitch + proximoSegmento.deltaPitch))
    utterance.rate = Math.max(0.75, Math.min(1.35, rate + proximoSegmento.deltaRate))
    if (vozAlvo) {
      utterance.voice = vozAlvo
    }

    utterance.onstart = () => {
      if (cancelRequestedRef.current) {
        window.speechSynthesis.cancel()
        return
      }
      setCurrentSegmentText(proximoSegmento.texto)
    }

    utterance.onend = () => {
      if (cancelRequestedRef.current) {
        isStreamingPumpRunningRef.current = false
        return
      }
      const pausa = Math.min(45, proximoSegmento.pausaAposMs)
      if (pausa > 0 && streamingQueueRef.current.length > 0) {
        timerPausaRef.current = setTimeout(() => {
          processarFilaStreaming()
        }, pausa)
      } else {
        processarFilaStreaming()
      }
    }

    utterance.onerror = () => {
      if (cancelRequestedRef.current) {
        isStreamingPumpRunningRef.current = false
        return
      }
      processarFilaStreaming()
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      window.speechSynthesis.speak(utterance)
    } catch {
      processarFilaStreaming()
    }
  }, [lang, pitch, rate, limparTimers, iniciarWatchdogResume, obterMelhorVozAtual])

  /**
   * 1. Inicia uma sessão de Streaming de Voz Frase a Frase (< 220ms)
   */
  const startStreamingSession = useCallback(() => {
    stop()
    cancelRequestedRef.current = false
    streamingQueueRef.current = []
    isStreamingSessionActiveRef.current = true
    isStreamingPumpRunningRef.current = false
    hasStartedStreamingCallbackRef.current = false
    iniciarWatchdogResume()
  }, [stop, iniciarWatchdogResume])

  /**
   * 2. Enfileira uma micro-sentença assim que ela fica pronta no stream e inicia a reprodução imediata
   */
  const enqueueStreamingSentence = useCallback(
    (sentence: string) => {
      if (cancelRequestedRef.current) return
      const microSegmentos = dividirTextoEmSegmentos(sentence, rate, pitch)
      if (microSegmentos.length === 0) return

      streamingQueueRef.current.push(...microSegmentos)
      setCurrentText((prev) => (prev ? `${prev} ${sentence}` : sentence))

      if (!isStreamingPumpRunningRef.current) {
        processarFilaStreaming()
      }
    },
    [rate, pitch, processarFilaStreaming],
  )

  /**
   * 3. Finaliza a sessão de streaming enfileirando eventual resíduo final
   */
  const finishStreamingSession = useCallback(
    (remainingSentence?: string) => {
      if (remainingSentence && remainingSentence.trim()) {
        const finais = dividirTextoEmSegmentos(remainingSentence, rate, pitch)
        if (finais.length > 0) {
          streamingQueueRef.current.push(...finais)
        }
      }
      isStreamingSessionActiveRef.current = false

      if (!isStreamingPumpRunningRef.current) {
        if (streamingQueueRef.current.length > 0) {
          processarFilaStreaming()
        } else {
          limparTimers()
          setIsSpeaking(false)
          setCurrentText(null)
          setCurrentSegmentText(null)
          if (hasStartedStreamingCallbackRef.current) {
            callbacksRef.current.onEnd?.()
          }
        }
      }
    },
    [rate, pitch, processarFilaStreaming, limparTimers],
  )

  // Executa a síntese local completa (também com watchdog resume e localService === true)
  const executarSinteseLocal = useCallback(
    (textoLimpo: string) => {
      startStreamingSession()
      enqueueStreamingSentence(textoLimpo)
      finishStreamingSession()
    },
    [startStreamingSession, enqueueStreamingSentence, finishStreamingSession],
  )

  // Reproduz um texto completo (usado no botão "Ouvir Lumi" ou mensagens curtas)
  const speak = useCallback(
    async (rawText: string) => {
      const textoLimpo = limparTextoParaVoz(rawText)
      if (!textoLimpo) return

      // Para garantir resposta instantânea (< 220ms), prioriza a fila de micro-sentenças localService
      let iaHabilitada = usarVozIa
      try {
        const valStorage = localStorage.getItem('lumi_voz_ia_habilitada')
        if (valStorage !== null) {
          iaHabilitada = valStorage === 'true'
        }
      } catch {
        // ignore
      }

      // Verifica se já está em cache instantâneo da IA; se não estiver, usa síntese local imediata (< 220ms)
      if (iaHabilitada) {
        try {
          const { obterAudioLumiUrl, dividirEmFrasesParaAudio } =
            await import('@/services/lumiAudioService')

          const lotes = dividirEmFrasesParaAudio(textoLimpo, 8)
          if (lotes.length > 0) {
            // Dispara com timeout curto de 650ms para nunca atrasar a resposta se o servidor demorar
            const audioUrl = await Promise.race([
              obterAudioLumiUrl({ text: lotes[0], voice: vozIaNome }),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 650)),
            ])

            if (audioUrl && !cancelRequestedRef.current) {
              stop()
              cancelRequestedRef.current = false
              setIsSpeaking(true)
              setIsUsingIaVoice(true)
              setCurrentText(textoLimpo)
              setCurrentSegmentText(lotes[0])
              callbacksRef.current.onStart?.()

              if (!audioElementRef.current) {
                audioElementRef.current = new Audio()
              }
              const audio = audioElementRef.current
              audio.src = audioUrl
              audio.playbackRate = Math.max(0.85, Math.min(1.25, rate || 1.0))
              audio.onended = () => {
                if (cancelRequestedRef.current) return
                setIsSpeaking(false)
                setIsUsingIaVoice(false)
                setCurrentText(null)
                setCurrentSegmentText(null)
                callbacksRef.current.onEnd?.()
              }
              audio.onerror = () => {
                if (!cancelRequestedRef.current) {
                  executarSinteseLocal(textoLimpo)
                }
              }
              await audio.play()
              return
            }
          }
        } catch {
          // Fallback imediato (< 220ms) para fila local
        }
      }

      executarSinteseLocal(textoLimpo)
    },
    [usarVozIa, vozIaNome, rate, stop, executarSinteseLocal],
  )

  useEffect(() => {
    return () => {
      cancelRequestedRef.current = true
      limparTimers()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel()
        } catch {
          // ignore
        }
      }
    }
  }, [limparTimers])

  return {
    isSupported,
    isSpeaking,
    isUsingIaVoice,
    currentText,
    currentSegmentText,
    voices,
    selectedVoice,
    definirVozPreferida,
    warmUp,
    speak,
    stop,
    startStreamingSession,
    enqueueStreamingSentence,
    finishStreamingSession,
  }
}
