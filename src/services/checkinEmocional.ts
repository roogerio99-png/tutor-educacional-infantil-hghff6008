import pb from '@/lib/pocketbase/client'
import type { CheckinEmocionalRecord, HumorEmocional } from '@/types'

export interface CheckinStatusResponse {
  fez_checkin: boolean
  checkin: CheckinEmocionalRecord | null
}

export interface HistoricoEmocionalResponse {
  historico: CheckinEmocionalRecord[]
  alerta_atencao_emocional: boolean
  dias_negativos_consecutivos: number
}

export async function verificarCheckinHoje(criancaId: string): Promise<CheckinStatusResponse> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  try {
    const res = await fetch(`${baseUrl}/backend/v1/checkin-emocional/hoje/${criancaId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    if (!res.ok) {
      const hojeStr = new Date().toISOString().split('T')[0]
      const records = await pb
        .collection('checkins_emocionais')
        .getList<CheckinEmocionalRecord>(1, 1, {
          filter: `crianca = '${criancaId}' && data = '${hojeStr}'`,
        })
      return {
        fez_checkin: records.items.length > 0,
        checkin: records.items[0] || null,
      }
    }

    return await res.json()
  } catch {
    return { fez_checkin: false, checkin: null }
  }
}

export async function registrarCheckinEmocional(
  criancaId: string,
  humor: HumorEmocional,
  nota?: string,
): Promise<CheckinEmocionalRecord> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  const res = await fetch(`${baseUrl}/backend/v1/checkin-emocional`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      crianca_id: criancaId,
      humor,
      nota: nota || '',
    }),
  })

  if (!res.ok) {
    const hojeStr = new Date().toISOString().split('T')[0]
    return await pb.collection('checkins_emocionais').create<CheckinEmocionalRecord>({
      crianca: criancaId,
      data: hojeStr,
      humor,
      nota: nota || '',
    })
  }

  const data = await res.json()
  return data.checkin
}

export async function obterHistoricoEmocional(
  criancaId: string,
): Promise<HistoricoEmocionalResponse> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  try {
    const res = await fetch(`${baseUrl}/backend/v1/checkin-emocional/historico/${criancaId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    if (!res.ok) {
      // Fallback local
      const items = await pb.collection('checkins_emocionais').getFullList<CheckinEmocionalRecord>({
        filter: `crianca = '${criancaId}'`,
        sort: '-data',
        batch: 14,
      })

      let diasNeg = 0
      let maxNeg = 0
      for (const item of items) {
        if (item.humor === 'triste' || item.humor === 'muito_triste') {
          diasNeg++
          if (diasNeg > maxNeg) maxNeg = diasNeg
        } else {
          diasNeg = 0
        }
      }

      return {
        historico: items,
        alerta_atencao_emocional: maxNeg >= 3,
        dias_negativos_consecutivos: maxNeg,
      }
    }

    return await res.json()
  } catch {
    return {
      historico: [],
      alerta_atencao_emocional: false,
      dias_negativos_consecutivos: 0,
    }
  }
}
