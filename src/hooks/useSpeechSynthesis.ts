import { useState, useEffect, useCallback, useRef } from 'react'
import {
  limparTextoParaVoz,
  dividirTextoEmSegmentos,
  dividirParaVozRealAgil,
  selecionarMelhorVozPt,
} from '@/lib/speechUtils'
import {
  obterAudioLumiUrl,
  precarregarAudioLumi,
  getUsarVozIaLumi,
  getVozIaLumiPreferida,
  setUsarVozIaLumi as salvarUsarVozIa,
  setVozIaLumiPreferida as salvarVozIaPreferida,
} from '@/services/lumiAudioService'

export interface UseSpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
  usarVozIa?: boolean
  vozIaNome?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: string) => void
}

const STORAGE_VOICE_KEY = 'lumi_voz_preferida_uri'

export function useSpeechSynthesis({
  rate = 1.03,
  pitch = 1.02,
  volume = 1.0,
  usarVozIa: usarVozIaProp,
  vozIaNome: vozIaNomeProp,
  onStart,
  onEnd,
  onError,
}: UseSpeechSynthesisOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [isUsingIaVoice, setIsUsingIaVoice] = useState(true)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [usarVozIaState, setUsarVozIaState] = useState<boolean>(() =>
    usarVozIaProp !== undefined ? usarVozIaProp : getUsarVozIaLumi(),
  )
  const [vozIaPreferidaState, setVozIaPreferidaState] = useState<string>(
    () => vozIaNomeProp || getVozIaLumiPreferida(),
  )

  const sessionCounterRef = useRef<number>(0)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef<boolean>(false)

  // Fila de Streaming de Voz Real Humana (Lumi Live 2.0)
  const streamingQueueRef = useRef<string[]>([])
  const isStreamingActiveRef = useRef<boolean>(false)
  const isStreamingFinishedRef = useRef<boolean>(false)
  const isPlayingStreamItemRef = useRef<boolean>(false)
  const streamStartedCallbackFiredRef = useRef<boolean>(false)

  const callbacksRef = useRef({ onStart, onEnd, onError })
  useEffect(() => {
    callbacksRef.current = { onStart, onEnd, onError }
  }, [onStart, onEnd, onError])

  useEffect(() => {
    if (usarVozIaProp !== undefined) {
      setUsarVozIaState(usarVozIaProp)
    }
  }, [usarVozIaProp])

  useEffect(() => {
    if (vozIaNomeProp) {
      setVozIaPreferidaState(vozIaNomeProp)
    }
  }, [vozIaNomeProp])

  const limparTimers = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
  }, [])

  const pararAudioHtml = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.onended = null
        audioRef.current.onerror = null
        audioRef.current.onplay = null
        audioRef.current.src = ''
      } catch {
        // ignore
      }
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsSupported(true)

    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices()
        if (!allVoices || allVoices.length === 0) return

        const ptVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith('pt'))
        const available = ptVoices.length > 0 ? ptVoices : allVoices
        setVoices(available)

        let savedName: string | null = null
        try {
          savedName = localStorage.getItem(STORAGE_VOICE_KEY)
        } catch {
          savedName = null
        }

        const bestVoice = selecionarMelhorVozPt(allVoices, savedName)
        if (bestVoice) {
          setSelectedVoice(bestVoice)
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      sessionCounterRef.current += 1
      limparTimers()
      pararAudioHtml()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [limparTimers, pararAudioHtml])

  const selectVoiceByName = useCallback(
    (name: string) => {
      const found = voices.find((v) => v.name === name)
      if (found) {
        setSelectedVoice(found)
        try {
          localStorage.setItem(STORAGE_VOICE_KEY, found.name)
        } catch {
          // ignore
        }
      }
    },
    [voices],
  )

  const setUsarVozIa = useCallback((usar: boolean) => {
    setUsarVozIaState(usar)
    salvarUsarVozIa(usar)
  }, [])

  const setVozIaPreferida = useCallback((voiceId: string) => {
    setVozIaPreferidaState(voiceId)
    salvarVozIaPreferida(voiceId)
  }, [])

  const obterMelhorVozAtual = useCallback((): SpeechSynthesisVoice | null => {
    if (selectedVoice && !/Desktop|eSpeak/i.test(selectedVoice.name)) {
      return selectedVoice
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const atuais = window.speechSynthesis.getVoices()
      if (atuais && atuais.length > 0) {
        let savedName: string | null = null
        try {
          savedName = localStorage.getItem(STORAGE_VOICE_KEY)
        } catch {
          savedName = null
        }
        return selecionarMelhorVozPt(atuais, savedName)
      }
    }
    return selectedVoice
  }, [selectedVoice])

  const warmUp = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!unlockedRef.current && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices()
        window.speechSynthesis.resume()
        unlockedRef.current = true
      } catch {
        // ignore
      }
    }
  }, [])

  /**
   * Reproduz um único bloco de texto usando Voz Humana Real (Gemini Neural TTS)
   * com fallback para a melhor voz neural do navegador apenas se offline/indisponível.
   */
  const reproduzirBlocoUnico = useCallback(
    async (textoBloco: string, sessionId: number): Promise<boolean> => {
      const limpo = limparTextoParaVoz(textoBloco)
      if (!limpo || sessionCounterRef.current !== sessionId) return false

      // 1. Tenta Voz Humana Real (Gemini Neural TTS via /api/lumi/tts)
      if (usarVozIaState) {
        try {
          if (!streamStartedCallbackFiredRef.current) {
            setIsLoadingAudio(true)
          }

          const urlIa = await Promise.race([
            obterAudioLumiUrl({
              text: limpo,
              voice: vozIaPreferidaState,
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 6500)),
          ])

          if (sessionCounterRef.current !== sessionId) {
            setIsLoadingAudio(false)
            return false
          }

          if (urlIa) {
            const tocouComSucesso = await new Promise<boolean>((resolve) => {
              if (sessionCounterRef.current !== sessionId) {
                resolve(false)
                return
              }
              pararAudioHtml()
              const audio = new Audio(urlIa)
              audioRef.current = audio
              audio.volume = Math.max(0, Math.min(1, volume))
              // Mantém o timbre humano natural sem distorcer (velocidade sutil entre 0.94 e 1.12)
              audio.playbackRate = Math.max(0.94, Math.min(1.12, rate))

              audio.onplay = () => {
                if (sessionCounterRef.current !== sessionId) {
                  audio.pause()
                  resolve(false)
                  return
                }
                setIsLoadingAudio(false)
                setIsUsingIaVoice(true)
                setIsSpeaking(true)
                if (!streamStartedCallbackFiredRef.current) {
                  streamStartedCallbackFiredRef.current = true
                  callbacksRef.current.onStart?.()
                }
              }

              audio.onended = () => {
                if (sessionCounterRef.current !== sessionId) {
                  resolve(false)
                  return
                }
                audioRef.current = null
                resolve(true)
              }

              audio.onerror = () => {
                audioRef.current = null
                resolve(false)
              }

              audio.play().catch(() => {
                audioRef.current = null
                resolve(false)
              })
            })

            if (tocouComSucesso) {
              return true
            }
          }
        } catch {
          // Segue para fallback neural do navegador se necessário
        }
      }

      if (sessionCounterRef.current !== sessionId) return false
      setIsLoadingAudio(false)

      // 2. Fallback: Voz Neural do Navegador (ex: Microsoft Francisca Natural / Google português do Brasil)
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return false
      }

      return new Promise<boolean>((resolve) => {
        if (sessionCounterRef.current !== sessionId) {
          resolve(false)
          return
        }

        try {
          window.speechSynthesis.resume()
        } catch {
          // ignore
        }

        const utterance = new SpeechSynthesisUtterance(limpo)
        utterance.lang = 'pt-BR'
        const vozAtiva = obterMelhorVozAtual()
        if (vozAtiva) {
          utterance.voice = vozAtiva
          utterance.lang = vozAtiva.lang || 'pt-BR'
        }
        utterance.rate = Math.max(0.92, Math.min(1.15, rate))
        utterance.pitch = Math.max(0.95, Math.min(1.1, pitch))
        utterance.volume = Math.max(0, Math.min(1, volume))

        utterance.onstart = () => {
          if (sessionCounterRef.current !== sessionId) {
            window.speechSynthesis.cancel()
            resolve(false)
            return
          }
          setIsUsingIaVoice(false)
          setIsSpeaking(true)
          if (!streamStartedCallbackFiredRef.current) {
            streamStartedCallbackFiredRef.current = true
            callbacksRef.current.onStart?.()
          }
        }

        utterance.onend = () => {
          resolve(true)
        }

        utterance.onerror = (event) => {
          if (event.error === 'interrupted' || event.error === 'canceled') {
            resolve(false)
            return
          }
          resolve(false)
        }

        window.speechSynthesis.speak(utterance)
      })
    },
    [
      usarVozIaState,
      vozIaPreferidaState,
      volume,
      rate,
      pitch,
      pararAudioHtml,
      obterMelhorVozAtual,
    ],
  )

  /**
   * Processador ágil da fila de Streaming de Voz Real Humana:
   * - Reproduz a 1ª frase imediatamente com voz humana real.
   * - Enquanto a frase atual toca, agrupa e pré-carrega em segundo plano as frases seguintes
   *   para que toquem em sequência sem pausas robóticas.
   */
  const processarFilaStreaming = useCallback(
    async (sessionId: number) => {
      if (sessionCounterRef.current !== sessionId) return
      if (isPlayingStreamItemRef.current) return

      if (streamingQueueRef.current.length === 0) {
        if (isStreamingFinishedRef.current) {
          isStreamingActiveRef.current = false
          setIsSpeaking(false)
          setIsLoadingAudio(false)
          limparTimers()
          callbacksRef.current.onEnd?.()
        }
        return
      }

      isPlayingStreamItemRef.current = true

      // Se ainda não começamos a falar, pegamos a 1ª frase curta para início imediato.
      // Se já estamos falando e acumularam várias frases na fila, consolidamos em um bloco fluido (até 320 chars)
      // e pré-carregamos o próximo!
      let textoAtual = streamingQueueRef.current.shift()!
      if (streamStartedCallbackFiredRef.current && streamingQueueRef.current.length > 0) {
        while (
          streamingQueueRef.current.length > 0 &&
          (textoAtual + ' ' + streamingQueueRef.current[0]).length <= 320
        ) {
          textoAtual = `${textoAtual} ${streamingQueueRef.current.shift()!}`
        }
      }

      // Pré-carrega o próximo bloco em paralelo enquanto o atual vai tocar!
      if (usarVozIaState && streamingQueueRef.current.length > 0) {
        const proximoPreview = streamingQueueRef.current.slice(0, 2).join(' ')
        precarregarAudioLumi(proximoPreview, vozIaPreferidaState)
      }

      await reproduzirBlocoUnico(textoAtual, sessionId)

      if (sessionCounterRef.current !== sessionId) {
        isPlayingStreamItemRef.current = false
        return
      }

      isPlayingStreamItemRef.current = false
      void processarFilaStreaming(sessionId)
    },
    [limparTimers, reproduzirBlocoUnico, usarVozIaState, vozIaPreferidaState],
  )

  const startStreamingSession = useCallback(() => {
    sessionCounterRef.current += 1
    const currentSession = sessionCounterRef.current
    limparTimers()
    pararAudioHtml()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    streamingQueueRef.current = []
    isStreamingActiveRef.current = true
    isStreamingFinishedRef.current = false
    isPlayingStreamItemRef.current = false
    streamStartedCallbackFiredRef.current = false
    setIsLoadingAudio(false)

    return currentSession
  }, [limparTimers, pararAudioHtml])

  const enqueueStreamingSentence = useCallback(
    (sentence: string) => {
      const limpo = limparTextoParaVoz(sentence)
      if (!limpo) return

      if (!isStreamingActiveRef.current) {
        startStreamingSession()
      }

      streamingQueueRef.current.push(limpo)

      // Se for a 1ª ou 2ª frase entrando na fila, já dispara o pré-carregamento da voz real humana imediatamente!
      if (usarVozIaState && streamingQueueRef.current.length <= 2) {
        precarregarAudioLumi(limpo, vozIaPreferidaState)
      }

      if (!isPlayingStreamItemRef.current) {
        void processarFilaStreaming(sessionCounterRef.current)
      }
    },
    [startStreamingSession, processarFilaStreaming, usarVozIaState, vozIaPreferidaState],
  )

  const finishStreamingSession = useCallback(
    (remainingText?: string) => {
      if (remainingText) {
        const limpo = limparTextoParaVoz(remainingText)
        if (limpo) {
          streamingQueueRef.current.push(limpo)
          if (usarVozIaState) {
            precarregarAudioLumi(limpo, vozIaPreferidaState)
          }
        }
      }
      isStreamingFinishedRef.current = true
      if (!isPlayingStreamItemRef.current) {
        void processarFilaStreaming(sessionCounterRef.current)
      }
    },
    [processarFilaStreaming, usarVozIaState, vozIaPreferidaState],
  )

  /**
   * Fala um texto completo com Voz Humana Real Ágil:
   * Divide em Bloco 1 (1ª frase rápida para resposta em ~500ms) + Blocos seguintes pré-carregados em paralelo!
   */
  const speak = useCallback(
    async (text: string) => {
      const blocos = dividirParaVozRealAgil(text)
      if (blocos.length === 0) return

      sessionCounterRef.current += 1
      const currentSession = sessionCounterRef.current

      limparTimers()
      pararAudioHtml()
      streamingQueueRef.current = [...blocos]
      isStreamingActiveRef.current = true
      isStreamingFinishedRef.current = true
      isPlayingStreamItemRef.current = false
      streamStartedCallbackFiredRef.current = false

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      // Dispara o pré-carregamento paralelo do 1º e do 2º bloco imediatamente!
      if (usarVozIaState) {
        blocos.slice(0, 2).forEach((bloco) => precarregarAudioLumi(bloco, vozIaPreferidaState))
      }

      await processarFilaStreaming(currentSession)
    },
    [limparTimers, pararAudioHtml, usarVozIaState, vozIaPreferidaState, processarFilaStreaming],
  )

  const stop = useCallback(() => {
    sessionCounterRef.current += 1
    limparTimers()
    pararAudioHtml()
    streamingQueueRef.current = []
    isStreamingActiveRef.current = false
    isStreamingFinishedRef.current = true
    isPlayingStreamItemRef.current = false
    streamStartedCallbackFiredRef.current = false
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsLoadingAudio(false)
  }, [limparTimers, pararAudioHtml])

  return {
    isSupported,
    isSpeaking,
    isLoadingAudio,
    isUsingIaVoice,
    usarVozIa: usarVozIaState,
    setUsarVozIa,
    vozIaPreferida: vozIaPreferidaState,
    setVozIaPreferida,
    voices,
    selectedVoice,
    selectVoiceByName,
    speak,
    startStreamingSession,
    enqueueStreamingSentence,
    finishStreamingSession,
    stop,
    warmUp,
    dividirTextoEmSegmentos,
  }
}
