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
  maxAlternatives?: number
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
   * Se deve reiniciar automaticamente o recognition caso o navegador encerre a sessão prematuramente
   */
  continuous?: boolean
  /**
   * Callback disparado assim que a criança começa a falar (útil para Barge-in imediato < 50ms)
   */
  onSpeechStarted?: () => void
  /**
   * Callback para o texto provisório (interim) em tempo real
   */
  onInterimResult?: (transcript: string) => void
  /**
   * Callback quando a fala é finalizada após estabilização do silêncio ou stop manual
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
  continuous = true,
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
  const isStartingRef = useRef(false)
  const isRunningRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedFinalRef = useRef('')
  const currentInterimRef = useRef('')

  const callbacksRef = useRef({ onSpeechStarted, onInterimResult, onFinalResult, onError })
  useEffect(() => {
    callbacksRef.current = { onSpeechStarted, onInterimResult, onFinalResult, onError }
  }, [onSpeechStarted, onInterimResult, onFinalResult, onError])

  useEffect(() => {
    const hasConstructor =
      typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    setIsSupported(hasConstructor)
  }, [])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }, [])

  const finalizeAndEmit = useCallback(
    (reason: 'silence' | 'manual') => {
      clearSilenceTimer()
      const textoFinal = (accumulatedFinalRef.current + ' ' + currentInterimRef.current).trim()
      accumulatedFinalRef.current = ''
      currentInterimRef.current = ''
      setInterimTranscript('')

      if (textoFinal && callbacksRef.current.onFinalResult) {
        callbacksRef.current.onFinalResult(textoFinal)
      }

      if (reason === 'silence') {
        // Encerra a escuta do turno após o silêncio infantil de 1,2s
        isManuallyStoppedRef.current = true
        if (recognitionRef.current && isRunningRef.current) {
          try {
            recognitionRef.current.stop()
          } catch {
            // ignore
          }
        }
        setIsListening(false)
        isRunningRef.current = false
      }
    },
    [clearSilenceTimer],
  )

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true
    isStartingRef.current = false
    clearSilenceTimer()
    clearRestartTimer()

    if (recognitionRef.current && isRunningRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }

    setIsListening(false)
    isRunningRef.current = false

    // Se houver texto acumulado e o usuário parou manualmente, emite o resultado
    finalizeAndEmit('manual')
  }, [clearSilenceTimer, clearRestartTimer, finalizeAndEmit])

  const startListening = useCallback(async () => {
    clearRestartTimer()
    clearSilenceTimer()

    const SpeechConstructor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined

    if (!SpeechConstructor) {
      const msg =
        'Seu navegador não possui suporte nativo à voz da Web Speech API. Use o Google Chrome, Edge ou Safari.'
      setErrorMessage(msg)
      callbacksRef.current.onError?.(msg, 'not-supported')
      return
    }

    // Se já estiver iniciando ou rodando, evita chamadas duplicadas
    if (isStartingRef.current || isRunningRef.current) {
      return
    }

    // Tenta solicitar permissão explícita de microfone primeiro se a API de mídia estiver disponível
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        // Verifica se a permissão já foi concedida ou solicita
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Libera os tracks imediatamente pois o SpeechRecognition abrirá o canal próprio
        stream.getTracks().forEach((track) => track.stop())
        setPermissionDenied(false)
      } catch (mediaErr: unknown) {
        const errStr = String(mediaErr)
        if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
          setPermissionDenied(true)
          const msg =
            'Precisamos da permissão do microfone para a criança poder falar com a Lumi 🎤'
          setErrorMessage(msg)
          callbacksRef.current.onError?.(msg, 'not-allowed')
          setIsListening(false)
          isRunningRef.current = false
          return
        }
      }
    }

    isManuallyStoppedRef.current = false
    isStartingRef.current = true
    setErrorMessage(null)
    setPermissionDenied(false)
    accumulatedFinalRef.current = ''
    currentInterimRef.current = ''
    setInterimTranscript('')
    setFinalTranscript('')

    try {
      // Se havia uma instância prévia, cancela
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }

      const recognition = new SpeechConstructor()
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = lang

      recognition.onstart = () => {
        isStartingRef.current = false
        isRunningRef.current = true
        setIsListening(true)
        setErrorMessage(null)
      }

      if ('onspeechstart' in recognition) {
        recognition.onspeechstart = () => {
          callbacksRef.current.onSpeechStarted?.()
        }
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        // Dispara barge-in imediato na primeira detecção de fala
        callbacksRef.current.onSpeechStarted?.()

        // Algoritmo canônico da Web Speech API:
        // results é cumulativo na sessão continuous; percorre todo o array separando final e interim
        let finalParts = ''
        let interimParts = ''

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            finalParts += item[0].transcript + ' '
          } else {
            interimParts += item[0].transcript
          }
        }

        finalParts = finalParts.trim()
        interimParts = interimParts.trim()

        accumulatedFinalRef.current = finalParts
        currentInterimRef.current = interimParts

        const textoExibicao = (finalParts ? finalParts + ' ' + interimParts : interimParts).trim()

        setInterimTranscript(textoExibicao)
        setFinalTranscript(finalParts)
        callbacksRef.current.onInterimResult?.(textoExibicao)

        // Reinicia o Detector de Silêncio Infantil (~1200ms)
        // Quando a criança para de falar por mais de 1,2s, concluímos o turno automaticamente
        clearSilenceTimer()
        if (textoExibicao) {
          silenceTimerRef.current = setTimeout(() => {
            finalizeAndEmit('silence')
          }, silenceDurationMs)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        isStartingRef.current = false
        clearSilenceTimer()
        const err = event.error || 'unknown'

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setPermissionDenied(true)
          const msg =
            'Precisamos da permissão do microfone para a criança poder falar com a Lumi 🎤'
          setErrorMessage(msg)
          callbacksRef.current.onError?.(msg, err)
          isManuallyStoppedRef.current = true
          setIsListening(false)
          isRunningRef.current = false
        } else if (err === 'no-speech') {
          // Chrome dispara no-speech periodicamente se a criança ainda não começou a falar.
          // Não tratamos como erro fatal, mantemos ouvindo
        } else if (err === 'aborted') {
          // Aborto manual / programático — não alarma
          setIsListening(false)
          isRunningRef.current = false
        } else {
          const msg = 'Não consegui ouvir direito. Pode falar de novo? 😊'
          setErrorMessage(msg)
          callbacksRef.current.onError?.(msg, err)
          setIsListening(false)
          isRunningRef.current = false
        }
      }

      recognition.onend = () => {
        isStartingRef.current = false
        isRunningRef.current = false

        // Se o usuário não pediu para parar manualmente e ainda há expectativa de escuta,
        // reinicia graciosamente após um breve intervalo (tolerância de keep-alive do Chrome)
        if (!isManuallyStoppedRef.current && continuous) {
          clearRestartTimer()
          restartTimerRef.current = setTimeout(() => {
            if (!isManuallyStoppedRef.current) {
              try {
                recognition.start()
                isRunningRef.current = true
                setIsListening(true)
              } catch {
                // Se falhar o reinício da mesma instância, zera estado limpo
                setIsListening(false)
                isRunningRef.current = false
              }
            }
          }, 300)
        } else {
          clearSilenceTimer()
          setIsListening(false)
          setInterimTranscript('')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: unknown) {
      isStartingRef.current = false
      isRunningRef.current = false
      setIsListening(false)
      const errStr = String(err)
      console.warn('Erro ao disparar reconhecimento de voz:', err)

      if (errStr.includes('not-allowed')) {
        setPermissionDenied(true)
        setErrorMessage('Permissão do microfone negada. Toque no cadeado da barra do navegador.')
      } else {
        setErrorMessage('Não foi possível iniciar o microfone. Toque para tentar novamente.')
      }
    }
  }, [lang, continuous, silenceDurationMs, clearSilenceTimer, clearRestartTimer, finalizeAndEmit])

  const toggleListening = useCallback(() => {
    if (isListening || isRunningRef.current) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const resetTranscript = useCallback(() => {
    clearSilenceTimer()
    clearRestartTimer()
    accumulatedFinalRef.current = ''
    currentInterimRef.current = ''
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)
  }, [clearSilenceTimer, clearRestartTimer])

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true
      clearSilenceTimer()
      clearRestartTimer()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [clearSilenceTimer, clearRestartTimer])

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
