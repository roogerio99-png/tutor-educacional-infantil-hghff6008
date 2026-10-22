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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [customPromptText, setCustomPromptText] = useState<string | null>(null)

  // FRENTE 2: Check-in Emocional Diário
  const [precisaCheckinHoje, setPrecisaCheckinHoje] = useState(false)
  const [salvandoCheckin, setSalvandoCheckin] = useState(false)
  const [humorHoje, setHumorHoje] = useState<HumorEmocional | null>(null)

  // Estados do Protocolo Socrático e Quadro Visual (Fase 2)
  const [etapaAtual, setEtapaAtual] = useState<EtapaSocratica>('entender')
  const [materiaDetectada, setMateriaDetectada] = useState<string>('ciencias')
  const [topicoQuadroCustom, setTopicoQuadroCustom] = useState<string>('')

  // Respiração Guiada (Socioemocional)
  const [modoRespiracao, setModoRespiracao] = useState(false)
  const [anotacaoLivre, setAnotacaoLivre] = useState(
    'Dica da Lumi: Ensinar é aprender duas vezes! Explique cada passo com suas palavras.',
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

      // Verificar se a criança já fez o check-in de hoje
      verificarCheckinHoje(criancaSelecionada.id).then((res) => {
        if (!res.fez_checkin) {
          setPrecisaCheckinHoje(true)
          setHumorHoje(null)
        } else {
          setPrecisaCheckinHoje(false)
          setHumorHoje(res.checkin?.humor || null)
          // Mensagem inicial adaptada
          setMessages([
            {
              id: 'welcome',
              sender: 'lumi',
              text: `Olá! Eu sou a Lumi ✨. Olá, ${criancaSelecionada.nome}! Que bom te ver por aqui hoje. O que você gostaria de explorar, desenhar ou descobrir juntos?`,
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

      let textoBoasVindas = `Olá, ${criancaSelecionada.nome}! Eu sou a Lumi ✨. `
      if (humor === 'triste' || humor === 'muito_triste') {
        textoBoasVindas += `Percebi que você está se sentindo um pouquinho para baixo hoje. Saiba que você é muito especial, e aqui vamos no seu ritmo com todo o carinho do mundo! Se quiser, podemos fazer um momento de respiração calma ou conversar sobre algo leve que você gosta.`
        setModoRespiracao(true) // Ativa respiração acolhedora
      } else if (humor === 'muito_feliz' || humor === 'feliz') {
        textoBoasVindas += `Que alegria sentir sua energia boa hoje! Vamos aproveitar esse ânimo para explorar descobertas incríveis? O que vamos investigar agora?`
      } else {
        textoBoasVindas += `Obrigada por me contar como você está! Estou aqui pronta para investigar e aprender com você passo a passo, sem pressa. Qual lição ou curiosidade vamos desvendar?`
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

    // Placeholder da Lumi
    setMessages((prev) => [
      ...prev,
      {
        id: lumiMsgId,
        sender: 'lumi',
        text: 'Lumi está pensando socraticamente...',
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

      // Atualizar etapa e ações executadas
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
        const errorMessage = err instanceof Error ? err.message : 'Falha na conexão com a Lumi'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === lumiMsgId
              ? {
                  ...m,
                  text: `Puxa, tive uma pequena oscilação na conexão (${errorMessage}). Mas continue me contando: o que você pensa sobre isso?`,
                }
              : m,
          ),
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  const sugestoesRapidas = [
    'Como as plantas se alimentam na fotossíntese?',
    'Me ajuda a entender frações e divisões?',
    'Por que usamos a letra Ç nas palavras?',
    'Tenho prova de ciências na sexta-feira!',
    'Gosto de aprender fazendo desenhos coloridos!',
    'Terminei a lição de matemática de hoje!',
  ]

  const handleTrocarTopicoQuadro = () => {
    const opcao = prompt(
      'Escolha a matéria para visualizar no quadro:\n1 - Matemática\n2 - Ciências\n3 - Português\n4 - História\n5 - Geografia\n6 - Mapa Mental Geral',
      'Matemática',
    )
    if (opcao) {
      const opcLow = opcao.toLowerCase()
      if (opcLow.includes('1') || opcLow.includes('mat')) {
        setMateriaDetectada('matematica')
        setTopicoQuadroCustom('Matemática: Frações & Reta')
      } else if (opcLow.includes('2') || opcLow.includes('cien')) {
        setMateriaDetectada('ciencias')
        setTopicoQuadroCustom('Ciências: Fotossíntese & Ciclo')
      } else if (opcLow.includes('3') || opcLow.includes('port')) {
        setMateriaDetectada('portugues')
        setTopicoQuadroCustom('Português: Sílabas & Frases')
      } else if (opcLow.includes('4') || opcLow.includes('hist')) {
        setMateriaDetectada('historia')
        setTopicoQuadroCustom('História: Linha do Tempo')
      } else if (opcLow.includes('5') || opcLow.includes('geo')) {
        setMateriaDetectada('geografia')
        setTopicoQuadroCustom('Geografia: Orientação & Relevo')
      } else {
        setMateriaDetectada('geral')
        setTopicoQuadroCustom('Mapa Mental Socrático')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* FRENTE 1: Indicador visual do Protocolo Socrático de 5 etapas */}
      <TrilhaEtapasSocraticas
        etapaAtiva={etapaAtual}
        onSelecionarEtapa={(et) => setEtapaAtual(et)}
      />

      {/* FRENTE 2: Card de Check-in Emocional Diário (aparece se a criança ainda não fez hoje) */}
      {precisaCheckinHoje && (
        <CheckinEmocionalCard
          nomeCrianca={criancaSelecionada?.nome || 'Aluno'}
          onSelecionarHumor={handleSelecionarHumor}
          salvando={salvandoCheckin}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-18rem)]">
        {/* Coluna da Esquerda: Chat Socrático com a Lumi (7 colunas no desktop) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-soft border border-slate-200/80 overflow-hidden">
          {/* Topo do Chat */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/30">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">Lumi IA</h2>
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
                    title="Online"
                  />
                  <span className="text-[11px] text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    Anti-Spoiler Ativo
                  </span>
                  {humorHoje && (
                    <span className="text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      {humorHoje === 'muito_feliz' && '🌟 Muito Feliz'}
                      {humorHoje === 'feliz' && '😊 Feliz'}
                      {humorHoje === 'neutro' && '😐 Normal'}
                      {humorHoje === 'triste' && '🙁 Acolhimento'}
                      {humorHoje === 'muito_triste' && '😢 Cuidado Especial'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Apoiando{' '}
                  <span className="font-semibold text-slate-700">
                    {criancaSelecionada?.nome || 'Aluno'}
                  </span>{' '}
                  • {criancaSelecionada?.serie || 'Ensino Fundamental'}
                  {criancaSelecionada?.acessibilidade &&
                    criancaSelecionada.acessibilidade !== 'Nenhuma' && (
                      <span className="ml-1 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                        {criancaSelecionada.acessibilidade}
                      </span>
                    )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja iniciar uma nova conversa socrática com a Lumi?')) {
                  setConversationId(null)
                  setEtapaAtual('entender')
                  setMessages([
                    {
                      id: 'nova',
                      sender: 'lumi',
                      text: `Começando uma nova jornada! O que você gostaria de explorar hoje, ${criancaSelecionada?.nome || 'amigo'}?`,
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      etapa: 'entender',
                    },
                  ])
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl font-medium transition-colors"
            >
              Reiniciar Sessão
            </button>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scroll max-h-[520px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'lumi' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                    ✨
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4 shadow-sm text-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-white rounded-br-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                  {/* FRENTE 2: Cartões de confirmação de escrita da Lumi (Agenda / Memórias) */}
                  {msg.acoes && msg.acoes.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {msg.acoes.map((acao, i) => (
                        <CartaoAcaoLumi key={i} acao={acao} />
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] flex items-center justify-between gap-4 ${
                      msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'lumi' && (
                      <span className="italic text-amber-700 font-semibold flex items-center gap-1">
                        <span>🧭</span> Etapa:{' '}
                        {msg.etapa ? msg.etapa.toUpperCase() : etapaAtual.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {criancaSelecionada?.nome ? criancaSelecionada.nome.charAt(0) : 'U'}
                  </div>
                )}
              </div>
            ))}

            {enviando && (
              <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold italic pl-10">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Lumi está preparando uma pergunta socrática...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto custom-scroll">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Experimente:
            </span>
            {sugestoesRapidas.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(sug)}
                className="text-xs bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Caixa de Entrada */}
          <form
            onSubmit={handleEnviar}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Converse com a Lumi sobre o que ${criancaSelecionada?.nome || 'o aluno'} está aprendendo...`}
              disabled={enviando}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || enviando}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <span>Enviar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Coluna da Direita: FRENTE 3 - Quadro Visual Determinístico & Pausa Ativa (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <QuadroVisualContainer
            materia={materiaDetectada}
            etapaSocratica={etapaAtual}
            acessibilidade={criancaSelecionada?.acessibilidade}
            topicoCustomizado={topicoQuadroCustom}
            onTrocarTopico={handleTrocarTopicoQuadro}
          />

          {/* Bloco de Síntese Pedagógica / Anotações */}
          <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>📝</span> Síntese do Aluno
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                Consolidação
              </span>
            </div>
            <textarea
              rows={2}
              value={anotacaoLivre}
              onChange={(e) => setAnotacaoLivre(e.target.value)}
              className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none resize-none"
              placeholder="Escreva aqui com suas próprias palavras o que você descobriu..."
            />
          </div>

          {/* Card de Pausa Ativa & Respiração Guiada (Socioemocional) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🫁</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Momento Calma & Foco</h4>
                  <p className="text-[11px] text-indigo-200">Respiração 4-4 para foco atencional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModoRespiracao(!modoRespiracao)}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow transition-colors"
              >
                {modoRespiracao ? 'Pausar' : 'Iniciar'}
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-400 flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg shadow-indigo-500/30 ${
                  modoRespiracao ? 'breathe-circle' : ''
                }`}
              >
                <div className="text-center p-2">
                  <span className="block text-base">🧘</span>
                  <span className="text-[10px] font-extrabold uppercase text-indigo-950">
                    {modoRespiracao ? 'Inspire... Expire...' : 'Respirar'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-indigo-200 text-center mt-3 max-w-xs">
                {modoRespiracao
                  ? 'Acompanhe o círculo crescendo e diminuindo com calma. Sinta o ar entrar e sair.'
                  : 'Quando a matéria parecer difícil, 3 respirações profundas destravam o cérebro.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversaQuadro
