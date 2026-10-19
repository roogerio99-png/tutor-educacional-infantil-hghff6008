import pb from '@/lib/pocketbase/client'
import type { DificuldadeRecord } from '@/types'

export interface DificuldadeInput {
  crianca: string
  materia: string
  descricao: string
  impacto: string
}

export async function listarDificuldades(criancaId?: string): Promise<DificuldadeRecord[]> {
  const filter = criancaId ? `crianca = "${criancaId}"` : ''
  return await pb.collection('dificuldades').getFullList<DificuldadeRecord>({
    filter,
    sort: '-created',
    expand: 'crianca',
  })
}

export async function obterDificuldade(id: string): Promise<DificuldadeRecord> {
  return await pb.collection('dificuldades').getOne<DificuldadeRecord>(id, {
    expand: 'crianca',
  })
}

export async function criarDificuldade(dados: DificuldadeInput): Promise<DificuldadeRecord> {
  return await pb.collection('dificuldades').create<DificuldadeRecord>(dados, {
    expand: 'crianca',
  })
}

export async function atualizarDificuldade(
  id: string,
  dados: Partial<DificuldadeInput>,
): Promise<DificuldadeRecord> {
  return await pb.collection('dificuldades').update<DificuldadeRecord>(id, dados, {
    expand: 'crianca',
  })
}

export async function excluirDificuldade(id: string): Promise<boolean> {
  return await pb.collection('dificuldades').delete(id)
}
