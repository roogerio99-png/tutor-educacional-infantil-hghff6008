import pb from '@/lib/pocketbase/client'
import { streamAgentChat, type StreamAgentChatHandlers } from '@/lib/skipAi'
import type { EtapaSocratica, AcaoLumiExecutada } from '@/types'

export interface EnviarMensagemLumiParams {
  message: string
  conversationId?: string | null
  criancaId?: string | null
  customPrompt?: string | null
  minutosRestantes?: number
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
}

export async function enviarMensagemLumiSync(
  params: EnviarMensagemLumiParams,
): Promise<LumiChatResponse> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  const res = await fetch(`${baseUrl}/backend/v1/lumi/chat`, {
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
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  const res = await fetch(`${baseUrl}/backend/v1/lumi/chat-stream`, {
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
    }),
    signal: params.signal,
  })

  // Decodifica headers SSE contendo metadados unificados
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
