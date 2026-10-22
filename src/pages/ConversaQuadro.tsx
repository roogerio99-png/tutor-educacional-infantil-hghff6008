import React, { useState, useEffect, useRef } from 'react'
import { useCrianca } from '@/contexts/CriancaContext'
import { enviarMensagemLumiStream, enviarMensagemLumiSync } from '@/services/lumiAgent'
import { obterPromptAtivo } from '@/services/prompts'
import { verificarCheckinHoje, registrarCheckinEmocional } from '@/services/checkinEmocional'
import type { EtapaSocratica, AcaoLumiExecutada, HumorEmocional } from '@/types'
import { TrilhaEtapasSocraticas } from '@/components/TrilhaEtapasSocraticas'
import { CartaoAcaoLumi } from '@/components/CartaoAcaoLumi'
import { CheckinEmocionalCard } from '@/components/CheckinEmocionalCard'
import { QuadroVisualContainer } from '@/components/QuadroVisualContainer'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { MessageCircle, Palette, Sparkles, Send, RefreshCw, Wind } from 'lucide-react'

interface ChatMessage {
  id: string
  sender: 'lumi' | 'user'
  text: string
  timestamp: string
  visualHint?: string
  etapa?: EtapaSocratica
  acoes?: AcaoLumiExecutada[]
}

