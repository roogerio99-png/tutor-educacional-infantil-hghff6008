import { useState, useEffect, useRef, useCallback } from 'react'

// Tipagens para SpeechRecognition da Web Speech API (nativa em navegadores modernos)
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null
  onspeechstart?: ((this: SpeechRecognitionLike, ev: Event) => void) | null
  onspeechend?: ((this: SpeechRecognitionLike, ev: Event) => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

// Declaração de suporte a window.webkitSpeechRecognition / window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseSpeechRecognitionOptions {
  lang?: string
  /**
   * Tolerância de silêncio em milissegundos para concluir a fala.
   * Conforme o manual da Lumi IA para crianças de 6 a 12 anos: padrão 1200ms
   */
  silenceDurationMs?: number
  /**
   * Callback disparado assim que a criança começa a falar (útil para Barge-in imediato < 50ms)
   */
  onSpeechStarted?: () => void
  /**
   * Callback para o texto provisório (interim) em tempo real
   */
  onInterimResult?: (transcript: string) => void
  /**
   * Callback quando a fala é finalizada após estabilização do silêncio
   */
  onFinalResult?: (transcript: string) => void
  /**
   * Callback de erro
   */
  onError?: (errorMessage: string, rawError: string) => void
}

export function useSpeechRecognition({
  lang = 'pt-BR',
  silenceDurationMs = 1200,
  onSpeechStarted,
  onInterimResult,
  onFinalResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const isManuallyStoppedRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedTranscriptRef = useRef<string>('')
  const callbacksRef = useRef({ onSpeechStarted, onInterimResult, onFinalResult, onError })

  useEffect(() => {
    callbacksRef.current = { onSpeechStarted, onInterimResult, onFinalResult, onError }
  }, [onSpeechStarted, onInterimResult, onFinalResult, onError])

  useEffect(() => {
    const SpeechConstructor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined

    setIsSupported(!!SpeechConstructor)
  }, [])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true
    clearSilenceTimer()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignora erro se já estiver parado
      }
    }
    setIsListening(false)

    // Se houver texto acumulado e o usuário parou manualmente, emite o resultado
    const pending = accumulatedTranscriptRef.current.trim()
    if (pending && callbacksRef.current.onFinalResult) {
      callbacksRef.current.onFinalResult(pending)
      accumulatedTranscriptRef.current = ''
    }
  }, [clearSilenceTimer])

  const startListening = useCallback(() => {
    const SpeechConstructor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined

    if (!SpeechConstructor) {
      setErrorMessage('Seu navegador não suporta fala por voz.')
      return
    }

    // Limpa estados prévios
    clearSilenceTimer()
    setInterimTranscript('')
    setFinalTranscript('')
    accumulatedTranscriptRef.current = ''
    setErrorMessage(null)
    setPermissionDenied(false)
    isManuallyStoppedRef.current = false

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechConstructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = lang

      recognition.onstart = () => {
        setIsListening(true)
      }

      if ('onspeechstart' in recognition) {
        recognition.onspeechstart = () => {
          callbacksRef.current.onSpeechStarted?.()
        }
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        // Gatilho imediato de barge-in na primeira detecção de voz
        callbacksRef.current.onSpeechStarted?.()

        let currentInterim = ''
        let currentFinalPart = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            currentFinalPart += item[0].transcript
          } else {
            currentInterim += item[0].transcript
          }
        }

        if (currentFinalPart) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current +
            ' ' +
            currentFinalPart
          ).trim()
          setFinalTranscript(accumulatedTranscriptRef.current)
        }

        const textoExibicao = (accumulatedTranscriptRef.current + ' ' + currentInterim).trim()
        setInterimTranscript(textoExibicao)
        callbacksRef.current.onInterimResult?.(textoExibicao)

        // Reinicia o Detector de Silêncio Infantil (calibrado para 1200ms)
        // Nunca corta a criança no meio de uma frase enquanto ela pensa
        clearSilenceTimer()
        silenceTimerRef.current = setTimeout(() => {
          const resultadoCompleto = accumulatedTranscriptRef.current.trim() || currentInterim.trim()
          if (resultadoCompleto) {
            callbacksRef.current.onFinalResult?.(resultadoCompleto)
            accumulatedTranscriptRef.current = ''
            setInterimTranscript('')
            // Para o microfone após conclusão do turno da criança
            try {
              recognition.stop()
            } catch {
              // ignore
            }
          }
        }, silenceDurationMs)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        clearSilenceTimer()
        const err = event.error || 'unknown'
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setPermissionDenied(true)
          const msg =
            'Precisamos da permissão do microfone para a criança poder falar com a Lumi 🎤'
          setErrorMessage(msg)
          callbacksRef.current.onError?.(msg, err)
        } else if (err === 'no-speech') {
          // Não capturou fala — sem alarme, mantém ouvindo se continuous
        } else if (err !== 'aborted') {
          const msg = 'Não consegui ouvir direito. Pode falar de novo? 😊'
          setErrorMessage(msg)
          callbacksRef.current.onError?.(msg, err)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        clearSilenceTimer()
        setIsListening(false)
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Erro ao iniciar reconhecimento de voz:', err)
      setIsListening(false)
    }
  }, [lang, silenceDurationMs, clearSilenceTimer])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const resetTranscript = useCallback(() => {
    clearSilenceTimer()
    accumulatedTranscriptRef.current = ''
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)
  }, [clearSilenceTimer])

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      clearSilenceTimer()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [clearSilenceTimer])

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    permissionDenied,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  }
}
