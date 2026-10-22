import pb from '@/lib/pocketbase/client'
import { streamAgentChat, type StreamAgentChatHandlers } from '@/lib/skipAi'
import type { EtapaSocratica, AcaoLumiExecutada } from '@/types'

export interface EnviarMensagemLumiParams {
  message: string
  conversationId?: string | null
  criancaId?: string | null
  customPrompt?: string | null
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
  // Nota: o streaming do agente Skip Cloud repassa SSE diretamente da LLM.
  // Para obter a extração precisa de etapas, metadados e persistência de ações socráticas com confiabilidade,
  // delegamos para o endpoint síncrono oficial e simulamos os eventos para os handlers caso necessário,
  // ou utilizamos o chat síncrono diretamente.
  try {
    const syncRes = await enviarMensagemLumiSync(params)
    // Se o handler forneceu onChunk, disparamos com o conteúdo final
    if (handlers.onChunk) {
      handlers.onChunk(syncRes.content, syncRes.content)
    }
    return {
      conversationId: syncRes.conversation_id,
      content: syncRes.content,
      messageId: syncRes.message_id,
      etapa: syncRes.etapa,
      materia: syncRes.materia,
      acoes: syncRes.acoes,
    }
  } catch (err) {
    // Fallback: tenta stream padrão se endpoint síncrono falhar
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
      }),
      signal: params.signal,
    })

    const streamResult = await streamAgentChat(res, handlers)

    return {
      conversationId: res.headers.get('X-Conversation-Id') || streamResult.conversation_id,
      content: streamResult.content,
      messageId: streamResult.message_id,
      etapa: 'guiar',
      materia: 'geral',
      acoes: [],
    }
  }
}
