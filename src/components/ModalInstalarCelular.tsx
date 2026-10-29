import React, { useState } from 'react'
import { Check, Copy, Download, Rocket, Share2, Smartphone, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { usePWAInstall } from '@/lib/pwa'

interface ModalInstalarCelularProps {
  aberto: boolean
  onFechar: () => void
}

export const ModalInstalarCelular: React.FC<ModalInstalarCelularProps> = ({ aberto, onFechar }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [aba, setAba] = useState<'publicar' | 'android' | 'iphone'>(isIOS ? 'iphone' : 'publicar')
  const [copiado, setCopiado] = useState(false)

  if (!aberto) return null

  const urlAtual =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-d2xq5edyzyfzqra4x4nps2-567753823186.us-east1.run.app'

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(urlAtual)}`

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlAtual)
      setCopiado(true)
      toast.success('Link copiado! Envie pelo WhatsApp ou abra no navegador do celular.')
      setTimeout(() => setCopiado(false), 3000)
    } catch {
      toast.error('Não foi possível copiar automaticamente.')
    }
  }

  const handleInstalarDireto = async () => {
    const ok = await install()
    if (ok) {
      toast.success('Aplicativo Lumi IA instalado na tela inicial do seu aparelho!')
      onFechar()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#EADBCE] shadow-2xl overflow-hidden my-auto">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-[#FF9E43] via-[#F28C28] to-[#D95C08] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold leading-tight flex items-center gap-1.5">
                <span>Aplicativo no Celular</span>
                <Sparkles className="w-4 h-4 text-amber-100" />
              </h2>
              <p className="text-xs text-amber-50 font-medium">
                Instale a Lumi IA na tela inicial (Android & iPhone)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Botão de instalação em 1 clique caso o navegador atual suporte beforeinstallprompt */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-emerald-950">
                  Seu aparelho permite instalação direta!
                </p>
                <p className="text-xs text-emerald-800">
                  Toque abaixo para criar o ícone do app Lumi IA na sua tela inicial agora.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInstalarDireto}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora (1 Clique)</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>A Lumi IA já está rodando como Aplicativo Instalado neste dispositivo!</span>
            </div>
          )}

          {/* Seletor de Abas */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F6EDE3] rounded-2xl">
            <button
              type="button"
              onClick={() => setAba('publicar')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                aba === 'publicar'
                  ? 'bg-white text-[#4A3B32] shadow-xs'
                  : 'text-[#8A796C] hover:text-[#4A3B32]'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>1. Link Público</span>
            </button>
            <button
              type="button"
              onClick={() => setAba('android')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                aba === 'android'
                  ? 'bg-white text-[#4A3B32] shadow-xs'
                  : 'text-[#8A796C] hover:text-[#4A3B32]'
              }`}
            >
              <span>🤖</span>
              <span>2. Android</span>
            </button>
            <button
              type="button"
              onClick={() => setAba('iphone')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                aba === 'iphone'
                  ? 'bg-white text-[#4A3B32] shadow-xs'
                  : 'text-[#8A796C] hover:text-[#4A3B32]'
              }`}
            >
              <span>🍎</span>
              <span>3. iPhone</span>
            </button>
          </div>

          {/* Conteúdo de cada aba */}
          {aba === 'publicar' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2">
                <p className="font-extrabold text-sm flex items-center gap-1.5 text-[#4A3B32]">
                  <Rocket className="w-4 h-4 text-[#F28C28]" />
                  <span>Como liberar acesso direto no celular (Sem o Editor):</span>
                </p>
                <p className="leading-relaxed">
                  Enquanto você está editando aqui no <strong>Google AI Studio</strong>, o link de
                  teste fica protegido pela sua conta Google. Para criar o{' '}
                  <strong>link público definitivo</strong> que abre direto em qualquer celular:
                </p>
                <ol className="space-y-2 pt-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Olhe para o <strong>canto superior direito</strong> da tela do Google AI
                      Studio (acima do painel Preview).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Clique no botão <strong>&quot;Deploy&quot;</strong> (ícone de foguete/nuvem{' '}
                      <strong>Cloud Run</strong>) ou em <strong>&quot;Share&quot;</strong>{' '}
                      (Compartilhar) e marque <em>Public</em>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Pronto! O Google gera um endereço público 24h no ar. Abra esse endereço no
                      celular e instale o ícone seguindo a aba <strong>Android</strong> ou{' '}
                      <strong>iPhone</strong> acima.
                    </span>
                  </li>
                </ol>
              </div>

              {/* QR Code e Copiar Link */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-2xl border border-[#EADBCE] shadow-xs shrink-0">
                  <img
                    src={qrUrl}
                    alt="QR Code de acesso"
                    className="w-28 h-28 object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-[#4A3B32]">
                    Já está logado na mesma conta Google no celular?
                  </p>
                  <p className="text-[11px] text-[#8A796C] leading-relaxed">
                    Aponte a câmera do celular para o QR Code ao lado ou copie o link abaixo para
                    abrir no navegador do celular:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopiarLink}
                    className="w-full py-2 px-3 rounded-xl bg-[#F28C28] hover:bg-[#D97A1A] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link do Aplicativo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {aba === 'android' && (
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] space-y-3">
              <h3 className="text-sm font-extrabold text-[#4A3B32] flex items-center gap-2">
                <span>🤖</span>
                <span>Como transformar em Aplicativo no Android (Chrome)</span>
              </h3>
              <p className="text-xs text-[#8A796C]">
                A Lumi IA já possui tecnologia <strong>PWA (Progressive Web App)</strong>. Não
                precisa baixar na Play Store:
              </p>
              <ol className="space-y-2.5 text-xs text-[#4A3B32]">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Abra o link do aplicativo no navegador <strong>Google Chrome</strong> do seu
                    celular Android.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Toque em <strong>&quot;Instalar aplicativo&quot;</strong> (ou{' '}
                    <strong>&quot;Adicionar à tela inicial&quot;</strong>) e confirme em{' '}
                    <strong>Instalar</strong>.
                  </span>
                </li>
              </ol>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] text-amber-950 font-semibold">
                ✨ O ícone laranja da <strong>Lumi IA</strong> ficará salvo junto com seus outros
                aplicativos e abrirá em <strong>tela cheia</strong> (sem barra de navegador)!
              </div>
            </div>
          )}

          {aba === 'iphone' && (
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] space-y-3">
              <h3 className="text-sm font-extrabold text-[#4A3B32] flex items-center gap-2">
                <span>🍎</span>
                <span>Como transformar em Aplicativo no iPhone / iPad (Safari)</span>
              </h3>
              <p className="text-xs text-[#8A796C]">
                No iOS, o Safari instala a Lumi IA direto na tela de início com ícone exclusivo:
              </p>
              <ol className="space-y-2.5 text-xs text-[#4A3B32]">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Abra o link do aplicativo no navegador <strong>Safari</strong> do iPhone.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="flex items-center gap-1 flex-wrap">
                    Toque no botão <strong>Compartilhar</strong>{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-[#F28C28]" /> (quadrado com seta para
                    cima na barra inferior).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Role a lista para baixo e toque em{' '}
                    <strong>&quot;Adicionar à Tela de Início&quot;</strong> ➔ depois em{' '}
                    <strong>Adicionar</strong>.
                  </span>
                </li>
              </ol>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] text-amber-950 font-semibold">
                ✨ O aplicativo <strong>Lumi IA</strong> aparecerá na tela inicial do iPhone e
                abrirá como um app nativo em tela cheia!
              </div>
            </div>
          )}

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onFechar}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
