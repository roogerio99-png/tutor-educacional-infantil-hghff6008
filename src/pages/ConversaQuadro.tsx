import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCrianca } from '@/contexts/CriancaContext'
import { enviarMensagemLumiStream, enviarMensagemLumiSync } from '@/services/lumiAgent'
import { obterPromptAtivo } from '@/services/prompts'
import { verificarCheckinHoje, registrarCheckinEmocional } from '@/services/checkinEmocional'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useGeminiLiveVoice, type VozGeminiLive } from '@/hooks/useGeminiLiveVoice'
import { getVozIaLumiPreferida, setVozIaLumiPreferida } from '@/services/lumiAudioService'
import { BotaoVozCrianca } from '@/components/BotaoVozCrianca'
import { BotaoOuvirLumi } from '@/components/BotaoOuvirLumi'
import type {
  EtapaSocratica,
  AcaoLumiExecutada,
  HumorEmocional,
  MissaoBnccRecord,
  MetaKanban,
} from '@/types'
import { TrilhaEtapasSocraticas } from '@/components/TrilhaEtapasSocraticas'
import { CartaoAcaoLumi } from '@/components/CartaoAcaoLumi'
import { CheckinEmocionalCard } from '@/components/CheckinEmocionalCard'
import { QuadroVisualContainer } from '@/components/QuadroVisualContainer'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { OrbeLumiLive, type EstadoLumiLive } from '@/components/OrbeLumiLive'
import { BarraCenariosTeste, type CenárioTesteInfo } from '@/components/BarraCenariosTeste'
import { TelemetriaCerebro, type EventoTelemetria } from '@/components/TelemetriaCerebro'
import { obterFasePorIdade } from '@/services/fasesAdaptativas'
import { listarMissoesPorFase } from '@/services/missoesBncc'
import { MissoesBnccContainer } from '@/components/fases/MissoesBnccContainer'
import { KanbanMetasWorkspace } from '@/components/fases/KanbanMetasWorkspace'
import { obterStatusUsoHoje } from '@/services/tempoUso'
import {
  MessageCircle,
  Palette,
  Sparkles,
  Send,
  RefreshCw,
  Wind,
  Volume2,
  VolumeX,
  Gauge,
  Hand,
  Rocket,
  BookOpen,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Mic,
} from 'lucide-react'

interface ChatMessage {
  id: string
  sender: 'lumi' | 'user'
  text: string
  timestamp: string
  visualHint?: string
  etapa?: EtapaSocratica
  acoes?: AcaoLumiExecutada[]
}

interface RitmoPreset {
  id: string
  nome: string
  rate: number
  descricao: string
}

const PRESETS_RITMO: RitmoPreset[] = [
  {
    id: 'natural',
    nome: '🌿 Natural (1.05x)',
    rate: 1.05,
    descricao: 'Ritmo real caloroso e entusiasmado (recomendado)',
  },
  {
    id: 'dinamico',
    nome: '⚡ Dinâmica (1.15x)',
    rate: 1.15,
    descricao: 'Mais ágil sem soar robótica',
  },
  {
    id: 'calmo',
    nome: '🐢 Bem Calmo (0.90x)',
    rate: 0.9,
    descricao: 'Pausado para alfabetização e foco',
  },
  {
    id: 'historinha',
    nome: '📖 Contadora (0.98x)',
    rate: 0.98,
    descricao: 'Cadência expressiva e acolhedora',
  },
]

const STORAGE_ETAPA_KEY = 'lumi_etapa_socratica_ativa'
const STORAGE_MATERIA_KEY = 'lumi_materia_detectada_ativa'

