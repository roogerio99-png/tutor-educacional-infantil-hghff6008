import pb, { localFetch } from '@/lib/pocketbase/client'
import { streamAgentChat, type StreamAgentChatHandlers } from '@/lib/skipAi'
import type { EtapaSocratica, AcaoLumiExecutada, MemoriaRecord } from '@/types'

export type ModeloGeminiAgente = 'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'
export type ModoAgenteLumi = 'agente_geral' | 'tutor_socratico'

export interface EnviarMensagemLumiParams {
  message: string
  conversationId?: string | null
  criancaId?: string | null
  customPrompt?: string | null
  minutosRestantes?: number
  model?: ModeloGeminiAgente
  modoAgente?: ModoAgenteLumi
  history?: Array<{ role: 'user' | 'model'; text: string }>
  signal?: AbortSignal
}

export interface LumiChatResponse {
  conversation_id: string
  content: string
  citations?: Array<{ source_id?: string; text?: string }>
  message_id?: string
  etapa?: EtapaSocratica
  materia?: string
  acoes?: AcaoLumiExecutada[]
  memorias_aprendidas?: MemoriaRecord[]
}

export async function enviarMensagemLumiSync(
  params: EnviarMensagemLumiParams,
): Promise<LumiChatResponse> {
  const token = pb.authStore.token

  const res = await localFetch('/backend/v1/lumi/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      message: params.message,
      conversation_id: params.conversationId || null,
      crianca_id: params.criancaId || null,
      custom_prompt: params.customPrompt || null,
      minutos_restantes:
        params.minutosRestantes !== undefined ? params.minutosRestantes : undefined,
      model: params.model || 'gemini-3.8-flash',
      modo_agente: params.modoAgente || 'agente_geral',
      history: params.history || [],
    }),
    signal: params.signal,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Erro ao conversar com Lumi (${res.status})`)
  }

  return await res.json()
}

export async function enviarMensagemLumiStream(
  params: EnviarMensagemLumiParams,
  handlers: StreamAgentChatHandlers,
): Promise<{
  conversationId: string
  content: string
  messageId?: string
  etapa?: EtapaSocratica
  materia?: string
  acoes?: AcaoLumiExecutada[]
}> {
  const token = pb.authStore.token

  const res = await localFetch('/backend/v1/lumi/chat-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      message: params.message,
      conversation_id: params.conversationId || null,
      crianca_id: params.criancaId || null,
      custom_prompt: params.customPrompt || null,
      minutos_restantes:
        params.minutosRestantes !== undefined ? params.minutosRestantes : undefined,
      model: params.model || 'gemini-3.8-flash',
      modo_agente: params.modoAgente || 'agente_geral',
      history: params.history || [],
    }),
    signal: params.signal,
  })

  const etapaHeader = (res.headers.get('X-Etapa-Socratica') || undefined) as
    | EtapaSocratica
    | undefined
  const materiaHeader = res.headers.get('X-Materia') || undefined
  const conversationIdHeader = res.headers.get('X-Conversation-Id') || ''
  let acoesHeader: AcaoLumiExecutada[] = []
  const acoesRaw = res.headers.get('X-Acoes-Executadas')
  if (acoesRaw) {
    try {
      acoesHeader = JSON.parse(decodeURIComponent(acoesRaw))
    } catch {
      acoesHeader = []
    }
  }

  const streamResult = await streamAgentChat(res, handlers)

  return {
    conversationId: conversationIdHeader || streamResult.conversation_id,
    content: streamResult.content,
    messageId: streamResult.message_id,
    etapa: etapaHeader,
    materia: materiaHeader,
    acoes: acoesHeader,
  }
}

export interface GerarImagemLumiParams {
  prompt: string
  base64Image?: string | null
  mimeType?: string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  criancaIdade?: number
}

export interface GerarImagemLumiResult {
  ok: boolean
  model: string
  imageUrl: string
  caption: string
}

export async function gerarOuEditarImagemLumi(
  params: GerarImagemLumiParams,
): Promise<GerarImagemLumiResult> {
  const res = await localFetch('/api/lumi/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.imageUrl) {
    throw new Error(
      data.error || 'Não foi possível criar ou editar a imagem agora. Tente novamente!',
    )
  }

  return data
}

export interface GerarMusicaLumiParams {
  prompt: string
  durationType?: 'clip' | 'full'
  criancaIdade?: number
}

export interface GerarMusicaLumiResult {
  ok: boolean
  model: string
  audioDataUri: string
  mimeType: string
  lyrics: string
}

export async function gerarMusicaLumi(
  params: GerarMusicaLumiParams,
): Promise<GerarMusicaLumiResult> {
  const res = await localFetch('/api/lumi/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.audioDataUri) {
    throw new Error(data.error || 'Não foi possível compor a música agora. Tente novamente!')
  }

  return data
}
