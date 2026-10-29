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
   * Lumi Live 2.0: padrão 1050ms para encerrar o turno sem repetição
   */
  silenceDurationMs?: number
  /**
   * Se deve manter escuta contínua até o silêncio do turno
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

function normalizarComparacao(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Mescla um novo segmento de fala ao texto acumulado sem duplicar prefixos ou sufixos.
 * - Se o novo segmento já começa com o acumulado (comportamento comum no Chrome Android/Desktop),
 *   substitui em vez de concatenar.
 * - Remove sobreposição sufixo-prefixo palavra a palavra.
 */
export function mesclarSegmentosSemOverlap(acumulado: string, novoSegmento: string): string {
  const accTrim = acumulado.trim()
  const novoTrim = novoSegmento.trim()

  if (!accTrim) return novoTrim
  if (!novoTrim) return accTrim

  const accNorm = normalizarComparacao(accTrim)
  const novoNorm = normalizarComparacao(novoTrim)

  if (!accNorm) return novoTrim
  if (!novoNorm) return accTrim

  // 1. Se são idênticos, mantém o mais recente
  if (accNorm === novoNorm) {
    return novoTrim
  }

  // 2. Se o novo segmento começa com todo o acumulado, substitui em vez de concatenar!
  if (novoNorm.startsWith(accNorm)) {
    return novoTrim
  }

  // 3. Se o acumulado já começa com o novo segmento ou já termina com ele, mantém o acumulado
  if (accNorm.startsWith(novoNorm) || accNorm.endsWith(novoNorm)) {
    return accTrim
  }

  // 4. Verifica sobreposição sufixo(acumulado) === prefixo(novoSegmento) em nível de palavras
  const accWords = accTrim.split(/\s+/)
  const novoWords = novoTrim.split(/\s+/)
  const accWordsNorm = accWords.map(normalizarComparacao)
  const novoWordsNorm = novoWords.map(normalizarComparacao)

  const maxOverlap = Math.min(accWords.length, novoWords.length)
  let overlapCount = 0

  for (let k = maxOverlap; k >= 1; k--) {
    let match = true
    for (let j = 0; j < k; j++) {
      if (accWordsNorm[accWords.length - k + j] !== novoWordsNorm[j]) {
        match = false
        break
      }
    }
    if (match) {
      overlapCount = k
      break
    }
  }

  if (overlapCount > 0) {
    const restantes = novoWords.slice(overlapCount)
    return restantes.length > 0 ? `${accTrim} ${restantes.join(' ')}` : accTrim
  }

  return `${accTrim} ${novoTrim}`
}

/**
 * Remove n-gramas adjacentes duplicados (ex: "oi lumi oi lumi" -> "oi lumi",
 * "quanto é quanto é dois" -> "quanto é dois").
 */
export function colapsarRepeticoesConsecutivas(texto: string): string {
  if (!texto) return ''
  let words = texto.trim().split(/\s+/)
  if (words.length <= 1) return texto.trim()

  // Colapsa n-gramas consecutivos de tamanho 6 até 1
  for (let n = Math.min(6, Math.floor(words.length / 2)); n >= 1; n--) {
    const result: string[] = []
    let i = 0
    while (i < words.length) {
      if (i + 2 * n <= words.length) {
        const bloco1 = words
          .slice(i, i + n)
          .map(normalizarComparacao)
          .join(' ')
        const bloco2 = words
          .slice(i + n, i + 2 * n)
          .map(normalizarComparacao)
          .join(' ')
        if (bloco1 && bloco1 === bloco2) {
          result.push(...words.slice(i, i + n))
          i += 2 * n
          // Pula caso haja uma 3ª repetição seguida do mesmo bloco
          while (
            i + n <= words.length &&
            words
              .slice(i, i + n)
              .map(normalizarComparacao)
              .join(' ') === bloco1
          ) {
            i += n
          }
          continue
        }
      }
      result.push(words[i])
      i++
    }
    words = result
  }

  return words.join(' ').trim()
}