export const ConversaQuadro: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { criancaSelecionada } = useCrianca()
  const { modoCriancaAtivo, abrirModalSairModo } = useModoCrianca()
  const { tipoConta, permissoes } = useAuth()

  // Determina qual espaço segregado está ativo pela rota:
  // '/conversa' -> Foco 100% na conversa com a Lumi (Voz ou Texto)
  // '/quadro'   -> Foco no Quadro Visual, Missões BNCC e Caderninho
  const isModoQuadro = location.pathname.startsWith('/quadro')

  // Sub-aba dentro de '/quadro' para não sobrecarregar a criança: 'lousa' | 'missoes' | 'caderno'
  const [subAbaQuadro, setSubAbaQuadro] = useState<'lousa' | 'missoes' | 'caderno'>('lousa')

  // Gaveta recolhida por padrão para ferramentas de teste/telemetria do responsável
  const [mostrarPainelLaboratorioPais, setMostrarPainelLaboratorioPais] = useState(false)

  // Modal leve de Respiração (Momento Calma) acessível por 1 botão na conversa
  const [modalCalmaAberto, setModalCalmaAberto] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [customPromptText, setCustomPromptText] = useState<string | null>(null)

  // Modo Conversação por Voz (Lumi Live com Orbe Animada)
  const [modoConversacaoVoz, setModoConversacaoVoz] = useState<boolean>(() => {
    try {
      const salvo = localStorage.getItem('lumi_modo_conversacao_voz')
      return salvo === 'true'
    } catch {
      return false
    }
  })

  // Visão no chat: 'texto' (chat simples com bolhas) vs 'orbe' (Lumi Live Orbe de Voz Real)
  const [visaoChat, setVisaoChat] = useState<'texto' | 'orbe'>(() => {
    try {
      const salvo = localStorage.getItem('lumi_modo_conversacao_voz')
      return salvo === 'true' ? 'orbe' : 'texto'
    } catch {
      return 'texto'
    }
  })

  // Liga/Desliga Síntese Vocal da Lumi
  const [vozHabilitada, setVozHabilitada] = useState<boolean>(() => {
    try {
      const salvo = localStorage.getItem('lumi_voz_habilitada')
      return salvo !== 'false'
    } catch {
      return true
    }
  })

  // Timbre da Voz Real Gemini (Kore, Zephyr, Puck, Fenrir, Charon)
  const [vozRealAtiva, setVozRealAtiva] = useState<VozGeminiLive>(() => {
    return getVozIaLumiPreferida()
  })

  // Ritmo da Voz
  const [ritmoId, setRitmoId] = useState<string>(() => {
    try {
      const salvo = localStorage.getItem('lumi_ritmo_voz')
      if (salvo === 'rapido') {
        localStorage.setItem('lumi_ritmo_voz', 'natural')
        return 'natural'
      }
      return salvo || 'natural'
    } catch {
      return 'natural'
    }
  })

  const ritmoAtual = useMemo(() => {
    return PRESETS_RITMO.find((r) => r.id === ritmoId) || PRESETS_RITMO[0]
  }, [ritmoId])

  // Fase Adaptativa (Régua de Desenvolvimento 1, 2 e 3)
  const faseAtual = useMemo(() => {
    return obterFasePorIdade(criancaSelecionada?.idade)
  }, [criancaSelecionada?.idade])

  // Missões BNCC da fase
  const [missoesFase, setMissoesFase] = useState<MissaoBnccRecord[]>([])

  // Kanban de metas para Fase 3 (Workspace)
  const [metasKanban, setMetasKanban] = useState<MetaKanban[]>([
    {
      id: 'meta-1',
      titulo: 'Modelar equações de cinemática vetorial',
      materia: 'Física',
      status: 'em_progresso',
    },
    {
      id: 'meta-2',
      titulo: 'Refutar argumentos com falácias lógicas no Tribunal Socrático',
      materia: 'Filosofia',
      status: 'planejado',
    },
    {
      id: 'meta-3',
      titulo: 'Redação dissertativa sobre ética e inteligência artificial',
      materia: 'Redação',
      status: 'concluido',
    },
  ])

  // Controle de Fadiga Digital e Tempo Restante
  const [minutosRestantesUso, setMinutosRestantesUso] = useState<number | null>(null)
  const [chatBloqueadoPorTempo, setChatBloqueadoPorTempo] = useState(false)

  // Calibragem Psicopedagógica Piaget
  const estagioPiaget = useMemo(() => {
    const idade = criancaSelecionada?.idade || 8
    if (idade <= 8) {
      return {
        nome: 'O Ninho das Descobertas (Fase 1)',
        faixa: '5–8 anos',
        descricao: 'Alfabetização, consciência fonológica, contagem concreta e TTS em voz alta.',
      }
    }
    if (idade >= 13) {
      return {
        nome: 'O Workspace / HUB (Fase 3)',
        faixa: '13–16 anos',
        descricao: 'Mentor intelectual, dialética avançada, Kanban de metas e dark mode.',
      }
    }
    return {
      nome: 'A Central de Missões (Fase 2)',
      faixa: '9–12 anos',
      descricao: 'Copiloto de missões, lógica, engrenagens, frações e estética futurista.',
    }
  }, [criancaSelecionada?.idade])

  const [mensagemFalandoId, setMensagemFalandoId] = useState<string | null>(null)
  const [legendaFalando, setLegendaFalando] = useState<string>('')

  // Check-in Emocional Diário
  const [precisaCheckinHoje, setPrecisaCheckinHoje] = useState(false)
  const [salvandoCheckin, setSalvandoCheckin] = useState(false)
  const [humorHoje, setHumorHoje] = useState<HumorEmocional | null>(null)

  // Etapa Socrática e Matéria Detectada (compartilhadas entre /conversa e /quadro)
  const [etapaAtual, setEtapaAtualState] = useState<EtapaSocratica>(() => {
    try {
      return (localStorage.getItem(STORAGE_ETAPA_KEY) as EtapaSocratica) || 'entender'
    } catch {
      return 'entender'
    }
  })

  const [materiaDetectada, setMateriaDetectadaState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_MATERIA_KEY) || 'ciencias'
    } catch {
      return 'ciencias'
    }
  })

  const setEtapaAtual = useCallback((novaEtapa: EtapaSocratica) => {
    setEtapaAtualState(novaEtapa)
    try {
      localStorage.setItem(STORAGE_ETAPA_KEY, novaEtapa)
    } catch {
      // ignore
    }
  }, [])

  const setMateriaDetectada = useCallback((novaMateria: string) => {
    setMateriaDetectadaState(novaMateria)
    try {
      localStorage.setItem(STORAGE_MATERIA_KEY, novaMateria)
    } catch {
      // ignore
    }
  }, [])

  const [topicoQuadroCustom, setTopicoQuadroCustom] = useState<string>('')

  // Rótulo amigável da etapa em curso para a Orbe Live
  const passoAtualAmigavel = useMemo(() => {
    switch (etapaAtual) {
      case 'entender':
        return 'explorando o que você sabe 🔍'
      case 'contextualizar':
        return 'imaginando no seu dia a dia 💭'
      case 'guiar':
        return 'descobrindo pistas com você ✏️'
      case 'praticar':
        return 'hora de tentar um pedacinho 🧩'
      case 'consolidar':
        return 'celebrando sua conquista 🌟'
      default:
        return 'conversando com carinho ✨'
    }
  }, [etapaAtual])

  const detectarEtapaDoTexto = useCallback((texto: string): EtapaSocratica | null => {
    if (!texto) return null
    const norm = texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const matchTag = norm.match(/\[\[etapa:\s*(entender|contextualizar|guiar|praticar|consolidar)/i)
    if (matchTag && matchTag[1]) {
      return matchTag[1] as EtapaSocratica
    }

    if (
      norm.includes('entender o que voce ja sabe') ||
      norm.includes('me conta onde essa duvida') ||
      norm.includes('descobrir junto com voce') ||
      norm.includes('do comecinho o que voce') ||
      norm.includes('o que voce ja sabe') ||
      norm.includes('o que voce acha')
    ) {
      return 'entender'
    }
    if (
      norm.includes('outro jeito de pensar') ||
      norm.includes('no seu dia a dia') ||
      norm.includes('parecido com o que') ||
      norm.includes('imaginar isso') ||
      norm.includes('numa historinha')
    ) {
      return 'contextualizar'
    }
    if (
      norm.includes('te dar uma pistinha') ||
      norm.includes('primeiro passinho') ||
      norm.includes('olha bem para esse detalhe') ||
      norm.includes('passo a passo') ||
      norm.includes('uma dica')
    ) {
      return 'guiar'
    }
    if (
      norm.includes('sua vez de tentar') ||
      norm.includes('vamos praticar') ||
      norm.includes('desafio rapido') ||
      norm.includes('mao na massa')
    ) {
      return 'praticar'
    }
    if (
      norm.includes('voce conseguiu') ||
      norm.includes('como voce pensou') ||
      norm.includes('ensinar para um amigo') ||
      norm.includes('voce arrasou')
    ) {
      return 'consolidar'
    }
    return null
  }, [])

  // Respiração Guiada (Momento Calma & Foco)
  const [modoRespiracao, setModoRespiracao] = useState(false)
  const [anotacaoLivre, setAnotacaoLivre] = useState(
    'Dica da Lumi: quando você explica com suas próprias palavras, seu cérebro guarda muito melhor! ✨',
  )

  // Telemetria do Cérebro Conversacional (restrita ao painel de laboratório dos pais)
  const [eventosTelemetria, setEventosTelemetria] = useState<EventoTelemetria[]>([])
  const [acoesRecentes, setAcoesRecentes] = useState<AcaoLumiExecutada[]>([])

  const adicionarEventoTelemetria = useCallback((ev: Omit<EventoTelemetria, 'id' | 'horario'>) => {
    const novo: EventoTelemetria = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      horario: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      ...ev,
    }
    setEventosTelemetria((prev) => [novo, ...prev].slice(0, 30))
  }, [])

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const acessibilidadeReforcada =
    (criancaSelecionada?.acessibilidade || '').toLowerCase().includes('apoio visual') ||
    (criancaSelecionada?.acessibilidade || '').toLowerCase().includes('fonte grande')
  const fonteGrande = (criancaSelecionada?.acessibilidade || '')
    .toLowerCase()
    .includes('fonte grande')

  // Hook de Voz Real Full-Duplex com Gemini 3.8 Live
  const {
    isConnected: liveConnected,
    isConnecting: liveConnecting,
    isMicActive: liveMicActive,
    isSpeaking: liveSpeaking,
    isThinking: liveThinking,
    liveInputTranscript,
    liveOutputTranscript,
    volumeLevel,
    errorMessage: erroLiveVoice,
    permissionDenied: livePermDenied,
    connect: connectLive,
    disconnect: disconnectLive,
    toggleMic: toggleLiveMic,
    stopOutputPlayback: stopLivePlayback,
  } = useGeminiLiveVoice({
    criancaNome: criancaSelecionada?.nome,
    criancaIdade: criancaSelecionada?.idade,
    criancaSerie: criancaSelecionada?.serie,
    criancaInteresses: criancaSelecionada?.interesses,
    criancaAcessibilidade: criancaSelecionada?.acessibilidade,
    materiaAtual: materiaDetectada,
    etapaAtual,
    vozPreferida: vozRealAtiva,
    playbackRate: ritmoAtual.rate,
    muted: !vozHabilitada,
    onStageDetected: (etapa) => {
      setEtapaAtual(etapa)
    },
    onTurnComplete: (userText, lumiText) => {
      const horario = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const novasMsgs: ChatMessage[] = []
      if (userText && userText.trim()) {
        novasMsgs.push({
          id: `live-user-${Date.now()}`,
          sender: 'user',
          text: userText.trim(),
          timestamp: horario,
        })
      }
      if (lumiText && lumiText.trim()) {
        const etapaDetectada = detectarEtapaDoTexto(lumiText) || etapaAtual
        if (etapaDetectada) {
          setEtapaAtual(etapaDetectada)
        }
        setLegendaFalando(lumiText.trim())
        novasMsgs.push({
          id: `live-lumi-${Date.now() + 1}`,
          sender: 'lumi',
          text: lumiText.trim(),
          timestamp: horario,
          etapa: etapaDetectada,
        })
        adicionarEventoTelemetria({
          tipo: 'socratica',
          titulo: `Conversa de Voz Real (${vozRealAtiva})`,
          detalhe: `Turno concluído no Gemini Live na etapa ${etapaDetectada.toUpperCase()}.`,
          status: 'executado',
        })
      }
      if (novasMsgs.length > 0) {
        setMessages((prev) => [...prev, ...novasMsgs])
      }
    },
  })

  const handleTrocarVozReal = useCallback(
    (novaVoz: VozGeminiLive) => {
      setVozRealAtiva(novaVoz)
      setVozIaLumiPreferida(novaVoz)
      adicionarEventoTelemetria({
        tipo: 'piaget',
        titulo: `Voz Real Alterada: ${novaVoz}`,
        detalhe: `Timbre neural Gemini ajustado para ${novaVoz}.`,
        status: 'ativo',
      })
    },
    [adicionarEventoTelemetria],
  )

  const {
    isSupported: synthSuportado,
    isSpeaking,
    speak: synthSpeak,
    stop: synthStop,
    warmUp: synthWarmUp,
  } = useSpeechSynthesis({
    rate: ritmoAtual.rate,
    pitch: 1.05,
    vozIaNome: vozRealAtiva,
    onEnd: () => {
      setMensagemFalandoId(null)
      setLegendaFalando('')
      if ((modoConversacaoVoz || visaoChat === 'orbe') && !liveConnected && !isModoQuadro) {
        setTimeout(() => {
          startListening()
        }, 300)
      }
    },
    onError: () => {
      setMensagemFalandoId(null)
      setLegendaFalando('')
      if ((modoConversacaoVoz || visaoChat === 'orbe') && !liveConnected && !isModoQuadro) {
        setTimeout(() => {
          startListening()
        }, 300)
      }
    },
  })

  const falarMensagemLumi = useCallback(
    (msgId: string, texto: string) => {
      if (!vozHabilitada) return
      if (mensagemFalandoId === msgId && isSpeaking) {
        synthStop()
        setMensagemFalandoId(null)
        setLegendaFalando('')
      } else {
        stopLivePlayback()
        synthStop()
        setMensagemFalandoId(msgId)
        setLegendaFalando(texto)
        synthSpeak(texto)
      }
    },
    [vozHabilitada, mensagemFalandoId, isSpeaking, synthStop, synthSpeak, stopLivePlayback],
  )

  const executarBargeIn = useCallback(
    (motivo = 'Fala da criança') => {
      if (liveSpeaking || isSpeaking || mensagemFalandoId || enviando) {
        stopLivePlayback()
        synthStop()
        setMensagemFalandoId(null)
        setLegendaFalando('')
        adicionarEventoTelemetria({
          tipo: 'socratica',
          titulo: 'Barge-In Acionado (Interrupção Natural)',
          detalhe: `${motivo} interrompeu a fala da Lumi imediatamente. Turno devolvido à criança.`,
          status: 'executado',
        })
      }
    },
    [
      liveSpeaking,
      isSpeaking,
      mensagemFalandoId,
      enviando,
      stopLivePlayback,
      synthStop,
      adicionarEventoTelemetria,
    ],
  )

  const enviarTexto = useCallback(
    async (textoParaEnviar: string) => {
      const textoLimpo = textoParaEnviar.trim()
      if (!textoLimpo || enviando) return

      synthStop()
      setMensagemFalandoId(null)
      setLegendaFalando('')

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: textoLimpo,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, userMsg])
      setInputText('')
      setEnviando(true)

      const lumiMsgId = (Date.now() + 1).toString()
      let currentAssistantText = ''

      setMessages((prev) => [
        ...prev,
        {
          id: lumiMsgId,
          sender: 'lumi',
          text: 'Lumi está pensando com carinho...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])

      try {
        const minutosRestantesParam =
          minutosRestantesUso !== null && minutosRestantesUso <= 2 ? minutosRestantesUso : undefined

        const res = await enviarMensagemLumiStream(
          {
            message: textoLimpo,
            conversationId,
            criancaId: criancaSelecionada?.id,
            customPrompt: customPromptText,
            minutosRestantes: minutosRestantesParam,
          },
          {
            onChunk: (_delta, full) => {
              currentAssistantText = full
              setMessages((prev) =>
                prev.map((m) => (m.id === lumiMsgId ? { ...m, text: full } : m)),
              )
              const etapaDetectada = detectarEtapaDoTexto(full)
              if (etapaDetectada) {
                setEtapaAtual(etapaDetectada)
              }
              if (visaoChat === 'orbe') {
                setLegendaFalando(full)
              }
              if (full.length > 30 && /[.!?]\s*$/.test(full)) {
                import('@/services/lumiAudioService').then(({ preloadAudioLumi }) => {
                  preloadAudioLumi(full, vozRealAtiva)
                })
              }
            },
          },
        )

        if (res.conversationId) {
          setConversationId(res.conversationId)
        }

        if (res.etapa) {
          setEtapaAtual(res.etapa)
          adicionarEventoTelemetria({
            tipo: 'socratica',
            titulo: `Etapa Socrática: ${res.etapa.toUpperCase()}`,
            detalhe: `Transição pedagógica adaptada à resposta da criança.`,
            status: 'ativo',
          })
        }
        if (res.materia) {
          setMateriaDetectada(res.materia)
          adicionarEventoTelemetria({
            tipo: 'quadro',
            titulo: `Matéria Detectada: ${res.materia}`,
            detalhe: `Quadro visual sincronizado para ilustrações de ${res.materia}.`,
            status: 'executado',
          })
        }

        if (res.acoes && res.acoes.length > 0) {
          setAcoesRecentes(res.acoes)
          res.acoes.forEach((ac) => {
            adicionarEventoTelemetria({
              tipo: ac.tipo.includes('agenda') ? 'agenda' : 'subsunçor',
              titulo: ac.titulo || 'Ação Automatizada',
              detalhe: ac.conteudo || `Evento em ${ac.data || 'hoje'}`,
              status: 'executado',
            })
          })
        }

        const textoFinalLumi = res.content || currentAssistantText
        const etapaDaFala = detectarEtapaDoTexto(textoFinalLumi)
        const etapaFinal = res.etapa || etapaDaFala || etapaAtual
        if (etapaFinal) {
          setEtapaAtual(etapaFinal)
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === lumiMsgId
              ? {
                  ...m,
                  text: textoFinalLumi,
                  etapa: etapaFinal,
                  acoes: res.acoes,
                }
              : m,
          ),
        )

        if (
          (faseAtual.ttsObrigatorio ||
            (vozHabilitada && (modoConversacaoVoz || visaoChat === 'orbe'))) &&
          textoFinalLumi
        ) {
          setMensagemFalandoId(lumiMsgId)
          setLegendaFalando(textoFinalLumi)
          synthSpeak(textoFinalLumi)
        }

        if (
          (minutosRestantesUso !== null && minutosRestantesUso <= 2) ||
          textoFinalLumi.includes('nosso tempo de conexão por hoje está chegando ao fim')
        ) {
          setTimeout(() => {
            setChatBloqueadoPorTempo(true)
          }, 3500)
        }
      } catch (streamErr) {
        console.warn('Streaming falhou, tentando fallback síncrono:', streamErr)
        try {
          const minutosRestantesParamFallback =
            minutosRestantesUso !== null && minutosRestantesUso <= 2
              ? minutosRestantesUso
              : undefined

          const syncRes = await enviarMensagemLumiSync({
            message: textoLimpo,
            conversationId,
            criancaId: criancaSelecionada?.id,
            customPrompt: customPromptText,
            minutosRestantes: minutosRestantesParamFallback,
          })

          if (syncRes.conversation_id) {
            setConversationId(syncRes.conversation_id)
          }
          if (syncRes.etapa) {
            setEtapaAtual(syncRes.etapa)
          }
          if (syncRes.materia) {
            setMateriaDetectada(syncRes.materia)
          }
          if (syncRes.acoes && syncRes.acoes.length > 0) {
            setAcoesRecentes(syncRes.acoes)
          }

          const etapaDaFalaSync = detectarEtapaDoTexto(syncRes.content)
          const etapaFinalSync = syncRes.etapa || etapaDaFalaSync || etapaAtual
          if (etapaFinalSync) {
            setEtapaAtual(etapaFinalSync)
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === lumiMsgId
                ? {
                    ...m,
                    text: syncRes.content,
                    etapa: etapaFinalSync,
                    acoes: syncRes.acoes,
                  }
                : m,
            ),
          )

          if (
            (faseAtual.ttsObrigatorio ||
              (vozHabilitada && (modoConversacaoVoz || visaoChat === 'orbe'))) &&
            syncRes.content
          ) {
            setMensagemFalandoId(lumiMsgId)
            setLegendaFalando(syncRes.content)
            synthSpeak(syncRes.content)
          }
        } catch (err: unknown) {
          console.error('Falha geral na IA:', err)
          const textoErro =
            'Tive uma pequena falha na conexão, mas estou aqui com você! Pode me contar de novo?'
          setMessages((prev) =>
            prev.map((m) => (m.id === lumiMsgId ? { ...m, text: textoErro } : m)),
          )
        }
      } finally {
        setEnviando(false)
      }
    },
    [
      enviando,
      conversationId,
      criancaSelecionada?.id,
      customPromptText,
      visaoChat,
      modoConversacaoVoz,
      vozHabilitada,
      vozRealAtiva,
      etapaAtual,
      faseAtual.ttsObrigatorio,
      minutosRestantesUso,
      detectarEtapaDoTexto,
      setEtapaAtual,
      setMateriaDetectada,
      synthSpeak,
      synthStop,
      adicionarEventoTelemetria,
    ],
  )

  const {
    isSupported: recSuportado,
    isListening,
    interimTranscript,
    permissionDenied,
    errorMessage: erroReconhecimento,
    startListening,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    lang: 'pt-BR',
    silenceDurationMs: 1200,
    onSpeechStarted: () => {
      executarBargeIn('Início da fala da criança')
    },
    onFinalResult: (transcript) => {
      if (transcript.trim()) {
        if (modoConversacaoVoz || visaoChat === 'orbe') {
          setInputText('')
          enviarTexto(transcript.trim())
        } else {
          setInputText(transcript.trim())
          inputRef.current?.focus()
        }
      }
    },
  })

  // Ativar/desativar modo de voz ao vivo (Orbe) vs Chat em Texto de forma simples
  const handleAlternarModoVozOuTexto = (novoModo: 'orbe' | 'texto') => {
    const ativarVoz = novoModo === 'orbe'
    setVisaoChat(novoModo)
    setModoConversacaoVoz(ativarVoz)
    try {
      localStorage.setItem('lumi_modo_conversacao_voz', String(ativarVoz))
    } catch {
      // ignore
    }

    if (!ativarVoz) {
      stopLivePlayback()
      disconnectLive()
      synthStop()
      stopListening()
      setMensagemFalandoId(null)
      setLegendaFalando('')
    } else {
      synthWarmUp()
      connectLive(true)
    }
  }

  const handleFalarAgoraOrbe = useCallback(() => {
    if (liveConnected || liveConnecting) {
      toggleLiveMic()
    } else {
      connectLive(true)
    }
  }, [liveConnected, liveConnecting, toggleLiveMic, connectLive])

  const handleToggleVoz = () => {
    const novo = !vozHabilitada
    setVozHabilitada(novo)
    try {
      localStorage.setItem('lumi_voz_habilitada', String(novo))
    } catch {
      // ignore
    }
    if (!novo) {
      stopLivePlayback()
      synthStop()
      setMensagemFalandoId(null)
      setLegendaFalando('')
    }
  }

  const handleCicloRitmo = () => {
    const idx = PRESETS_RITMO.findIndex((r) => r.id === ritmoId)
    const proximo = PRESETS_RITMO[(idx + 1) % PRESETS_RITMO.length]
    setRitmoId(proximo.id)
    try {
      localStorage.setItem('lumi_ritmo_voz', proximo.id)
    } catch {
      // ignore
    }
    adicionarEventoTelemetria({
      tipo: 'piaget',
      titulo: `Ritmo da Voz Alterado: ${proximo.nome}`,
      detalhe: proximo.descricao,
      status: 'ativo',
    })
  }

  const handleExecutarCenario = async (cenario: CenárioTesteInfo) => {
    executarBargeIn('Cenário de teste disparado')
    setEtapaAtual(cenario.simulacaoEtapa)
    setMateriaDetectada(cenario.simulacaoMateria)

    adicionarEventoTelemetria({
      tipo: cenario.id === 'teste_guardrail' ? 'guardrail' : 'socratica',
      titulo: `Cenário: ${cenario.titulo}`,
      detalhe: cenario.acaoSincronizada,
      status: 'executado',
    })

    if (cenario.id === 'estou_frustrado') {
      setModoRespiracao(true)
      setModalCalmaAberto(true)
    }

    if (isModoQuadro) {
      navigate('/conversa')
    }
    await enviarTexto(cenario.mensagemUsuario)
  }

  useEffect(() => {
    obterPromptAtivo().then((p) => {
      if (p) {
        setCustomPromptText(
          `${p.identidade} Regra Socrática: ${p.metodo_socratico} ${p.diretrizes_pedagogicas || ''} NUNCA verbalize o passo nem anuncie métodos na fala.`,
        )
      }
    })
  }, [])

  useEffect(() => {
    if (criancaSelecionada) {
      const etapaInicial: EtapaSocratica = criancaSelecionada.ultima_etapa_socratica || 'entender'
      const materiaInicial = criancaSelecionada.ultima_materia || 'ciencias'

      setEtapaAtual(etapaInicial)
      setMateriaDetectada(materiaInicial)
      setConversationId(null)

      adicionarEventoTelemetria({
        tipo: 'piaget',
        titulo: `Criança Conectada: ${criancaSelecionada.nome}`,
        detalhe: `Estágio Piaget: ${estagioPiaget.nome} (${estagioPiaget.faixa}) | Bioma/Local: ${criancaSelecionada.localidade || 'Brasil'}`,
        status: 'ativo',
      })

      verificarCheckinHoje(criancaSelecionada.id).then((res) => {
        if (!res.fez_checkin) {
          setPrecisaCheckinHoje(true)
          setHumorHoje(null)
        } else {
          setPrecisaCheckinHoje(false)
          setHumorHoje(res.checkin?.humor || null)
          setMessages((prev) =>
            prev.length > 0
              ? prev
              : [
                  {
                    id: 'welcome',
                    sender: 'lumi',
                    text: `Oi, ${criancaSelecionada.nome.split(' ')[0]}! 🌟 Que alegria te ver aqui hoje! O que você gostaria de desvendar ou aprender comigo agora?`,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    visualHint: 'Quadro preparado para investigações!',
                    etapa: etapaInicial,
                  },
                ],
          )
        }
      })
    }
  }, [criancaSelecionada, estagioPiaget, adicionarEventoTelemetria, setEtapaAtual, setMateriaDetectada])

  const handleSelecionarHumor = async (humor: HumorEmocional) => {
    if (!criancaSelecionada) return
    try {
      setSalvandoCheckin(true)
      await registrarCheckinEmocional(criancaSelecionada.id, humor)
      setHumorHoje(humor)
      setPrecisaCheckinHoje(false)

      const primeiroNome = criancaSelecionada.nome.split(' ')[0]
      let textoBoasVindas = `Oi, ${primeiroNome}! Eu sou a Lumi ✨. `
      if (humor === 'triste' || humor === 'muito_triste') {
        textoBoasVindas += `Vi que você está um pouquinho para baixo hoje. Aqui vamos devagarzinho, com todo carinho! Se quiser, podemos respirar juntos ou conversar sobre algo divertido.`
        setModoRespiracao(true)
        setModalCalmaAberto(true)
      } else if (humor === 'muito_feliz' || humor === 'feliz') {
        textoBoasVindas += `Que felicidade ver essa sua animação hoje! O que vamos explorar juntos agora?`
      } else {
        textoBoasVindas += `Estou aqui prontinha para aprender com você, passo a passo e sem pressa. Qual curiosidade vamos descobrir hoje?`
      }

      setMessages([
        {
          id: 'welcome_checkin',
          sender: 'lumi',
          text: textoBoasVindas,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          visualHint: 'Lumi conectada ao seu ritmo!',
          etapa: etapaAtual,
        },
      ])
    } catch (err) {
      console.error('Erro ao registrar check-in:', err)
      setPrecisaCheckinHoje(false)
    } finally {
      setSalvandoCheckin(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, enviando])

  const handleEnviar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || enviando) return
    await enviarTexto(inputText)
  }

  useEffect(() => {
    listarMissoesPorFase(faseAtual.id).then((missoes) => {
      setMissoesFase(missoes)
    })
  }, [faseAtual.id])

  useEffect(() => {
    if (!criancaSelecionada) return

    let montado = true
    const verificarTempo = async () => {
      try {
        const status = await obterStatusUsoHoje(criancaSelecionada.id)
        if (!montado) return
        if (status.limite_diario_min > 0) {
          const rest = Math.max(0, status.tempo_restante_min)
          setMinutosRestantesUso(rest)
          if (rest <= 0 || status.bloqueado) {
            setChatBloqueadoPorTempo(true)
          }
        } else {
          setMinutosRestantesUso(null)
          setChatBloqueadoPorTempo(status.bloqueado)
        }
      } catch {
        /* intentionally ignored */
      }
    }

    verificarTempo()
    const timer = setInterval(verificarTempo, 30000)
    return () => {
      montado = false
      clearInterval(timer)
    }
  }, [criancaSelecionada])

  // Ao clicar em uma missão lá na aba Quadro & Missões, leva a criança para a conversa e inicia a missão!
  const handleIniciarMissao = (missao: MissaoBnccRecord) => {
    if (missao.materia) {
      const mLow = missao.materia.toLowerCase()
      if (mLow.includes('mat')) setMateriaDetectada('matematica')
      else if (mLow.includes('ciên') || mLow.includes('cien') || mLow.includes('fís'))
        setMateriaDetectada('ciencias')
      else if (mLow.includes('port') || mLow.includes('red')) setMateriaDetectada('portugues')
      else if (mLow.includes('hist')) setMateriaDetectada('historia')
      else if (mLow.includes('geo')) setMateriaDetectada('geografia')
    }
    navigate('/conversa')
    setTimeout(() => {
      enviarTexto(`Quero explorar a missão "${missao.titulo}". Como começamos?`)
    }, 100)
  }

  const handleOuvirMissao = (texto: string) => {
    synthStop()
    synthSpeak(texto)
  }

  const handleAtualizarStatusKanban = (
    id: string,
    novoStatus: 'planejado' | 'em_progresso' | 'concluido',
  ) => {
    setMetasKanban((prev) => prev.map((m) => (m.id === id ? { ...m, status: novoStatus } : m)))
  }

  const handleAdicionarMetaKanban = () => {
    const titulo = prompt('Título da nova meta acadêmica:')
    if (!titulo || !titulo.trim()) return
    const nova: MetaKanban = {
      id: `meta-${Date.now()}`,
      titulo: titulo.trim(),
      materia: 'Geral',
      status: 'planejado',
    }
    setMetasKanban((prev) => [...prev, nova])
  }

  const sugestoesRapidas = useMemo(() => {
    if (faseAtual.id === 'fase_1') {
      return [
        'Qual o som da letra B?',
        'Vamos contar maçãs coloridas?',
        'Me conta uma historinha curta!',
        'Como os passarinhos voam?',
      ]
    }
    if (faseAtual.id === 'fase_2') {
      return [
        'Como as frações dividem uma pizza?',
        'Como a folha faz fotossíntese?',
        'Como os espelhos refletem a luz?',
        'Me desafia com um enigma espacial!',
      ]
    }
    return [
      'Proponha uma tese para o Tribunal Socrático',
      'Como funciona a aceleração na cinemática vetorial?',
      'Identifique falácias lógicas neste argumento',
      'Como estruturar uma redação nota 1000?',
    ]
  }, [faseAtual.id])

  const handleSelecionarMateriaQuadro = (materiaId: string, label: string) => {
    setMateriaDetectada(materiaId)
    setTopicoQuadroCustom(label)
  }

  const handleNovaConversa = () => {
    stopLivePlayback()
    synthStop()
    stopListening()
    setMensagemFalandoId(null)
    setLegendaFalando('')
    setConversationId(null)
    setEtapaAtual('entender')
    const primeiroNome = criancaSelecionada?.nome?.split(' ')[0] || 'amigo(a)'
    const msgNova = `Começando uma nova aventura! O que vamos descobrir hoje, ${primeiroNome}?`
    setMessages([
      {
        id: 'nova',
        sender: 'lumi',
        text: msgNova,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        etapa: 'entender',
      },
    ])
    if (vozHabilitada && (modoConversacaoVoz || visaoChat === 'orbe') && !liveConnected) {
      setMensagemFalandoId('nova')
      setLegendaFalando(msgNova)
      synthSpeak(msgNova)
    }
  }

  const estadoOrbe: EstadoLumiLive =
    liveSpeaking || isSpeaking
      ? 'falando'
      : liveThinking || enviando
        ? 'pensando'
        : liveMicActive || isListening
          ? 'ouvindo'
          : 'ocioso'

  if (tipoConta === 'crianca' && !permissoes.conversa) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-[#F0E4D8] shadow-sm max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mb-4 shadow-sm">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-lg font-extrabold text-[#4A3B32]">Conversa Guardada 💛</h2>
        <p className="text-sm text-[#8A796C] max-w-md mt-2">
          Esse cantinho está guardado pelo seu responsável 💛. Em breve vocês conversarão juntos com
          a Lumi!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* Banner de Bem-Estar Digital quando restar <= 2 minutos */}
      {minutosRestantesUso !== null && minutosRestantesUso <= 2 && (
        <div className="bg-amber-500/20 border-2 border-amber-400 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⏳</span>
            <div>
              <p className="font-extrabold text-xs sm:text-sm">
                Hora de desacelerar por hoje, {criancaSelecionada?.nome?.split(' ')[0] || 'amigo(a)'}!
              </p>
              <p className="text-[11px] opacity-90">
                Restam menos de 2 minutos para descansar a mente e brincar fora da tela.
              </p>
            </div>
          </div>
          {chatBloqueadoPorTempo && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm shrink-0">
              Sessão Salva 🌟
            </span>
          )}
        </div>
      )}

      {/* Navegação Infantil Segregada e Clara no Topo: 1 atividade por vez! */}
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-amber-200/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <button
            type="button"
            onClick={() => navigate('/conversa')}
            className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              !isModoQuadro
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 scale-[1.01]'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100/80'
            }`}
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span>1. Conversar com a Lumi</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/quadro')}
            className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              isModoQuadro
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.01]'
                : 'bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100/80'
            }`}
          >
            <Palette className="w-5 h-5 shrink-0" />
            <span>2. Quadro & Missões 🎨</span>
          </button>
        </div>

        {/* Botão Calma rápido sempre disponível sem ocupar espaço na tela */}
        <button
          type="button"
          onClick={() => {
            setModoRespiracao(true)
            setModalCalmaAberto(true)
          }}
          className="px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="Fazer uma pausa para respirar com calma"
        >
          <span>🧘</span>
          <span>Pausa Calma</span>
        </button>
      </div>

      {/* =====================================================================
          ESPAÇO 1: CONVERSAR COM A LUMI (Foco 100% na conversa de voz ou texto)
         ===================================================================== */}
      {!isModoQuadro ? (
        <div className="space-y-4">
          {/* Check-in Emocional Diário (aparece apenas quando ainda não fez hoje) */}
          {precisaCheckinHoje && (
            <CheckinEmocionalCard
              nomeCrianca={criancaSelecionada?.nome?.split(' ')[0] || 'Amigo(a)'}
              onSelecionarHumor={handleSelecionarHumor}
              salvando={salvandoCheckin}
            />
          )}

          {/* Trilha Socrática simples e visual */}
          <TrilhaEtapasSocraticas
            etapaAtiva={etapaAtual}
            onSelecionarEtapa={(et) => setEtapaAtual(et)}
          />

          {/* Cartão Único e Limpo de Conversa com a Lumi */}
          <div className="flex flex-col bg-white rounded-3xl shadow-soft border border-amber-100 overflow-hidden">
            {/* Cabeçalho Limpo da Lumi */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50/50 border-b border-amber-100/90 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center text-xl shadow-md shadow-amber-400/30 shrink-0">
                  ✨
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-800">Lumi</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Pronta para ajudar
                    </span>
                    {humorHoje && (
                      <span className="text-[11px] text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                        {humorHoje === 'muito_feliz' && '🌟 Super Feliz!'}
                        {humorHoje === 'feliz' && '😊 Feliz'}
                        {humorHoje === 'neutro' && '😐 Tranquilo(a)'}
                        {humorHoje === 'triste' && '💛 Acolhendo você'}
                        {humorHoje === 'muito_triste' && '💛 Com todo carinho'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conversando com{' '}
                    <span className="font-bold text-slate-700">
                      {criancaSelecionada?.nome?.split(' ')[0] || 'você'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Seletor Grande e Infantil: Voz ao Vivo vs Texto + Som */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-amber-100/90 p-1 rounded-2xl border border-amber-200">
                  <button
                    type="button"
                    onClick={() => handleAlternarModoVozOuTexto('orbe')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      visaoChat === 'orbe'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-white/60'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>Voz ao Vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAlternarModoVozOuTexto('texto')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      visaoChat === 'texto'
                        ? 'bg-white text-amber-950 shadow-xs'
                        : 'text-amber-900 hover:bg-white/60'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Texto</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleToggleVoz}
                  title={vozHabilitada ? 'Silenciar voz da Lumi' : 'Ativar voz da Lumi'}
                  className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    vozHabilitada
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-300'
                  }`}
                >
                  {vozHabilitada ? (
                    <Volume2 className="w-4 h-4 text-amber-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCicloRitmo}
                  title={`Ritmo da voz: ${ritmoAtual.nome}`}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-600" />
                  <span>{ritmoAtual.rate}x</span>
                </button>

                <button
                  type="button"
                  onClick={handleNovaConversa}
                  title="Começar nova conversa"
                  className="p-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {modoCriancaAtivo && (
                  <button
                    type="button"
                    onClick={abrirModalSairModo}
                    title="Sair do Modo Criança (pede PIN)"
                    className="text-xs text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>🔒</span>
                  </button>
                )}
              </div>
            </div>

            {/* Botão de Interrupção Rápida quando Lumi está falando */}
            {(liveSpeaking || isSpeaking) && visaoChat === 'texto' && (
              <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                  <span className="animate-pulse">🔊</span> Lumi está falando...
                </span>
                <button
                  type="button"
                  onClick={() => executarBargeIn('Interrupção manual')}
                  className="text-xs font-black bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Parar fala</span>
                </button>
              </div>
            )}

            {/* CONTEÚDO CENTRAL: ORBE DE VOZ REAL OU CHAT DE TEXTO */}
            {visaoChat === 'orbe' ? (
              <div className="p-4 sm:p-6 bg-slate-50/40">
                <OrbeLumiLive
                  estado={estadoOrbe}
                  legendaOuvindo={liveInputTranscript || interimTranscript}
                  legendaFalando={
                    liveOutputTranscript ||
                    legendaFalando ||
                    (messages[messages.length - 1]?.sender === 'lumi'
                      ? messages[messages.length - 1]?.text
                      : '')
                  }
                  vozHabilitada={vozHabilitada}
                  onToggleVoz={handleToggleVoz}
                  onInterromper={() => executarBargeIn('Botão Interromper Lumi')}
                  onFalarAgora={handleFalarAgoraOrbe}
                  isListening={liveMicActive || isListening}
                  ritmoNome={ritmoAtual.nome}
                  onCicloRitmo={handleCicloRitmo}
                  isSupported={true}
                  permissionDenied={livePermDenied || permissionDenied}
                  errorMessage={erroLiveVoice || erroReconhecimento}
                  etapaAtual={etapaAtual}
                  passoDetectadoNome={passoAtualAmigavel}
                  liveConnected={liveConnected}
                  liveConnecting={liveConnecting}
                  volumeLevel={volumeLevel}
                  vozRealAtiva={vozRealAtiva}
                  onTrocarVozReal={handleTrocarVozReal}
                />
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scroll min-h-[380px] max-h-[520px] bg-slate-50/30">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-3 ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender === 'lumi' && (
                        <div
                          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0"
                          aria-label="Lumi"
                        >
                          ✨
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-3xl p-4 shadow-xs text-sm sm:text-base leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-amber-500 text-white font-medium rounded-br-xs'
                            : 'bg-white text-slate-800 border border-amber-100 rounded-bl-xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">
                          {msg.text.replace(/\[\[ETAPA:[^\]]+\]\]/gi, '').trim()}
                        </div>

                        {msg.acoes && msg.acoes.length > 0 && (
                          <div className="space-y-2 mt-2.5">
                            {msg.acoes.map((acao, i) => (
                              <CartaoAcaoLumi key={i} acao={acao} />
                            ))}
                          </div>
                        )}

                        <div
                          className={`mt-2 text-[11px] flex items-center justify-between gap-3 ${
                            msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {msg.sender === 'lumi' && synthSuportado && (
                            <BotaoOuvirLumi
                              isSpeaking={mensagemFalandoId === msg.id && isSpeaking}
                              onClick={() => falarMensagemLumi(msg.id, msg.text)}
                              tamanho="sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {enviando && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700 font-bold italic pl-12 animate-pulse">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Lumi está preparando a resposta com carinho...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {isListening && (
                  <div className="px-4 py-3 bg-red-50/90 border-t border-red-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-red-900">
                          Ouvindo você... Pode falar! 🎤
                        </div>
                        {interimTranscript && (
                          <p
                            className={`text-red-950 font-black italic mt-0.5 ${
                              fonteGrande ? 'text-lg' : 'text-sm'
                            }`}
                          >
                            &ldquo;{interimTranscript}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={stopListening}
                      className="px-3.5 py-2 rounded-xl bg-red-200 hover:bg-red-300 text-red-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      Concluir fala ✓
                    </button>
                  </div>
                )}

                {/* Sugestões Rápidas Simples */}
                <div className="px-4 py-2.5 bg-amber-50/50 border-t border-amber-100/70 flex items-center gap-2 overflow-x-auto custom-scroll">
                  <span className="text-[11px] font-bold text-amber-800/80 uppercase tracking-wider shrink-0">
                    Ideias:
                  </span>
                  {sugestoesRapidas.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => enviarTexto(sug)}
                      disabled={enviando}
                      className="text-xs bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-amber-200/90 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-semibold cursor-pointer active:scale-95"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Barra de Digitação e Microfone */}
            {chatBloqueadoPorTempo ? (
              <div className="p-4 bg-amber-50/90 border-t border-amber-200 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">🌙</span>
                <p className="font-extrabold text-sm text-amber-900">
                  Seu tempo de conexão de hoje terminou!
                </p>
                <p className="text-xs text-amber-800 max-w-md">
                  A Lumi já guardou todo o seu progresso com carinho. Hora de descansar e brincar!
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleEnviar}
                className="p-3 sm:p-4 bg-amber-50/40 border-t border-amber-100 flex items-center gap-2.5"
              >
                <BotaoVozCrianca
                  isListening={isListening}
                  isSupported={recSuportado}
                  disabled={enviando}
                  onClick={toggleListening}
                  acessibilidadeReforcada={acessibilidadeReforcada}
                  tamanho="grande"
                  permissionDenied={permissionDenied}
                />

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Ouvindo sua voz com carinho... 🎤'
                      : 'Escreva aqui ou toque no microfone para falar...'
                  }
                  disabled={enviando}
                  className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-amber-300 bg-white text-slate-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || enviando}
                  aria-label="Enviar mensagem"
                  className="h-12 sm:h-14 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-black text-sm sm:text-base shadow-md active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Atalho amigável para ver a ilustração do tema atual no Quadro */}
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-indigo-950">
                  Quer ver o desenho desta matéria ou escolher uma Missão do Dia?
                </p>
                <p className="text-xs text-indigo-700">
                  O Quadro Mágico está sintonizado em{' '}
                  <strong className="uppercase">{materiaDetectada}</strong> para te ajudar!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quadro')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span>Ir para Quadro & Missões</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* =====================================================================
            ESPAÇO 2: QUADRO VISUAL, MISSÕES DO DIA & CADERNINHO (Segregado!)
           ===================================================================== */
        <div className="space-y-4">
          {/* Sub-navegação simples em 3 cartões grandes para a criança escolher 1 coisa por vez */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSubAbaQuadro('lousa')}
              className={`p-3 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                subAbaQuadro === 'lousa'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-800 border-indigo-100 hover:border-indigo-300'
              }`}
            >
              <Palette className="w-6 h-6 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm block">Lousa Ilustrada</span>
                <span
                  className={`text-[11px] hidden sm:block ${
                    subAbaQuadro === 'lousa' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  Esquemas visuais por matéria
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaQuadro('missoes')}
              className={`p-3 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                subAbaQuadro === 'missoes'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : 'bg-white text-slate-800 border-amber-100 hover:border-amber-300'
              }`}
            >
              <Rocket className="w-6 h-6 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm block">Missões do Dia</span>
                <span
                  className={`text-[11px] hidden sm:block ${
                    subAbaQuadro === 'missoes' ? 'text-amber-100' : 'text-slate-500'
                  }`}
                >
                  Desafios práticos BNCC
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaQuadro('caderno')}
              className={`p-3 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                subAbaQuadro === 'caderno'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-slate-800 border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <BookOpen className="w-6 h-6 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm block">Meu Caderninho</span>
                <span
                  className={`text-[11px] hidden sm:block ${
                    subAbaQuadro === 'caderno' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  Anotações & Calma
                </span>
              </div>
            </button>
          </div>

          {/* SUB-ABA 1: LOUSA ILUSTRADA */}
          {subAbaQuadro === 'lousa' && (
            <div className="space-y-4">
              {/* Botões visuais de matérias para a criança trocar sem usar prompt() */}
              <div className="bg-white rounded-2xl p-3 border border-indigo-100 flex items-center gap-2 overflow-x-auto custom-scroll">
                <span className="text-xs font-extrabold text-slate-500 shrink-0 px-1">
                  Escolha o tema do Quadro:
                </span>
                {[
                  { id: 'ciencias', label: '🌱 Ciências' },
                  { id: 'matematica', label: '🍕 Matemática' },
                  { id: 'portugues', label: '📖 Português' },
                  { id: 'historia', label: '🏛️ História' },
                  { id: 'geografia', label: '🗺️ Geografia' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelecionarMateriaQuadro(m.id, m.label)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                      materiaDetectada === m.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-indigo-50 text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <QuadroVisualContainer
                materia={materiaDetectada}
                etapaSocratica={etapaAtual}
                acessibilidade={criancaSelecionada?.acessibilidade}
                topicoCustomizado={topicoQuadroCustom}
                onTrocarTopico={() => {
                  const ordem = ['ciencias', 'matematica', 'portugues', 'historia', 'geografia']
                  const prox = ordem[(ordem.indexOf(materiaDetectada) + 1) % ordem.length]
                  setMateriaDetectada(prox)
                }}
              />
            </div>
          )}

          {/* SUB-ABA 2: MISSÕES DO DIA (BNCC + KANBAN FASE 3) */}
          {subAbaQuadro === 'missoes' && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-amber-100 space-y-5">
              <MissoesBnccContainer
                missoes={missoesFase}
                fase={faseAtual.id}
                onIniciarMissao={handleIniciarMissao}
                onOuvirMissao={handleOuvirMissao}
              />

              {faseAtual.id === 'fase_3' && (
                <KanbanMetasWorkspace
                  metas={metasKanban}
                  onAtualizarStatus={handleAtualizarStatusKanban}
                  onAdicionarMeta={handleAdicionarMetaKanban}
                />
              )}
            </div>
          )}

          {/* SUB-ABA 3: MEU CADERNINHO & MOMENTO CALMA */}
          {subAbaQuadro === 'caderno' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-soft border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <span>📝</span> Meu Caderninho de Descobertas
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Suas palavras
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Anote aqui o que você aprendeu hoje com a Lumi. Escrever com suas palavras ajuda
                    o cérebro a guardar para sempre!
                  </p>
                  <textarea
                    rows={5}
                    value={anotacaoLivre}
                    onChange={(e) => setAnotacaoLivre(e.target.value)}
                    className="w-full bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
                    placeholder="Escreva aqui com suas próprias palavras o que você descobriu com a Lumi..."
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-soft flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center">
                      <Wind className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Momento Calma & Foco</h4>
                      <p className="text-[11px] text-indigo-200">
                        Respiração da Flor e da Vela (inspire 4s, expire 4s)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModoRespiracao(!modoRespiracao)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all cursor-pointer"
                  >
                    {modoRespiracao ? 'Pausar' : 'Começar 🧘'}
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-400 flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg shadow-indigo-500/30 transition-transform ${
                      modoRespiracao ? 'breathe-circle' : ''
                    }`}
                  >
                    <div className="text-center p-2">
                      <span className="block text-xl">🌸🕯️</span>
                      <span className="text-[10px] font-black uppercase text-indigo-950">
                        {modoRespiracao ? 'Inspire... Assopre...' : 'Respirar'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-200 text-center mt-3 max-w-xs leading-relaxed">
                    Cheire a florzinha devagar e assopre a vela suavemente sem apagar!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          GAVETA OPCIONAL DO RESPONSÁVEL (Cenários de Teste & Telemetria)
          100% Oculta no Modo Criança e recolhida por padrão para não poluir!
         ===================================================================== */}
      {!modoCriancaAtivo && tipoConta === 'responsavel' && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setMostrarPainelLaboratorioPais(!mostrarPainelLaboratorioPais)}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-200/70 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-slate-500" />
              <span>
                Ferramentas de Demonstração para os Pais (Cenários Rápidos & Telemetria Socrática)
              </span>
            </span>
            {mostrarPainelLaboratorioPais ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {mostrarPainelLaboratorioPais && (
            <div className="mt-3 space-y-4 animate-in fade-in duration-200">
              <BarraCenariosTeste onExecutarCenario={handleExecutarCenario} disabled={enviando} />
              <TelemetriaCerebro
                etapaAtual={etapaAtual}
                materiaAtual={materiaDetectada}
                estagioPiaget={estagioPiaget}
                acoesRecentes={acoesRecentes}
                eventos={eventosTelemetria}
                guardrailAtivo={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal Leve de Pausa Calma (Respiração da Flor e da Vela) */}
      {modalCalmaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-2xl max-w-md w-full border border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center">
                  <Wind className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Pausa Calma com a Lumi 🧘</h3>
                  <p className="text-xs text-indigo-200">Respiração da Flor e da Vela</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModoRespiracao(false)
                  setModalCalmaAberto(false)
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Voltar ✓
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div
                className={`w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-400 flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg shadow-indigo-500/30 transition-transform ${
                  modoRespiracao ? 'breathe-circle' : ''
                }`}
              >
                <div className="text-center p-2">
                  <span className="block text-2xl">🌸🕯️</span>
                  <span className="text-[10px] font-black uppercase text-indigo-950">
                    {modoRespiracao ? 'Inspire... Assopre...' : 'Pausado'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 text-center mt-4 leading-relaxed">
                Cheire a florzinha contando até 4... e assopre a velinha bem devagar sem apagar!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversaQuadro
