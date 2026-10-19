import pb from '@/lib/pocketbase/client'
import type { ConhecimentoRecord } from '@/types'

export interface ConhecimentoInput {
  crianca: string
  titulo?: string
  conteudo: string
}

export async function listarConhecimento(criancaId?: string): Promise<ConhecimentoRecord[]> {
  const filter = criancaId ? `crianca = "${criancaId}"` : ''
  return await pb.collection('conhecimento').getFullList<ConhecimentoRecord>({
    filter,
    sort: '-created',
    expand: 'crianca',
  })
}

export async function obterConhecimento(id: string): Promise<ConhecimentoRecord> {
  return await pb.collection('conhecimento').getOne<ConhecimentoRecord>(id, {
    expand: 'crianca',
  })
}

export async function criarConhecimento(dados: ConhecimentoInput): Promise<ConhecimentoRecord> {
  return await pb.collection('conhecimento').create<ConhecimentoRecord>(dados, {
    expand: 'crianca',
  })
}

export async function atualizarConhecimento(
  id: string,
  dados: Partial<ConhecimentoInput>,
): Promise<ConhecimentoRecord> {
  return await pb.collection('conhecimento').update<ConhecimentoRecord>(id, dados, {
    expand: 'crianca',
  })
}

export async function excluirConhecimento(id: string): Promise<boolean> {
  return await pb.collection('conhecimento').delete(id)
}
