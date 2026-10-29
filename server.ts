import express from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT) || 3000

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })
}

const VALID_GEMINI_VOICES = ['Kore', 'Zephyr', 'Puck', 'Fenrir', 'Charon'] as const
type GeminiVoiceName = (typeof VALID_GEMINI_VOICES)[number]

function resolveGeminiVoice(voiceInput?: string): GeminiVoiceName {
  if (!voiceInput) return 'Kore'
  const clean = voiceInput.trim()
  if ((VALID_GEMINI_VOICES as readonly string[]).includes(clean)) {
    return clean as GeminiVoiceName
  }
  const lower = clean.toLowerCase()
  if (lower === 'nova' || lower === 'kore' || lower === 'coral' || lower === 'shimmer') {
    return 'Kore'
  }
  if (lower === 'zephyr' || lower === 'alloy' || lower === 'sage') {
    return 'Zephyr'
  }
  if (lower === 'puck' || lower === 'fable' || lower === 'verse') {
    return 'Puck'
  }
  if (lower === 'fenrir' || lower === 'onyx') {
    return 'Fenrir'
  }
  if (lower === 'charon' || lower === 'echo' || lower === 'ash') {
    return 'Charon'
  }
  return 'Kore'
}

// In-memory TTS cache to make repeated phrases instantaneous
const ttsAudioCache = new Map<string, string>()

function buildLumiSystemInstruction(params: {
  criancaNome?: string
  criancaIdade?: number
  criancaSerie?: string
  criancaLocalidade?: string
  criancaObservacoes?: string
  materia?: string
  etapaSocratica?: string
  customPrompt?: string
}): string {
  const nome = params.criancaNome || 'Amigo(a)'
  const primeiroNome = nome.split(' ')[0]
  const idade = params.criancaIdade || 10
  const serie = params.criancaSerie || '5º Ano'
  const localidade = params.criancaLocalidade || 'Brasil'
  const obs = params.criancaObservacoes || ''
  const materia = params.materia || 'ciencias'
  const etapa = params.etapaSocratica || 'entender'

  return `Você é a Lumi, uma tutora educacional socrática infantil com voz humana real, super calorosa, afetuosa, paciente e entusiasmada.
Você fala SEMPRE em Português do Brasil (pt-BR), com sotaque brasileiro natural, expressivo e acolhedor.

PERFIL DA CRIANÇA QUE ESTÁ CONVERSANDO COM VOCÊ:
- Nome: ${nome} (chame carinhosamente de ${primeiroNome})
- Idade: ${idade} anos (${serie})
- Região/Localidade: ${localidade}
${obs ? `- Interesses e estilo de aprendizagem: ${obs}` : ''}
- Matéria atual em foco: ${materia}
- Etapa Socrática atual: ${etapa}
${params.customPrompt ? `- Diretrizes adicionais: ${params.customPrompt}` : ''}

REGRAS DE OURO PARA SUA FALA EM TEMPO REAL:
1. FALE CURTO E DIRETO: Responda em no máximo 1 a 3 frases curtas por turno. Crianças precisam de diálogo dinâmico e fluido, nunca de monólogos longos.
2. MÉTODO SOCRÁTICO PURO: NUNCA dê a resposta pronta de uma tarefa ou conta! Use analogias lúdicas (como fatias de pizza, blocos de montar, cozinha solar das plantas, animais, esportes) e termine sempre com UMA pergunta curiosa e simples que ajude ${primeiroNome} a descobrir a resposta pensando sozinho(a).
3. PROIBIDO NARRAR O MÉTODO: Nunca diga "agora vou usar o método socrático", "na etapa de contextualizar" ou tags técnicas em voz alta. Não leia colchetes nem tags em voz alta.
4. TOM DE VOZ: Sorria com a voz! Seja encorajadora, comemore cada tentativa da criança, acolha dúvidas ou erros com muito carinho ("Quase lá!", "Boa pista!", "Vamos pensar juntos nesse pedacinho!").`
}

