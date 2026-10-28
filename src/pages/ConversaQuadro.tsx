import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCrianca } from '@/contexts/CriancaContext'
import { enviarMensagemLumiStream, enviarMensagemLumiSync } from '@/services/lumiAgent'
import { obterPromptAtivo } from '@/services/prompts'
import { verificarCheckinHoje, registrarCheckinEmocional } from '@/services/checkinEmocional'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { BotaoVozCrianca } from '@/components/BotaoVozCrianca'
import { BotaoOuvirLumi } from '@/components/BotaoOuvirLumi'
import { ToggleModoConversacao } from '@/components/ToggleModoConversacao'
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
import { finalizarSessaoMetricas } from '@/services/metricasSocioemocionais'
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

// Presets de Ritmo da Voz calibrados para ritmo natural humano
interface RitmoPreset {
  id: string
  nome: string
  rate: number
  descricao: string
}

const PRESETS_RITMO: RitmoPreset[] = [
  {
    id: 'natural',
    nome: '🌿 Natural & Viva (1.05x)',
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

export const ConversaQuadro: React.FC = () => {
  const { criancaSelecionada } = useCrianca()
  const { modoCriancaAtivo, abrirModalSairModo } = useModoCrianca()
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

  // Visão no chat: 'texto' (chat tradicional com bolhas) vs 'orbe' (Lumi Live Orbe imersiva)
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

  // Ritmo da Voz (Presets: Padrão Natural 1.05x, migrando 'rapido' antigo se houver)
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

  // Controle de Fadiga Digital e Tempo Restante (<= 2 min dispara gatilho amigável e bloqueio passivo)
  const [minutosRestantesUso, setMinutosRestantesUso] = useState<number | null>(null)
  const [chatBloqueadoPorTempo, setChatBloqueadoPorTempo] = useState(false)
  const [gatilhoFadigaInjetado, setGatilhoFadigaInjetado] = useState(false)

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

  // Mensagem atualmente sendo falada pela Lumi (ID para controle de botão individual)
  const [mensagemFalandoId, setMensagemFalandoId] = useState<string | null>(null)
  const [legendaFalando, setLegendaFalando] = useState<string>('')

  // Aba ativa para telas móveis: 'chat' | 'quadro'
  const [abaAtivaMobile, setAbaAtivaMobile] = useState<'chat' | 'quadro'>('chat')

  // Check-in Emocional Diário
  const [precisaCheckinHoje, setPrecisaCheckinHoje] = useState(false)
  const [salvandoCheckin, setSalvandoCheckin] = useState(false)
  const [humorHoje, setHumorHoje] = useState<HumorEmocional | null>(null)

  // Etapa Socrática e Matéria Detectada
  const [etapaAtual, setEtapaAtual] = useState<EtapaSocratica>('entender')
  const [materiaDetectada, setMateriaDetectada] = useState<string>('ciencias')
  const [topicoQuadroCustom, setTopicoQuadroCustom] = useState<string>('')

  // Rótulo amigável e espontâneo da etapa em curso para a Orbe Live
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

  // Função utilitária para detectar e sincronizar etapa a partir da fala da Lumi em tempo real
  const detectarEtapaDoTexto = useCallback((texto: string): EtapaSocratica | null => {
    if (!texto) return null
    const norm = texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    // 1. Match explícito por tag [[ETAPA: ...]] (fonte mais precisa e presente em toda resposta)
    const matchTag = norm.match(/\[\[etapa:\s*(entender|contextualizar|guiar|praticar|consolidar)/i)
    if (matchTag && matchTag[1]) {
      return matchTag[1] as EtapaSocratica
    }

    // 2. Match semântico e por fórmulas ocasionais de abertura/transição
    if (
      norm.includes('entender o que voce ja sabe') ||
      norm.includes('me conta onde essa duvida') ||
      norm.includes('descobrir junto com voce') ||
      norm.includes('do comecinho o que voce') ||
      norm.includes('o que voce ja sabe') ||
      norm.includes('o que voce acha') ||
      norm.includes('o que voce já pensou') ||
      norm.includes('o que você já sabe')
    ) {
      return 'entender'
    }
    if (
      norm.includes('outro jeito de pensar') ||
      norm.includes('no seu dia a dia') ||
      norm.includes('parecido com o que') ||
      norm.includes('imaginar isso') ||
      norm.includes('numa historinha') ||
      norm.includes('no recreio') ||
      norm.includes('no dia a dia')
    ) {
      return 'contextualizar'
    }
    if (
      norm.includes('te dar uma pistinha') ||
      norm.includes('primeiro passinho') ||
      norm.includes('olha bem para esse detalhe') ||
      norm.includes('por esse caminho') ||
      norm.includes('passo a passo') ||
      norm.includes('uma dica') ||
      norm.includes('pistinha para voce') ||
      norm.includes('pistinha para você')
    ) {
      return 'guiar'
    }
    if (
      norm.includes('sua vez de tentar') ||
      norm.includes('vamos praticar') ||
      norm.includes('desafio rapido') ||
      norm.includes('mao na massa') ||
      norm.includes('desafio bem divertido') ||
      norm.includes('tenta fazer') ||
      norm.includes('desafio rápido') ||
      norm.includes('mão na massa')
    ) {
      return 'praticar'
    }
    if (
      norm.includes('voce conseguiu') ||
      norm.includes('como voce pensou') ||
      norm.includes('ensinar para um amigo') ||
      norm.includes('me ensina o caminho') ||
      norm.includes('com suas palavras como') ||
      norm.includes('voce arrasou') ||
      norm.includes('você conseguiu') ||
      norm.includes('você arrasou')
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

  // Telemetria do Cérebro Conversacional
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

  // Preferências de acessibilidade da criança selecionada
  const acessibilidadeReforcada =
    (criancaSelecionada?.acessibilidade || '').toLowerCase().includes('apoio visual') ||
    (criancaSelecionada?.acessibilidade || '').toLowerCase().includes('fonte grande')
  const fonteGrande = (criancaSelecionada?.acessibilidade || '')
    .toLowerCase()
    .includes('fonte grande')

  // Hook de Síntese de Voz (Lumi fala) com o rate selecionado e warm-up no primeiro gesto
  const {
    isSupported: synthSuportado,
    isSpeaking,
    speak: synthSpeak,
    stop: synthStop,
    warmUp: synthWarmUp,
  } = useSpeechSynthesis({
    rate: ritmoAtual.rate,
    pitch: 1.05,
    onEnd: () => {
      setMensagemFalandoId(null)
      setLegendaFalando('')
      // No Modo Conversação por Voz (Lumi Live), devolve o microfone para a criança falar
      if (modoConversacaoVoz || visaoChat === 'orbe') {
        setTimeout(() => {
          startListening()
        }, 300)
      }
    },
    onError: () => {
      setMensagemFalandoId(null)
      setLegendaFalando('')
      if (modoConversacaoVoz || visaoChat === 'orbe') {
        setTimeout(() => {
          startListening()
        }, 300)
      }
    },
  })

  // Função para falar a resposta da Lumi (respeita toggle de voz)
  const falarMensagemLumi = useCallback(
    (msgId: string, texto: string) => {
      if (!vozHabilitada) return
      if (mensagemFalandoId === msgId && isSpeaking) {
        synthStop()
        setMensagemFalandoId(null)
        setLegendaFalando('')
      } else {
        synthStop()
        setMensagemFalandoId(msgId)
        setLegendaFalando(texto)
        synthSpeak(texto)
      }
    },
    [vozHabilitada, mensagemFalandoId, isSpeaking, synthStop, synthSpeak],
  )

  // Barge-in Instantâneo (< 50ms): Interrompe a Lumi assim que a criança fala ou clica no botão
  const executarBargeIn = useCallback(
    (motivo = 'Fala da criança') => {
      if (isSpeaking || mensagemFalandoId || enviando) {
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
    [isSpeaking, mensagemFalandoId, enviando, synthStop, adicionarEventoTelemetria],
  )

  // Função de envio unificada (digitação ou fala)
  const enviarTexto = useCallback(
    async (textoParaEnviar: string) => {
      const textoLimpo = textoParaEnviar.trim()
      if (!textoLimpo || enviando) return

      // Interrompe imediatamente qualquer fala anterior da Lumi (< 50ms)
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
        // Se minutos restantes <= 2, passa no parâmetro para o encerramento amigável
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
              // Detecta dinamicamente a etapa socrática no texto transmitido
              const etapaDetectada = detectarEtapaDoTexto(full)
              if (etapaDetectada) {
                setEtapaAtual(etapaDetectada)
              }
              if (visaoChat === 'orbe') {
                setLegendaFalando(full)
              }
              // Preload antecipado em segundo plano: se já tiver pelo menos uma frase completa, inicia o TTS
              if (full.length > 30 && /[.!?]\s*$/.test(full)) {
                import('@/services/lumiAudioService').then(({ preloadAudioLumi }) => {
                  preloadAudioLumi(full, 'nova')
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

        // Confirma ou refina a etapa detectada a partir da fala final
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

        // TTS Obrigatório na Fase 1 (5 a 8 anos) para apoiar crianças em alfabetização!
        if (
          (faseAtual.ttsObrigatorio ||
            (vozHabilitada && (modoConversacaoVoz || visaoChat === 'orbe'))) &&
          textoFinalLumi
        ) {
          setMensagemFalandoId(lumiMsgId)
          setLegendaFalando(textoFinalLumi)
          synthSpeak(textoFinalLumi)
        }

        // Se o tempo restava <= 2 minutos ou a resposta continha a frase de encerramento amigável:
        if (
          (minutosRestantesUso !== null && minutosRestantesUso <= 2) ||
          textoFinalLumi.includes('nosso tempo de conexão por hoje está chegando ao fim')
        ) {
          setGatilhoFadigaInjetado(true)
          // Bloqueio passivo suave após a resposta terminar sem cortar o diálogo
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

          if (
            (minutosRestantesUso !== null && minutosRestantesUso <= 2) ||
            syncRes.content.includes('nosso tempo de conexão por hoje está chegando ao fim')
          ) {
            setGatilhoFadigaInjetado(true)
            setTimeout(() => {
              setChatBloqueadoPorTempo(true)
            }, 3500)
          }
        } catch (err: unknown) {
          console.error('Falha geral na IA:', err)
          const textoErro =
            'Tive uma pequena falha na conexão, mas estou aqui com você! Pode me contar de novo?'
          setMessages((prev) =>
            prev.map((m) =>
              m.id === lumiMsgId
                ? {
                    ...m,
                    text: textoErro,
                  }
                : m,
            ),
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
      synthSpeak,
      synthStop,
      adicionarEventoTelemetria,
    ],
  )

  // Hook de Reconhecimento de Voz Infantil (1200ms de tolerância de silêncio + barge-in no speechstart)
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
      // Barge-in instantâneo: se a criança fala enquanto a Lumi está falando, para o áudio
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

  // Alterna o toggle do Modo Conversação por Voz (Lumi Live)
  const handleToggleModoConversacao = () => {
    const novoValor = !modoConversacaoVoz
    setModoConversacaoVoz(novoValor)
    setVisaoChat(novoValor ? 'orbe' : 'texto')
    try {
      localStorage.setItem('lumi_modo_conversacao_voz', String(novoValor))
    } catch {
      // ignore
    }

    if (!novoValor) {
      synthStop()
      stopListening()
      setMensagemFalandoId(null)
      setLegendaFalando('')
    } else {
      // Ao ativar o modo conversação, pré-aquece o sintetizador e liga o microfone
      synthWarmUp()
      if (!isSpeaking && !enviando) {
        startListening()
      }
    }
  }

  // Alterna o som da voz da Lumi
  const handleToggleVoz = () => {
    const novo = !vozHabilitada
    setVozHabilitada(novo)
    try {
      localStorage.setItem('lumi_voz_habilitada', String(novo))
    } catch {
      // ignore
    }
    if (!novo) {
      synthStop()
      setMensagemFalandoId(null)
      setLegendaFalando('')
    }
  }

  // Ciclo dos presets de ritmo da voz
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

  // Executar Cenário Rápido de Teste (do manual pedagógico)
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
    }

    await enviarTexto(cenario.mensagemUsuario)
  }

  // Carregar prompt do sistema ativo
  useEffect(() => {
    obterPromptAtivo().then((p) => {
      if (p) {
        setCustomPromptText(
          `${p.identidade} Regra Socrática: ${p.metodo_socratico} ${p.diretrizes_pedagogicas || ''} NUNCA verbalize o passo nem anuncie métodos na fala.`,
        )
      }
    })
  }, [])

  // Inicializar mensagens, etapa e verificar check-in ao trocar de criança
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
          setMessages([
            {
              id: 'welcome',
              sender: 'lumi',
              text: `Oi, ${criancaSelecionada.nome}! 🌟 Que alegria te ver aqui hoje! O que você gostaria de desvendar, desenhar ou aprender comigo agora?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              visualHint: 'Quadro preparado para investigações!',
              etapa: etapaInicial,
            },
          ])
        }
      })
    }
  }, [criancaSelecionada, estagioPiaget, adicionarEventoTelemetria])

  // Ação ao selecionar o humor no card de check-in emocional
  const handleSelecionarHumor = async (humor: HumorEmocional) => {
    if (!criancaSelecionada) return
    try {
      setSalvandoCheckin(true)
      await registrarCheckinEmocional(criancaSelecionada.id, humor)
      setHumorHoje(humor)
      setPrecisaCheckinHoje(false)

      let textoBoasVindas = `Oi, ${criancaSelecionada.nome}! Eu sou a Lumi ✨. `
      if (humor === 'triste' || humor === 'muito_triste') {
        textoBoasVindas += `Vi que você está um pouquinho para baixo hoje. Saiba que você é muito especial, e aqui vamos devagarzinho, com todo carinho! Se quiser, podemos fazer uma pausa para respirar juntos ou conversar sobre algo divertido que você adora.`
        setModoRespiracao(true)
      } else if (humor === 'muito_feliz' || humor === 'feliz') {
        textoBoasVindas += `Que felicidade ver essa sua animação hoje! Vamos aproveitar toda essa energia boa para desvendar coisas incríveis? O que vamos explorar juntos agora?`
      } else {
        textoBoasVindas += `Obrigada por me contar como você está! Estou aqui prontinha para aprender com você, passo a passo e sem pressa. Qual lição ou curiosidade vamos descobrir?`
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

      adicionarEventoTelemetria({
        tipo: 'piaget',
        titulo: 'Check-in Emocional Registrado',
        detalhe: `Humor: ${humor}. Resposta da Lumi adaptada com acolhimento.`,
        status: 'executado',
      })
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

  // Carregar missões da fase atual
  useEffect(() => {
    listarMissoesPorFase(faseAtual.id).then((missoes) => {
      setMissoesFase(missoes)
    })
  }, [faseAtual.id])

  // Monitorar tempo restante de uso da criança para bem-estar digital (fadiga aos <= 2 minutos)
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

  // Iniciar missão ao clicar
  const handleIniciarMissao = (missao: MissaoBnccRecord) => {
    enviarTexto(`Quero explorar a missão "${missao.titulo}". Como começamos?`)
  }

  // Ouvir missão em TTS (obrigatório / facilitador para Fase 1)
  const handleOuvirMissao = (texto: string) => {
    synthStop()
    synthSpeak(texto)
  }

  // Ações do Kanban de Metas da Fase 3
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

  // Sugestões rápidas amigáveis adaptadas por fase
  const sugestoesRapidas = useMemo(() => {
    if (faseAtual.id === 'fase_1') {
      return [
        'Qual o som da letra B?',
        'Vamos contar maçãs coloridas?',
        'Me conta uma historinha curta!',
        'Como os passarinhos voam?',
        'Quero desenhar no quadro!',
      ]
    }
    if (faseAtual.id === 'fase_2') {
      return [
        'Como funciona a Operação Alexandria?',
        'Como as frações dividem uma pizza?',
        'Como os espelhos refletem a luz?',
        'Me desafia com um enigma espacial!',
        'Como equilibrar a teia de um bioma?',
      ]
    }
    return [
      'Proponha uma tese para o Tribunal Socrático',
      'Como funciona a aceleração na cinemática vetorial?',
      'Identifique falácias lógicas neste argumento',
      'Debata os impactos éticos da automação',
      'Como estruturar uma redação nota 1000?',
    ]
  }, [faseAtual.id])

  const handleTrocarTopicoQuadro = () => {
    const opcao = prompt(
      'Qual matéria você quer ver desenhada no quadro?\n1 - Matemática\n2 - Ciências\n3 - Português\n4 - História\n5 - Geografia\n6 - Quadro Geral de Ideias',
      'Matemática',
    )
    if (opcao) {
      const opcLow = opcao.toLowerCase()
      if (opcLow.includes('1') || opcLow.includes('mat')) {
        setMateriaDetectada('matematica')
        setTopicoQuadroCustom('Matemática Divertida')
      } else if (opcLow.includes('2') || opcLow.includes('cien')) {
        setMateriaDetectada('ciencias')
        setTopicoQuadroCustom('Ciências Naturais')
      } else if (opcLow.includes('3') || opcLow.includes('port')) {
        setMateriaDetectada('portugues')
        setTopicoQuadroCustom('Palavras & Frases')
      } else if (opcLow.includes('4') || opcLow.includes('hist')) {
        setMateriaDetectada('historia')
        setTopicoQuadroCustom('História & Viagem no Tempo')
      } else if (opcLow.includes('5') || opcLow.includes('geo')) {
        setMateriaDetectada('geografia')
        setTopicoQuadroCustom('Geografia & Mapas')
      } else {
        setMateriaDetectada('geral')
        setTopicoQuadroCustom('Quadro de Descobertas')
      }
    }
  }

  const handleNovaConversa = () => {
    if (confirm('Quer começar uma nova conversa com a Lumi?')) {
      synthStop()
      stopListening()
      setMensagemFalandoId(null)
      setLegendaFalando('')
      setConversationId(null)
      setEtapaAtual('entender')
      const msgNova = `Começando uma nova aventura! O que vamos descobrir hoje, ${criancaSelecionada?.nome || 'amigo(a)'}?`
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
      if (vozHabilitada && (modoConversacaoVoz || visaoChat === 'orbe')) {
        setMensagemFalandoId('nova')
        setLegendaFalando(msgNova)
        synthSpeak(msgNova)
      }
    }
  }

  const { tipoConta, permissoes } = useAuth()

  // Estado atual da Orbe Lumi Live
  const estadoOrbe: EstadoLumiLive = isListening
    ? 'ouvindo'
    : enviando
      ? 'pensando'
      : isSpeaking
        ? 'falando'
        : 'ocioso'

  // Se for conta de criança e o responsável bloqueou a conversa com a Lumi:
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
    <div
      className={`space-y-4 max-w-7xl mx-auto pb-8 transition-colors duration-300 ${
        faseAtual.id === 'fase_1'
          ? 'fase-ninho-descobertas'
          : faseAtual.id === 'fase_2'
            ? 'fase-central-missoes bg-slate-950 text-slate-100 p-2 sm:p-4 rounded-3xl'
            : 'fase-workspace-hub bg-zinc-950 text-zinc-100 p-2 sm:p-4 rounded-2xl'
      }`}
    >
      {/* Banner de Bem-Estar Digital / Fadiga quando restar <= 2 minutos */}
      {minutosRestantesUso !== null && minutosRestantesUso <= 2 && (
        <div className="bg-amber-500/20 border-2 border-amber-400 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⏳</span>
            <div>
              <p className="font-extrabold text-xs sm:text-sm">
                Hora de desacelerar por hoje, {criancaSelecionada?.nome || 'amigo(a)'}!
              </p>
              <p className="text-[11px] opacity-90">
                Restam menos de 2 minutos para descansar a mente e recarregar os servidores da Lumi.
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

      {/* 1. Missões BNCC adaptadas à fase atual */}
      <MissoesBnccContainer
        missoes={missoesFase}
        fase={faseAtual.id}
        onIniciarMissao={handleIniciarMissao}
        onOuvirMissao={handleOuvirMissao}
      />

      {/* 2. Para Fase 3 (Workspace): Kanban de Metas e Estudos Dirigidos */}
      {faseAtual.id === 'fase_3' && (
        <KanbanMetasWorkspace
          metas={metasKanban}
          onAtualizarStatus={handleAtualizarStatusKanban}
          onAdicionarMeta={handleAdicionarMetaKanban}
        />
      )}

      {/* 3. Trilha Socrática em linguagem infantil e discreta */}
      <TrilhaEtapasSocraticas
        etapaAtiva={etapaAtual}
        onSelecionarEtapa={(et) => setEtapaAtual(et)}
      />

      {/* 4. Barra de Cenários Rápidos de Teste (visível apenas para o Responsável, escondida no Modo Criança) */}
      {!modoCriancaAtivo && (
        <BarraCenariosTeste onExecutarCenario={handleExecutarCenario} disabled={enviando} />
      )}

      {/* 3. Check-in Emocional Diário */}
      {precisaCheckinHoje && (
        <CheckinEmocionalCard
          nomeCrianca={criancaSelecionada?.nome || 'Amigo(a)'}
          onSelecionarHumor={handleSelecionarHumor}
          salvando={salvandoCheckin}
        />
      )}

      {/* 4. Seletor de Abas para Celulares e Telas Pequenas (Conversar vs Quadro) */}
      <div className="flex lg:hidden bg-amber-100/70 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setAbaAtivaMobile('chat')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] ${
            abaAtivaMobile === 'chat'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-amber-800/80 hover:bg-white/50'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-amber-600" />
          <span>Conversar com a Lumi</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtivaMobile('quadro')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] ${
            abaAtivaMobile === 'quadro'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-amber-800/80 hover:bg-white/50'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-600" />
          <span>Ver o Quadro 🎨</span>
        </button>
      </div>

      {/* 5. Grade Principal: Chat/Orbe + Quadro Visual Secundário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna do Chat / Lumi Live (7 colunas no desktop) */}
        <div
          className={`lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-soft border border-amber-100 overflow-hidden ${
            abaAtivaMobile === 'quadro' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Topo do Chat amigável */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50/50 border-b border-amber-100/90 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center text-xl shadow-md shadow-amber-400/30 shrink-0">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-800">Lumi</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>

                  {/* Indicador discreto de Estágio Piaget para os Pais */}
                  {!modoCriancaAtivo && (
                    <span
                      title={estagioPiaget.descricao}
                      className="text-[10px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1"
                    >
                      <span>🌱</span>
                      <span>Piaget: {estagioPiaget.faixa}</span>
                    </span>
                  )}

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
                  Estudando com{' '}
                  <span className="font-bold text-slate-700">
                    {criancaSelecionada?.nome || 'você'}
                  </span>
                  {criancaSelecionada?.serie && ` • ${criancaSelecionada.serie}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Botão de alternar visão Texto / Orbe Live */}
              <div className="flex bg-amber-100/80 p-0.5 rounded-xl border border-amber-200">
                <button
                  type="button"
                  onClick={() => setVisaoChat('texto')}
                  title="Ver mensagens escritas em chat"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visaoChat === 'texto'
                      ? 'bg-white text-amber-950 shadow-2xs'
                      : 'text-amber-800/80 hover:text-amber-950'
                  }`}
                >
                  💬 Texto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisaoChat('orbe')
                    setModoConversacaoVoz(true)
                    try {
                      localStorage.setItem('lumi_modo_conversacao_voz', 'true')
                    } catch {
                      // ignore
                    }
                    if (!isSpeaking && !enviando) {
                      startListening()
                    }
                  }}
                  title="Modo Lumi Live (Voz em tempo real + Orbe animada)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    visaoChat === 'orbe'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-800/80 hover:text-amber-950'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Orbe Live</span>
                </button>
              </div>

              {/* Botão de Voz da Lumi: Ligada / Desligada */}
              <button
                type="button"
                onClick={handleToggleVoz}
                title={
                  vozHabilitada
                    ? 'Voz da Lumi ativada (clique para silenciar)'
                    : 'Voz da Lumi silenciada (clique para ligar)'
                }
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer min-h-[38px] ${
                  vozHabilitada
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                }`}
              >
                {vozHabilitada ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Voz: Ligada</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Voz: Desligada</span>
                  </>
                )}
              </button>

              {/* Seletor de Ritmo da Voz (Presets) */}
              <button
                type="button"
                onClick={handleCicloRitmo}
                title={`Ritmo da voz atual: ${ritmoAtual.nome}. Clique para alternar.`}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer min-h-[38px]"
              >
                <Gauge className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">{ritmoAtual.nome}</span>
                <span className="md:hidden">{ritmoAtual.rate}x</span>
              </button>

              {/* Toggle do Modo Conversação por Voz */}
              <ToggleModoConversacao
                ativo={modoConversacaoVoz}
                onToggle={handleToggleModoConversacao}
                acessibilidadeReforcada={acessibilidadeReforcada}
              />

              {modoCriancaAtivo && (
                <button
                  type="button"
                  onClick={abrirModalSairModo}
                  title="Sair do Modo Criança (pede PIN)"
                  className="text-xs text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[38px]"
                >
                  <span>🔒</span>
                  <span className="hidden md:inline">Sair</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNovaConversa}
                title="Começar de novo"
                className="text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recomeçar</span>
              </button>
            </div>
          </div>

          {/* Banner do Modo Conversação / Barge-in em Destaque */}
          {modoConversacaoVoz && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-100/40 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-950 flex-wrap">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-base animate-bounce">🗣️</span>
                <span>
                  Lumi Live Full-Duplex: fale a qualquer momento e a Lumi para instantaneamente
                  (barge-in)!
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={() => executarBargeIn('Interrupção manual do usuário')}
                    className="text-xs font-black bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-full cursor-pointer transition-all shadow-xs flex items-center gap-1"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>✋ Interromper Lumi</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* EXIBIÇÃO: ORBE LUMI LIVE vs CHAT TRADICIONAL */}
          {visaoChat === 'orbe' ? (
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-slate-50/40">
              <OrbeLumiLive
                estado={estadoOrbe}
                legendaOuvindo={interimTranscript}
                legendaFalando={
                  legendaFalando ||
                  (messages[messages.length - 1]?.sender === 'lumi'
                    ? messages[messages.length - 1]?.text
                    : '')
                }
                vozHabilitada={vozHabilitada}
                onToggleVoz={handleToggleVoz}
                onInterromper={() => executarBargeIn('Botão Interromper Lumi')}
                onFalarAgora={toggleListening}
                isListening={isListening}
                ritmoNome={ritmoAtual.nome}
                onCicloRitmo={handleCicloRitmo}
                isSupported={recSuportado}
                permissionDenied={permissionDenied}
                errorMessage={erroReconhecimento}
                etapaAtual={etapaAtual}
                passoDetectadoNome={passoAtualAmigavel}
              />
            </div>
          ) : (
            <>
              {/* Área das Mensagens com visual espaçoso e fontes infantis legíveis */}
              <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 custom-scroll min-h-[380px] max-h-[560px] bg-slate-50/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 sm:gap-3 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'lumi' && (
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0"
                        aria-label="Lumi"
                      >
                        ✨
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-3xl p-3.5 sm:p-4 shadow-xs text-sm sm:text-base leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-amber-500 text-white font-medium rounded-br-xs'
                          : 'bg-white text-slate-800 border border-amber-100 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {msg.acoes && msg.acoes.length > 0 && (
                        <div className="space-y-2 mt-2.5">
                          {msg.acoes.map((acao, i) => (
                            <CartaoAcaoLumi key={i} acao={acao} />
                          ))}
                        </div>
                      )}

                      <div
                        className={`mt-1.5 text-[10px] sm:text-[11px] flex items-center justify-between gap-3 ${
                          msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'lumi' && (
                          <div className="flex items-center gap-2">
                            {synthSuportado && (
                              <BotaoOuvirLumi
                                isSpeaking={mensagemFalandoId === msg.id && isSpeaking}
                                onClick={() => falarMensagemLumi(msg.id, msg.text)}
                                tamanho="sm"
                              />
                            )}
                            <span className="text-amber-700/80 font-bold flex items-center gap-1">
                              <span>✨</span> Lumi
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {msg.sender === 'user' && (
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center text-sm font-black shrink-0 shadow-xs"
                        aria-label={criancaSelecionada?.nome || 'Você'}
                      >
                        {criancaSelecionada?.nome
                          ? criancaSelecionada.nome.charAt(0).toUpperCase()
                          : '😊'}
                      </div>
                    )}
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

              {/* Feedback em tempo real com transcrição provisória grande e botão barge-in */}
              {isListening && (
                <div className="px-4 py-3 bg-red-50/90 border-t border-red-200/80 flex items-center justify-between gap-3 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute" />
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 relative" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-red-900 flex items-center gap-1.5">
                        <span>Ouvindo você com atenção... Pode falar! 🎤</span>
                      </div>
                      {interimTranscript ? (
                        <p
                          className={`text-red-950 font-black italic mt-0.5 ${
                            fonteGrande ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                          }`}
                        >
                          &ldquo;{interimTranscript}&rdquo;
                        </p>
                      ) : (
                        <p className="text-[11px] text-red-700">
                          Pausa calibrada para seu raciocínio (1,2s). Fale sem pressa!
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-3.5 py-2 rounded-xl bg-red-200 hover:bg-red-300 text-red-950 text-xs font-bold transition-all cursor-pointer min-h-[36px]"
                  >
                    Concluir fala ✓
                  </button>
                </div>
              )}

              {permissionDenied && (
                <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎤</span>
                    <span>
                      <strong>Atenção aos pais/responsáveis:</strong> Precisamos da permissão do
                      microfone no navegador para a criança falar com a Lumi.
                    </span>
                  </div>
                </div>
              )}

              {erroReconhecimento && !permissionDenied && (
                <div className="px-4 py-2 bg-orange-50 border-t border-orange-200 text-xs text-orange-900 flex items-center gap-2">
                  <span>😊</span>
                  <span>{erroReconhecimento}</span>
                </div>
              )}

              {/* Sugestões Rápidas */}
              <div className="px-3 py-2 bg-amber-50/50 border-t border-amber-100/70 flex items-center gap-1.5 overflow-x-auto custom-scroll">
                <span className="text-[11px] font-bold text-amber-800/80 uppercase tracking-wider shrink-0 mr-1">
                  Dica rápida:
                </span>
                {sugestoesRapidas.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(sug)
                      inputRef.current?.focus()
                    }}
                    className="text-xs bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-amber-200/90 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-semibold cursor-pointer active:scale-95"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Caixa de Entrada Amigável ou Bloqueio de Bem-Estar */}
          {chatBloqueadoPorTempo ? (
            <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/60 text-center flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🌙</span>
              <p className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                Seu tempo de conexão de hoje terminou!
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md">
                A Lumi já guardou todo o seu progresso socrático com carinho. Vá descansar, brincar
                offline ou conversar com sua família!
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleEnviar}
              className={`p-3 sm:p-3.5 border-t flex items-center gap-2.5 ${
                faseAtual.id === 'fase_1'
                  ? 'bg-amber-50/50 border-amber-200'
                  : faseAtual.id === 'fase_2'
                    ? 'bg-slate-900 border-purple-500/40'
                    : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <BotaoVozCrianca
                isListening={isListening}
                isSupported={recSuportado}
                disabled={enviando}
                onClick={toggleListening}
                acessibilidadeReforcada={acessibilidadeReforcada}
                tamanho={
                  faseAtual.id === 'fase_1' ? 'grande' : modoConversacaoVoz ? 'grande' : 'normal'
                }
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
                    : faseAtual.id === 'fase_1'
                      ? 'Diga ou digite o que descobriu...'
                      : faseAtual.id === 'fase_2'
                        ? 'Comando de missão ou dúvida...'
                        : 'Escreva sua tese ou dúvida...'
                }
                disabled={enviando}
                className={`flex-1 px-4 py-3 sm:py-3.5 ${
                  faseAtual.id === 'fase_1'
                    ? 'rounded-2xl border-2 border-amber-300 bg-white text-slate-900 text-lg'
                    : faseAtual.id === 'fase_2'
                      ? 'rounded-xl border border-purple-500/50 bg-slate-950 text-purple-100 placeholder:text-slate-400 text-sm'
                      : 'rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 text-sm'
                }`}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || enviando}
                aria-label="Enviar mensagem"
                className={`flex items-center gap-2 shrink-0 cursor-pointer ${
                  faseAtual.id === 'fase_1'
                    ? 'h-14 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-lg shadow-md active:scale-95'
                    : faseAtual.id === 'fase_2'
                      ? 'h-12 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-md'
                      : 'h-10 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs border border-zinc-700'
                }`}
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Coluna do Quadro Visual e Apoio Socioemocional (5 colunas no desktop) */}
        <div
          className={`lg:col-span-5 flex flex-col gap-4 ${
            abaAtivaMobile === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Quadro Visual Limpo e Determinístico */}
          <QuadroVisualContainer
            materia={materiaDetectada}
            etapaSocratica={etapaAtual}
            acessibilidade={criancaSelecionada?.acessibilidade}
            topicoCustomizado={topicoQuadroCustom}
            onTrocarTopico={handleTrocarTopicoQuadro}
          />

          {/* Telemetria do Cérebro Conversacional (visível fora do Modo Criança) */}
          {!modoCriancaAtivo && (
            <TelemetriaCerebro
              etapaAtual={etapaAtual}
              materiaAtual={materiaDetectada}
              estagioPiaget={estagioPiaget}
              acoesRecentes={acoesRecentes}
              eventos={eventosTelemetria}
              guardrailAtivo={true}
            />
          )}

          {/* Caderninho de descobertas da criança */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>📝</span> Meu Caderninho de Descobertas
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                Suas palavras
              </span>
            </div>
            <textarea
              rows={2}
              value={anotacaoLivre}
              onChange={(e) => setAnotacaoLivre(e.target.value)}
              className="w-full bg-amber-50/30 p-3 rounded-2xl border border-amber-200/70 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none leading-relaxed"
              placeholder="Escreva aqui com suas próprias palavras o que você descobriu com a Lumi..."
            />
          </div>

          {/* Card Amigável: Momento Calma & Foco (Respiração Guiada "Flor e Vela") */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-4 sm:p-5 text-white shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center text-lg">
                  <Wind className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">Momento Calma & Foco</h4>
                  <p className="text-[11px] text-indigo-200">
                    Respiração da Flor e da Vela (inspire 4s, expire 4s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModoRespiracao(!modoRespiracao)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white shadow-xs transition-all cursor-pointer min-h-[38px]"
              >
                {modoRespiracao ? 'Pausar' : 'Começar 🧘'}
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2 sm:py-3">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-400 flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg shadow-indigo-500/30 transition-transform ${
                  modoRespiracao ? 'breathe-circle' : ''
                }`}
              >
                <div className="text-center p-2">
                  <span className="block text-base sm:text-lg">🌸🕯️</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-950">
                    {modoRespiracao ? 'Inspire a flor... Assopre a vela...' : 'Respirar'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-indigo-200 text-center mt-3 max-w-xs leading-relaxed">
                {modoRespiracao
                  ? 'Cheire a flor (inspire com calma) e assopre a velinha sem apagar (expire suavemente).'
                  : 'Quando uma dúvida parecer difícil ou der frustração, respirar com calma destrava o cérebro!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversaQuadro
