import React from 'react'
import { Mic, Volume2, Sparkles, Hand, VolumeX, Radio, Loader2 } from 'lucide-react'
import { VOZES_REAIS_LUMI, type VozGeminiLive } from '@/hooks/useGeminiLiveVoice'

export type EstadoLumiLive = 'ouvindo' | 'pensando' | 'falando' | 'ocioso'

export interface OrbeLumiLiveProps {
  estado: EstadoLumiLive
  legendaOuvindo?: string
  legendaFalando?: string
  vozHabilitada: boolean
  onToggleVoz: () => void
  onInterromper: () => void
  onFalarAgora: () => void
  isListening: boolean
  ritmoNome: string
  onCicloRitmo: () => void
  isSupported?: boolean
  permissionDenied?: boolean
  errorMessage?: string | null
  etapaAtual?: string
  passoDetectadoNome?: string
  // Real-time Gemini Live Voice props
  liveConnected?: boolean
  liveConnecting?: boolean
  volumeLevel?: number
  vozRealAtiva?: VozGeminiLive
  onTrocarVozReal?: (voz: VozGeminiLive) => void
}

export const OrbeLumiLive: React.FC<OrbeLumiLiveProps> = ({
  estado,
  legendaOuvindo = '',
  legendaFalando = '',
  vozHabilitada,
  onToggleVoz,
  onInterromper,
  onFalarAgora,
  isListening,
  ritmoNome,
  onCicloRitmo,
  isSupported = true,
  permissionDenied = false,
  errorMessage = null,
  passoDetectadoNome,
  liveConnected = false,
  liveConnecting = false,
  volumeLevel = 0,
  vozRealAtiva = 'Kore',
  onTrocarVozReal,
}) => {
  const configEstado = {
    ouvindo: {
      titulo: liveConnected
        ? 'Voz Real em Tempo Real • Ouvindo você 🎤'
        : 'Ouvindo você com atenção 🎤',
      subtitulo: 'Pode falar naturalmente como numa conversa de verdade, estou te escutando!',
      corBorda: 'border-rose-400',
      corGradiente: 'from-rose-500 via-amber-400 to-orange-500',
      corAura: 'bg-rose-400/35',
      icone: '👂',
      ondaCor: 'bg-rose-300',
      ondaAtiva: true,
    },
    pensando: {
      titulo: 'Pensando com carinho... ✨',
      subtitulo: 'A Lumi está preparando uma pergunta divertida para você!',
      corBorda: 'border-indigo-400',
      corGradiente: 'from-amber-400 via-purple-500 to-indigo-600',
      corAura: 'bg-indigo-400/35',
      icone: '🧠',
      ondaCor: 'bg-purple-300',
      ondaAtiva: true,
    },
    falando: {
      titulo: 'Lumi falando com Voz Real... 🔊',
      subtitulo: 'Preste atenção ou fale a qualquer momento se quiser interromper (barge-in)!',
      corBorda: 'border-amber-400',
      corGradiente: 'from-amber-400 via-orange-500 to-amber-600',
      corAura: 'bg-amber-400/40',
      icone: '🗣️',
      ondaCor: 'bg-amber-200',
      ondaAtiva: true,
    },
    ocioso: {
      titulo: 'Pronta para conversar com Voz Real! ✨',
      subtitulo: 'Toque em "Conversar por Voz Real" abaixo para falar ao vivo com a Lumi',
      corBorda: 'border-amber-200',
      corGradiente: 'from-amber-400 to-orange-400',
      corAura: 'bg-amber-300/20',
      icone: '✨',
      ondaCor: 'bg-amber-300',
      ondaAtiva: false,
    },
  }[estado]

  // Escala dinâmica baseada no volume real de áudio (microfone ou voz da Lumi)
  const boostEscala = configEstado.ondaAtiva ? 1 + Math.min(0.22, volumeLevel * 0.25) : 1

  return (
    <div className="relative flex flex-col items-center justify-between p-5 sm:p-7 bg-gradient-to-b from-amber-500/10 via-white to-orange-500/5 rounded-3xl border-2 border-amber-200/80 shadow-soft overflow-hidden min-h-[480px]">
      {/* Barra superior de controles Lumi Live */}
      <div className="w-full flex items-center justify-between gap-2 z-10 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white shadow-xs transition-all ${
              liveConnected
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
          >
            {liveConnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>
              {liveConnecting
                ? 'Conectando Voz Real...'
                : liveConnected
                  ? 'Lumi Live • Voz Real Conectada'
                  : 'Lumi Live • Tempo Real'}
            </span>
          </span>

          <button
            type="button"
            onClick={onCicloRitmo}
            title="Alterar ritmo da voz da Lumi"
            className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>⏱️</span>
            <span>{ritmoNome}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor rápido de Voz Humana Real da Lumi */}
          {onTrocarVozReal && (
            <select
              aria-label="Escolher timbre da voz real da Lumi"
              value={vozRealAtiva}
              onChange={(e) => onTrocarVozReal(e.target.value as VozGeminiLive)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-h-[36px]"
              title="Escolher a voz humana da Lumi"
            >
              {VOZES_REAIS_LUMI.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.emoji} Voz: {v.nome}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={onToggleVoz}
            title={vozHabilitada ? 'Silenciar voz da Lumi' : 'Ativar voz da Lumi'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
              vozHabilitada
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {vozHabilitada ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>🔊 Voz Ligada</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span>🔇 Voz Silenciada</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Centro: Orbe Animada com Ondas Reativas à Voz Real */}
      <div className="relative my-6 flex flex-col items-center justify-center">
        {/* Aura pulsante de fundo reativa ao volume */}
        <div
          className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full ${configEstado.corAura} blur-2xl transition-transform duration-150`}
          style={{
            transform: `scale(${boostEscala * 1.15})`,
          }}
        />

        {/* Anéis concêntricos de onda sonora */}
        {configEstado.ondaAtiva && (
          <>
            <div
              className={`absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 ${configEstado.corBorda} opacity-45 animate-ping`}
              style={{ animationDuration: estado === 'ouvindo' ? '1.4s' : '1.8s' }}
            />
            <div
              className={`absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-amber-300/60 opacity-60 animate-pulse`}
            />
          </>
        )}

        {/* A ORBE PRINCIPAL */}
        <div
          style={{
            transform: `scale(${boostEscala})`,
          }}
          className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr ${configEstado.corGradiente} p-1 shadow-2xl flex items-center justify-center transition-all duration-150 ${
            estado === 'falando'
              ? 'shadow-amber-500/50'
              : estado === 'ouvindo'
                ? 'shadow-rose-500/50'
                : estado === 'pensando'
                  ? 'rotate-6 shadow-indigo-500/50 animate-pulse'
                  : 'hover:scale-105'
          }`}
        >
          {/* Brilho interno tridimensional estilo bola de energia */}
          <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-xs flex flex-col items-center justify-center relative overflow-hidden">
            {/* Reflexo superior de vidro */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/40 rounded-full blur-md" />

            {/* Ícone expressivo da Lumi */}
            <span
              className={`text-4xl sm:text-5xl transition-transform duration-300 ${
                estado === 'falando'
                  ? 'animate-bounce'
                  : estado === 'ouvindo'
                    ? 'scale-110'
                    : estado === 'pensando'
                      ? 'animate-spin'
                      : ''
              }`}
            >
              {configEstado.icone}
            </span>

            {/* Equalizador de barras reativas ao volume real */}
            <div className="flex items-center gap-1.5 mt-2 h-6">
              {[0.45, 0.85, 1.0, 0.75, 0.95, 0.6, 0.4].map((peso, i) => {
                const nivelDinamico = Math.max(0.25, volumeLevel)
                const alturaPx = configEstado.ondaAtiva
                  ? Math.max(6, Math.round(peso * nivelDinamico * (estado === 'falando' ? 26 : 22)))
                  : 4
                return (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full ${configEstado.ondaCor} transition-all duration-100 ${
                      configEstado.ondaAtiva ? ' opacity-95' : 'h-1.5 opacity-30'
                    }`}
                    style={{
                      height: `${alturaPx}px`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Rótulo de status da Orbe */}
        <div className="mt-4 text-center">
          <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-center gap-1.5">
            {configEstado.titulo}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-sm">
            {configEstado.subtitulo}
          </p>
        </div>
      </div>

      {/* Legendas em Tempo Real (Texto Grande da Criança ou da Lumi) */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-amber-200/90 shadow-xs mb-4 min-h-[92px] flex flex-col justify-center text-center">
        {estado === 'ouvindo' && (
          <div>
            <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider">
              Você está dizendo ao vivo:
            </span>
            <p className="text-base sm:text-xl font-extrabold text-slate-900 mt-1 italic leading-snug">
              {legendaOuvindo
                ? `"${legendaOuvindo}"`
                : 'Fale naturalmente com a Lumi... estou te ouvindo! 🎙️'}
            </p>
          </div>
        )}

        {estado === 'pensando' && (
          <div>
            <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Lumi conectando os saberes...
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-700 mt-1">
              Preparando resposta com voz real para você!
            </p>
          </div>
        )}

        {estado === 'falando' && (
          <div>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider flex items-center justify-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                Lumi falando ({vozRealAtiva}):
              </span>
              {passoDetectadoNome && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs animate-fade-in">
                  <span>✨</span>
                  <span>Agora: {passoDetectadoNome}</span>
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {legendaFalando ? legendaFalando.replace(/\[\[ETAPA:[^\]]+\]\]/gi, '').trim() : '...'}
            </p>
          </div>
        )}

        {estado === 'ocioso' && (
          <div>
            <p className="text-xs sm:text-sm text-slate-500">
              💡 <strong>Voz Real Full-Duplex:</strong> converse naturalmente como em uma chamada de
              voz! Se você falar enquanto a Lumi explica, ela para na hora para te ouvir.
            </p>
          </div>
        )}
      </div>

      {/* Barra de Ações Rápidas da Orbe (Interrupção + Conversar Agora) */}
      <div className="w-full flex items-center justify-center gap-3 flex-wrap z-10">
        {(estado === 'falando' || estado === 'pensando') && (
          <button
            type="button"
            onClick={onInterromper}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-all animate-bounce"
            title="Interromper a fala da Lumi e devolver a palavra para a criança"
          >
            <Hand className="w-4 h-4" />
            <span>✋ Interromper Lumi (Barge-in)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onFalarAgora}
          disabled={!isSupported || liveConnecting}
          title={
            !isSupported
              ? 'Navegador sem suporte a captura de áudio'
              : permissionDenied
                ? 'Clique para solicitar permissão do microfone'
                : isListening
                  ? 'Pausar microfone em tempo real'
                  : 'Conversar por Voz Real com a Lumi'
          }
          className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ${
            !isSupported
              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
              : permissionDenied
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 ring-4 ring-amber-200'
                : isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-4 ring-rose-200'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'
          }`}
        >
          {liveConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
          )}
          <span>
            {!isSupported
              ? 'Microfone não suportado'
              : liveConnecting
                ? 'Conectando Voz Real...'
                : permissionDenied
                  ? 'Liberar Microfone 🎤'
                  : isListening
                    ? 'Pausar Microfone Ao Vivo ⏸️'
                    : 'Conversar por Voz Real 🎤'}
          </span>
        </button>
      </div>

      {/* Alerta de permissão ou erro dentro do Orbe Live */}
      {permissionDenied && (
        <div className="w-full mt-3 p-3 bg-amber-100/90 border border-amber-300 rounded-xl text-center text-xs text-amber-900 font-bold z-10 animate-fade-in-up">
          <span>
            ⚠️ <strong>Atenção aos pais/responsáveis:</strong> Precisamos da permissão do microfone
            para a criança conversar com a Lumi. Clique no ícone de cadeado na barra de endereços do
            navegador e permita o microfone.
          </span>
        </div>
      )}

      {errorMessage && !permissionDenied && (
        <div className="w-full mt-3 p-2.5 bg-orange-100/80 border border-orange-300 rounded-xl text-center text-xs text-orange-900 font-semibold z-10 animate-fade-in-up">
          <span>😊 {errorMessage}</span>
        </div>
      )}
    </div>
  )
}

export default OrbeLumiLive
