import React, { useState } from 'react'
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Rocket,
  Share2,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePWAInstall } from '@/lib/pwa'

interface ModalInstalarCelularProps {
  aberto: boolean
  onFechar: () => void
}

export const ModalInstalarCelular: React.FC<ModalInstalarCelularProps> = ({ aberto, onFechar }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [aba, setAba] = useState<'publicar' | 'android' | 'iphone' | 'integrar'>(
    isIOS ? 'iphone' : 'integrar',
  )
  const [copiado, setCopiado] = useState<string | null>(null)

  if (!aberto) return null

  const urlAtual =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-d2xq5edyzyfzqra4x4nps2-567753823186.us-east1.run.app'

  const embedUrl = `${urlAtual}/embed?nome=Explorador&idade=9&modo=tutor_socratico`
  const sdkUrl = `${urlAtual}/lumi-sdk.js`

  const codigoSdkFlutuante = `<script src="${sdkUrl}" data-mode="floating" data-child-name="Aluno" data-child-age="9" defer></script>`
  const codigoWebComponent = `<script src="${sdkUrl}" defer></script>\n<lumi-ia-app child-name="Aluno" child-age="9" mode="tutor_socratico" height="640px"></lumi-ia-app>`
  const codigoIframeUniversal = `<iframe src="${embedUrl}" width="100%" height="640" style="border:0;border-radius:24px;" allow="microphone *; autoplay *; clipboard-write *; fullscreen *"></iframe>`

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(urlAtual)}`

  const copiarTexto = async (chave: string, texto: string, mensagem: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(chave)
      toast.success(mensagem)
      setTimeout(() => setCopiado(null), 3000)
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
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center safe-area-modal overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#EADBCE] shadow-2xl overflow-hidden my-auto">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-[#FF9E43] via-[#F28C28] to-[#D95C08] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold leading-tight flex items-center gap-1.5">
                <span>Central de Instalação & Terceiros</span>
                <Sparkles className="w-4 h-4 text-amber-100" />
              </h2>
              <p className="text-xs text-amber-50 font-medium">
                App Instalável (PWA) + Mini-App & SDK para Outros Aplicativos
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

        <div className="p-5 space-y-4 max-h-[80dvh] overflow-y-auto">
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

          {/* Seletor de 4 Abas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#F6EDE3] rounded-2xl">
            <button
              type="button"
              onClick={() => setAba('integrar')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                aba === 'integrar'
                  ? 'bg-white text-[#4A3B32] shadow-xs'
                  : 'text-[#8A796C] hover:text-[#4A3B32]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>1. Outros Apps</span>
            </button>
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
              <span>2. Terceiros</span>
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
              <span>3. Android</span>
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
              <span>4. iPhone</span>
            </button>
          </div>

          {/* ABA 1: INSTALAR DENTRO DE OUTROS APLICATIVOS (SDK / WEB COMPONENT / MINI-APP / SHARE TARGET) */}
          {aba === 'integrar' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-extrabold text-sm flex items-center gap-1.5 text-indigo-950">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>Instalar a Lumi IA dentro de Outros Aplicativos</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleTestarMiniAppInterno}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] inline-flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Abrir Mini-App (/embed) Aqui</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="leading-relaxed text-indigo-900">
                  A Lumi IA agora possui um <strong>Mini-App Autônomo (`/embed`)</strong> e um{' '}
                  <strong>SDK Universal (`/lumi-sdk.js`)</strong> prontos para instalar dentro de
                  qualquer outro aplicativo (Moodle, Google Classroom, portais escolares, sites ou
                  WebViews React Native / Flutter):
                </p>
              </div>

              {/* Opção A: Botão Flutuante em 1 Linha */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#4A3B32]">
                    A) Botão Flutuante (1 linha de código em qualquer App/Site):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copiarTexto(
                        'sdk',
                        codigoSdkFlutuante,
                        'Script do Botão Flutuante copiado!',
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F28C28] hover:bg-[#D97A1A] text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiado === 'sdk' ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar SDK</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-amber-300 text-[11px] overflow-x-auto font-mono">
                  {codigoSdkFlutuante}
                </pre>
              </div>

              {/* Opção B: Web Component Nativo <lumi-ia-app> */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#4A3B32]">
                    B) Web Component Nativo (&lt;lumi-ia-app&gt;):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copiarTexto(
                        'webcomponent',
                        codigoWebComponent,
                        'Código do Web Component copiado!',
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F28C28] hover:bg-[#D97A1A] text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiado === 'webcomponent' ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Tag</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 text-[11px] overflow-x-auto font-mono">
                  {codigoWebComponent}
                </pre>
              </div>

              {/* Opção C: Iframe / WebView Mobile (React Native, Flutter, Android, iOS, LMS) */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EADBCE] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#4A3B32]">
                    C) Iframe / WebView com Microfone e Voz liberados:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copiarTexto('iframe', codigoIframeUniversal, 'Código Iframe copiado!')
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F28C28] hover:bg-[#D97A1A] text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiado === 'iframe' ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Iframe</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-sky-300 text-[11px] overflow-x-auto font-mono">
                  {codigoIframeUniversal}
                </pre>
              </div>
            </div>
          )}

          {/* ABA 2: O QUE PRECISA PARA ABRIR A TERCEIROS (DEPLOY PÚBLICO) */}
          {aba === 'publicar' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2">
                <p className="font-extrabold text-sm flex items-center gap-1.5 text-[#4A3B32]">
                  <Rocket className="w-4 h-4 text-[#F28C28]" />
                  <span>Checklist para liberar acesso a Terceiros (24h no ar):</span>
                </p>
                <p className="leading-relaxed">
                  O código do aplicativo já está <strong>100% preparado para terceiros</strong> (com
                  CORS aberto, cadastro próprio de famílias, proteção de chave Gemini no backend e
                  rota `/embed`). Para qualquer pessoa acessar sem login do AI Studio:
                </p>
                <ol className="space-y-2 pt-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      No topo direito do Google AI Studio, clique em{' '}
                      <strong>&quot;Deploy&quot; (Cloud Run)</strong> ou{' '}
                      <strong>&quot;Share&quot; ➔ Public</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Cada família ou escola pode criar sua própria conta em{' '}
                      <strong>/cadastro</strong> (com Cadeia LGPD + PIN Parental + Senha Infantil).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F28C28] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Para empacotar na <strong>Google Play Store / App Store</strong>, basta usar a
                      URL pública no <strong>PWABuilder.com</strong> (o manifesto já possui{' '}
                      <code>share_target</code> e <code>maskable icons</code>).
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
                    Compartilhar Aplicativo ou Mini-App com Terceiros:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        copiarTexto(
                          'link-app',
                          urlAtual,
                          'Link principal copiado! Envie pelo WhatsApp.',
                        )
                      }
                      className="w-full py-2 px-3 rounded-xl bg-[#F28C28] hover:bg-[#D97A1A] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      {copiado === 'link-app' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Link Principal Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link do App Completo</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copiarTexto(
                          'link-embed',
                          embedUrl,
                          'Link do Mini-App (/embed) copiado! Pronto para uso direto sem login.',
                        )
                      }
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      {copiado === 'link-embed' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Link Mini-App Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link Direto (/embed sem login)</span>
                        </>
                      )}
                    </button>
                  </div>
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
                A Lumi IA possui tecnologia <strong>PWA + Web Share Target</strong> (também aparece
                no menu &quot;Compartilhar&quot; de outros apps no Android):
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
                    Toque em <strong>&quot;Instalar aplicativo&quot;</strong> e confirme em{' '}
                    <strong>Instalar</strong>.
                  </span>
                </li>
              </ol>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] text-amber-950 font-semibold">
                ✨ Após instalado, quando você selecionar um texto em <strong>outro app</strong> do
                celular e tocar em <strong>Compartilhar</strong>, a <strong>Lumi IA</strong>{' '}
                aparecerá na lista para explicar aquela tarefa na hora!
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
                No iOS, o Safari instala a Lumi IA direto na tela de início com ícone exclusivo e
                Safe Area completa para a Dynamic Island:
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

