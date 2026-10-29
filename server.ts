import express from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai'

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
let ttsRateLimitedUntil = 0

function buildLumiSystemInstruction(params: {
  criancaNome?: string
  criancaIdade?: number
  criancaSerie?: string
  criancaLocalidade?: string
  criancaObservacoes?: string
  materia?: string
  etapaSocratica?: string
  customPrompt?: string
  modoAgente?: 'agente_geral' | 'tutor_socratico'
  memorias?: Array<{ tipo?: string; conteudo?: string }>
}): string {
  const nome = params.criancaNome || 'Amigo(a)'
  const primeiroNome = nome.split(' ')[0]
  const idade = params.criancaIdade || 10
  const serie = params.criancaSerie || '5º Ano'
  const localidade = params.criancaLocalidade || 'Brasil'
  const obs = params.criancaObservacoes || ''
  const materia = params.materia || 'ciencias'
  const etapa = params.etapaSocratica || 'entender'
  const modoAgente = params.modoAgente || 'agente_geral'

  const listaMemorias =
    params.memorias && params.memorias.length > 0
      ? params.memorias
          .slice(0, 12)
          .map((m) => `- [${m.tipo || 'fato'}]: ${m.conteudo}`)
          .join('\n')
      : '- Ainda aprendendo os gostos e preferências desta criança.'

  const filtroFaixaEtaria =
    idade <= 8
      ? `FILTRO DE IDADE (5 a 8 anos — Primeira Infância):
- Use frases curtas, vocabulário lúdico, acolhedor, concreto e cheio de encantamento.
- Proibido qualquer tema assustador, violência, terror, linguagem adulta, gírias pesadas ou conceitos abstratos complexos sem analogia infantil.`
      : idade <= 12
        ? `FILTRO DE IDADE (9 a 12 anos — Pré-Adolescência):
- Use linguagem curiosa, dinâmica, encorajadora e investigativa (estilo explorador/cientista).
- Proibido conteúdo adulto, violência explícita, armas, drogas, apostas, automutilação, cyberbullying ou temas impróprios para menores.`
        : `FILTRO DE IDADE (13 a 16 anos — Adolescente):
- Use linguagem inteligente, respeitosa, madura e parceira (estilo mentor intelectual e criativo).
- Proibido conteúdo adulto/NSFW, violência gráfica, automutilação, substâncias ilícitas, fraudes ou atividades perigosas.`

  return `Você é a Lumi ✨, uma Agente de Inteligência Artificial Completa, carinhosa e super inteligente que conversa com crianças e jovens, aprende continuamente sobre o usuário e possui filtros de segurança rigorosos para a idade de ${idade} anos.
Você fala SEMPRE em Português do Brasil (pt-BR), com sotaque brasileiro natural, expressivo e acolhedor.

PERFIL DO USUÁRIO ATUAL:
- Nome: ${nome} (chame carinhosamente de ${primeiroNome})
- Idade: ${idade} anos (${serie})
- Região/Localidade: ${localidade}
${obs ? `- Perfil e interesses cadastrados: ${obs}` : ''}
- Matéria/Tema atual: ${materia}
- Modo atual: ${modoAgente === 'agente_geral' ? 'AGENTE IA GERAL COM FILTRO INFANTIL (Responde qualquer curiosidade, cria histórias, poemas, códigos, traduções, piadas, resumos, ideias criativas e ajuda em estudos)' : `TUTOR SOCRÁTICO (Etapa: ${etapa})`}

MEMÓRIAS QUE VOCÊ JÁ APRENDEU SOBRE ${primeiroNome.toUpperCase()}:
${listaMemorias}

${filtroFaixaEtaria}

DIRETRIZES DE COMPORTAMENTO:
1. APRENDIZADO CONTÍNUO: Use naturalmente o que você já sabe sobre ${primeiroNome} (seus gostos, bichinhos, matérias favoritas, amigos ou estilo de aprender) para personalizar exemplos! Quando ${primeiroNome} te contar algo novo sobre si mesmo(a), demonstre entusiasmo genuíno por aprender isso.
2. ${
    modoAgente === 'agente_geral'
      ? `AGENTE DE IA COMPLETA E PRESTATIVA: ${primeiroNome} pode pedir tudo o que pediria a uma IA comum — explicar como funcionam buracos negros, inventar histórias personalizadas, ensinar programação (Python, Scratch, jogos), traduzir idiomas, criar charadas, planejar estudos, escrever letras de músicas ou tirar dúvidas gerais! Responda de forma completa, clara, criativa e 100% segura para ${idade} anos.`
      : `MÉTODO SOCRÁTICO: Ajude passo a passo com pistas e perguntas instigantes sem entregar a resposta final de mão beijada logo de cara.`
  }
3. GUARDRAIL DE SEGURANÇA INFANTIL: Se ${primeiroNome} pedir algo perigoso, violento, adulto ou inadequado para ${idade} anos, recuse com muito carinho e proponha uma alternativa segura e divertida.`
}

