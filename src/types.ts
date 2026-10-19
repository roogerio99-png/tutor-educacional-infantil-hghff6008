import type { RecordModel } from 'pocketbase'

export type Materia =
  | 'Português'
  | 'Matemática'
  | 'Ciências'
  | 'História'
  | 'Geografia'
  | 'Inglês'
  | 'Artes'
  | string

export type Impacto = 'Leve' | 'Moderado' | 'Alto' | string

export interface UserRecord extends RecordModel {
  name?: string
  email: string
  avatar?: string
  verified: boolean
}

export interface CriancaRecord extends RecordModel {
  owner: string
  nome: string
  idade: number
  serie: string
  escola?: string
  observacoes?: string
  expand?: {
    owner?: UserRecord
    dificuldades_via_crianca?: DificuldadeRecord[]
  }
}

export interface DificuldadeRecord extends RecordModel {
  crianca: string
  materia: string
  descricao: string
  impacto: string
  expand?: {
    crianca?: CriancaRecord
  }
}

export interface ConhecimentoRecord extends RecordModel {
  crianca: string
  titulo?: string
  conteudo: string
  expand?: {
    crianca?: CriancaRecord
  }
}

// Aliases para retrocompatibilidade
export type User = UserRecord
export type Crianca = CriancaRecord
export type Dificuldade = DificuldadeRecord
export type Conhecimento = ConhecimentoRecord

export const MATERIAS: string[] = [
  'Português',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Inglês',
  'Artes',
]

export const IMPACTOS: string[] = ['Leve', 'Moderado', 'Alto']

export const SERIES: string[] = [
  'Educação Infantil',
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  'Ensino Médio',
]
