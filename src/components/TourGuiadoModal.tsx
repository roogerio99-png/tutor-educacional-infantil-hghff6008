import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Calendar,
  BarChart3,
  Sliders,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Compass,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react'

export interface PassoTour {
  id: 'conversa' | 'agenda' | 'grafo' | 'prompts'
  numero: number
  abaLabel: string
  rota: string
  titulo: string
  subtitulo: string
  descricao: string
  corGradiente: string
  corBadge: string
  icone: React.ReactNode
  destaques: Array<{
    emoji: string
    titulo: string
    texto: string
  }>
  dicaResponsavel: string
}

export const PASSOS_TOUR_APRENDIZ: PassoTour[] = [
  {
    id: 'conversa',
    numero: 1,
    abaLabel: '1. Conversa & Quadro',
    rota: '/conversa',
    titulo: 'Conversa Socrática & Quadro Visual',
    subtitulo: 'Onde a criança aprende pensando, falando com voz real e desenhando ideias',
    descricao:
      'Nesta aba principal, a Lumi conversa com seu filho(a) usando o Método Socrático: ela nunca entrega a resposta pronta, mas faz perguntas acolhedoras que constroem o raciocínio passo a passo.',
    corGradiente: 'from-amber-500 via-orange-500 to-amber-400',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    icone: <MessageSquare className="w-6 h-6 text-white" />,
    destaques: [
      {
        emoji: '🎙️',
        titulo: 'Orbe Live com Voz Real Full-Duplex',
        texto:
          'Conversa por voz natural em tempo real com 5 timbres neurais e interrupção instantânea (barge-in) quando a criança fala.',
      },
      {
        emoji: '🎨',
        titulo: 'Quadro Visual Pedagógico Sincronizado',
        texto:
          'Ilustra automaticamente esquemas de Matemática, Ciências, Português, História e Geografia conforme o tema da conversa.',
      },
      {
        emoji: '🌱',
        titulo: 'Missões BNCC & Check-in Emocional',
        texto:
          'Atividades práticas alinhadas à idade (Piaget) e acolhimento do humor diário com exercício de respiração guiada.',
      },
    ],
    dicaResponsavel:
      'Você pode testar cenários pedagógicos na barra rápida no topo ou ativar o Modo Criança para entregar o dispositivo com segurança.',
  },
  {
    id: 'agenda',
    numero: 2,
    abaLabel: '2. Agenda Escolar',
    rota: '/agenda',
    titulo: 'Agenda Escolar Inteligente',
    subtitulo: 'Organização de provas, tarefas, leituras e compromissos sem esquecimentos',
    descricao:
      'Acompanhe e cadastre todas as atividades escolares de cada filho(a) em um só lugar, organizadas por matéria, data, horário e status de conclusão.',
    corGradiente: 'from-sky-500 via-blue-600 to-indigo-500',
    corBadge: 'bg-sky-100 text-sky-900 border-sky-300',
    icone: <Calendar className="w-6 h-6 text-white" />,
    destaques: [
      {
        emoji: '🤖',
        titulo: 'Agendamento Automático pela Lumi',
        texto:
          'Se a criança disser no chat "tenho prova de Ciências amanhã", a Lumi anota automaticamente o compromisso na Agenda!',
      },
      {
        emoji: '📚',
        titulo: 'Classificação por Tipo e Matéria',
        texto:
          'Filtre rapidamente entre Provas, Tarefas de Casa, Revisões e Projetos com indicadores visuais de prazos.',
      },
      {
        emoji: '✅',
        titulo: 'Reforço de Autonomia',
        texto:
          'Permite marcar atividades concluídas para celebrar o progresso diário da criança nos estudos.',
      },
    ],
    dicaResponsavel:
      'Use a Agenda antes do início da semana para que a Lumi priorize os temas das próximas provas durante as conversas.',
  },
  {
    id: 'grafo',
    numero: 3,
    abaLabel: '3. Grafo & Painel',
    rota: '/grafo-painel',
    titulo: 'Grafo Cognitivo & Painel da Família',
    subtitulo: 'Visão completa do desenvolvimento acadêmico, emocional e segurança',
    descricao:
      'Exclusivo para os responsáveis, este painel revela como a criança está aprendendo, quais analogias funcionam melhor para ela e como está seu bem-estar socioemocional.',
    corGradiente: 'from-emerald-500 via-teal-600 to-cyan-600',
    corBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icone: <BarChart3 className="w-6 h-6 text-white" />,
    destaques: [
      {
        emoji: '🧠',
        titulo: 'Subsunçores & Mapeamento de Dificuldades',
        texto:
          'Veja os conhecimentos-ponte (ex: explicar frações com pizza ou dezenas com Minecraft) e os pontos de atenção por matéria.',
      },
      {
        emoji: '💬',
        titulo: 'Pontes de Conversa para o Jantar',
        texto:
          'Sugestões práticas geradas após cada sessão para você puxar assunto com seu filho(a) fora das telas.',
      },
      {
        emoji: '🛡️',
        titulo: 'Termômetro Emocional, LGPD & Acesso da Criança',
        texto:
          'Histórico de humor, alertas de proteção prioritários, gestão de login próprio da criança e controle total de privacidade.',
      },
    ],
    dicaResponsavel:
      'Confira as "Pontes de Conversa" após os estudos: quando a criança explica aos pais o que aprendeu, a fixação na memória triplica!',
  },
  {
    id: 'prompts',
    numero: 4,
    abaLabel: '4. Studio & Família',
    rota: '/prompts',
    titulo: 'Studio de Prompts & Configurações da Família',
    subtitulo: 'Personalize a didática da Lumi, timbres de voz real e limites saudáveis de uso',
    descricao:
      'Ajuste o comportamento pedagógico do agente socrático no Studio de Prompts e configure perfis dos filhos, voz neural e tempo máximo diário em Família & Uso.',
    corGradiente: 'from-purple-600 via-indigo-600 to-violet-600',
    corBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    icone: <Sliders className="w-6 h-6 text-white" />,
    destaques: [
      {
        emoji: '🎛️',
        titulo: 'Studio de Prompts Socráticos',
        texto:
          'Edite ou crie perfis de instrução definindo identidade, diretrizes pedagógicas, tom de voz e regras do quadro visual.',
      },
      {
        emoji: '🔊',
        titulo: '5 Vozes Neurais Reais & Controle de Tempo',
        texto:
          'Em "Família & Uso", escolha a voz favorita (Kore, Zephyr, Puck, Fenrir ou Charon) e defina limites diários e janela de horário.',
      },
      {
        emoji: '🔒',
        titulo: 'Modo Criança Protegido por PIN',
        texto:
          'Trave as abas de configuração com um PIN de 4 dígitos para que a criança navegue apenas no ambiente seguro de estudo.',
      },
    ],
    dicaResponsavel:
      'A conta de demonstração já possui o PIN padrão 1234 configurado para você experimentar o Modo Criança quando quiser.',
  },
]