export const ConversaQuadro: React.FC = () => {
  const { criancaSelecionada } = useCrianca()
  const { modoCriancaAtivo, abrirModalSairModo } = useModoCrianca()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [customPromptText, setCustomPromptText] = useState<string | null>(null)

  // Aba ativa para telas móveis e controle de visualização limpa: 'chat' | 'quadro'
  const [abaAtivaMobile, setAbaAtivaMobile] = useState<'chat' | 'quadro'>('chat')

  // Check-in Emocional Diário
  const [precisaCheckinHoje, setPrecisaCheckinHoje] = useState(false)
  const [salvandoCheckin, setSalvandoCheckin] = useState(false)
  const [humorHoje, setHumorHoje] = useState<HumorEmocional | null>(null)

  // Etapa Socrática e Matéria Detectada
  const [etapaAtual, setEtapaAtual] = useState<EtapaSocratica>('entender')
  const [materiaDetectada, setMateriaDetectada] = useState<string>('ciencias')
  const [topicoQuadroCustom, setTopicoQuadroCustom] = useState<string>('')

  // Respiração Guiada (Momento Calma & Foco)
  const [modoRespiracao, setModoRespiracao] = useState(false)
  const [anotacaoLivre, setAnotacaoLivre] = useState(
    'Dica da Lumi: quando você explica com suas próprias palavras, seu cérebro guarda muito melhor! ✨',
  )

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Carregar prompt do sistema ativo
  useEffect(() => {
    obterPromptAtivo().then((p) => {
      if (p) {
        setCustomPromptText(`${p.identidade} Regra Socrática: ${p.metodo_socratico}`)
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
  }, [criancaSelecionada])

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

    const textoUsuario = inputText.trim()
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textoUsuario,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setEnviando(true)

    const lumiMsgId = (Date.now() + 1).toString()
    let currentAssistantText = ''

    // Placeholder da Lumi em tom fofo e infantil
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
      const res = await enviarMensagemLumiStream(
        {
          message: textoUsuario,
          conversationId,
          criancaId: criancaSelecionada?.id,
          customPrompt: customPromptText,
        },
        {
          onChunk: (_delta, full) => {
            currentAssistantText = full
            setMessages((prev) => prev.map((m) => (m.id === lumiMsgId ? { ...m, text: full } : m)))
          },
        },
      )

      if (res.conversationId) {
        setConversationId(res.conversationId)
      }

      if (res.etapa) {
        setEtapaAtual(res.etapa)
      }
      if (res.materia) {
        setMateriaDetectada(res.materia)
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === lumiMsgId
            ? {
                ...m,
                text: res.content || currentAssistantText,
                etapa: res.etapa,
                acoes: res.acoes,
              }
            : m,
        ),
      )
    } catch (streamErr) {
      console.warn('Streaming falhou, tentando fallback síncrono:', streamErr)
      try {
        const syncRes = await enviarMensagemLumiSync({
          message: textoUsuario,
          conversationId,
          criancaId: criancaSelecionada?.id,
          customPrompt: customPromptText,
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

        setMessages((prev) =>
          prev.map((m) =>
            m.id === lumiMsgId
              ? {
                  ...m,
                  text: syncRes.content,
                  etapa: syncRes.etapa,
                  acoes: syncRes.acoes,
                }
              : m,
          ),
        )
      } catch (err: unknown) {
        console.error('Falha geral na IA:', err)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === lumiMsgId
              ? {
                  ...m,
                  text: 'Tive uma pequena falha na conexão, mas estou aqui com você! Pode me contar de novo?',
                }
              : m,
          ),
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  // Sugestões rápidas amigáveis em linguagem infantil
  const sugestoesRapidas = [
    'Como as plantas bebem água?',
    'Me ajuda a entender frações?',
    'Por que usamos a letra Ç?',
    'Tenho lição de ciências hoje!',
    'Terminei minha tarefinha!',
    'Quero um desafio divertido!',
  ]

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
      setConversationId(null)
      setEtapaAtual('entender')
      setMessages([
        {
          id: 'nova',
          sender: 'lumi',
          text: `Começando uma nova aventura! O que vamos descobrir hoje, ${criancaSelecionada?.nome || 'amigo(a)'}?`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          etapa: 'entender',
        },
      ])
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto pb-6">
      {/* 1. Trilha Socrática em linguagem infantil e discreta */}
      <TrilhaEtapasSocraticas
        etapaAtiva={etapaAtual}
        onSelecionarEtapa={(et) => setEtapaAtual(et)}
      />

      {/* 2. Check-in Emocional Diário (aparece quando a criança ainda não fez hoje) */}
      {precisaCheckinHoje && (
        <CheckinEmocionalCard
          nomeCrianca={criancaSelecionada?.nome || 'Amigo(a)'}
          onSelecionarHumor={handleSelecionarHumor}
          salvando={salvandoCheckin}
        />
      )}

      {/* 3. Seletor de Abas para Celulares e Telas Pequenas (Conversar vs Quadro) */}
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

      {/* 4. Grade Principal: Chat (prioritário) + Quadro Visual Secundário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna do Chat (7 colunas no desktop) */}
        <div
          className={`lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-soft border border-amber-100 overflow-hidden ${
            abaAtivaMobile === 'quadro' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Topo do Chat amigável */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50/50 border-b border-amber-100/90 flex items-center justify-between gap-2">
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

            <div className="flex items-center gap-2">
              {modoCriancaAtivo && (
                <button
                  type="button"
                  onClick={abrirModalSairModo}
                  title="Sair do Modo Criança (pede PIN)"
                  className="text-xs text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <span>🔒</span>
                  <span className="hidden md:inline">Sair do Modo</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNovaConversa}
                title="Começar de novo"
                className="text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recomeçar</span>
              </button>
            </div>
          </div>

          {/* Área das Mensagens com visual espaçoso e fontes infantis legíveis */}
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 custom-scroll min-h-[380px] max-h-[560px] bg-slate-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 sm:gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Avatar da Lumi sempre visível e destacado */}
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

                  {/* Cartõezinhos fofos de ações que a Lumi executou */}
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
                      <span className="text-amber-700/80 font-bold flex items-center gap-1">
                        <span>✨</span> Lumi
                      </span>
                    )}
                  </div>
                </div>

                {/* Avatar da Criança */}
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
                <span>Lumi está preparando a resposta...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sugestões Rápidas em formato de pílulas fofas */}
          <div className="px-3 py-2 bg-amber-50/50 border-t border-amber-100/70 flex items-center gap-1.5 overflow-x-auto custom-scroll">
            <span className="text-[11px] font-bold text-amber-800/80 uppercase tracking-wider shrink-0 mr-1">
              Dica rápida:
            </span>
            {sugestoesRapidas.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(sug)}
                className="text-xs bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-amber-200/90 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-semibold cursor-pointer active:scale-95"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Caixa de Entrada Amigável para Crianças */}
          <form
            onSubmit={handleEnviar}
            className="p-3 sm:p-3.5 bg-white border-t border-amber-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escreva pra Lumi..."
              disabled={enviando}
              className="flex-1 px-4 py-3 sm:py-3.5 rounded-2xl border-2 border-amber-200/80 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-sm sm:text-base bg-amber-50/20 text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || enviando}
              aria-label="Enviar mensagem"
              className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-sm sm:text-base shadow-md shadow-amber-500/30 disabled:opacity-40 transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[48px]"
            >
              <span>Enviar</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
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

          {/* Card Amigável: Momento Calma & Foco (Respiração Guiada) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-4 sm:p-5 text-white shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center text-lg">
                  <Wind className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">Momento Calma & Foco</h4>
                  <p className="text-[11px] text-indigo-200">
                    Respire fundo para destravarmos o cérebro
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
                  <span className="block text-base sm:text-lg">🧘</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-950">
                    {modoRespiracao ? 'Inspire... Expire...' : 'Respirar'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-indigo-200 text-center mt-3 max-w-xs leading-relaxed">
                {modoRespiracao
                  ? 'Acompanhe a bolinha crescendo e diminuindo com calma. Sinta o ar entrar e sair.'
                  : 'Quando uma dúvida parecer difícil, respirar com calma ajuda nosso cérebro a pensar melhor!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversaQuadro
