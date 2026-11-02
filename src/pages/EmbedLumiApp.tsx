import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  enviarMensagemLumiStream,
  type ModoAgenteLumi,
} from '@/services/lumiAgent'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { extrairMicroSentencasStream, dividirParaVozRealAgil } from '@/lib/speechUtils'
import {
  detectarModeloPedagogicoIdeal,
  CATALOGO_MODELOS_PEDAGOGICOS,
  obterExemploTrabalhadoPorMateria,
  type ModeloPedagogico,
} from '@/lib/orquestradorPedagogico'
import {
  getVozIaLumiPreferida,
  setVozIaLumiPreferida,
  precarregarAudioLumi,
} from '@/services/lumiAudioService'
import { usePWAInstall } from '@/lib/pwa'
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

interface EmbedMessage {
  id: string
  sender: 'lumi' | 'user'
  text: string
  timestamp: string
  modeloPedagogico?: ModeloPedagogico
}

export default function EmbedLumiApp() {
  const [searchParams] = useSearchParams()

  // Parâmetros vindos do aplicativo hospedeiro (LMS, Portal Escolar, WebView, Share Target)
  const nomeInicial = searchParams.get('nome') || searchParams.get('childName') || 'Explorador(a)'
  const idadeInicial = Math.min(
    17,
    Math.max(4, parseInt(searchParams.get('idade') || searchParams.get('age') || '9', 10) || 9),
  )
  const serieInicial = searchParams.get('serie') || `${Math.max(1, idadeInicial - 5)}º Ano`
  const modoInicial: ModoAgenteLumi =
    searchParams.get('modo') === 'agente_geral' ? 'agente_geral' : 'tutor_socratico'
  const perguntaCompartilhada =
    searchParams.get('pergunta') || searchParams.get('text') || searchParams.get('titulo') || ''

  const [nomeAluno, setNomeAluno] = useState(nomeInicial)
  const [idadeAluno, setIdadeAluno] = useState(idadeInicial)
  const [modoAgente, setModoAgente] = useState<ModoAgenteLumi>(modoInicial)
  const [modeloPedagogico, setModeloPedagogico] = useState<ModeloPedagogico>(
    modoInicial === 'agente_geral' ? 'ausubel_expositivo' : 'sweller_exemplo_trabalhado',
  )
  const [materiaAtiva, setMateriaAtiva] = useState('matematica')
  const [vozHabilitada, setVozHabilitada] = useState(true)
  const [inputText, setInputText] = useState(perguntaCompartilhada)
  const [enviando, setEnviando] = useState(false)

  const { isInstallable, isInstalled, install } = usePWAInstall()

  const {
    speak: synthSpeak,
    stop: synthStop,
    isSpeaking,
    startStreamingSession,
    enqueueStreamingSentence,
    finishStreamingSession,
  } = useSpeechSynthesis({ rate: 1.05 })

  const [messages, setMessages] = useState<EmbedMessage[]>(() => {
    const boasVindas = `Oi, ${nomeInicial}! ✨ Eu sou a Lumi IA (conectada com proteção para ${idadeInicial} anos). Posso te explicar curiosidades na hora ou resolver exemplos passo a passo das suas tarefas escolares! O que vamos descobrir agora?`
    return [
      {
        id: 'embed-welcome',
        sender: 'lumi',
        text: boasVindas,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modeloPedagogico: 'ausubel_expositivo',
      },
    ]
  })

  const chatEndRef = useRef<HTMLDivElement>(null)
  const enviarTextoRef = useRef<(txt: string) => Promise<void>>(async () => {})

  // Notifica o aplicativo-pai (quando embarcado em iframe/WebView) que o Mini-App Lumi está pronto
  useEffect(() => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'LUMI_EMBED_READY',
            version: '2.1.0',
            student: { name: nomeAluno, age: idadeAluno },
          },
          '*',
        )
      }
    } catch {
      // ignore cross-origin restrictions
    }
  }, [nomeAluno, idadeAluno])

  // Pré-aquece o primeiro bloco da voz real
  useEffect(() => {
    const vozPreferida = searchParams.get('voz') || getVozIaLumiPreferida()
    if (searchParams.get('voz')) {
      setVozIaLumiPreferida(vozPreferida)
    }
    const primeiroBloco = dividirParaVozRealAgil(messages[0]?.text || '')[0]
    if (primeiroBloco) {
      precarregarAudioLumi(primeiroBloco, vozPreferida)
    }
  }, [searchParams, messages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, enviando])

  const detectarMateriaRapida = (txt: string): string => {
    const low = txt.toLowerCase()
    if (/(quanto|conta|soma|divid|multipl|fra[cç]|n[uú]mero|\d+\s*[+\-x*/÷]\s*\d+)/i.test(low)) {
      return 'matematica'
    }
    if (/(palavra|s[ií]laba|verbo|frase|texto|acento|portugu[eê]s)/i.test(low)) {
      return 'portugues'
    }
    if (/(hist[oó]ria|brasil| Egito|idade m[eé]dia|ind[ií]gena)/i.test(low)) {
      return 'historia'
    }
    if (/(planeta|mapa|clima|bioma|geografia|rio| relevo)/i.test(low)) {
      return 'geografia'
    }
    return 'ciencias'
  }

  const enviarTexto = useCallback(
    async (textoOriginal: string) => {
      const texto = textoOriginal.trim()
      if (!texto || enviando) return

      synthStop()
      setInputText('')
      setEnviando(true)

      const deteccao = detectarModeloPedagogicoIdeal(texto, modoAgente, 1)
      setModeloPedagogico(deteccao.modelo)
      const mat = detectarMateriaRapida(texto)
      setMateriaAtiva(mat)

      const userMsg: EmbedMessage = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: texto,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      const lumiMsgId = `l-${Date.now() + 1}`
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: lumiMsgId,
          sender: 'lumi',
          text: '...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modeloPedagogico: deteccao.modelo,
        },
      ])

      const sessionStreamId = vozHabilitada ? startStreamingSession() : 0
      let bufferVozStream = ''
      let acumuladoTotal = ''

      try {
        const historicoRecente = messages.slice(-6).map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }))

        const respostaFinal = await enviarMensagemLumiStream(
          {
            message: texto,
            childContext: {
              id: 'embed-guest',
              nome: nomeAluno,
              idade: idadeAluno,
              serie: serieInicial,
            },
            mode: modoAgente,
            pedagogicalModel: deteccao.modelo,
            pedagogicalInstruction: deteccao.instrucaoInjetadaPrompt,
            history: historicoRecente,
          },
          (delta, fullText) => {
            acumuladoTotal = fullText
            const limpo = fullText.replace(/\[\[ETAPA:[^\]]*\]\]/gi, '').trim()
            setMessages((prev) =>
              prev.map((m) => (m.id === lumiMsgId ? { ...m, text: limpo || '...' } : m)),
            )

            if (vozHabilitada && sessionStreamId) {
              bufferVozStream += delta
              const extraido = extrairMicroSentencasStream(bufferVozStream, false)
              bufferVozStream = extraido.restante
              for (const sentenca of extraido.sentencasProntas) {
                enqueueStreamingSentence(sentenca, sessionStreamId)
              }
            }
          },
        )

        const textoFinalLimpo = (respostaFinal.reply || acumuladoTotal)
          .replace(/\[\[ETAPA:[^\]]*\]\]/gi, '')
          .trim()

        setMessages((prev) =>
          prev.map((m) => (m.id === lumiMsgId ? { ...m, text: textoFinalLimpo } : m)),
        )

        if (vozHabilitada && sessionStreamId) {
          const extraidoFinal = extrairMicroSentencasStream(bufferVozStream, true)
          for (const sentenca of extraidoFinal.sentencasProntas) {
            enqueueStreamingSentence(sentenca, sessionStreamId)
          }
          finishStreamingSession(sessionStreamId)
        }

        // Emite evento para o aplicativo hospedeiro via postMessage
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              {
                type: 'LUMI_EMBED_MESSAGE',
                question: texto,
                reply: textoFinalLimpo,
                pedagogicalModel: deteccao.modelo,
              },
              '*',
            )
          }
        } catch {
          // ignore
        }
      } catch {
        const msgFallback =
          'Vamos pensar juntos passo a passo! Me conte com suas palavras o que você já tentou fazer até aqui?'
        setMessages((prev) =>
          prev.map((m) => (m.id === lumiMsgId ? { ...m, text: msgFallback } : m)),
        )
        if (vozHabilitada) {
          void synthSpeak(msgFallback)
        }
      } finally {
        setEnviando(false)
      }
    },
    [
      enviando,
      modoAgente,
      vozHabilitada,
      messages,
      nomeAluno,
      idadeAluno,
      serieInicial,
      synthStop,
      startStreamingSession,
      enqueueStreamingSentence,
      finishStreamingSession,
      synthSpeak,
    ],
  )

  useEffect(() => {
    enviarTextoRef.current = enviarTexto
  }, [enviarTexto])

  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    silenceTimeoutMs: 1050,
    onFinalTurn: (textoFalado) => {
      if (textoFalado.trim()) {
        void enviarTextoRef.current(textoFalado)
      }
    },
  })

  const exemploMateria = obterExemploTrabalhadoPorMateria(materiaAtiva)

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FFF8F0] text-[#4A3B32] pt-safe pb-safe px-safe">
      {/* Barra Superior Compacta do Mini-App Instalável / Embarcado */}
      <header className="bg-slate-900 text-white px-3 py-2.5 flex items-center justify-between gap-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center shadow-xs shrink-0">
            <span className="text-base">✨</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight truncate">Lumi IA</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span>{idadeAluno} anos</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {CATALOGO_MODELOS_PEDAGOGICOS[modeloPedagogico].icone}{' '}
              {CATALOGO_MODELOS_PEDAGOGICOS[modeloPedagogico].nomeCurto}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Seletor rápido de idade para filtro em apps de terceiros */}
          <select
            aria-label="Idade do aluno"
            value={idadeAluno}
            onChange={(e) => setIdadeAluno(Number(e.target.value) || 9)}
            className="bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-bold px-2 py-1 rounded-xl focus:outline-none cursor-pointer"
          >
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((id) => (
              <option key={id} value={id}>
                {id} anos
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              const novo = !vozHabilitada
              setVozHabilitada(novo)
              if (!novo) synthStop()
            }}
            className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
              vozHabilitada
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={vozHabilitada ? 'Voz Real Ativa' : 'Voz Silenciada'}
          >
            {vozHabilitada ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={() => void install()}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
              title="Instalar aplicativo no dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          <Link
            to="/conversa"
            target="_top"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Abrir plataforma completa Lumi IA"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Barra de Alternância Pedagógica (Curiosidade Livre vs Dever de Casa com Exemplo Resolvido) */}
      <div className="bg-white border-b border-[#EADBCE] px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto custom-scroll shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModoAgente('tutor_socratico')
              setModeloPedagogico('sweller_exemplo_trabalhado')
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
              modoAgente === 'tutor_socratico'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            📐 Dever de Casa (Exemplo + Desafio)
          </button>
          <button
            type="button"
            onClick={() => {
              setModoAgente('agente_geral')
              setModeloPedagogico('ausubel_expositivo')
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
              modoAgente === 'agente_geral'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
            }`}
          >
            💡 Curiosidade Livre (Direto)
          </button>
        </div>

        <input
          type="text"
          value={nomeAluno}
          onChange={(e) => setNomeAluno(e.target.value)}
          placeholder="Seu nome"
          aria-label="Nome do aluno"
          className="w-28 sm:w-36 px-2.5 py-1 rounded-xl border border-[#EADBCE] bg-[#FFF8F0] text-xs font-bold text-[#4A3B32] focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Área de Mensagens + Bloco Visual de Exemplo Resolvido (Sweller + Vygotsky) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scroll">
        {modeloPedagogico === 'sweller_exemplo_trabalhado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">
                ✅ {exemploMateria.passo1ExemploLumi.titulo}
              </span>
              <p className="text-xs font-bold text-emerald-950">
                {exemploMateria.passo1ExemploLumi.enunciado}
              </p>
              <p className="text-[11px] text-emerald-900">
                {exemploMateria.passo1ExemploLumi.resolucaoPassoAPasso}
              </p>
              <p className="text-xs font-black text-emerald-800">
                🌟 {exemploMateria.passo1ExemploLumi.respostaCompleta}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-amber-800 block">
                🎯 {exemploMateria.passo2DesafioCrianca.titulo}
              </span>
              <p className="text-xs font-bold text-amber-950">
                {exemploMateria.passo2DesafioCrianca.enunciado}
              </p>
              <p className="text-[11px] text-amber-800">
                {exemploMateria.passo2DesafioCrianca.dicaRapida}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'lumi' && (
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs">
                ✨
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-white font-semibold rounded-br-xs'
                  : 'bg-white text-slate-800 border border-[#EADBCE] rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] ${
                    msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
                {msg.sender === 'lumi' && (
                  <button
                    type="button"
                    onClick={() => void synthSpeak(msg.text)}
                    className="text-[10px] font-extrabold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Ouvir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {interimTranscript && (
          <div className="p-2.5 rounded-2xl bg-amber-100/80 border border-amber-300 text-xs font-bold text-amber-950 animate-pulse">
            🎙️ Ouvindo você: &ldquo;{interimTranscript}&rdquo;
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Sugestões Rápidas */}
      <div className="px-3 py-1.5 bg-[#FFF8F0] border-t border-[#EADBCE]/60 flex items-center gap-1.5 overflow-x-auto custom-scroll shrink-0">
        {[
          'Me ajuda a resolver 24 ÷ 4 passo a passo?',
          'Por que os vulcões entram em erupção?',
          'Como separar sílabas de palavras difíceis?',
          'Não sei fazer essa tarefa, está difícil!',
        ].map((sug, i) => (
          <button
            key={i}
            type="button"
            disabled={enviando}
            onClick={() => void enviarTexto(sug)}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-[#EADBCE] text-[11px] font-bold text-[#4A3B32] whitespace-nowrap transition cursor-pointer shrink-0"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Barra de Entrada (Voz + Texto) */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enviarTexto(inputText)
        }}
        className="p-2.5 bg-white border-t border-[#EADBCE] flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            if (isListening) {
              stopListening()
            } else {
              synthStop()
              startListening()
            }
          }}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-xs cursor-pointer shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
          }`}
          title={isListening ? 'Parar microfone' : 'Falar com a Lumi'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunte uma curiosidade ou digite sua tarefa..."
          disabled={enviando}
          className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] text-xs sm:text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || enviando}
          className="px-4 py-2.5 rounded-2xl bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
        >
          {enviando ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </>
          )}
        </button>
      </form>

      {isSpeaking && (
        <div className="bg-amber-500 text-white px-3 py-1 text-[11px] font-bold flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Lumi falando com voz real...</span>
          </span>
          <button
            type="button"
            onClick={synthStop}
            className="underline font-extrabold cursor-pointer"
          >
            Pausar voz
          </button>
        </div>
      )}
    </div>
  )
}
