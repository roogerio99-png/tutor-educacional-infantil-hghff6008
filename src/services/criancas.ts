import pb from '@/lib/pocketbase/client'
import type { CriancaRecord } from '@/types'

export interface CriancaInput {
  nome: string
  idade: number
  serie: string
  escola?: string
  observacoes?: string
}

export async function listarCriancas(): Promise<CriancaRecord[]> {
  const records = await pb.collection('criancas').getFullList<CriancaRecord>({
    sort: '-created',
  })
  return records
}

export async function obterCrianca(id: string): Promise<CriancaRecord> {
  return await pb.collection('criancas').getOne<CriancaRecord>(id)
}

export async function criarCrianca(dados: CriancaInput): Promise<CriancaRecord> {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('Usuário não autenticado')

  return await pb.collection('criancas').create<CriancaRecord>({
    ...dados,
    owner: userId,
  })
}

export async function atualizarCrianca(id: string, dados: CriancaInput): Promise<CriancaRecord> {
  return await pb.collection('criancas').update<CriancaRecord>(id, dados)
}

export async function excluirCrianca(id: string): Promise<boolean> {
  return await pb.collection('criancas').delete(id)
}