async function startServer() {
  const app = express()
  app.use(express.json({ limit: '10mb' }))

  // TTS Endpoint powered by gemini-3.8-flash-lite-tts
  const handleTtsRequest = async (req: express.Request, res: express.Response) => {
    try {
      const { text, voice } = req.body || {}
      const cleanText = String(text || '')
        .replace(/\[\[ETAPA:[^\]]+\]\]/gi, '')
        .replace(/[*_#`~>]/g, '')
        .trim()

      if (!cleanText) {
        res.status(400).json({ error: 'Texto vazio para síntese de voz.' })
        return
      }

      const geminiVoice = resolveGeminiVoice(voice)
      const cacheKey = `${geminiVoice}:${cleanText.toLowerCase()}`

      if (ttsAudioCache.has(cacheKey)) {
        res.json({
          cached: true,
          format: 'wav',
          voice: geminiVoice,
          model: 'gemini-3.8-flash-lite-tts',
          audio_base64: ttsAudioCache.get(cacheKey),
          audio_url: null,
        })
        return
      }

      const ai = getGenAIClient()
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                // @ts-ignore - speechMetadata supported by Gemini 3.8 TTS
                speechMetadata: {
                  style:
                    'Warm, affectionate, cheerful, natural Brazilian Portuguese female tutor speaking clearly and expressively to a child',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: geminiVoice },
            },
          },
        },
      })

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)?.inlineData
          ?.data || ''

      if (!base64Audio) {
        res.status(200).json({
          cached: false,
          format: 'wav',
          voice: geminiVoice,
          model: 'gemini-3.8-flash-lite-tts',
          audio_base64: '',
          audio_url: null,
        })
        return
      }

      const dataUri = `data:audio/wav;base64,${base64Audio}`
      if (ttsAudioCache.size > 200) {
        const firstKey = ttsAudioCache.keys().next().value
        if (firstKey) ttsAudioCache.delete(firstKey)
      }
      ttsAudioCache.set(cacheKey, dataUri)

      res.json({
        cached: false,
        format: 'wav',
        voice: geminiVoice,
        model: 'gemini-3.8-flash-lite-tts',
        audio_base64: dataUri,
        audio_url: null,
      })
    } catch (error: any) {
      console.error('[Server TTS Error]:', error?.message || error)
      res.status(200).json({
        cached: false,
        format: 'wav',
        voice: 'Kore',
        model: 'gemini-3.8-flash-lite-tts',
        audio_base64: '',
        audio_url: null,
        error: error?.message || 'Erro ao sintetizar voz IA',
      })
    }
  }

  app.post('/api/lumi/tts', handleTtsRequest)
  app.post('/backend/v1/lumi/tts', handleTtsRequest)

  const httpServer = createServer(app)

  // Real-time Gemini Live API WebSocket Server (/api/lumi/live)
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
      if (reqUrl.pathname === '/api/lumi/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request)
        })
      }
    } catch (err) {
      console.error('[WS Upgrade Error]:', err)
    }
  })

  wss.on('connection', async (clientWs: WebSocket, request) => {
    let liveSession: any = null
    let isClosing = false

    const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
    const initialVoice = resolveGeminiVoice(reqUrl.searchParams.get('voice') || 'Kore')
    const criancaNome = reqUrl.searchParams.get('nome') || 'Ana Paula'
    const criancaIdade = Number(reqUrl.searchParams.get('idade')) || 10
    const criancaSerie = reqUrl.searchParams.get('serie') || '5º Ano'
    const criancaLocalidade = reqUrl.searchParams.get('localidade') || 'Brasil'
    const criancaObservacoes = reqUrl.searchParams.get('observacoes') || ''
    const materia = reqUrl.searchParams.get('materia') || 'ciencias'
    const etapaSocratica = reqUrl.searchParams.get('etapa') || 'entender'

    const sendToClient = (payload: Record<string, any>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload))
      }
    }

    try {
      const ai = getGenAIClient()
      const systemInstruction = buildLumiSystemInstruction({
        criancaNome,
        criancaIdade,
        criancaSerie,
        criancaLocalidade,
        criancaObservacoes,
        materia,
        etapaSocratica,
      })

      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: initialVoice },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            sendToClient({
              type: 'connected',
              voice: initialVoice,
              model: 'gemini-3.8-live',
            })
          },
          onmessage: (message: LiveServerMessage) => {
            try {
              const serverContent = message.serverContent
              if (!serverContent) return

              // 1. Model audio chunks (24kHz PCM16 LE base64)
              const parts = serverContent.modelTurn?.parts || []
              for (const part of parts) {
                if (part.inlineData?.data) {
                  sendToClient({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                }
                if (part.text) {
                  sendToClient({
                    type: 'model_text',
                    text: part.text,
                  })
                }
              }

              // 2. Live input audio transcription (what the child said)
              if (serverContent.inputTranscription?.text) {
                sendToClient({
                  type: 'input_transcription',
                  text: serverContent.inputTranscription.text,
                })
              }

              // 3. Live output audio transcription (what Lumi is speaking)
              if (serverContent.outputTranscription?.text) {
                sendToClient({
                  type: 'output_transcription',
                  text: serverContent.outputTranscription.text,
                })
              }

              // 4. Barge-in / Interruption
              if (serverContent.interrupted) {
                sendToClient({
                  type: 'interrupted',
                })
              }

              // 5. Turn completion
              if (serverContent.turnComplete) {
                sendToClient({
                  type: 'turn_complete',
                })
              }
            } catch (msgErr) {
              console.error('[Live onmessage error]:', msgErr)
            }
          },
          onerror: (err: any) => {
            console.error('[Gemini Live Session Error]:', err)
            sendToClient({
              type: 'error',
              message: err?.message || 'Erro na sessão de voz em tempo real da Lumi.',
            })
          },
          onclose: () => {
            if (!isClosing) {
              sendToClient({ type: 'disconnected' })
            }
          },
        },
      })
    } catch (connErr: any) {
      console.error('[Failed to connect Gemini Live]:', connErr)
      sendToClient({
        type: 'error',
        message:
          connErr?.message ||
          'Não foi possível conectar ao servidor Gemini Live de voz em tempo real.',
      })
      clientWs.close()
      return
    }

    clientWs.on('message', (rawData) => {
      if (!liveSession) return
      try {
        const msg = JSON.parse(rawData.toString())

        if (msg.type === 'audio' && msg.audio) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          })
        } else if (msg.type === 'text' && msg.text) {
          liveSession.sendRealtimeInput({
            text: String(msg.text),
          })
        }
      } catch (parseErr) {
        console.warn('[WS client message error]:', parseErr)
      }
    })

    clientWs.on('close', () => {
      isClosing = true
      if (liveSession) {
        try {
          liveSession.close()
        } catch {
          // ignore
        }
        liveSession = null
      }
    })

    clientWs.on('error', () => {
      isClosing = true
      if (liveSession) {
        try {
          liveSession.close()
        } catch {
          // ignore
        }
        liveSession = null
      }
    })
  })

  // Mount Vite dev server in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(__dirname, 'dist')
    app.use(express.static(distPath))
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lumi Server] Running on http://0.0.0.0:${PORT} (Gemini Live + TTS enabled)`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
})
