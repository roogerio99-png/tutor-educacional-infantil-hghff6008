import pb from '@/lib/pocketbase/client'
import type { AgendaRecord, TipoEventoAgenda } from '@/types'

export interface AgendaInput {
  crianca: string
  titulo: string
  descricao?: string
  data: string
  horario?: string
  materia?: string
  tipo?: TipoEventoAgenda
  concluido?: boolean
}

export async function listarEventosAgenda(criancaId?: string): Promise<AgendaRecord[]> {
  try {
    const filter = criancaId ? `crianca = '${criancaId}'` : ''
    const records = await pb.collection('agenda').getFullList<AgendaRecord>({
      filter,
      sort: 'data,horario',
      expand: 'crianca',
    })
    return records
  } catch (error) {
    console.error('Erro ao listar eventos da agenda:', error)
    return []
  }
}

export async function criarEventoAgenda(data: AgendaInput): Promise<AgendaRecord> {
  return await pb.collection('agenda').create<AgendaRecord>(data)
}

export async function atualizarEventoAgenda(
  id: string,
  data: Partial<AgendaInput>,
): Promise<AgendaRecord> {
  return await pb.collection('agenda').update<AgendaRecord>(id, data)
}

export async function alternarConcluidoAgenda(
  id: string,
  concluidoAtual: boolean,
): Promise<AgendaRecord> {
  return await pb.collection('agenda').update<AgendaRecord>(id, {
    concluido: !concluidoAtual,
  })
}

export async function excluirEventoAgenda(id: string): Promise<boolean> {
  return await pb.collection('agenda').delete(id)
}
