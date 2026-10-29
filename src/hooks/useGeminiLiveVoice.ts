import { useState, useRef, useCallback, useEffect } from 'react'

export type VozGeminiLive = 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon'

export interface OpcaoVozReal {
  id: VozGeminiLive
  nome: string
  descricao: string
  emoji: string
}

export const VOZES_REAIS_LUMI: OpcaoVozReal[] = [
  {
    id: 'Kore',
    nome: 'Kore (Acolhedora)',
    descricao: 'Voz feminina calorosa, carinhosa e maternal (Recomendada)',
    emoji: '🌸',
  },
  {
    id: 'Zephyr',
    nome: 'Zephyr (Suave)',
    descricao: 'Voz feminina serena, paciente e cristalina',
    emoji: '🍃',
  },
  {
    id: 'Puck',
    nome: 'Puck (Animada)',
    descricao: 'Voz jovem, divertida, energética e curiosa',
    emoji: '⚡',
  },
  {
    id: 'Fenrir',
    nome: 'Fenrir (Calma)',
    descricao: 'Voz grave, tranquila e segura para foco profundo',
    emoji: '🦉',
  },
  {
    id: 'Charon',
    nome: 'Charon (Narradora)',
    descricao: 'Cadência expressiva de contação de histórias',
    emoji: '📖',
  },
]

export interface UseGeminiLiveVoiceOptions {
  criancaNome?: string
  criancaIdade?: number
  criancaSerie?: string
  criancaLocalidade?: string
  criancaObservacoes?: string
  criancaInteresses?: string
  criancaAcessibilidade?: string
  materia?: string
  materiaAtual?: string
  etapaSocratica?: string
  etapaAtual?: string
  vozPreferida?: VozGeminiLive
  playbackRate?: number
  muted?: boolean
  onStageDetected?: (etapa: any) => void
  onTurnComplete?: (userTranscript: string, lumiTranscript: string) => void
  onBargeIn?: () => void
  onError?: (msg: string) => void
}

function float32ToPcm16Base64(float32Array: Float32Array, inputSampleRate: number): string {
  // Downsample to 16000 Hz if needed
  let samples = float32Array
  if (inputSampleRate !== 16000 && inputSampleRate > 0) {
    const ratio = inputSampleRate / 16000
    const newLength = Math.round(float32Array.length / ratio)
    const resampled = new Float32Array(newLength)
    for (let i = 0; i < newLength; i++) {
      const srcIdx = Math.min(float32Array.length - 1, Math.floor(i * ratio))
      resampled[i] = float32Array[srcIdx]
    }
    samples = resampled
  }

  const buffer = new ArrayBuffer(samples.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(sub))
  }
  return btoa(binary)
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const view = new DataView(bytes.buffer)
  const numSamples = Math.floor(len / 2)
  const float32 = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const int16 = view.getInt16(i * 2, true)
    float32[i] = int16 / 32768.0
  }
  return float32
}

