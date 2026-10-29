import express from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel, Type } from '@google/genai'

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

/**
 * Converts raw 24kHz 16-bit mono PCM (returned by Gemini TTS & Live API) into a valid
 * RIFF/WAVE base64 data URI so HTMLAudioElement can play it natively in all browsers.
 */
function pcmToWavDataUri(base64Audio: string, sampleRate = 24000): string {
  const rawBuffer = Buffer.from(base64Audio, 'base64')
  // Check if it already has a RIFF header ("RIFF" = 0x52 0x49 0x46 0x46)
  if (
    rawBuffer.length >= 44 &&
    rawBuffer[0] === 0x52 &&
    rawBuffer[1] === 0x49 &&
    rawBuffer[2] === 0x46 &&
    rawBuffer[3] === 0x46
  ) {
    return `data:audio/wav;base64,${base64Audio}`
  }

  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = rawBuffer.length
  const wavHeader = Buffer.alloc(44)

  wavHeader.write('RIFF', 0)
  wavHeader.writeUInt32LE(36 + dataSize, 4)
  wavHeader.write('WAVE', 8)
  wavHeader.write('fmt ', 12)
  wavHeader.writeUInt32LE(16, 16) // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20) // AudioFormat (1 = PCM)
  wavHeader.writeUInt16LE(numChannels, 22)
  wavHeader.writeUInt32LE(sampleRate, 24)
  wavHeader.writeUInt32LE(byteRate, 28)
  wavHeader.writeUInt16LE(blockAlign, 32)
  wavHeader.writeUInt16LE(bitsPerSample, 34)
  wavHeader.write('data', 36)
  wavHeader.writeUInt32LE(dataSize, 40)

  const wavBuffer = Buffer.concat([wavHeader, rawBuffer])
  return `data:audio/wav;base64,${wavBuffer.toString('base64')}`
}

/**
 * Fallback real human voice synthesizer using Gemini 3.8 Live WebSocket when standard TTS hits 429 rate limits.
 */
