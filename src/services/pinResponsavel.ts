import pb from '@/lib/pocketbase/client'

export interface PinStatusResponse {
  definido: boolean
}

export interface DefinirPinParams {
  novo_pin: string
  confirmacao: string
  pin_atual?: string
  senha_conta?: string
}

export interface RedefinirPinSenhaParams {
  senha_conta: string
  novo_pin: string
  confirmacao: string
}

export interface VerificarPinResponse {
  valido: boolean
  aviso?: string
}

const BASE_URL = import.meta.env.VITE_POCKETBASE_URL

/**
 * Consulta se o usuário responsável já definiu o PIN numérico de 4 dígitos.
 */
export async function obterStatusPin(): Promise<boolean> {
  if (!pb.authStore.isValid || !pb.authStore.token) return false

  try {
    const res = await fetch(`${BASE_URL}/backend/v1/auth/pin/status`, {
      method: 'GET',
      headers: {
        Authorization: pb.authStore.token,
      },
    })

    if (!res.ok) {
      // Se a rota falhar, verifica no record do authStore
      const userRec = pb.authStore.record as { pin_definido?: boolean } | null
      return !!userRec?.pin_definido
    }

    const data: PinStatusResponse = await res.json()
    return !!data.definido
  } catch (err) {
    console.warn('Erro ao consultar status do PIN:', err)
    const userRec = pb.authStore.record as { pin_definido?: boolean } | null
    return !!userRec?.pin_definido
  }
}

/**
 * Define ou atualiza o PIN de 4 dígitos.
 */
export async function definirPinResponsavel(
  params: DefinirPinParams,
): Promise<{ success: boolean; message: string }> {
  if (!pb.authStore.isValid || !pb.authStore.token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(`${BASE_URL}/backend/v1/auth/pin/definir`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify(params),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível configurar o PIN.')
  }

  return data
}

/**
 * Valida o PIN inserido ao tentar sair do Modo Criança.
 */
export async function verificarPinResponsavel(pin: string): Promise<boolean> {
  if (!pb.authStore.isValid || !pb.authStore.token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(`${BASE_URL}/backend/v1/auth/pin/verificar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({ pin }),
  })

  const data: VerificarPinResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.aviso || 'Erro ao validar PIN.')
  }

  return !!data.valido
}

/**
 * Redefine o PIN utilizando a senha da conta do responsável.
 */
export async function redefinirPinComSenha(
  params: RedefinirPinSenhaParams,
): Promise<{ success: boolean; message: string }> {
  if (!pb.authStore.isValid || !pb.authStore.token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(`${BASE_URL}/backend/v1/auth/pin/redefinir-com-senha`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify(params),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível redefinir o PIN.')
  }

  return data
}