export const STORAGE_KEY_TOUR_VISTO = 'lumi_tour_guiado_v1_concluido'

interface TourGuiadoModalProps {
  isOpen: boolean
  onClose: () => void
  onHighlightTab?: (tabId: PassoTour['id'] | null) => void
}

export const TourGuiadoModal: React.FC<TourGuiadoModalProps> = ({
  isOpen,
  onClose,
  onHighlightTab,
}) => {
  const [passoIdx, setPassoIdx] = useState(0)
  const navigate = useNavigate()

  const passoAtual = PASSOS_TOUR_APRENDIZ[passoIdx]
  const totalPassos = PASSOS_TOUR_APRENDIZ.length
  const isUltimoPasso = passoIdx === totalPassos - 1

  useEffect(() => {
    if (isOpen) {
      onHighlightTab?.(PASSOS_TOUR_APRENDIZ[passoIdx].id)
    } else {
      onHighlightTab?.(null)
    }
  }, [isOpen, passoIdx, onHighlightTab])

  const concluirTour = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TOUR_VISTO, 'true')
    } catch {
      // ignore
    }
    onHighlightTab?.(null)
    onClose()
  }, [onClose, onHighlightTab])

  const avancar = useCallback(() => {
    if (passoIdx < totalPassos - 1) {
      setPassoIdx((prev) => prev + 1)
    } else {
      concluirTour()
    }
  }, [passoIdx, totalPassos, concluirTour])

  const voltar = useCallback(() => {
    if (passoIdx > 0) {
      setPassoIdx((prev) => prev - 1)
    }
  }, [passoIdx])

  const irParaAbaAtual = () => {
    navigate(passoAtual.rota)
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        concluirTour()
      } else if (e.key === 'ArrowRight') {
        avancar()
      } else if (e.key === 'ArrowLeft') {
        voltar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, avancar, voltar, concluirTour])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-guiado-titulo"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho com gradiente dinâmico da aba */}
        <div
          className={`bg-gradient-to-r ${passoAtual.corGradiente} p-4 sm:p-6 text-white relative transition-all duration-300`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0 border border-white/30">
                {passoAtual.icone}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-black/25 text-white border border-white/20">
                    <Compass className="w-3 h-3" />
                    Tour do Responsável • Aba {passoAtual.numero} de {totalPassos}
                  </span>
                </div>
                <h2
                  id="tour-guiado-titulo"
                  className="text-lg sm:text-xl font-black tracking-tight mt-1 text-white"
                >
                  {passoAtual.titulo}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5">
                  {passoAtual.subtitulo}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={concluirTour}
              title="Fechar tour guiado"
              className="p-2 rounded-xl bg-black/15 hover:bg-black/30 text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Seletor rápido das 4 Abas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-white/20">
            {PASSOS_TOUR_APRENDIZ.map((p, idx) => {
              const ativo = idx === passoIdx
              const visitado = idx < passoIdx
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPassoIdx(idx)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                    ativo
                      ? 'bg-white text-slate-900 shadow-sm scale-[1.02]'
                      : visitado
                        ? 'bg-white/25 text-white hover:bg-white/35'
                        : 'bg-black/15 text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {visitado ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current/15 flex items-center justify-center text-[10px] font-black shrink-0">
                      {p.numero}
                    </span>
                  )}
                  <span className="truncate">{p.abaLabel.replace(/^\d+\.\s*/, '')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Corpo explicativo da aba */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{passoAtual.descricao}</p>
            <button
              type="button"
              onClick={irParaAbaAtual}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-amber-300 transition-colors shrink-0 cursor-pointer"
              title={`Navegar para ${passoAtual.abaLabel}`}
            >
              <span>Ver aba ao vivo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Destaques da Aba */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Principais Funcionalidades desta Aba
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {passoAtual.destaques.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-start gap-3 hover:border-amber-300 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-lg shrink-0">
                    {item.emoji}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {item.titulo}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dica prática para o Responsável */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 leading-relaxed">
              <strong className="font-extrabold">Dica para os pais:</strong>{' '}
              {passoAtual.dicaResponsavel}
            </p>
          </div>
        </div>

        {/* Rodapé de navegação do Tour */}
        <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={concluirTour}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Pular tour
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Você pode reabrir este guia a qualquer momento no botão &ldquo;Tour Guiado&rdquo; no topo.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={voltar}
              disabled={passoIdx === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={avancar}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isUltimoPasso ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Começar a Usar!</span>
                </>
              ) : (
                <>
                  <span>Próxima Aba</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TourGuiadoModal