export function useSpeechRecognition({
  lang = 'pt-BR',
  silenceDurationMs = 1050,
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
  const turnEmittedRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mergedTranscriptRef = useRef('')

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

  const teardownRecognitionInstance = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    recognitionRef.current = null
    try {
      rec.onresult = null
      rec.onend = null
      rec.onerror = null
      rec.onstart = null
      rec.abort()
    } catch {
      // ignore
    }
  }, [])

  const finalizeAndEmit = useCallback(
    (_reason: 'silence' | 'manual') => {
      // Trava atômica: garante que cada turno de fala seja emitido no máximo 1 única vez
      if (turnEmittedRef.current) return
      turnEmittedRef.current = true

      clearSilenceTimer()
      clearRestartTimer()
      isManuallyStoppedRef.current = true
      isStartingRef.current = false
      isRunningRef.current = false

      const textoBruto = mergedTranscriptRef.current.trim()
      const textoFinalLimpo = colapsarRepeticoesConsecutivas(textoBruto)

      mergedTranscriptRef.current = ''
      setInterimTranscript('')
      setIsListening(false)

      // Desarma onresult/onend e aborta imediatamente para impedir eventos tardios duplicados
      teardownRecognitionInstance()

      if (textoFinalLimpo && callbacksRef.current.onFinalResult) {
        setFinalTranscript(textoFinalLimpo)
        callbacksRef.current.onFinalResult(textoFinalLimpo)
      }
    },
    [clearSilenceTimer, clearRestartTimer, teardownRecognitionInstance],
  )

  const stopListening = useCallback(() => {
    if (!turnEmittedRef.current && mergedTranscriptRef.current.trim()) {
      finalizeAndEmit('manual')
      return
    }

    turnEmittedRef.current = true
    isManuallyStoppedRef.current = true
    isStartingRef.current = false
    isRunningRef.current = false
    clearSilenceTimer()
    clearRestartTimer()
    teardownRecognitionInstance()
    setIsListening(false)
    setInterimTranscript('')
  }, [clearSilenceTimer, clearRestartTimer, finalizeAndEmit, teardownRecognitionInstance])

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

    if (isStartingRef.current || isRunningRef.current) {
      return
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
    turnEmittedRef.current = false
    mergedTranscriptRef.current = ''
    setErrorMessage(null)
    setPermissionDenied(false)
    setInterimTranscript('')
    setFinalTranscript('')

    try {
      teardownRecognitionInstance()

      const recognition = new SpeechConstructor()
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = lang
      recognition.maxAlternatives = 1

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
        if (turnEmittedRef.current || isManuallyStoppedRef.current) return

        callbacksRef.current.onSpeechStarted?.()

        // Reconstrói o texto da sessão mesclando cada resultado sem overlap nem duplicação
        let combinado = ''
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i]
          const seg = (item?.[0]?.transcript || '').trim()
          if (!seg) continue
          combinado = mesclarSegmentosSemOverlap(combinado, seg)
        }

        const textoSemRepeticoes = colapsarRepeticoesConsecutivas(combinado)
        mergedTranscriptRef.current = textoSemRepeticoes

        setInterimTranscript(textoSemRepeticoes)
        callbacksRef.current.onInterimResult?.(textoSemRepeticoes)

        // Detector de Silêncio Lumi Live 2.0 (1050ms por padrão)
        clearSilenceTimer()
        if (textoSemRepeticoes) {
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
        } else if (err === 'no-speech' || err === 'aborted') {
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

        // Se já havia fala capturada e o motor encerrou antes do timer de 1050ms, finaliza 1 única vez
        if (!turnEmittedRef.current && mergedTranscriptRef.current.trim()) {
          finalizeAndEmit('silence')
          return
        }

        if (!isManuallyStoppedRef.current && !turnEmittedRef.current && continuous) {
          clearRestartTimer()
          restartTimerRef.current = setTimeout(() => {
            if (!isManuallyStoppedRef.current && !turnEmittedRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
                isRunningRef.current = true
                setIsListening(true)
              } catch {
                setIsListening(false)
                isRunningRef.current = false
              }
            }
          }, 250)
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
      if (errStr.includes('not-allowed')) {
        setPermissionDenied(true)
        setErrorMessage('Permissão do microfone negada. Toque no cadeado da barra do navegador.')
      } else {
        setErrorMessage('Não foi possível iniciar o microfone. Toque para tentar novamente.')
      }
    }
  }, [
    lang,
    continuous,
    silenceDurationMs,
    clearSilenceTimer,
    clearRestartTimer,
    finalizeAndEmit,
    teardownRecognitionInstance,
  ])

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
    turnEmittedRef.current = false
    mergedTranscriptRef.current = ''
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)
  }, [clearSilenceTimer, clearRestartTimer])

  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true
      turnEmittedRef.current = true
      clearSilenceTimer()
      clearRestartTimer()
      teardownRecognitionInstance()
    }
  }, [clearSilenceTimer, clearRestartTimer, teardownRecognitionInstance])

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
