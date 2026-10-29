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
  rate = 1.05, // Taxa natural de adulto falando com criança (~1.0–1.15)
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

  // Referência ao player de áudio HTML5 para a voz da IA
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const callbacksRef = useRef({ onStart, onEnd, onError, onSegmentStart })
  useEffect(() => {
    callbacksRef.current = { onStart, onEnd, onError, onSegmentStart }
  }, [onStart, onEnd, onError, onSegmentStart])

  // Controle de fila de execução de segmentos para prosódia fluida
  const cancelRequestedRef = useRef(false)
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([])
  const timerPausaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Carrega e atualiza vozes do sistema
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

  // Limpa timer de respiro e keep-alive
  const limparTimers = useCallback(() => {
    if (timerPausaRef.current) {
      clearTimeout(timerPausaRef.current)
      timerPausaRef.current = null
    }
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current)
      keepAliveIntervalRef.current = null
    }
  }, [])

  // Parada total imediata (barge-in < 50ms) de qualquer som (áudio IA ou síntese local)
  const stop = useCallback(() => {
    cancelRequestedRef.current = true
    utteranceQueueRef.current = []
    activeUtteranceRef.current = null
    limparTimers()

    // 1. Pausa e reseta elemento de áudio da IA imediatamente
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause()
        audioElementRef.current.currentTime = 0
        audioElementRef.current.src = ''
      } catch {
        // ignore
      }
    }

    // 2. Cancela Web Speech local
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

  // Warm-up do sintetizador para contornar restrições de autoplay e inicialização atrasada (ex: iOS Safari)
  const warmUp = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      // Dispara uma utterance inaudível e rápida apenas para liberar o motor de áudio
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0.01
      u.rate = 2
      window.speechSynthesis.speak(u)
    } catch {
      // ignore
    }
  }, [])

  // Troca a voz preferida e salva localmente
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

  // Executa a síntese local (Web Speech API) - usado também como fallback automático
  const executarSinteseLocal = useCallback(
    (textoLimpo: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeaking(false)
        callbacksRef.current.onEnd?.()
        return
      }

      const segmentos = dividirTextoEmSegmentos(textoLimpo, rate, pitch)
      if (segmentos.length === 0) {
        setIsSpeaking(false)
        callbacksRef.current.onEnd?.()
        return
      }

      const vozesAtuais = window.speechSynthesis.getVoices()
      let vozAlvo = selectedVoice
      if (!vozAlvo && vozesAtuais.length > 0) {
        let vozSalva: string | null = null
        try {
          vozSalva = localStorage.getItem(STORAGE_VOZ_KEY)
        } catch {
          // ignore
        }
        vozAlvo = selecionarMelhorVozPt(vozesAtuais, voiceName || vozSalva)
        if (vozAlvo) setSelectedVoice(vozAlvo)
      }

      cancelRequestedRef.current = false
      setIsSpeaking(true)
      setIsUsingIaVoice(false)
      setCurrentText(textoLimpo)

      let indiceAtual = 0
      callbacksRef.current.onStart?.()

      keepAliveIntervalRef.current = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause()
            window.speechSynthesis.resume()
          }
        }
      }, 10000)

      const tocarProximoSegmento = () => {
        if (cancelRequestedRef.current) return

        if (indiceAtual >= segmentos.length) {
          limparTimers()
          setIsSpeaking(false)
          setCurrentText(null)
          setCurrentSegmentText(null)
          callbacksRef.current.onEnd?.()
          return
        }

        const seg = segmentos[indiceAtual]
        const utterance = new SpeechSynthesisUtterance(seg.texto)
        activeUtteranceRef.current = utterance

        utterance.lang = lang
        const pitchFinal = Math.max(0.7, Math.min(1.4, pitch + seg.deltaPitch))
        const rateFinal = Math.max(0.7, Math.min(1.4, rate + seg.deltaRate))
        utterance.pitch = pitchFinal
        utterance.rate = rateFinal

        if (vozAlvo) {
          utterance.voice = vozAlvo
        }

        utterance.onstart = () => {
          if (cancelRequestedRef.current) {
            window.speechSynthesis.cancel()
            return
          }
          setCurrentSegmentText(seg.texto)
          callbacksRef.current.onSegmentStart?.(seg, indiceAtual, segmentos.length)
        }

        utterance.onend = () => {
          if (cancelRequestedRef.current) return

          indiceAtual++
          if (indiceAtual < segmentos.length) {
            timerPausaRef.current = setTimeout(() => {
              tocarProximoSegmento()
            }, seg.pausaAposMs)
          } else {
            tocarProximoSegmento()
          }
        }

        utterance.onerror = (e) => {
          const errorType = (e as unknown as { error?: string })?.error
          if (
            errorType === 'canceled' ||
            errorType === 'interrupted' ||
            cancelRequestedRef.current
          ) {
            return
          }
          console.warn('Erro em segmento da voz Lumi local:', e)
          indiceAtual++
          if (indiceAtual < segmentos.length) {
            tocarProximoSegmento()
          } else {
            limparTimers()
            setIsSpeaking(false)
            setCurrentText(null)
            setCurrentSegmentText(null)
            callbacksRef.current.onError?.(e)
          }
        }

        try {
          window.speechSynthesis.speak(utterance)
        } catch (err) {
          console.warn('Falha ao disparar utterance local:', err)
          limparTimers()
          setIsSpeaking(false)
          setCurrentText(null)
          setCurrentSegmentText(null)
          callbacksRef.current.onError?.(err)
        }
      }

      tocarProximoSegmento()
    },
    [lang, rate, pitch, selectedVoice, voiceName, limparTimers],
  )

  // Reproduz uma sequência de áudio (OpenAI TTS preferencial com fallback transparente para local)
  const speak = useCallback(
    async (rawText: string) => {
      const textoLimpo = limparTextoParaVoz(rawText)
      if (!textoLimpo) return

      // Interrompe imediatamente qualquer reprodução em andamento
      cancelRequestedRef.current = true
      limparTimers()

      if (audioElementRef.current) {
        try {
          audioElementRef.current.pause()
          audioElementRef.current.currentTime = 0
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

      cancelRequestedRef.current = false

      // Verifica se a Voz IA está habilitada globalmente e nas opções
      let iaHabilitada = usarVozIa
      try {
        const valStorage = localStorage.getItem('lumi_voz_ia_habilitada')
        if (valStorage !== null) {
          iaHabilitada = valStorage === 'true'
        }
      } catch {
        // ignore
      }

      if (iaHabilitada) {
        try {
          // Import dinâmico leve para evitar ciclo e permitir tree-shake
          const { obterAudioLumiUrl, dividirEmFrasesParaAudio } =
            await import('@/services/lumiAudioService')

          const lotes = dividirEmFrasesParaAudio(textoLimpo, 2)
          if (lotes.length > 0) {
            setIsSpeaking(true)
            setIsUsingIaVoice(true)
            setCurrentText(textoLimpo)
            callbacksRef.current.onStart?.()

            let loteIdx = 0

            const tocarProximoLoteIa = async () => {
              if (cancelRequestedRef.current) return

              if (loteIdx >= lotes.length) {
                setIsSpeaking(false)
                setIsUsingIaVoice(false)
                setCurrentText(null)
                setCurrentSegmentText(null)
                callbacksRef.current.onEnd?.()
                return
              }

              const textoDoLote = lotes[loteIdx]
              setCurrentSegmentText(textoDoLote)

              // Preload do próximo lote enquanto este toca
              if (loteIdx + 1 < lotes.length) {
                obterAudioLumiUrl({ text: lotes[loteIdx + 1], voice: vozIaNome }).catch(() => {})
              }

              const audioUrl = await obterAudioLumiUrl({ text: textoDoLote, voice: vozIaNome })

              if (cancelRequestedRef.current) return

              if (!audioUrl) {
                console.warn(
                  '[useSpeechSynthesis] Falha ao obter áudio TTS OpenAI, caindo para síntese local',
                )
                // Se falhar o lote atual, faz fallback para o restante via síntese local sem parar a experiência
                const restante = lotes.slice(loteIdx).join(' ')
                executarSinteseLocal(restante)
                return
              }

              if (!audioElementRef.current) {
                audioElementRef.current = new Audio()
              }
              const audio = audioElementRef.current
              audio.src = audioUrl
              audio.playbackRate = Math.max(0.85, Math.min(1.25, rate || 1.0))

              audio.onended = () => {
                if (cancelRequestedRef.current) return
                loteIdx++
                // Pequena pausa natural de 150ms entre frases
                timerPausaRef.current = setTimeout(() => {
                  tocarProximoLoteIa()
                }, 150)
              }

              audio.onerror = (err) => {
                console.warn('[useSpeechSynthesis] Erro no elemento Audio:', err)
                if (cancelRequestedRef.current) return
                // Fallback para fala local do restante
                const restante = lotes.slice(loteIdx).join(' ')
                executarSinteseLocal(restante)
              }

              try {
                await audio.play()
              } catch (playErr) {
                console.warn('[useSpeechSynthesis] Falha ao dar play no áudio IA:', playErr)
                if (!cancelRequestedRef.current) {
                  executarSinteseLocal(textoLimpo)
                }
              }
            }

            await tocarProximoLoteIa()
            return
          }
        } catch (iaErr) {
          console.warn('[useSpeechSynthesis] Falha geral no pipeline TTS IA:', iaErr)
          if (!cancelRequestedRef.current) {
            executarSinteseLocal(textoLimpo)
          }
          return
        }
      }

      // Se voz IA desabilitada ou não solicitada, usa local
      executarSinteseLocal(textoLimpo)
    },
    [usarVozIa, vozIaNome, limparTimers, executarSinteseLocal],
  )

  // Ao desmontar o componente, cancela fala ativa imediatamente
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
  }
}
