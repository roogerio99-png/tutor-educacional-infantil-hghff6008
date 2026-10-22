import pb from '@/lib/pocketbase/client'
import type { MemoriaRecord } from '@/types'

export async function listarMemorias(criancaId: string): Promise<MemoriaRecord[]> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  const res = await fetch(`${baseUrl}/backend/v1/memorias/${criancaId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!res.ok) {
    // Fallback direto via SDK
    return await pb.collection('memorias').getFullList<MemoriaRecord>({
      filter: `crianca = '${criancaId}' && ativo = true`,
      sort: '-created',
    })
  }

  return await res.json()
}

export async function excluirMemoria(memoriaId: string): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  const res = await fetch(`${baseUrl}/backend/v1/memorias/${memoriaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!res.ok) {
    // Fallback SDK
    return await pb.collection('memorias').delete(memoriaId)
  }

  return true
}
