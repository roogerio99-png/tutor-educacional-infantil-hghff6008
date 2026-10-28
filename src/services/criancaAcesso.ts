import pb from '@/lib/pocketbase/client'
import type { PermissoesCrianca } from '@/types'

export interface ObterAcessoCriancaResponse {
  possui_acesso: boolean
  acesso: {
    id: string
    username: string
    nome_exibicao: string
    ativo: boolean
    permissoes: PermissoesCrianca
    crianca: string
    created?: string
    updated?: string
  } | null
}

export interface SalvarAcessoCriancaParams {
  crianca_id: string
  username: string
  senha?: string
  nome_exibicao?: string
  ativo?: boolean
  permissoes?: PermissoesCrianca
}

export interface SalvarAcessoCriancaResponse {
  success: boolean
  message: string
  acesso: {
    id: string
    username: string
    nome_exibicao: string
    ativo: boolean
    permissoes: PermissoesCrianca
    crianca: string
  }
}

/**
 * Consulta no backend se a criança possui usuário configurado
 */
export async function obterAcessoCrianca(criancaId: string): Promise<ObterAcessoCriancaResponse> {
  const res = await pb.send<ObterAcessoCriancaResponse>(`/backend/v1/crianca-acesso/${criancaId}`, {
    method: 'GET',
  })
  return res
}

/**
 * Cria ou atualiza os dados de acesso da criança (com senha)
 */
export async function salvarAcessoCrianca(
  params: SalvarAcessoCriancaParams,
): Promise<SalvarAcessoCriancaResponse> {
  const res = await pb.send<SalvarAcessoCriancaResponse>('/backend/v1/crianca-acesso/salvar', {
    method: 'POST',
    body: params,
  })
  return res
}

/**
 * Pausa ou reativa o acesso da criança
 */
export async function alternarStatusAcessoCrianca(
  criancaId: string,
  ativo: boolean,
): Promise<{ success: boolean; ativo: boolean; message: string }> {
  const res = await pb.send<{ success: boolean; ativo: boolean; message: string }>(
    '/backend/v1/crianca-acesso/alternar-status',
    {
      method: 'POST',
      body: {
        crianca_id: criancaId,
        ativo,
      },
    },
  )
  return res
}

/**
 * Exclui o acesso da criança
 */
export async function excluirAcessoCrianca(
  criancaId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await pb.send<{ success: boolean; message: string }>(
    `/backend/v1/crianca-acesso/${criancaId}`,
    {
      method: 'DELETE',
    },
  )
  return res
}
