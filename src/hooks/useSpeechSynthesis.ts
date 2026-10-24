import { useState, useEffect, useRef, useCallback } from 'react'
import { limparTextoParaVoz } from '@/lib/speechUtils'

export interface UseSpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: unknown) => void
}

export function useSpeechSynthesis({
  lang = 'pt-BR',
  rate = 1.35,
  pitch = 1.05,
  onStart,
  onEnd,
  onError,
}: UseSpeechSynthesisOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const callbacksRef = useRef({ onStart, onEnd, onError })
  useEffect(() => {
    callbacksRef.current = { onStart, onEnd, onError }
  }, [onStart, onEnd, onError])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)

      const carregarVozes = () => {
        try {
          const listaVozes = window.speechSynthesis.getVoices()
          setVoices(listaVozes)
        } catch {
          // ignore
        }
      }

      carregarVozes()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = carregarVozes
      }
    } else {
      setIsSupported(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false)
    setCurrentText(null)
  }, [])

  const speak = useCallback(
    (rawText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return
      }

      const textoLimpo = limparTextoParaVoz(rawText)
      if (!textoLimpo) return

      try {
        // Interrompe fala anterior se houver
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(textoLimpo)
        utterance.lang = lang
        utterance.rate = rate
        utterance.pitch = pitch

        // Procura a melhor voz pt-BR disponível (preferência por vozes com timbre natural ou femininas se disponíveis)
        const vozesDisponiveis = window.speechSynthesis.getVoices()
        const vozPt =
          vozesDisponiveis.find(
            (v) =>
              v.lang === 'pt-BR' &&
              /Google|Luciana|Francisca|Letícia|Maria|Heloisa|Vitória|Natural/i.test(v.name),
          ) ||
          vozesDisponiveis.find((v) => v.lang === 'pt-BR') ||
          vozesDisponiveis.find((v) => v.lang.startsWith('pt'))

        if (vozPt) {
          utterance.voice = vozPt
        }

        utterance.onstart = () => {
          setIsSpeaking(true)
          setCurrentText(textoLimpo)
          callbacksRef.current.onStart?.()
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          setCurrentText(null)
          callbacksRef.current.onEnd?.()
        }

        utterance.onerror = (e) => {
          setIsSpeaking(false)
          setCurrentText(null)
          callbacksRef.current.onError?.(e)
        }

        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.warn('Erro ao reproduzir fala com SpeechSynthesis:', err)
        setIsSpeaking(false)
        setCurrentText(null)
      }
    },
    [lang, rate, pitch],
  )

  // Ao desmontar o componente, cancela fala ativa para não ecoar em outras telas
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  return {
    isSupported,
    isSpeaking,
    currentText,
    voices,
    speak,
    stop,
  }
}
