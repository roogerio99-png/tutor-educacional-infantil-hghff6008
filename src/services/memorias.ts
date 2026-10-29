import pb, { localFetch } from '@/lib/pocketbase/client'
import type { MemoriaRecord } from '@/types'

export async function listarMemorias(criancaId: string): Promise<MemoriaRecord[]> {
  try {
    const token = pb.authStore.token
    const res = await localFetch(`/backend/v1/memorias/${criancaId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    if (res.ok) {
      const data = await res.json()
      const list = Array.isArray(data) ? data : Array.isArray(data?.memorias) ? data.memorias : []
      return list
    }
  } catch {
    // Fallback direto via SDK
  }

  return await pb.collection('memorias').getFullList<MemoriaRecord>({
    filter: `crianca = '${criancaId}'`,
    sort: '-created',
  })
}

export async function ensinarMemoria(
  criancaId: string,
  conteudo: string,
  tipo: MemoriaRecord['tipo'] = 'preferencia',
): Promise<MemoriaRecord> {
  return await pb.collection('memorias').create<MemoriaRecord>({
    crianca: criancaId,
    tipo,
    conteudo: conteudo.trim(),
    origem: 'ensinado_pelo_usuario',
    ativo: true,
    owner: pb.authStore.record?.id || 'user_demo_rogerio',
  })
}

export async function excluirMemoria(memoriaId: string): Promise<boolean> {
  try {
    const token = pb.authStore.token
    const res = await localFetch(`/backend/v1/memorias/${memoriaId}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.ok) return true
  } catch {
    // Fallback SDK
  }

  return await pb.collection('memorias').delete(memoriaId)
}
