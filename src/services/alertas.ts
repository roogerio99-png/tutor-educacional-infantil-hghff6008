import pb from '@/lib/pocketbase/client'
import type { AlertaRecord } from '@/types'

export async function listarAlertas(criancaId?: string): Promise<AlertaRecord[]> {
  const filter = criancaId ? `crianca = '${criancaId}'` : ''
  return await pb.collection('alertas').getFullList<AlertaRecord>({
    filter,
    sort: '-created',
    expand: 'crianca',
  })
}

export async function marcarAlertaComoLido(alertaId: string): Promise<AlertaRecord> {
  return await pb.collection('alertas').update<AlertaRecord>(alertaId, {
    lido: true,
  })
}

export async function excluirAlerta(alertaId: string): Promise<boolean> {
  return await pb.collection('alertas').delete(alertaId)
}
