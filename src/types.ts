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
  consentimento_lgpd?: boolean
  consentimento_data?: string
  pin_definido?: boolean
  pin_hash?: string
}

export type GeneroCrianca = 'Menina' | 'Menino' | 'Prefiro não informar'

export type EtapaSocratica = 'entender' | 'contextualizar' | 'guiar' | 'praticar' | 'consolidar'

export interface AcaoLumiExecutada {
  tipo: 'agenda_criada' | 'agenda_concluida' | 'memoria_registrada'
  id?: string
  titulo?: string
  materia?: string
  data?: string
  tipo_evento?: string
  conteudo?: string
}

export interface CriancaRecord extends RecordModel {
  owner: string
  nome: string
  idade: number
  serie: string
  escola?: string
  observacoes?: string
  localidade?: string
  genero?: GeneroCrianca
  horarios_aula?: string
  acessibilidade?: string
  ultima_etapa_socratica?: EtapaSocratica
  ultima_materia?: string
  expand?: {
    owner?: UserRecord
    dificuldades_via_crianca?: DificuldadeRecord[]
    conhecimento_via_crianca?: ConhecimentoRecord[]
    agenda_via_crianca?: AgendaRecord[]
  }
}

export type TipoAlerta = 'risco_seguranca' | 'tema_sensivel' | 'fora_escopo' | 'aviso_geral'
export type NivelAlerta = 'critico' | 'alto' | 'medio' | 'informativo'

export interface AlertaRecord extends RecordModel {
  crianca: string
  tipo: TipoAlerta
  nivel?: NivelAlerta
  mensagem: string
  conteudo_detectado?: string
  lido?: boolean
  expand?: {
    crianca?: CriancaRecord
  }
}

export type TipoMemoria =
  | 'interesse'
  | 'pessoa_relacao'
  | 'rotina'
  | 'estrategia'
  | 'dificuldade'
  | 'emocao'

export interface MemoriaRecord extends RecordModel {
  crianca: string
  tipo: TipoMemoria
  conteudo: string
  categoria?: string
  confianca: 'alta' | 'media' | 'baixa'
  origem?: string
  data: string
  ativo: boolean
  expand?: {
    crianca?: CriancaRecord
  }
}

export type HumorEmocional = 'muito_feliz' | 'feliz' | 'neutro' | 'triste' | 'muito_triste'

export interface CheckinEmocionalRecord extends RecordModel {
  crianca: string
  data: string
  humor: HumorEmocional
  nota?: string
  expand?: {
    crianca?: CriancaRecord
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

export type FaseDesenvolvimentoId = 'fase_1' | 'fase_2' | 'fase_3'

export interface FaseDesenvolvimentoConfig {
  id: FaseDesenvolvimentoId
  titulo: string
  subtitulo: string
  faixaEtaria: string
  idadeMin: number
  idadeMax: number
  ttsObrigatorio: boolean
  estilo: {
    themeClass: string
    primaryColor: string
    accentColor: string
    badgeBg: string
    badgeText: string
    cardClass: string
    buttonClass: string
    inputClass: string
    fontClass: string
  }
  tomIA: string
  diretrizTom: string
}

export interface MissaoBnccRecord extends RecordModel {
  fase: FaseDesenvolvimentoId
  faixa_etaria: string
  titulo: string
  materia: string
  descricao: string
  habilidades_bncc?: string
  tipo_interacao?: string
  recursos_midia?:
    | {
        icone?: string
        cor?: string
        som_exemplo?: string
        foco?: string
        [key: string]: unknown
      }
    | string
  ordem?: number
  ativo?: boolean
}

export interface AcademicTags {
  logic_mathematics?: number
  reading_comprehension?: number
  scientific_investigation?: number
  [key: string]: number | undefined
}

export interface SocioemotionalTags {
  focus_attention?: {
    score: number
    context?: string
  }
  frustration_management?: {
    score: number
    status?: string
  }
  autonomy_rate?: number
  [key: string]: unknown
}

export interface DailyMetricRecord extends RecordModel {
  crianca: string
  session_id: string
  user_id: string
  date: string
  duration_minutes: number
  academic_tags: AcademicTags | string
  socioemotional_tags: SocioemotionalTags | string
  parent_bridges: string[] | string
  resilience_moments_count?: number
  resilience_autonomous_rate?: number
  expand?: {
    crianca?: CriancaRecord
  }
}

export interface MetaKanban {
  id: string
  titulo: string
  materia: string
  status: 'planejado' | 'em_progresso' | 'concluido'
  dataLimite?: string
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

export interface PermissoesCrianca {
  conversa: boolean
  agenda: boolean
  grafo: boolean
  conquistas: boolean
  [key: string]: boolean
}

export interface CriancaUsuarioRecord extends RecordModel {
  owner: string
  crianca: string
  username: string
  nome_exibicao?: string
  avatar?: string
  ativo: boolean
  permissoes?: PermissoesCrianca | string
  expand?: {
    owner?: UserRecord
    crianca?: CriancaRecord
  }
}

export type TipoConta = 'responsavel' | 'crianca'

// Aliases para retrocompatibilidade
export type User = UserRecord
export type Crianca = CriancaRecord
export type Dificuldade = DificuldadeRecord
export type Conhecimento = ConhecimentoRecord
export type Agenda = AgendaRecord
export type SystemPrompt = SystemPromptRecord
export type Alerta = AlertaRecord
export type Memoria = MemoriaRecord
export type CheckinEmocional = CheckinEmocionalRecord

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
