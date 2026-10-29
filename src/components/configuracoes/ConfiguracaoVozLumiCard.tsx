import React, { useState, useEffect, useRef } from 'react'
import {
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Play,
  RefreshCw,
  Info,
  Bot,
} from 'lucide-react'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import {
  isVozIaLumiHabilitada,
  setVozIaLumiHabilitada,
  getVozIaLumiPreferida,
  setVozIaLumiPreferida,
  obterAudioLumiUrl,
} from '@/services/lumiAudioService'
import { VOZES_REAIS_LUMI, type VozGeminiLive } from '@/hooks/useGeminiLiveVoice'

export const ConfiguracaoVozLumiCard: React.FC = () => {
  const [vozIaAtiva, setVozIaAtiva] = useState<boolean>(true)
  const [vozIaPreferida, setVozIaPreferidaState] = useState<VozGeminiLive>('Kore')
  const [tocandoAmostraIa, setTocandoAmostraIa] = useState<boolean>(false)
  const [carregandoAmostraIa, setCarregandoAmostraIa] = useState<boolean>(false)
  const audioIaRef = useRef<HTMLAudioElement | null>(null)

  const [vozesPtBr, setVozesPtBr] = useState<SpeechSynthesisVoice[]>([])
  const [vozSelecionadaNome, setVozSelecionadaNome] = useState<string>('')
  const [taxaTeste, setTaxaTeste] = useState<number>(1.05)
  const [textoAmostra, setTextoAmostra] = useState<string>(
    'Olá! Eu sou a Lumi. Adoro descobrir curiosidades com você! O que vamos explorar hoje?',
  )
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  useEffect(() => {
    setVozIaAtiva(isVozIaLumiHabilitada())
    setVozIaPreferidaState(getVozIaLumiPreferida())
  }, [])

  const {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    definirVozPreferida,
    speak,
    stop,
    warmUp,
  } = useSpeechSynthesis({
    rate: taxaTeste,
    pitch: 1.05,
    usarVozIa: false,
  })

  useEffect(() => {
    if (voices && voices.length > 0) {
      const filtradas = voices.filter(
        (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.startsWith('pt'),
      )
      setVozesPtBr(filtradas)

      try {
        const salva = localStorage.getItem('lumi_voz_nome_preferida')
        if (salva) {
          setVozSelecionadaNome(salva)
        } else if (selectedVoice) {
          setVozSelecionadaNome(selectedVoice.name)
        }
      } catch {
        if (selectedVoice) {
          setVozSelecionadaNome(selectedVoice.name)
        }
      }
    }
  }, [voices, selectedVoice])

  const handleToggleVozIa = (novoEstado: boolean) => {
    setVozIaAtiva(novoEstado)
    setVozIaLumiHabilitada(novoEstado)
    if (audioIaRef.current) {
      audioIaRef.current.pause()
      setTocandoAmostraIa(false)
    }
    stop()
    setMensagemSucesso(
      novoEstado
        ? `Voz Verdadeira da Lumi (${vozIaPreferida}) ativada com sucesso!`
        : 'Voz local do aparelho ativada.',
    )
    setTimeout(() => {
      setMensagemSucesso(null)
    }, 3500)
  }

  const handleTrocarVozIa = (novaVoz: VozGeminiLive) => {
    setVozIaPreferidaState(novaVoz)
    setVozIaLumiPreferida(novaVoz)
    if (audioIaRef.current) {
      audioIaRef.current.pause()
      setTocandoAmostraIa(false)
    }
    setMensagemSucesso(`Voz Real da Lumi alterada para "${novaVoz}"!`)
    setTimeout(() => {
      setMensagemSucesso(null)
    }, 3500)
  }

  const handleTocarAmostraVozIa = async () => {
    stop()
    if (tocandoAmostraIa) {
      if (audioIaRef.current) {
        audioIaRef.current.pause()
        audioIaRef.current.currentTime = 0
      }
      setTocandoAmostraIa(false)
      return
    }

    setCarregandoAmostraIa(true)
    try {
      const audioUrl = await obterAudioLumiUrl({
        text: textoAmostra,
        voice: vozIaPreferida,
      })

      if (!audioUrl) {
        setMensagemSucesso('Serviço temporariamente indisponível. Usando teste local.')
        speak(textoAmostra)
        return
      }

      if (!audioIaRef.current) {
        audioIaRef.current = new Audio()
      }
      const audio = audioIaRef.current
      audio.src = audioUrl
      audio.onended = () => {
        setTocandoAmostraIa(false)
      }
      audio.onerror = () => {
        setTocandoAmostraIa(false)
      }
      await audio.play()
      setTocandoAmostraIa(true)
    } catch (err) {
      console.warn('Erro ao tocar amostra IA:', err)
      speak(textoAmostra)
    } finally {
      setCarregandoAmostraIa(false)
    }
  }

  const handleSelecionarVoz = (nome: string) => {
    stop()
    if (audioIaRef.current) {
      audioIaRef.current.pause()
      setTocandoAmostraIa(false)
    }
    setVozSelecionadaNome(nome)
    definirVozPreferida(nome)
    setMensagemSucesso(`Voz de fallback atualizada para "${nome}"`)
    setTimeout(() => {
      setMensagemSucesso(null)
    }, 3000)
  }

  const handleTestarAmostra = () => {
    if (audioIaRef.current) {
      audioIaRef.current.pause()
      setTocandoAmostraIa(false)
    }
    warmUp()
    if (isSpeaking) {
      stop()
    } else {
      speak(textoAmostra)
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-amber-200/90 shadow-soft p-5 sm:p-7 space-y-6">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-md shrink-0">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-800">Calibragem da Voz da Lumi</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Gemini Live & TTS Real
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Personalize a voz humana real da Lumi para o Modo Criança e a Orbe Live em tempo real.
            </p>
          </div>
        </div>

        <div className="text-xs shrink-0">
          {isSupported ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Áudio em Tempo Real Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Sintetizador Local Indisponível
            </span>
          )}
        </div>
      </div>

      {/* CARD DE DESTAQUE: VOZ VERDADEIRA DA LUMI (GEMINI LIVE & TTS) */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <Sparkles className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black tracking-tight">
                  Voz Verdadeira da Lumi (Gemini Live IA)
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-amber-700 shadow-2xs">
                  Voz Humana Real
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Conversação em tempo real (Gemini 3.8 Live) com respiração, entonação carinhosa e
                resposta imediata.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <span className="text-xs font-bold text-amber-100">
              {vozIaAtiva ? 'Ativada' : 'Desativada'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={vozIaAtiva}
              onClick={() => handleToggleVozIa(!vozIaAtiva)}
              className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer p-1 ${
                vozIaAtiva ? 'bg-white' : 'bg-black/25'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full transition-transform transform shadow-md ${
                  vozIaAtiva
                    ? 'translate-x-6 bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'translate-x-0 bg-white/70'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Grade de escolha das 5 Vozes Reais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 relative z-10">
          {VOZES_REAIS_LUMI.map((v) => {
            const selecionada = vozIaPreferida === v.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleTrocarVozIa(v.id)}
                className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  selecionada
                    ? 'bg-white text-amber-950 border-white shadow-md scale-[1.02]'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black">
                    {v.emoji} {v.nome}
                  </span>
                  {selecionada && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                </div>
                <p
                  className={`text-[10px] mt-1 leading-snug ${
                    selecionada ? 'text-slate-600 font-medium' : 'text-amber-100/90'
                  }`}
                >
                  {v.descricao}
                </p>
              </button>
            )
          })}
        </div>

        {/* Botão de Amostra da Voz Real */}
        <div className="pt-2 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="text-xs text-amber-100/90 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-yellow-200" />
            <span>
              Voz selecionada: <strong>{vozIaPreferida}</strong> (Gemini 3.8 Live & Flash TTS)
            </span>
          </div>

          <button
            type="button"
            onClick={handleTocarAmostraVozIa}
            disabled={carregandoAmostraIa}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 ${
              tocandoAmostraIa
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-white text-slate-800 hover:bg-amber-50'
            }`}
          >
            {carregandoAmostraIa ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gerando Voz Real ({vozIaPreferida})...</span>
              </>
            ) : tocandoAmostraIa ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Pausar Amostra</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-amber-600" />
                <span>Ouvir Amostra Voz Real ({vozIaPreferida}) 🔊</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explicação da tecnologia local */}
      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Voz Local de Fallback (Web Speech API):</strong> Se o dispositivo estiver offline,
          a Lumi usa automaticamente a voz do aparelho abaixo sem interromper a aula.
        </p>
      </div>

      {/* Seleção de Vozes no Aparelho */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Vozes em Português detectadas no aparelho ({vozesPtBr.length})
          </label>
          {selectedVoice && (
            <span className="text-xs text-amber-700 font-bold">Ativa: {selectedVoice.name}</span>
          )}
        </div>

        {vozesPtBr.length === 0 ? (
          <div className="p-4 rounded-2xl border border-dashed border-amber-300 text-center text-xs text-slate-500 space-y-1">
            <p>Carregando as vozes do sistema operacional...</p>
            <p className="text-[11px] text-slate-400">
              (Se não aparecer em alguns segundos, o navegador usará a voz padrão pt-BR do aparelho
              automaticamente)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scroll">
            {vozesPtBr.map((voz) => {
              const estaAtiva =
                voz.name === vozSelecionadaNome ||
                (!vozSelecionadaNome && selectedVoice?.name === voz.name)
              const ehNatural =
                /Natural|Neural|Google|Luciana|Francisca|Letícia|Premium|Enhanced/i.test(voz.name)

              return (
                <button
                  key={voz.name}
                  type="button"
                  onClick={() => handleSelecionarVoz(voz.name)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    estaAtiva
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-white hover:bg-amber-50/70 text-slate-800 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold truncate max-w-[190px]">{voz.name}</span>
                      {ehNatural && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                            estaAtiva ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Natural
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        estaAtiva ? 'text-amber-100' : 'text-slate-400'
                      }`}
                    >
                      {voz.lang} {voz.localService ? '• Local' : '• Online'}
                    </span>
                  </div>

                  {estaAtiva && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Teste Interativo de Ritmo e Amostra */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Frase de Amostra para Teste
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha uma frase abaixo e clique em &ldquo;Ouvir Amostra Voz Real&rdquo; ou teste a
              voz local.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Ritmo do teste:</span>
            <div className="inline-flex rounded-xl bg-white border border-slate-300 p-0.5">
              {[
                { label: '0.95x', rate: 0.95 },
                { label: '1.05x (Ideal)', rate: 1.05 },
                { label: '1.15x', rate: 1.15 },
              ].map((opt) => (
                <button
                  key={opt.rate}
                  type="button"
                  onClick={() => {
                    setTaxaTeste(opt.rate)
                    if (isSpeaking) stop()
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    taxaTeste === opt.rate
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'Olá! Eu sou a Lumi. Adoro descobrir curiosidades com você! O que vamos explorar hoje?',
            'Uau, parabéns! Você pensou muito bem nessa resposta. Vamos para o próximo passo?',
            'O que você acha que acontece com a água quando ela esquenta na chaleira?',
          ].map((frase, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTextoAmostra(frase)
                if (isSpeaking) stop()
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer text-left ${
                textoAmostra === frase
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Amostra {i + 1} ({i === 0 ? 'Acolhedora' : i === 1 ? 'Elogio' : 'Pergunta'})
            </button>
          ))}
        </div>

        <p className="p-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium italic">
          &ldquo;{textoAmostra}&rdquo;
        </p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestarAmostra}
              disabled={!isSupported}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 ${
                isSpeaking
                  ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Pausar Voz Local</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Testar Voz Local do Aparelho 🔊</span>
                </>
              )}
            </button>
          </div>

          {mensagemSucesso && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {mensagemSucesso}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfiguracaoVozLumiCard
