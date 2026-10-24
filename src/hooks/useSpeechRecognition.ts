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
  onFinalResult?: (transcript: string) => void
  onError?: (errorMessage: string, rawError: string) => void
}

export function useSpeechRecognition({
  lang = 'pt-BR',
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
  const callbacksRef = useRef({ onFinalResult, onError })

  useEffect(() => {
    callbacksRef.current = { onFinalResult, onError }
  }, [onFinalResult, onError])

  useEffect(() => {
    const SpeechConstructor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined

    if (SpeechConstructor) {
      setIsSupported(true)
    } else {
      setIsSupported(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignora erro se já estiver parado
      }
    }
    setIsListening(false)
  }, [])

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
    setInterimTranscript('')
    setFinalTranscript('')
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
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = lang

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentInterim = ''
        let currentFinal = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            currentFinal += item[0].transcript
          } else {
            currentInterim += item[0].transcript
          }
        }

        if (currentFinal) {
          setFinalTranscript((prev) => (prev ? `${prev} ${currentFinal}` : currentFinal))
          if (callbacksRef.current.onFinalResult) {
            callbacksRef.current.onFinalResult(currentFinal.trim())
          }
        }

        setInterimTranscript(currentInterim)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const err = event.error || 'unknown'
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setPermissionDenied(true)
          const msg =
            'Precisamos da permissão do microfone para a criança poder falar com a Lumi 🎤'
          setErrorMessage(msg)
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError(msg, err)
          }
        } else if (err === 'no-speech') {
          // Não capturou fala — apenas finaliza sem alarme
        } else if (err !== 'aborted') {
          // Outro erro transitório
          const msg = 'Não consegui ouvir direito. Pode falar de novo? 😊'
          setErrorMessage(msg)
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError(msg, err)
          }
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Erro ao iniciar reconhecimento de voz:', err)
      setIsListening(false)
    }
  }, [lang])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const resetTranscript = useCallback(() => {
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)
  }, [])

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [])

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
