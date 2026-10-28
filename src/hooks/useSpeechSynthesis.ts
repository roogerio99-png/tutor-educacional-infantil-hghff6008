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
  onStart,
  onEnd,
  onError,
  onSegmentStart,
}: UseSpeechSynthesisOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [currentSegmentText, setCurrentSegmentText] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

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

  // Parada total imediata (barge-in < 50ms)
  const stop = useCallback(() => {
    cancelRequestedRef.current = true
    utteranceQueueRef.current = []
    activeUtteranceRef.current = null
    limparTimers()

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        // Alguns navegadores (Safari/Chrome) precisam de resume para destravar a fila após cancel
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
      } catch {
        // ignore
      }
    }

    setIsSpeaking(false)
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

  // Reproduz uma sequência de segmentos com prosódia e pausas naturais
  const speak = useCallback(
    (rawText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

      const textoLimpo = limparTextoParaVoz(rawText)
      if (!textoLimpo) return

      // Interrompe imediatamente qualquer reprodução em andamento
      cancelRequestedRef.current = true
      utteranceQueueRef.current = []
      limparTimers()

      try {
        window.speechSynthesis.cancel()
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
      } catch {
        // ignore
      }

      // Prepara os segmentos oracionais com prosódia calibrada
      const segmentos = dividirTextoEmSegmentos(textoLimpo, rate, pitch)
      if (segmentos.length === 0) return

      // Prepara a voz selecionada
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
      setCurrentText(textoLimpo)

      let indiceAtual = 0
      callbacksRef.current.onStart?.()

      // Keep-alive para contornar bug do Chrome que pausa após ~15s de síntese contínua
      keepAliveIntervalRef.current = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause()
            window.speechSynthesis.resume()
          }
        }
      }, 10000)

      const tocarProximoSegmento = () => {
        if (cancelRequestedRef.current) {
          return
        }

        if (indiceAtual >= segmentos.length) {
          // Finalizou todos os segmentos com sucesso
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
        // Aplica o pitch e rate com as variações prosódicas calculadas
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
            // Pequeno respiro natural entre segmentos antes de acionar o próximo
            timerPausaRef.current = setTimeout(() => {
              tocarProximoSegmento()
            }, seg.pausaAposMs)
          } else {
            tocarProximoSegmento()
          }
        }

        utterance.onerror = (e) => {
          // 'canceled' ou 'interrupted' acontece no barge-in normal, não é falha
          const errorType = (e as unknown as { error?: string })?.error
          if (
            errorType === 'canceled' ||
            errorType === 'interrupted' ||
            cancelRequestedRef.current
          ) {
            return
          }
          console.warn('Erro em segmento da voz Lumi:', e)
          // Se falhar num segmento intermediário, tenta avançar
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
          console.warn('Falha ao disparar utterance:', err)
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
