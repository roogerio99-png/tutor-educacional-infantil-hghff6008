import React, { useState, useEffect, useRef } from 'react'
import { useCrianca } from '@/contexts/CriancaContext'
import { enviarMensagemLumiStream, enviarMensagemLumiSync } from '@/services/lumiAgent'
import { obterPromptAtivo } from '@/services/prompts'

interface ChatMessage {
  id: string
  sender: 'lumi' | 'user'
  text: string
  timestamp: string
  visualHint?: string
}

export const ConversaQuadro: React.FC = () => {
  const { criancaSelecionada } = useCrianca()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [customPromptText, setCustomPromptText] = useState<string | null>(null)

  // Estados do Quadro Visual
  const [topicoQuadro, setTopicoQuadro] = useState('Fotossíntese das Plantas')
  const [elementosQuadro, setElementosQuadro] = useState<
    Array<{ id: string; titulo: string; desc: string; icon: string; cor: string }>
  >([
    {
      id: '1',
      titulo: 'Luz Solar ☀️',
      desc: 'A fonte de energia que as folhas capturam através da clorofila.',
      icon: '☀️',
      cor: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    {
      id: '2',
      titulo: 'Gás Carbônico (CO₂) 💨',
      desc: 'Entra pelos estômatos microscópicos nas folhinhas.',
      icon: '🍃',
      cor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    {
      id: '3',
      titulo: 'Água da Raiz (H₂O) 💧',
      desc: 'Subindo pelos vasos até chegar às folhas verdinhas.',
      icon: '💧',
      cor: 'bg-sky-50 border-sky-200 text-sky-800',
    },
    {
      id: '4',
      titulo: 'Glicose & Oxigênio ✨',
      desc: 'Alimento para a plantinha crescer forte e ar puro para nós!',
      icon: '🌸',
      cor: 'bg-rose-50 border-rose-200 text-rose-800',
    },
  ])
  const [passoAtivo, setPassoAtivo] = useState(1)
  const [modoRespiracao, setModoRespiracao] = useState(false)
  const [anotacaoLivre, setAnotacaoLivre] = useState(
    'Dica da Lumi: As plantas respiram dia e noite, mas a fotossíntese só acontece na presença de luz!',
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

  // Inicializar mensagens quando troca de criança
  useEffect(() => {
    if (criancaSelecionada) {
      setMessages([
        {
          id: 'welcome',
          sender: 'lumi',
          text: `Olá! Eu sou a Lumi ✨. Olá, ${criancaSelecionada.nome}! O que você gostaria de explorar, desenhar ou descobrir hoje? Lembre-se: não há respostas erradas, vamos investigar juntos passo a passo!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          visualHint: 'Quadro preparado para investigações!',
        },
      ])
      setConversationId(null)
    }
  }, [criancaSelecionada])

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

    // Criar placeholder da Lumi
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
      // Tentar via streaming
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

      // Se a resposta contiver pistas visuais ou novos tópicos, atualizar o quadro
      analisarEAtualizarQuadro(textoUsuario, currentAssistantText || res.content)
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

        setMessages((prev) =>
          prev.map((m) => (m.id === lumiMsgId ? { ...m, text: syncRes.content } : m)),
        )

        analisarEAtualizarQuadro(textoUsuario, syncRes.content)
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

  // Atualização inteligente do quadro com base na conversa
  const analisarEAtualizarQuadro = (userText: string, lumiText: string) => {
    const texto = (userText + ' ' + lumiText).toLowerCase()

    if (
      texto.includes('fração') ||
      texto.includes('divisão') ||
      texto.includes('pizza') ||
      texto.includes('matemática')
    ) {
      setTopicoQuadro('Frações & Partes Iguais 🍕')
      setElementosQuadro([
        {
          id: '1',
          titulo: 'O Todo Inteiro (1/1)',
          desc: 'Uma pizza inteira ou uma barra de chocolate completa.',
          icon: '🍕',
          cor: 'bg-amber-50 border-amber-200 text-amber-800',
        },
        {
          id: '2',
          titulo: 'Metade (1/2)',
          desc: 'Dividida exatamente em 2 pedaços iguais para dois amigos.',
          icon: '✂️',
          cor: 'bg-blue-50 border-blue-200 text-blue-800',
        },
        {
          id: '3',
          titulo: 'Um Quarto (1/4)',
          desc: 'Dividida em 4 partes iguais. Cada fatia é um quarto!',
          icon: '🔢',
          cor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        },
        {
          id: '4',
          titulo: 'Numerador vs Denominador',
          desc: 'Em cima: quantas fatias você comeu. Embaixo: em quantas partes foi cortada.',
          icon: '💡',
          cor: 'bg-purple-50 border-purple-200 text-purple-800',
        },
      ])
      setAnotacaoLivre(
        'O denominador NUNCA pode ser zero! As partes divididas precisam ser de tamanhos idênticos.',
      )
    } else if (
      texto.includes('história') ||
      texto.includes('indígena') ||
      texto.includes('tempo') ||
      texto.includes('século')
    ) {
      setTopicoQuadro('Linha do Tempo Histórica 📜')
      setElementosQuadro([
        {
          id: '1',
          titulo: 'Passado Remoto',
          desc: 'Povos originários, conexão profunda com a floresta e os rios.',
          icon: '🏹',
          cor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        },
        {
          id: '2',
          titulo: 'Grandes Navegações',
          desc: 'Caravelas cruzando o oceano e o encontro de culturas.',
          icon: '⛵',
          cor: 'bg-sky-50 border-sky-200 text-sky-800',
        },
        {
          id: '3',
          titulo: 'Transformações',
          desc: 'Surgimento das primeiras vilas, cidades e engenhos.',
          icon: '🏛️',
          cor: 'bg-amber-50 border-amber-200 text-amber-800',
        },
        {
          id: '4',
          titulo: 'Nosso Presente',
          desc: 'Nós mesmos vivendo e construindo a história a cada dia.',
          icon: '🌍',
          cor: 'bg-rose-50 border-rose-200 text-rose-800',
        },
      ])
      setAnotacaoLivre(
        'História não é decorar datas, é entender por que as pessoas tomavam certas decisões no seu tempo.',
      )
    }
  }

  const sugestoesRapidas = [
    'Como as plantas se alimentam?',
    'Me ajuda a entender frações?',
    'Por que usamos a letra Ç?',
    'O que foi a linha do tempo do Brasil?',
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-14rem)]">
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
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Método Socrático
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Apoiando{' '}
                <span className="font-semibold text-slate-700">
                  {criancaSelecionada?.nome || 'Aluno'}
                </span>{' '}
                • {criancaSelecionada?.serie || 'Ensino Fundamental'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja iniciar uma nova conversa com a Lumi?')) {
                setConversationId(null)
                setMessages([
                  {
                    id: 'nova',
                    sender: 'lumi',
                    text: `Começando uma nova jornada! O que você gostaria de explorar hoje, ${criancaSelecionada?.nome || 'amigo'}?`,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ])
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl font-medium transition-colors"
          >
            Limpar Conversa
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

                <div
                  className={`mt-1.5 text-[10px] flex items-center justify-between gap-4 ${
                    msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'lumi' && (
                    <span className="italic text-amber-700 font-medium">Guia Socrático</span>
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
              Lumi está formulando uma pergunta orientadora...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Sugestões Rápidas */}
        <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto custom-scroll">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Perguntar:
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

      {/* Coluna da Direita: Quadro Visual Dinâmico & Pausa Ativa (5 colunas) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Card do Quadro Visual */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Quadro Visual de Apoio</h3>
                <p className="text-[11px] text-slate-500">Esquema cognitivo em tempo real</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {topicoQuadro}
            </span>
          </div>

          {/* Elementos em cartões visuais interativos */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {elementosQuadro.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setPassoAtivo(index + 1)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${item.cor} ${
                  passoAtivo === index + 1
                    ? 'ring-2 ring-amber-500 shadow-md scale-102'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/70">
                    Etapa {index + 1}
                  </span>
                </div>
                <h4 className="text-xs font-bold leading-snug mb-1">{item.titulo}</h4>
                <p className="text-[11px] leading-tight opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Bloco de Anotações e Síntese */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>📝</span> Síntese Pedagógica
              </span>
              <span className="text-[10px] text-slate-400">Editável</span>
            </div>
            <textarea
              rows={2}
              value={anotacaoLivre}
              onChange={(e) => setAnotacaoLivre(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-600 focus:outline-none resize-none"
            />
          </div>

          {/* Botões do Quadro */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Estimula memória visual</span>
            <button
              type="button"
              onClick={() => {
                const novoTema = prompt('Qual assunto deseja desenhar no quadro?', topicoQuadro)
                if (novoTema) {
                  analisarEAtualizarQuadro(novoTema, novoTema)
                }
              }}
              className="text-amber-600 hover:text-amber-700 font-semibold hover:underline"
            >
              Trocar Tópico
            </button>
          </div>
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
  )
}

export default ConversaQuadro
