import pb from '@/lib/pocketbase/client'

export interface RegistroUsoRecord {
  id: string
  crianca: string
  data: string
  minutos: number
  created: string
  updated: string
}

export interface StatusUsoResponse {
  crianca_id: string
  data: string
  minutos_usados: number
  limite_diario_min: number
  tempo_restante_min: number
  bloqueado: boolean
  motivo_bloqueio?: 'limite_atingido' | 'fora_da_janela' | null
  janela_inicio?: string
  janela_fim?: string
}

export interface RegistrarHeartbeatResponse {
  sucesso: boolean
  minutos_usados: number
  tempo_restante_min: number
  bloqueado: boolean
  motivo_bloqueio?: 'limite_atingido' | 'fora_da_janela' | null
}

function obterDataHojeLocal(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function horaAtualEmMinutos(): number {
  const agora = new Date()
  return agora.getHours() * 60 + agora.getMinutes()
}

function converterHoraParaMinutos(horaStr?: string): number | null {
  if (!horaStr || !horaStr.includes(':')) return null
  const [h, m] = horaStr.split(':').map((v) => parseInt(v, 10))
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

/**
 * Obtém o status de uso da criança para a data de hoje.
 * Tenta buscar primeiro via backend customizado ou diretamente na collection `registro_uso`.
 */
export async function obterStatusUsoHoje(criancaId: string): Promise<StatusUsoResponse> {
  const dataHoje = obterDataHojeLocal()

  // Buscar a criança para obter os limites
  let criancaRec: {
    tempo_uso_diario_min?: number
    uso_janela_inicio?: string
    uso_janela_fim?: string
  } | null = null

  try {
    criancaRec = await pb.collection('criancas').getOne(criancaId)
  } catch {
    // Caso não consiga ler diretamente, prossegue com defaults
  }

  const limiteDiario = criancaRec?.tempo_uso_diario_min ?? 0
  const janelaInicio = criancaRec?.uso_janela_inicio || ''
  const janelaFim = criancaRec?.uso_janela_fim || ''

  // Verificar janela de horário
  let bloqueadoPorJanela = false
  if (janelaInicio && janelaFim) {
    const agoraMin = horaAtualEmMinutos()
    const iniMin = converterHoraParaMinutos(janelaInicio)
    const fimMin = converterHoraParaMinutos(janelaFim)

    if (iniMin !== null && fimMin !== null) {
      if (iniMin <= fimMin) {
        // Ex: 08:00 às 20:00
        if (agoraMin < iniMin || agoraMin >= fimMin) {
          bloqueadoPorJanela = true
        }
      } else {
        // Janela atravessando a meia-noite (ex: 20:00 às 06:00)
        if (agoraMin < iniMin && agoraMin >= fimMin) {
          bloqueadoPorJanela = true
        }
      }
    }
  }

  // Buscar minutos já usados hoje
  let minutosUsados = 0
  try {
    const registros = await pb.collection('registro_uso').getList<RegistroUsoRecord>(1, 1, {
      filter: pb.filter('crianca = {:c} && data = {:d}', { c: criancaId, d: dataHoje }),
    })
    if (registros.items.length > 0) {
      minutosUsados = registros.items[0].minutos || 0
    }
  } catch (err) {
    console.warn('[tempoUso] Erro ao buscar registros de uso:', err)
  }

  const bloqueadoPorLimite = limiteDiario > 0 && minutosUsados >= limiteDiario
  const bloqueado = bloqueadoPorJanela || bloqueadoPorLimite
  const motivo: 'limite_atingido' | 'fora_da_janela' | null = bloqueadoPorJanela
    ? 'fora_da_janela'
    : bloqueadoPorLimite
      ? 'limite_atingido'
      : null

  const tempoRestante = limiteDiario > 0 ? Math.max(0, limiteDiario - minutosUsados) : 9999

  return {
    crianca_id: criancaId,
    data: dataHoje,
    minutos_usados: minutosUsados,
    limite_diario_min: limiteDiario,
    tempo_restante_min: tempoRestante,
    bloqueado,
    motivo_bloqueio: motivo,
    janela_inicio: janelaInicio,
    janela_fim: janelaFim,
  }
}

/**
 * Registra o heartbeat de uso da criança (soma os minutos decorridos de sessão ativa).
 */
export async function registrarHeartbeatUso(
  criancaId: string,
  minutosDecorridos = 1,
): Promise<RegistrarHeartbeatResponse> {
  const dataHoje = obterDataHojeLocal()

  // Buscar registro atual do dia
  let minutosAtuais = 0
  let registroId: string | null = null

  try {
    const existentes = await pb.collection('registro_uso').getList<RegistroUsoRecord>(1, 1, {
      filter: pb.filter('crianca = {:c} && data = {:d}', { c: criancaId, d: dataHoje }),
    })
    if (existentes.items.length > 0) {
      registroId = existentes.items[0].id
      minutosAtuais = existentes.items[0].minutos || 0
    }
  } catch (err) {
    console.warn('[tempoUso] Erro ao buscar registro atual para heartbeat:', err)
  }

  const novoTotal = minutosAtuais + minutosDecorridos

  if (registroId) {
    await pb.collection('registro_uso').update(registroId, {
      minutos: novoTotal,
    })
  } else {
    const novo = await pb.collection('registro_uso').create({
      crianca: criancaId,
      data: dataHoje,
      minutos: novoTotal,
    })
    registroId = novo.id
  }

  // Obter status recalculado
  const st = await obterStatusUsoHoje(criancaId)

  return {
    sucesso: true,
    minutos_usados: st.minutos_usados,
    tempo_restante_min: st.tempo_restante_min,
    bloqueado: st.bloqueado,
    motivo_bloqueio: st.motivo_bloqueio,
  }
}
