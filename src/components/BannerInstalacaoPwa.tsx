import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export const BannerInstalacaoPwa: React.FC<{
  updateAvailable?: boolean
  onReloadUpdate?: () => void
}> = ({ updateAvailable = false, onReloadUpdate }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // Detecta se já está instalado/standalone
    const standaloneMatch =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone))
    setIsStandalone(standaloneMatch)

    // Detecta iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    // Se já estiver standalone, não precisa de prompt de instalação
    if (standaloneMatch) return

    // Verifica se usuário dispensou nos últimos 3 dias
    const dismissedUntil = localStorage.getItem('pwa_banner_dismissed_until')
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return
    }

    // Android/Chrome/Edge beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Em iOS Safari sem standalone, exibe o aviso sutil após alguns segundos se não dispensado
    if (isIosDevice && !standaloneMatch) {
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 4000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } else if (isIos) {
      setShowIosGuide(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIosGuide(false)
    // Silencia por 3 dias
    localStorage.setItem('pwa_banner_dismissed_until', String(Date.now() + 3 * 24 * 60 * 60 * 1000))
  }

  // Notificação de atualização disponível (quando o SW acha versão mais nova)
  if (updateAvailable && onReloadUpdate) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-md border border-[#EADBCE] shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3 text-[#4A3B32]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F28C28]/15 text-[#F28C28] flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#4A3B32] truncate">Nova versão do Aprendiz!</p>
              <p className="text-xs text-[#9C8B7D] truncate">Recarregue para ver melhorias.</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onReloadUpdate}
            className="bg-[#F28C28] hover:bg-[#E06A10] text-white font-bold rounded-xl text-xs px-3 py-1.5 flex-shrink-0 shadow-sm"
          >
            Atualizar
          </Button>
        </div>
      </div>
    )
  }

  // Se já está standalone ou não há banner a mostrar, oculta
  if (isStandalone || !showBanner) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-md border border-[#EADBCE] shadow-2xl rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[#4A3B32]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF9E43] to-[#F28C28] p-1.5 flex items-center justify-center flex-shrink-0 shadow-md">
              <img src="/favicon.svg" alt="Aprendiz" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#4A3B32]">Instalar Aprendiz</span>
                <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              </div>
              <p className="text-xs text-[#9C8B7D] truncate">
                Acesso rápido e tela cheia no celular
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-[#F28C28] hover:bg-[#E06A10] text-white font-bold rounded-xl text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </Button>
            <button
              onClick={handleDismiss}
              aria-label="Fechar"
              className="text-[#9C8B7D] hover:text-[#4A3B32] p-1.5 rounded-lg hover:bg-black/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Guia de instrução para iPhone/Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-[#EADBCE] shadow-2xl animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF9E43] to-[#F28C28] p-2 mx-auto mb-3 shadow-md flex items-center justify-center">
              <img src="/favicon.svg" alt="Aprendiz" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-lg font-extrabold text-[#4A3B32]">Como instalar no iPhone</h3>
            <p className="text-xs text-[#9C8B7D] mt-1 mb-4">
              O Safari adiciona o Aprendiz à tela de início em 2 toques:
            </p>

            <ol className="text-left text-xs text-[#4A3B32] space-y-2.5 bg-[#FFF8F0] p-3.5 rounded-2xl border border-[#FBEFE0] mb-5">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para
                  cima) na barra do Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Confirme em <strong>Adicionar</strong> no canto superior direito.
                </span>
              </li>
            </ol>

            <Button
              onClick={() => setShowIosGuide(false)}
              className="w-full bg-[#F28C28] hover:bg-[#E06A10] text-white font-bold rounded-xl py-2"
            >
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
