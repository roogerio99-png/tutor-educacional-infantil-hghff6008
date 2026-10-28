import pb from '@/lib/pocketbase/client'
import type { CriancaRecord } from '@/types'

export interface CriancaInput {
  nome: string
  idade: number
  serie: string
  escola?: string
  observacoes?: string
  localidade?: string
  genero?: 'Menina' | 'Menino' | 'Prefiro não informar'
  horarios_aula?: string
  acessibilidade?: string
  tempo_uso_diario_min?: number
  uso_janela_inicio?: string
  uso_janela_fim?: string
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

export async function atualizarCrianca(
  id: string,
  dados: Partial<CriancaInput>,
): Promise<CriancaRecord> {
  return await pb.collection('criancas').update<CriancaRecord>(id, dados)
}

export async function excluirCrianca(id: string): Promise<boolean> {
  return await pb.collection('criancas').delete(id)
}

export async function excluirCriancaCompleto(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  const res = await fetch(`${baseUrl}/backend/v1/crianca/${id}/excluir-completo`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erro ao excluir criança (${res.status})`)
  }

  return await res.json()
}
