import pb from '@/lib/pocketbase/client'
import type { SystemPromptRecord } from '@/types'

export interface SystemPromptInput {
  titulo: string
  identidade: string
  metodo_socratico: string
  diretrizes_pedagogicas?: string
  tom_de_voz?: string
  instrucoes_quadro?: string
  ativo?: boolean
}

export async function obterPromptAtivo(): Promise<SystemPromptRecord | null> {
  try {
    const list = await pb.collection('system_prompts').getList<SystemPromptRecord>(1, 1, {
      filter: 'ativo = true',
      sort: '-created',
    })
    if (list.items.length > 0) return list.items[0]

    // Fallback para qualquer prompt do usuário
    const fallback = await pb.collection('system_prompts').getList<SystemPromptRecord>(1, 1, {
      sort: '-created',
    })
    return fallback.items[0] || null
  } catch (error) {
    console.error('Erro ao buscar prompt ativo:', error)
    return null
  }
}

export async function listarPrompts(): Promise<SystemPromptRecord[]> {
  try {
    return await pb.collection('system_prompts').getFullList<SystemPromptRecord>({
      sort: '-created',
    })
  } catch (error) {
    console.error('Erro ao listar prompts:', error)
    return []
  }
}

export async function salvarPrompt(
  data: SystemPromptInput,
  id?: string,
): Promise<SystemPromptRecord> {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('Usuário não autenticado')

  if (id) {
    return await pb.collection('system_prompts').update<SystemPromptRecord>(id, data)
  }

  return await pb.collection('system_prompts').create<SystemPromptRecord>({
    ...data,
    owner: userId,
  })
}
