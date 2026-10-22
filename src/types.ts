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
    conhecimento_via_crianca?: ConhecimentoRecord[]
    agenda_via_crianca?: AgendaRecord[]
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

export type TipoEventoAgenda = 'prova' | 'tarefa' | 'revisao' | 'projeto' | 'outro'

export interface AgendaRecord extends RecordModel {
  crianca: string
  titulo: string
  descricao?: string
  data: string // YYYY-MM-DD
  horario?: string // HH:mm
  materia?: string
  tipo?: TipoEventoAgenda
  concluido?: boolean
  expand?: {
    crianca?: CriancaRecord
  }
}

export interface SystemPromptRecord extends RecordModel {
  owner: string
  titulo: string
  identidade: string
  metodo_socratico: string
  diretrizes_pedagogicas?: string
  tom_de_voz?: string
  instrucoes_quadro?: string
  ativo?: boolean
}

// Aliases para retrocompatibilidade
export type User = UserRecord
export type Crianca = CriancaRecord
export type Dificuldade = DificuldadeRecord
export type Conhecimento = ConhecimentoRecord
export type Agenda = AgendaRecord
export type SystemPrompt = SystemPromptRecord

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
