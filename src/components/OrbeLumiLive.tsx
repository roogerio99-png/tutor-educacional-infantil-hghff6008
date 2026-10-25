import React from 'react'
import { Mic, Volume2, Sparkles, Hand, VolumeX } from 'lucide-react'

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
}) => {
  // Configurações visuais por estado
  const configEstado = {
    ouvindo: {
      titulo: 'Ouvindo você com atenção 🎤',
      subtitulo: 'Pode falar no seu tempo, estou escutando tudinho...',
      corBorda: 'border-red-400',
      corGradiente: 'from-rose-500 via-amber-400 to-orange-500',
      corAura: 'bg-rose-400/30',
      icone: '👂',
      ondaCor: 'bg-rose-400',
      ondaAtiva: true,
    },
    pensando: {
      titulo: 'Pensando com carinho... ✨',
      subtitulo: 'A Lumi está organizando uma ideia divertida para você!',
      corBorda: 'border-indigo-400',
      corGradiente: 'from-amber-400 via-purple-500 to-indigo-600',
      corAura: 'bg-indigo-400/30',
      icone: '🧠',
      ondaCor: 'bg-purple-400',
      ondaAtiva: true,
    },
    falando: {
      titulo: 'Lumi está falando... 🔊',
      subtitulo: 'Preste atenção ou fale a qualquer momento se tiver uma dúvida!',
      corBorda: 'border-amber-400',
      corGradiente: 'from-amber-400 via-orange-500 to-amber-600',
      corAura: 'bg-amber-400/30',
      icone: '🗣️',
      ondaCor: 'bg-amber-400',
      ondaAtiva: true,
    },
    ocioso: {
      titulo: 'Pronta para conversar! ✨',
      subtitulo: 'Toque no microfone abaixo para começarmos a falar',
      corBorda: 'border-amber-200',
      corGradiente: 'from-amber-400 to-orange-400',
      corAura: 'bg-amber-300/20',
      icone: '✨',
      ondaCor: 'bg-amber-300',
      ondaAtiva: false,
    },
  }[estado]

  return (
    <div className="relative flex flex-col items-center justify-between p-5 sm:p-7 bg-gradient-to-b from-amber-500/10 via-white to-orange-500/5 rounded-3xl border-2 border-amber-200/80 shadow-soft overflow-hidden min-h-[460px]">
      {/* Barra superior de controles Lumi Live */}
      <div className="w-full flex items-center justify-between gap-2 z-10 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Lumi Live • Tempo Real
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

        <div className="flex items-center gap-2">
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

      {/* Centro: Orbe Animada com Ondas Reativas */}
      <div className="relative my-6 flex flex-col items-center justify-center">
        {/* Aura pulsante de fundo */}
        <div
          className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full ${configEstado.corAura} blur-2xl transition-all duration-700 ${
            estado === 'falando' || estado === 'ouvindo' ? 'scale-125 animate-pulse' : 'scale-100'
          }`}
        />

        {/* Anéis concêntricos de onda sonora */}
        {configEstado.ondaAtiva && (
          <>
            <div
              className={`absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 ${configEstado.corBorda} opacity-40 animate-ping`}
              style={{ animationDuration: estado === 'ouvindo' ? '1.5s' : '2s' }}
            />
            <div
              className={`absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-amber-300/60 opacity-60 animate-pulse`}
            />
          </>
        )}

        {/* A ORBE PRINCIPAL */}
        <div
          className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr ${configEstado.corGradiente} p-1 shadow-2xl flex items-center justify-center transition-all duration-500 transform ${
            estado === 'falando'
              ? 'scale-110 shadow-amber-500/50'
              : estado === 'ouvindo'
                ? 'scale-105 shadow-rose-500/50'
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

            {/* Ondas sonoras verticais reativas (equalizador) */}
            <div className="flex items-center gap-1.5 mt-2 h-5">
              {[0.4, 0.9, 0.6, 1, 0.7, 0.5].map((alt, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full ${configEstado.ondaCor} transition-all duration-200 ${
                    configEstado.ondaAtiva ? 'animate-pulse' : 'h-1.5 opacity-30'
                  }`}
                  style={{
                    height: configEstado.ondaAtiva
                      ? `${Math.max(6, Math.round(alt * (estado === 'falando' ? 20 : 14)))}px`
                      : '4px',
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
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
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-amber-200/90 shadow-xs mb-4 min-h-[90px] flex flex-col justify-center text-center">
        {estado === 'ouvindo' && (
          <div>
            <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider">
              Você está dizendo:
            </span>
            <p className="text-base sm:text-xl font-extrabold text-slate-900 mt-1 italic leading-snug">
              {legendaOuvindo ? `"${legendaOuvindo}"` : 'Fale agora com a Lumi... 🎙️'}
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
              Preparando analogias com seus assuntos favoritos!
            </p>
          </div>
        )}

        {estado === 'falando' && (
          <div>
            <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider flex items-center justify-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              Lumi explicando:
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {legendaFalando || '...'}
            </p>
          </div>
        )}

        {estado === 'ocioso' && (
          <div>
            <p className="text-xs sm:text-sm text-slate-500">
              💡 Dica de ouro: se você falar enquanto a Lumi estiver explicando, ela para na hora
              (barge-in) para te ouvir!
            </p>
          </div>
        )}
      </div>

      {/* Barra de Ações Rápidas da Orbe (Interrupção + Falar Agora) */}
      <div className="w-full flex items-center justify-center gap-3 flex-wrap z-10">
        {/* Botão de Barge-in Instantâneo (Interromper Lumi) */}
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

        {/* Botão de Falar Agora / Pausar Microfone */}
        <button
          type="button"
          onClick={onFalarAgora}
          title={
            !isSupported
              ? 'Navegador sem suporte a Web Speech API'
              : permissionDenied
                ? 'Clique para solicitar permissão do microfone'
                : isListening
                  ? 'Concluir minha fala agora'
                  : 'Falar com a Lumi'
          }
          className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ${
            !isSupported
              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
              : permissionDenied
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 ring-4 ring-amber-200'
                : isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-4 ring-rose-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
          }`}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
          <span>
            {!isSupported
              ? 'Microfone não suportado'
              : permissionDenied
                ? 'Liberar Microfone 🎤'
                : isListening
                  ? 'Concluir minha fala ✓'
                  : 'Falar com a Lumi 🎤'}
          </span>
        </button>
      </div>

      {/* Alerta de permissão ou erro dentro do Orbe Live */}
      {permissionDenied && (
        <div className="w-full mt-3 p-3 bg-amber-100/90 border border-amber-300 rounded-xl text-center text-xs text-amber-900 font-bold z-10 animate-fade-in-up">
          <span>
            ⚠️ <strong>Atenção aos pais/responsáveis:</strong> Precisamos da permissão do microfone
            para a criança falar com a Lumi. Clique no ícone de cadeado na barra de endereços do
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