export function useGeminiLiveVoice({
  criancaNome = 'Ana Paula',
  criancaIdade = 10,
  criancaSerie = '5º Ano',
  criancaLocalidade = 'Brasil',
  criancaObservacoes = '',
  criancaInteresses = '',
  criancaAcessibilidade = '',
  materia,
  materiaAtual,
  etapaSocratica,
  etapaAtual,
  vozPreferida = 'Kore',
  playbackRate = 1.0,
  muted = false,
  onTurnComplete,
  onBargeIn,
  onError,
}: UseGeminiLiveVoiceOptions = {}) {
  const resolvedObservacoes =
    [criancaObservacoes, criancaInteresses, criancaAcessibilidade].filter(Boolean).join(' | ') || ''
  const resolvedMateria = materia || materiaAtual || 'ciencias'
  const resolvedEtapa = etapaSocratica || etapaAtual || 'entender'

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [isModelSpeaking, setIsModelSpeaking] = useState(false)
  const [isModelThinking, setIsModelThinking] = useState(false)
  const [liveInputTranscript, setLiveInputTranscript] = useState('')
  const [liveOutputTranscript, setLiveOutputTranscript] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const inputAudioCtxRef = useRef<AudioContext | null>(null)
  const outputAudioCtxRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const nextStartTimeRef = useRef<number>(0)
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())

  const accumulatedInputRef = useRef('')
  const accumulatedOutputRef = useRef('')
  const mutedRef = useRef(muted)
  const playbackRateRef = useRef(playbackRate)
  const callbacksRef = useRef({ onTurnComplete, onBargeIn, onError })

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    playbackRateRef.current = playbackRate
  }, [playbackRate])

  useEffect(() => {
    callbacksRef.current = { onTurnComplete, onBargeIn, onError }
  }, [onTurnComplete, onBargeIn, onError])

  const stopOutputPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop()
        source.disconnect()
      } catch {
        // ignore
      }
    })
    activeSourcesRef.current.clear()
    nextStartTimeRef.current = 0
    setIsModelSpeaking(false)
    setVolumeLevel(0)
  }, [])

  const scheduleAudioChunk = useCallback(
    (base64Audio: string) => {
      if (mutedRef.current) return

      try {
        if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
          outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 })
        }
        const ctx = outputAudioCtxRef.current
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }

        const float32 = base64Pcm16ToFloat32(base64Audio)
        if (float32.length === 0) return

        // Calculate RMS energy for visual orb animation
        let sumSq = 0
        for (let i = 0; i < float32.length; i += 4) {
          sumSq += float32[i] * float32[i]
        }
        const rms = Math.sqrt(sumSq / Math.max(1, float32.length / 4))
        setVolumeLevel(Math.min(1, rms * 4.2))

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000)
        audioBuffer.getChannelData(0).set(float32)

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer

        // Subtle playback rate adjustment if user chose calm/dynamic preset
        const rate = Math.max(0.88, Math.min(1.18, playbackRateRef.current || 1.0))
        source.playbackRate.value = rate

        source.connect(ctx.destination)

        const now = ctx.currentTime
        const startTime = Math.max(now + 0.01, nextStartTimeRef.current)
        nextStartTimeRef.current = startTime + audioBuffer.duration / rate

        activeSourcesRef.current.add(source)
        setIsModelSpeaking(true)
        setIsModelThinking(false)

        source.onended = () => {
          activeSourcesRef.current.delete(source)
          if (activeSourcesRef.current.size === 0) {
            setIsModelSpeaking(false)
            setVolumeLevel(0)
          }
        }

        source.start(startTime)
      } catch (err) {
        console.warn('[GeminiLive Audio Playback Error]:', err)
      }
    },
    [],
  )

  const stopMicCapture = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect()
        processorRef.current.onaudioprocess = null
      } catch {
        // ignore
      }
      processorRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {})
      inputAudioCtxRef.current = null
    }
    setIsMicActive(false)
  }, [])

  const disconnectLive = useCallback(() => {
    stopMicCapture()
    stopOutputPlayback()
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {
        // ignore
      }
      wsRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
    setIsModelSpeaking(false)
    setIsModelThinking(false)
    setVolumeLevel(0)
  }, [stopMicCapture, stopOutputPlayback])

  const startMicCapture = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Seu navegador não suporta captura de microfone em tempo real.'
      setErrorMessage(msg)
      callbacksRef.current.onError?.(msg)
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      })
      setPermissionDenied(false)
      setErrorMessage(null)
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const inputCtx = new AudioCtx({ sampleRate: 16000 })
      inputAudioCtxRef.current = inputCtx

      if (inputCtx.state === 'suspended') {
        await inputCtx.resume()
      }

      const source = inputCtx.createMediaStreamSource(stream)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        const channelData = e.inputBuffer.getChannelData(0)

        // Compute mic volume for reactive UI
        let sumSq = 0
        for (let i = 0; i < channelData.length; i += 8) {
          sumSq += channelData[i] * channelData[i]
        }
        const rms = Math.sqrt(sumSq / Math.max(1, channelData.length / 8))
        if (activeSourcesRef.current.size === 0) {
          setVolumeLevel(Math.min(1, rms * 5.0))
        }

        const base64Audio = float32ToPcm16Base64(channelData, inputCtx.sampleRate)
        ws.send(JSON.stringify({ type: 'audio', audio: base64Audio }))
      }

      source.connect(processor)
      processor.connect(inputCtx.destination)
      setIsMicActive(true)
      return true
    } catch (err: any) {
      const errStr = String(err)
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
        setPermissionDenied(true)
        const msg = 'Permissão do microfone negada. Libere o microfone no navegador para conversar.'
        setErrorMessage(msg)
        callbacksRef.current.onError?.(msg)
      } else {
        const msg = 'Não foi possível acessar o microfone. Verifique se ele está conectado.'
        setErrorMessage(msg)
        callbacksRef.current.onError?.(msg)
      }
      return false
    }
  }, [])

  const connectLive = useCallback(
    async (autoStartMic = true, initialGreetingPrompt?: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (autoStartMic && !isMicActive) {
          await startMicCapture()
        }
        return
      }

      setIsConnecting(true)
      setErrorMessage(null)

      // Pre-warm 24kHz output AudioContext on user gesture
      try {
        if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
          outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 })
        }
        if (outputAudioCtxRef.current.state === 'suspended') {
          await outputAudioCtxRef.current.resume()
        }
      } catch {
        // ignore
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const params = new URLSearchParams({
        voice: vozPreferida,
        nome: criancaNome,
        idade: String(criancaIdade),
        serie: criancaSerie,
        localidade: criancaLocalidade,
        observacoes: resolvedObservacoes,
        materia: resolvedMateria,
        etapa: resolvedEtapa,
      })

      const wsUrl = `${protocol}//${window.location.host}/api/lumi/live?${params.toString()}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'connected') {
            setIsConnected(true)
            setIsConnecting(false)
            if (autoStartMic) {
              await startMicCapture()
            }
            if (initialGreetingPrompt) {
              setIsModelThinking(true)
              ws.send(JSON.stringify({ type: 'text', text: initialGreetingPrompt }))
            }
          } else if (data.type === 'audio' && data.audio) {
            scheduleAudioChunk(data.audio)
          } else if (data.type === 'input_transcription' && data.text) {
            accumulatedInputRef.current = (accumulatedInputRef.current + data.text).trimStart()
            setLiveInputTranscript(accumulatedInputRef.current)
          } else if (data.type === 'output_transcription' && data.text) {
            accumulatedOutputRef.current = (accumulatedOutputRef.current + data.text).trimStart()
            setLiveOutputTranscript(accumulatedOutputRef.current)
          } else if (data.type === 'interrupted') {
            // Native Gemini Live VAD Barge-in!
            stopOutputPlayback()
            callbacksRef.current.onBargeIn?.()
          } else if (data.type === 'turn_complete') {
            setIsModelThinking(false)
            const finalUser = accumulatedInputRef.current.trim()
            const finalLumi = accumulatedOutputRef.current.trim()
            if (finalUser || finalLumi) {
              callbacksRef.current.onTurnComplete?.(finalUser, finalLumi)
            }
            accumulatedInputRef.current = ''
            accumulatedOutputRef.current = ''
            setTimeout(() => {
              setLiveInputTranscript('')
            }, 1200)
          } else if (data.type === 'error') {
            setIsConnecting(false)
            setIsModelThinking(false)
            setErrorMessage(data.message || 'Erro na conexão de voz em tempo real.')
            callbacksRef.current.onError?.(data.message || 'Erro na conexão Live.')
          } else if (data.type === 'disconnected') {
            setIsConnected(false)
            setIsConnecting(false)
            setIsMicActive(false)
          }
        } catch (err) {
          console.warn('[WS Message Parse Error]:', err)
        }
      }

      ws.onerror = () => {
        setIsConnecting(false)
        setErrorMessage('Falha ao conectar ao canal de voz em tempo real.')
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        stopMicCapture()
      }
    },
    [
      vozPreferida,
      criancaNome,
      criancaIdade,
      criancaSerie,
      criancaLocalidade,
      resolvedObservacoes,
      resolvedMateria,
      resolvedEtapa,
      isMicActive,
      startMicCapture,
      scheduleAudioChunk,
      stopOutputPlayback,
      stopMicCapture,
    ],
  )

  const sendLiveTextPrompt = useCallback(
    async (text: string) => {
      const clean = text.trim()
      if (!clean) return

      stopOutputPlayback()
      accumulatedInputRef.current = clean
      accumulatedOutputRef.current = ''
      setLiveInputTranscript(clean)
      setLiveOutputTranscript('')
      setIsModelThinking(true)

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        await connectLive(false, clean)
        return
      }

      wsRef.current.send(JSON.stringify({ type: 'text', text: clean }))
    },
    [connectLive, stopOutputPlayback],
  )

  const toggleLiveMic = useCallback(async () => {
    if (!isConnected) {
      const primeiroNome = (criancaNome || 'amigo(a)').split(' ')[0]
      await connectLive(
        true,
        `Diga um "Oi, ${primeiroNome}!" bem curtinho, alegre e acolhedor (em 1 ou 2 frases) perguntando sobre o que vamos conversar hoje!`,
      )
      return
    }
    if (isMicActive) {
      stopMicCapture()
    } else {
      await startMicCapture()
    }
  }, [isConnected, isMicActive, criancaNome, connectLive, stopMicCapture, startMicCapture])

  const triggerManualBargeIn = useCallback(() => {
    stopOutputPlayback()
    setLiveOutputTranscript('')
    accumulatedOutputRef.current = ''
    callbacksRef.current.onBargeIn?.()
  }, [stopOutputPlayback])

  useEffect(() => {
    return () => {
      disconnectLive()
    }
  }, [disconnectLive])

  return {
    isConnected,
    isConnecting,
    isMicActive,
    isModelSpeaking,
    isSpeaking: isModelSpeaking,
    isModelThinking,
    isThinking: isModelThinking,
    liveInputTranscript,
    liveOutputTranscript,
    volumeLevel,
    permissionDenied,
    errorMessage,
    connectLive,
    connect: connectLive,
    disconnectLive,
    disconnect: disconnectLive,
    toggleLiveMic,
    toggleMic: toggleLiveMic,
    stopOutputPlayback,
    stopLivePlayback: stopOutputPlayback,
    sendLiveTextPrompt,
    triggerManualBargeIn,
  }
}
