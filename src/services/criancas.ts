import pb from '@/lib/pocketbase/client'
import type { CriancaRecord } from '@/types'

export interface CriancaInput {
  nome: string
  idade: number
  serie: string
  escola?: string
  observacoes?: string
  localidade?: string
  genero?: 'Menina' | 'Menino' | 'Prefiro não informar'
  horarios_aula?: string
  acessibilidade?: string
  tempo_uso_diario_min?: number
  uso_janela_inicio?: string
  uso_janela_fim?: string
}

export async function listarCriancas(): Promise<CriancaRecord[]> {
  const records = await pb.collection('criancas').getFullList<CriancaRecord>({
    sort: '-created',
  })
  return records
}

export async function obterCrianca(id: string): Promise<CriancaRecord> {
  return await pb.collection('criancas').getOne<CriancaRecord>(id)
}

export async function criarCrianca(dados: CriancaInput): Promise<CriancaRecord> {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('Usuário não autenticado')

  return await pb.collection('criancas').create<CriancaRecord>({
    ...dados,
    owner: userId,
  })
}

export async function atualizarCrianca(
  id: string,
  dados: Partial<CriancaInput>,
): Promise<CriancaRecord> {
  return await pb.collection('criancas').update<CriancaRecord>(id, dados)
}

export async function excluirCrianca(id: string): Promise<boolean> {
  return await pb.collection('criancas').delete(id)
}

export async function excluirCriancaCompleto(
  id: string,
): Promise<{ success: boolean; message: string }> {
  // Limpar coleções relacionadas vinculadas à criança
  const colecoesParaLimpar = [
    'memorias',
    'checkins_emocionais',
    'dificuldades',
    'conhecimento',
    'agenda',
    'alertas',
    'registro_uso',
  ]

  for (const col of colecoesParaLimpar) {
    try {
      const records = await pb.collection(col).getFullList({
        filter: pb.filter('crianca = {:c}', { c: id }),
      })
      for (const r of records) {
        await pb
          .collection(col)
          .delete(r.id)
          .catch(() => {})
      }
    } catch {
      // Ignora se não houver registros ou erro nessa coleção
    }
  }

  // Limpar usuário da criança se existir
  try {
    const usuarios = await pb.collection('criancas_usuarios').getFullList({
      filter: pb.filter('crianca = {:c}', { c: id }),
    })
    for (const u of usuarios) {
      await pb
        .collection('criancas_usuarios')
        .delete(u.id)
        .catch(() => {})
    }
  } catch {
    // Ignora se não houver
  }

  // Excluir a criança
  await pb.collection('criancas').delete(id)

  return {
    success: true,
    message: 'Perfil da criança e todos os dados vinculados foram removidos com sucesso.',
  }
}