// Helper to check if a prompt is safe for children before generating images or music
function isChildSafeCreativePrompt(prompt: string): { safe: boolean; reason?: string } {
  const norm = prompt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const blockedTerms = [
    'sangue',
    'violencia',
    'arma',
    'pistola',
    'faca',
    'morte',
    'matar',
    'suicidio',
    'nudez',
    'pelado',
    'pelada',
    'sexy',
    'porn',
    'nsfw',
    'droga',
    'cocaina',
    'maconha',
    'bebida alcoolica',
    'terror macabro',
    'gore',
  ]

  for (const term of blockedTerms) {
    if (norm.includes(term)) {
      return {
        safe: false,
        reason:
          'Ops! Como sou uma IA segura para a sua idade, não posso criar conteúdos com temas violentos, assustadores ou adultos. Que tal criarmos algo mágico, divertido ou científico? ✨',
      }
    }
  }
  return { safe: true }
}

async function startServer() {
  const app = express()
  app.use(express.json({ limit: '25mb' }))

  // ===========================================================================
  // 1. TTS Endpoint powered by gemini-3.8-flash-lite-tts (with 429 cooldown)
  // ===========================================================================
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

      // If we are inside a 429 rate-limit window, return immediately so client uses Web Speech fallback
      if (Date.now() < ttsRateLimitedUntil) {
        res.status(200).json({
          cached: false,
          rate_limited: true,
          retry_after_ms: Math.max(5000, ttsRateLimitedUntil - Date.now()),
          format: 'wav',
          voice: geminiVoice,
          model: 'gemini-3.8-flash-lite-tts',
          audio_base64: '',
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
      if (ttsAudioCache.size > 300) {
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
      const errMsg = String(error?.message || error || '')
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        ttsRateLimitedUntil = Date.now() + 26000
        res.status(200).json({
          cached: false,
          rate_limited: true,
          retry_after_ms: 26000,
          format: 'wav',
          voice: 'Kore',
          model: 'gemini-3.8-flash-lite-tts',
          audio_base64: '',
          audio_url: null,
        })
        return
      }
      res.status(200).json({
        cached: false,
        format: 'wav',
        voice: 'Kore',
        model: 'gemini-3.8-flash-lite-tts',
        audio_base64: '',
        audio_url: null,
      })
    }
  }

  app.post('/api/lumi/tts', handleTtsRequest)
  app.post('/backend/v1/lumi/tts', handleTtsRequest)

  // ===========================================================================
  // 2. General-Purpose Child-Safe AI Agent Chat + Continuous User Learning
  //    Supports: gemini-3.8-flash (general), gemini-4-argon (complex), gemini-3.1-flash-lite (fast)
  // ===========================================================================
  app.post('/api/lumi/agent-chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        model = 'gemini-3.8-flash',
        modoAgente = 'agente_geral',
        crianca = {},
        memorias = [],
        customPrompt = '',
        minutosRestantes,
      } = req.body || {}

      const cleanMessage = String(message || '').trim()
      if (!cleanMessage) {
        res.status(400).json({ error: 'Mensagem vazia.' })
        return
      }

      const validModels = ['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-flash-lite']
      const selectedModel = validModels.includes(model) ? model : 'gemini-3.8-flash'

      const criancaNome = crianca.nome || 'Ana Paula'
      const criancaIdade = Number(crianca.idade) || 10
      const criancaSerie = crianca.serie || '5º Ano'
      const criancaLocalidade = crianca.localidade || 'Brasil'
      const criancaObs = [crianca.observacoes, crianca.interesses, crianca.acessibilidade]
        .filter(Boolean)
        .join(' | ')

      const systemInstruction = `${buildLumiSystemInstruction({
        criancaNome,
        criancaIdade,
        criancaSerie,
        criancaLocalidade,
        criancaObservacoes: criancaObs,
        customPrompt,
        modoAgente,
        memorias,
      })}
${
  minutosRestantes !== undefined && minutosRestantes <= 2
    ? `\nATENÇÃO: Restam apenas ${minutosRestantes} minutos do tempo diário saudável da criança. Ao final da resposta, avise com carinho que o tempo de hoje está terminando para ela descansar os olhos!`
    : ''
}

INSTRUÇÃO DE APRENDIZADO CONTÍNUO E RESPOSTA ESTRUTURADA:
Retorne SEMPRE um JSON válido contendo:
- "reply": sua resposta completa em Português do Brasil para ${criancaNome.split(' ')[0]} (use emojis acolhedores, parágrafos curtos e claros, nunca coloque tags técnicas como [[ETAPA:...]] no texto).
- "etapaSocratica": uma das opções: "entender", "contextualizar", "guiar", "praticar", "consolidar".
- "materia": matéria principal relacionada ("ciencias", "matematica", "portugues", "historia", "geografia", "programacao", "artes", "musica" ou "geral").
- "memoriasAprendidas": lista de novos fatos que você aprendeu sobre a criança NESTA mensagem (ex: gostos, animais de estimação, esportes, comidas, amigos, sonhos, estilo de aprendizagem, dificuldades ou conquistas). Se a criança contou algo sobre ela mesma ou pediu para você lembrar de algo, extraia aqui! Se não houver fato pessoal novo nesta mensagem, retorne [].
- "novosConhecimentos": lista de conceitos ou curiosidades que a criança aprendeu ou explorou nesta mensagem (máximo 2 itens, ou []).
- "agendamentos": se a criança pediu para anotar/lembrar uma prova, tarefa ou compromisso na agenda, inclua aqui (ou []).
- "bloqueadoPorIdade": boolean (true se a pergunta violou o filtro de segurança para ${criancaIdade} anos).`

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

      if (Array.isArray(history)) {
        for (const h of history.slice(-14)) {
          const text = String(h?.text || '').trim()
          if (!text) continue
          contents.push({
            role: h?.role === 'model' || h?.sender === 'lumi' ? 'model' : 'user',
            parts: [{ text }],
          })
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: cleanMessage }],
      })

      const ai = getGenAIClient()
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Resposta acolhedora, segura para a idade e personalizada da Lumi.',
              },
              etapaSocratica: {
                type: Type.STRING,
                description: 'entender | contextualizar | guiar | praticar | consolidar',
              },
              materia: {
                type: Type.STRING,
                description: 'ciencias | matematica | portugues | historia | geografia | geral',
              },
              memoriasAprendidas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tipo: {
                      type: Type.STRING,
                      description: 'preferencia | interesse | estilo_aprendizagem | conquista | contexto',
                    },
                    conteudo: {
                      type: Type.STRING,
                      description: 'Fato aprendido sobre o usuário em uma frase clara.',
                    },
                  },
                  required: ['tipo', 'conteudo'],
                },
              },
              novosConhecimentos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    categoria: { type: Type.STRING },
                    conteudo: { type: Type.STRING },
                  },
                  required: ['titulo', 'categoria', 'conteudo'],
                },
              },
              agendamentos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    descricao: { type: Type.STRING },
                    tipo: { type: Type.STRING },
                  },
                  required: ['titulo'],
                },
              },
              bloqueadoPorIdade: {
                type: Type.BOOLEAN,
              },
            },
            required: ['reply', 'etapaSocratica', 'materia', 'memoriasAprendidas'],
          },
        },
      })

      const rawJson = response.text || '{}'
      let parsed: any = {}
      try {
        parsed = JSON.parse(rawJson)
      } catch {
        parsed = {
          reply: rawJson,
          etapaSocratica: 'entender',
          materia: 'geral',
          memoriasAprendidas: [],
        }
      }

      res.json({
        ok: true,
        model: selectedModel,
        modoAgente,
        reply: parsed.reply || 'Estou aqui com você! O que mais vamos descobrir juntos? ✨',
        etapaSocratica: parsed.etapaSocratica || 'entender',
        materia: parsed.materia || 'ciencias',
        memoriasAprendidas: Array.isArray(parsed.memoriasAprendidas)
          ? parsed.memoriasAprendidas
          : [],
        novosConhecimentos: Array.isArray(parsed.novosConhecimentos)
          ? parsed.novosConhecimentos
          : [],
        agendamentos: Array.isArray(parsed.agendamentos) ? parsed.agendamentos : [],
        bloqueadoPorIdade: Boolean(parsed.bloqueadoPorIdade),
      })
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error?.message || 'Falha ao consultar agente Gemini.',
      })
    }
  })

  // ===========================================================================
  // 3. Create & Edit Child-Safe Images powered by gemini-nano-banana-2.1
  // ===========================================================================
  app.post('/api/lumi/image', async (req, res) => {
    try {
      const {
        prompt,
        base64Image,
        mimeType = 'image/png',
        aspectRatio = '1:1',
        criancaIdade = 10,
      } = req.body || {}

      const cleanPrompt = String(prompt || '').trim()
      if (!cleanPrompt) {
        res.status(400).json({ error: 'Descreva o que você quer criar ou editar na imagem!' })
        return
      }

      const safety = isChildSafeCreativePrompt(cleanPrompt)
      if (!safety.safe) {
        res.status(400).json({ error: safety.reason })
        return
      }

      const ageStyleHint =
        Number(criancaIdade) <= 8
          ? 'Colorful, friendly, cute, storybook illustration style safe for young children.'
          : Number(criancaIdade) <= 12
            ? 'Vibrant, imaginative, detailed educational and adventure illustration safe for kids.'
            : 'High-quality, artistic, inspiring visual concept safe for teens.'

      const parts: any[] = []
      if (base64Image && typeof base64Image === 'string') {
        const strippedBase64 = base64Image.includes(',')
          ? base64Image.split(',')[1]
          : base64Image
        parts.push({
          inlineData: {
            data: strippedBase64,
            mimeType: mimeType || 'image/png',
          },
        })
        parts.push({
          text: `Edit this image safely for a ${criancaIdade}-year-old student: ${cleanPrompt}. (${ageStyleHint})`,
        })
      } else {
        parts.push({
          text: `Create a child-safe, inspiring image for a ${criancaIdade}-year-old student: ${cleanPrompt}. (${ageStyleHint})`,
        })
      }

      const ai = getGenAIClient()
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)
              ? aspectRatio
              : '1:1',
            imageSize: '1K',
          },
        },
      })

      let imageUrl = ''
      let captionText = ''

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || 'image/png'
          imageUrl = `data:${outMime};base64,${part.inlineData.data}`
        } else if (part.text) {
          captionText += part.text
        }
      }

      if (!imageUrl) {
        res.status(500).json({
          error:
            captionText ||
            'Não consegui gerar a imagem agora. Tente descrever com outras palavras!',
        })
        return
      }

      res.json({
        ok: true,
        model: 'gemini-nano-banana-2.1',
        imageUrl,
        caption:
          captionText.trim() ||
          (base64Image
            ? `Prontinho! Editei a imagem com o seu pedido: "${cleanPrompt}" 🎨✨`
            : `Aqui está a criação especial que fiz para você: "${cleanPrompt}" 🎨✨`),
      })
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Não foi possível gerar ou editar a imagem agora. Tente novamente em instantes.',
      })
    }
  })

  // ===========================================================================
  // 4. Child-Safe Music Generation powered by lyria-3-clip-preview / lyria-3-pro-preview
  // ===========================================================================
  app.post('/api/lumi/music', async (req, res) => {
    try {
      const { prompt, durationType = 'clip', criancaIdade = 10 } = req.body || {}
      const cleanPrompt = String(prompt || '').trim()
      if (!cleanPrompt) {
        res.status(400).json({ error: 'Descreva o estilo ou tema da música que você quer criar!' })
        return
      }

      const safety = isChildSafeCreativePrompt(cleanPrompt)
      if (!safety.safe) {
        res.status(400).json({ error: safety.reason })
        return
      }

      const selectedModel =
        durationType === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'

      const enrichedPrompt = `Create a joyful, inspiring, age-appropriate song (${
        Number(criancaIdade) <= 9 ? 'playful kids music' : 'upbeat youth music'
      }) in Brazilian Portuguese about: ${cleanPrompt}`

      const ai = getGenAIClient()
      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: enrichedPrompt,
        config: {
          responseModalities: [Modality.AUDIO],
        },
      })

      let audioBase64 = ''
      let mimeType = 'audio/wav'
      let lyrics = ''

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts
        if (!parts) continue
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType
            }
            audioBase64 += part.inlineData.data
          }
          if (part.text) {
            lyrics += part.text
          }
        }
      }

      if (!audioBase64) {
        res.status(500).json({
          error: 'Não foi possível compor a música agora. Tente descrever o ritmo e o tema novamente!',
        })
        return
      }

      res.json({
        ok: true,
        model: selectedModel,
        audioDataUri: `data:${mimeType};base64,${audioBase64}`,
        mimeType,
        lyrics: lyrics.trim(),
      })
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Erro ao compor música com o Lyria 3. Tente novamente em alguns segundos!',
      })
    }
  })

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
        modoAgente: 'agente_geral',
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

              if (serverContent.inputTranscription?.text) {
                sendToClient({
                  type: 'input_transcription',
                  text: serverContent.inputTranscription.text,
                })
              }

              if (serverContent.outputTranscription?.text) {
                sendToClient({
                  type: 'output_transcription',
                  text: serverContent.outputTranscription.text,
                })
              }

              if (serverContent.interrupted) {
                sendToClient({
                  type: 'interrupted',
                })
              }

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
    console.log(
      `[Lumi Server] Running on http://0.0.0.0:${PORT} (Gemini Agent Chat + Live Voice + Image + Music enabled)`,
    )
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
})