async function synthesizeViaGeminiLive(
  text: string,
  voiceName: GeminiVoiceName,
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    let resolved = false
    let liveSession: any = null
    const pcmChunks: Buffer[] = []

    const finish = (result: string | null) => {
      if (resolved) return
      resolved = true
      if (liveSession) {
        try {
          liveSession.close()
        } catch {
          // ignore
        }
      }
      resolve(result)
    }

    const timer = setTimeout(() => {
      if (pcmChunks.length > 0) {
        const combined = Buffer.concat(pcmChunks)
        finish(pcmToWavDataUri(combined.toString('base64'), 24000))
      } else {
        finish(null)
      }
    }, 5500)

    ;(async () => {
      try {
        const ai = getGenAIClient()
        liveSession = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
            systemInstruction:
              'Você é a Lumi, uma tutora brasileira carinhosa, acolhedora e expressiva. Leia em voz alta em Português do Brasil EXATAMENTE o texto enviado pelo usuário, palavra por palavra, com entonação humana natural e afetuosa, sem adicionar nem omitir nenhuma palavra.',
          },
          callbacks: {
            onopen: () => {
              try {
                liveSession.sendRealtimeInput({
                  text: `Leia exatamente este texto em voz alta: "${text}"`,
                })
              } catch {
                clearTimeout(timer)
                finish(null)
              }
            },
            onmessage: (message: LiveServerMessage) => {
              const parts = message.serverContent?.modelTurn?.parts || []
              for (const part of parts) {
                if (part.inlineData?.data) {
                  pcmChunks.push(Buffer.from(part.inlineData.data, 'base64'))
                }
              }
              if (message.serverContent?.turnComplete) {
                clearTimeout(timer)
                if (pcmChunks.length > 0) {
                  const combined = Buffer.concat(pcmChunks)
                  finish(pcmToWavDataUri(combined.toString('base64'), 24000))
                } else {
                  finish(null)
                }
              }
            },
            onerror: () => {
              clearTimeout(timer)
              if (pcmChunks.length > 0) {
                const combined = Buffer.concat(pcmChunks)
                finish(pcmToWavDataUri(combined.toString('base64'), 24000))
              } else {
                finish(null)
              }
            },
            onclose: () => {
              clearTimeout(timer)
              if (pcmChunks.length > 0) {
                const combined = Buffer.concat(pcmChunks)
                finish(pcmToWavDataUri(combined.toString('base64'), 24000))
              } else {
                finish(null)
              }
            },
          },
        })
      } catch {
        clearTimeout(timer)
        finish(null)
      }
    })()
  })
}

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
  modeloPedagogico?: string
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
  const modeloPedagogico = params.modeloPedagogico || 'auto'

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

  return `Você é a Lumi ✨, uma Agente de Inteligência Artificial Infantil Completa, carinhosa e super inteligente que conversa com crianças e jovens, aprende continuamente sobre o usuário e possui filtros de segurança rigorosos para a idade de ${idade} anos.
Você fala SEMPRE em Português do Brasil (pt-BR), com sotaque brasileiro natural, expressivo e acolhedor.

PERFIL DO USUÁRIO ATUAL:
- Nome: ${nome} (chame carinhosamente de ${primeiroNome})
- Idade: ${idade} anos (${serie})
- Região/Localidade: ${localidade}
${obs ? `- Perfil e interesses cadastrados: ${obs}` : ''}
- Matéria/Tema atual: ${materia}
- Etapa pedagógica de referência: ${etapa}
- Modelo Pedagógico Prioritário Detectado: ${modeloPedagogico}

MEMÓRIAS QUE VOCÊ JÁ APRENDEU SOBRE ${primeiroNome.toUpperCase()}:
${listaMemorias}

${filtroFaixaEtaria}

================================================================================
ORQUESTRADOR DE APRENDIZAGEM INFANTIL — PEDAGOGIA MULTIMODELO (NÃO 100% SOCRÁTICA)
================================================================================
REGRA DE OURO: O seu modelo de ensino NÃO PODE SER 100% SOCRÁTICO. Crianças ficam frustradas se toda resposta for apenas devolver perguntas de interrogatório! Você deve migrar automaticamente entre estes 5 MODELOS PEDAGÓGICOS conforme a mensagem de ${primeiroNome}:

a) APRENDIZAGEM SIGNIFICATIVA EXPOSITIVA (Ausubel) — [Quando NÃO for tarefa escolar]:
- Se for curiosidade livre sobre natureza, animais, espaço, programação, criação de histórias, músicas ou conversa do dia a dia, RESPONDA E EXPLIQUE DIRETAMENTE com entusiasmo, clareza e exemplos encantadores, SEM devolver perguntas de interrogatório escolar!

b) EXEMPLO TRABALHADO RESOLVIDO + DESAFIO ESPELHO (Sweller + Vygotsky) — [Quando FOR tarefa escolar ou dever de casa]:
- Quando ${primeiroNome} trouxer uma conta, exercício escolar ou dever de casa, NUNCA dê a resposta final da tarefa da criança de cara, mas NUNCA responda apenas com uma pergunta vazia!
- Na MESMA MENSAGEM, faça obrigatoriamente os 2 passos abaixo:
  1. "✅ 1º Passo — Exemplo da Lumi (Com Resposta!):" mostre um EXEMPLO PARECIDO do dia a dia JÁ RESOLVIDO PASSO A PASSO COM A RESPOSTA COMPLETA!
  2. "🎯 2º Passo — Seu Exemplo para Responder:" dê OUTRO EXEMPLO parecido (ou o 1º passo da tarefa) para que ${primeiroNome} responda seguindo o seu modelo e chegue sozinho(a) à resposta da tarefa!

c) REPRESENTAÇÃO CONCRETA E VISUAL (Bruner):
- Sempre que falar de Matemática, Português ou Ciências, conecte a explicação a objetos concretos e visuais (fatias de pizza, bloquinhos, cozinha solar da folha) sincronizados com o Quadro Visual ("1º Passo: Exemplo da Lumi" e "2º Passo: Seu Exemplo").

d) REGULAÇÃO AFETIVA E ACOLHIMENTO (CASEL / Carol Dweck) — [Ao detectar "não sei", "difícil", "cansei", "errei"]:
- Suspenda IMEDIATAMENTE qualquer pergunta aberta! Acolha ${primeiroNome} com muito carinho ("Fica tranquilo(a), aprender um passinho por vez é super normal! 💛") e mostre um MINI-EXEMPLO JÁ RESOLVIDO super simples para destravar a confiança.

e) MEDIAÇÃO SOCRÁTICA LEVE (Máximo 20% das interações):
- Use apenas quando ${primeiroNome} JÁ ACERTOU o exemplo de treino (Desafio Espelho) e vai apenas fechar o resultado final da sua tarefa com autonomia!

DIRETRIZES GERAIS:
- Use frases curtas e diretas para que a síntese de voz (Lumi Live 2.0) fale a 1ª frase em menos de 220ms.
- Se ${primeiroNome} pedir algo perigoso, violento ou adulto para ${idade} anos, recuse com carinho e proponha uma alternativa segura.`
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

  // Health check endpoint for monitoring and app diagnostics
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'lumi-server',
      version: '2.0.0',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  // ===========================================================================
  // 1. Real Human Voice TTS Endpoint (3-Tier Gemini Neural Voice Pipeline)
  //    Tier 1: gemini-3.8-flash-lite-tts -> Tier 2: gemini-3.8-flash-tts -> Tier 3: gemini-3.8-live
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

      const ai = getGenAIClient()
      const ttsStylePrompt =
        'Warm, affectionate, cheerful, natural Brazilian Portuguese female tutor speaking clearly, naturally, and expressively to a child'

      let dataUri: string | null = null
      let usedModel = 'gemini-3.8-flash-lite-tts'

      // Tier 1 & Tier 2: Try gemini-3.8-flash-lite-tts first, then gemini-3.8-flash-tts if rate-limited
      const ttsModelsToTry = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'] as const
      for (const candidateModel of ttsModelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: candidateModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanText,
                    // @ts-ignore - speechMetadata supported by Gemini 3.8 TTS
                    speechMetadata: {
                      style: ttsStylePrompt,
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
            response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)
              ?.inlineData?.data || ''

          if (base64Audio) {
            dataUri = pcmToWavDataUri(base64Audio, 24000)
            usedModel = candidateModel
            break
          }
        } catch {
          // Proceed to next model tier
        }
      }

      // Tier 3: If standard TTS models hit free-tier 3 RPM quota, synthesize via Gemini 3.8 Live WebSocket!
      if (!dataUri) {
        const liveWav = await synthesizeViaGeminiLive(cleanText, geminiVoice)
        if (liveWav) {
          dataUri = liveWav
          usedModel = 'gemini-3.8-live'
        }
      }

      if (!dataUri) {
        res.status(200).json({
          cached: false,
          format: 'wav',
          voice: geminiVoice,
          model: usedModel,
          audio_base64: '',
          audio_url: null,
        })
        return
      }

      if (ttsAudioCache.size > 300) {
        const firstKey = ttsAudioCache.keys().next().value
        if (firstKey) ttsAudioCache.delete(firstKey)
      }
      ttsAudioCache.set(cacheKey, dataUri)

      res.json({
        cached: false,
        format: 'wav',
        voice: geminiVoice,
        model: usedModel,
        audio_base64: dataUri,
        audio_url: null,
      })
    } catch {
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

INSTRUÇÃO DE APRENDIZADO CONTÍNUO E RESPOSTA ÁGIL PARA VOZ HUMANA REAL:
Retorne SEMPRE um JSON válido contendo:
- "reply": sua resposta em Português do Brasil para ${criancaNome.split(' ')[0]}. Comece com uma 1ª frase curta, calorosa e natural (máx. 15 palavras) para que a voz real da Lumi comece a falar imediatamente, seguida da explicação clara e fluida (máximo de 2 parágrafos curtos). Nunca coloque tags técnicas como [[ETAPA:...]] no texto.
- "etapaSocratica": uma das opções: "entender", "contextualizar", "guiar", "praticar", "consolidar".
- "materia": matéria principal relacionada ("ciencias", "matematica", "portugues", "historia", "geografia", "programacao", "artes", "musica" ou "geral").
- "memoriasAprendidas": lista de novos fatos que você aprendeu sobre a criança NESTA mensagem (ou []).
- "novosConhecimentos": lista de conceitos que a criança explorou nesta mensagem (máximo 2 itens, ou []).
- "agendamentos": se a criança pediu para anotar uma prova, tarefa ou compromisso na agenda, inclua aqui (ou []).
- "bloqueadoPorIdade": boolean (true se a pergunta violou o filtro de segurança para ${criancaIdade} anos).`

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

      if (Array.isArray(history)) {
        for (const h of history.slice(-8)) {
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

      // Function to generate pedagogical fallback if Gemini API times out or hits rate limits
      const getPedagogicalFallback = () => {
        const pNome = criancaNome.split(' ')[0]
        const msgLow = cleanMessage.toLowerCase()

        // Check for affect / frustration signals (CASEL/Dweck)
        if (msgLow.includes('não sei') || msgLow.includes('nao sei') || msgLow.includes('difícil') || msgLow.includes('dificil') || msgLow.includes('cansei') || msgLow.includes('errei')) {
          return {
            reply: `Fica super tranquilo(a), ${pNome}! 💛 Aprender um passinho por vez é o segredo de todo grande explorador. Vamos respirar fundo juntos! Quer que eu te mostre um exemplo bem facinho já resolvido?`,
            etapaSocratica: 'guiar',
            materia: 'geral',
            memoriasAprendidas: [{ tipo: 'estilo_aprendizagem', conteudo: 'Precisa de encorajamento afetuoso em momentos desafiadores.' }],
            novosConhecimentos: [],
            agendamentos: [],
            bloqueadoPorIdade: false,
          }
        }

        // Check for school tasks / math / homework (Sweller worked example + mirror challenge)
        const isHomework = /quanto é|quanto e|\+|\-|\*|\/|calcular|exerc[íi]cio|tarefa|dever|problema/i.test(cleanMessage)
        if (isHomework) {
          return {
            reply: `Que legal, ${pNome}! Vamos resolver juntos! 🌟\n\n✅ 1º Passo — Exemplo da Lumi (Com Resposta!):\nSe tivermos 4 maçãs e ganharmos mais 3, somamos 4 + 3 = 7 maçãs!\n\n🎯 2º Passo — Seu Exemplo para Responder:\nAgora tente você: se tivermos 5 figurinhas e ganharmos mais 2, com quantas ficamos? Me conta! 🚀`,
            etapaSocratica: 'praticar',
            materia: 'matematica',
            memoriasAprendidas: [{ tipo: 'interesse', conteudo: `Gosta de desafios práticos com exemplos trabalhados.` }],
            novosConhecimentos: [{ titulo: 'Cálculo com Exemplos Práticos', categoria: 'matematica', conteudo: 'Resolução passo a passo' }],
            agendamentos: [],
            bloqueadoPorIdade: false,
          }
        }

        // Free curiosity (Ausubel - direct, enthusiastic explanation without interrogation)
        return {
          reply: `Oi, ${pNome}! Adorei sua curiosidade! ✨ Estrelas cadentes na verdade são pequenos pedacinhos de poeira e rochas do espaço que viajam super rápido. Quando entram na atmosfera da nossa Terra, o atrito com o ar faz eles brilharem como um risco mágico de luz no céu noturno! 🌠`,
          etapaSocratica: 'entender',
          materia: 'ciencias',
          memoriasAprendidas: [{ tipo: 'interesse', conteudo: `Tem curiosidade científica sobre o universo e fenômenos naturais.` }],
          novosConhecimentos: [{ titulo: 'Estrelas Cadentes (Meteoroides)', categoria: 'ciencias', conteudo: 'Partículas espaciais que brilham ao entrar na atmosfera' }],
          agendamentos: [],
          bloqueadoPorIdade: false,
        }
      }

      // Call Gemini API with 7-second timeout protection
      const geminiPromise = ai.models.generateContent({
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

      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 7000)
      })

      let response: any = null
      try {
        response = await Promise.race([geminiPromise, timeoutPromise])
      } catch (geminiErr: any) {
        console.warn('[Gemini Agent Warning, using pedagogical fallback]:', geminiErr?.message)
      }

      let parsed: any = null
      if (response && response.text) {
        try {
          parsed = JSON.parse(response.text)
        } catch {
          parsed = null
        }
      }

      if (!parsed || !parsed.reply) {
        parsed = getPedagogicalFallback()
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
      console.error('[Agent-Chat Handler Error]:', error)
      res.json({
        ok: true,
        model: 'gemini-3.8-flash',
        modoAgente: 'agente_geral',
        reply: 'Oi, amigo(a)! Estou aqui com você para aprender e nos divertirmos juntos! O que quer explorar agora? ✨',
        etapaSocratica: 'entender',
        materia: 'geral',
        memoriasAprendidas: [],
        novosConhecimentos: [],
        agendamentos: [],
        bloqueadoPorIdade: false,
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
