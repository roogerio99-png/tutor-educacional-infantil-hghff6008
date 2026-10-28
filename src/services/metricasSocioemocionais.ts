import { pb } from '@/lib/pocketbase/client'
import { DailyMetricRecord } from '@/types'

export interface ObterMetricasResponse {
  metrics: DailyMetricRecord[]
  crianca_nome?: string
  crianca_idade?: number
}

export interface FinalizarSessaoParams {
  crianca_id: string
  duration_minutes: number
  session_id?: string
  academic_tags?: Record<string, number>
  socioemotional_tags?: Record<string, unknown>
  parent_bridges?: string[]
  resilience_moments_count?: number
  resilience_autonomous_rate?: number
}

export async function obterMetricasSocioemocionais(
  criancaId: string,
): Promise<ObterMetricasResponse> {
  try {
    const res = await pb.send<ObterMetricasResponse>(
      `/backend/v1/metricas/socioemocional/${encodeURIComponent(criancaId)}`,
      { method: 'GET' },
    )
    return res
  } catch (err) {
    console.error('[ERRO OBTER METRICAS SOCIOEMOCIONAIS]:', err)
    // Fallback: consulta direta na coleção via PocketBase SDK
    try {
      const metrics = await pb.collection('daily_metrics').getFullList<DailyMetricRecord>({
        filter: `crianca = "${criancaId}"`,
        sort: '-date',
      })
      return { metrics }
    } catch {
      return { metrics: [] }
    }
  }
}

export async function finalizarSessaoMetricas(
  params: FinalizarSessaoParams,
): Promise<{ success: boolean; metric?: DailyMetricRecord }> {
  try {
    const res = await pb.send<{ success: boolean; metric?: DailyMetricRecord }>(
      '/backend/v1/metricas/finalizar-sessao',
      {
        method: 'POST',
        body: params,
      },
    )
    return res
  } catch (err) {
    console.error('[ERRO FINALIZAR SESSAO METRICAS]:', err)
    return { success: false }
  }
}
