import { pb } from '@/lib/pocketbase/client'
import { MissaoBnccRecord, FaseDesenvolvimentoId } from '@/types'

export async function listarMissoesPorFase(
  fase: FaseDesenvolvimentoId,
): Promise<MissaoBnccRecord[]> {
  try {
    const records = await pb.collection('missoes_bncc').getFullList<MissaoBnccRecord>({
      filter: `fase = "${fase}" && ativo = true`,
      sort: 'ordem,created',
    })
    return records
  } catch (err) {
    console.error('[ERRO LISTAR MISSOES BNCC]:', err)
    return []
  }
}

export async function listarTodasMissoes(): Promise<MissaoBnccRecord[]> {
  try {
    const records = await pb.collection('missoes_bncc').getFullList<MissaoBnccRecord>({
      filter: 'ativo = true',
      sort: 'fase,ordem',
    })
    return records
  } catch (err) {
    console.error('[ERRO LISTAR TODAS MISSOES]:', err)
    return []
  }
}
