/**
 * Lumi IA — Universal Partner SDK & Custom Web Component (v2.1)
 * Permite instalar e incorporar a Lumi IA dentro de qualquer outro aplicativo web,
 * portal escolar, LMS (Moodle, Canvas, Google Classroom) ou WebView mobile (Android/iOS).
 *
 * Modos de uso:
 * 1) Botão/Orbe Flutuante em 1 linha:
 *    <script src="https://SEU_DOMINIO/lumi-sdk.js" data-child-name="Lucas" data-child-age="9" data-mode="floating"></script>
 *
 * 2) Web Component Nativo em qualquer HTML/React/Vue:
 *    <lumi-ia-app child-name="Sofia" child-age="10" mode="tutor_socratico" voice="Kore" height="620px"></lumi-ia-app>
 *
 * 3) API Programática JavaScript:
 *    window.LumiSDK.mount({ container: '#meu-container', childName: 'Pedro', childAge: 8 });
 */
(function () {
  if (window.__LUMI_SDK_LOADED__) return;
  window.__LUMI_SDK_LOADED__ = true;

  function detectBaseUrl() {
    try {
      var currentScript = document.currentScript;
      if (currentScript && currentScript.src) {
        var url = new URL(currentScript.src);
        return url.origin;
      }
      var scripts = document.querySelectorAll('script[src*="lumi-sdk"]');
      if (scripts.length > 0) {
        return new URL(scripts[0].src).origin;
      }
    } catch (_e) {
      // fallback
    }
    return window.location.origin;
  }

  var BASE_URL = detectBaseUrl();

  function buildEmbedUrl(options) {
    var opts = options || {};
    var params = new URLSearchParams();
    if (opts.childName) params.set('nome', String(opts.childName));
    if (opts.childAge) params.set('idade', String(opts.childAge));
    if (opts.grade) params.set('serie', String(opts.grade));
    if (opts.mode && opts.mode !== 'floating') params.set('modo', String(opts.mode));
    if (opts.voice) params.set('voz', String(opts.voice));
    if (opts.question) params.set('pergunta', String(opts.question));
    params.set('embedded', '1');
    return BASE_URL + '/embed?' + params.toString();
  }

  function createIframe(options) {
    var iframe = document.createElement('iframe');
    iframe.src = buildEmbedUrl(options);
    iframe.title = 'Lumi IA — Tutora Educacional';
    iframe.setAttribute(
      'allow',
      'microphone *; autoplay *; clipboard-write *; speaker-selection *; fullscreen *'
    );
    iframe.style.width = (options && options.width) || '100%';
    iframe.style.height = (options && options.height) || '100%';
    iframe.style.border = '0';
    iframe.style.borderRadius = (options && options.borderRadius) || '24px';
    iframe.style.background = '#FFF8F0';
    iframe.style.display = 'block';
    return iframe;
  }

  // 1. Define <lumi-ia-app> Custom Web Component
  if (typeof window !== 'undefined' && 'customElements' in window && !customElements.get('lumi-ia-app')) {
    class LumiIAAppElement extends HTMLElement {
      connectedCallback() {
        var childName = this.getAttribute('child-name') || this.getAttribute('nome') || 'Explorador(a)';
        var childAge = this.getAttribute('child-age') || this.getAttribute('idade') || '9';
        var grade = this.getAttribute('grade') || this.getAttribute('serie') || '4º Ano';
        var mode = this.getAttribute('mode') || this.getAttribute('modo') || 'tutor_socratico';
        var voice = this.getAttribute('voice') || this.getAttribute('voz') || 'Kore';
        var height = this.getAttribute('height') || '640px';

        this.style.display = 'block';
        this.style.width = '100%';
        this.innerHTML = '';

        var iframe = createIframe({
          childName: childName,
          childAge: childAge,
          grade: grade,
          mode: mode,
          voice: voice,
          height: height,
          borderRadius: '24px',
        });
        iframe.style.boxShadow = '0 14px 36px rgba(74, 59, 50, 0.14)';
        iframe.style.border = '1px solid #EADBCE';
        this.appendChild(iframe);
      }
    }
    customElements.define('lumi-ia-app', LumiIAAppElement);
  }

  // 2. Floating Widget Injector for Third-Party Host Apps
  function mountFloatingWidget(options) {
    if (document.getElementById('lumi-ia-floating-root')) return;

    var root = document.createElement('div');
    root.id = 'lumi-ia-floating-root';
    root.style.position = 'fixed';
    root.style.right = 'max(16px, env(safe-area-inset-right, 16px))';
    root.style.bottom = 'max(16px, env(safe-area-inset-bottom, 16px))';
    root.style.zIndex = '2147483000';
    root.style.fontFamily = "'Nunito', system-ui, -apple-system, sans-serif";

    var panel = document.createElement('div');
    panel.style.display = 'none';
    panel.style.width = 'min(410px, calc(100vw - 24px))';
    panel.style.height = 'min(650px, calc(100dvh - 96px))';
    panel.style.marginBottom = '12px';
    panel.style.borderRadius = '24px';
    panel.style.overflow = 'hidden';
    panel.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.28)';
    panel.style.border = '2px solid #F28C28';
    panel.style.background = '#FFF8F0';

    var iframe = createIframe({
      childName: options.childName,
      childAge: options.childAge,
      grade: options.grade,
      mode: options.pedagogicalMode || 'tutor_socratico',
      voice: options.voice || 'Kore',
      height: '100%',
      borderRadius: '0px',
    });
    panel.appendChild(iframe);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Abrir Lumi IA');
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '10px';
    btn.style.marginLeft = 'auto';
    btn.style.padding = '12px 18px';
    btn.style.borderRadius = '999px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.background = 'linear-gradient(135deg, #FF9E43 0%, #F28C28 60%, #D95C08 100%)';
    btn.style.color = '#FFFFFF';
    btn.style.fontWeight = '800';
    btn.style.fontSize = '14px';
    btn.style.boxShadow = '0 10px 28px rgba(242, 140, 40, 0.4)';
    btn.innerHTML = '<span style="font-size:18px">✨</span><span>Estudar com Lumi IA</span>';

    var isOpen = false;
    btn.addEventListener('click', function () {
      isOpen = !isOpen;
      panel.style.display = isOpen ? 'block' : 'none';
      btn.innerHTML = isOpen
        ? '<span style="font-size:16px">✕</span><span>Fechar Lumi</span>'
        : '<span style="font-size:18px">✨</span><span>Estudar com Lumi IA</span>';
    });

    root.appendChild(panel);
    root.appendChild(btn);
    document.body.appendChild(root);
  }

  // 3. Expose Global Programmatic API
  window.LumiSDK = {
    version: '2.1.0',
    baseUrl: BASE_URL,
    buildEmbedUrl: buildEmbedUrl,
    mount: function (options) {
      var opts = options || {};
      if (opts.floating) {
        mountFloatingWidget(opts);
        return;
      }
      var target =
        typeof opts.container === 'string'
          ? document.querySelector(opts.container)
          : opts.container;
      if (!target) {
        console.warn('[LumiSDK] Container não encontrado:', opts.container);
        return;
      }
      target.innerHTML = '';
      target.appendChild(createIframe(opts));
    },
    mountFloatingWidget: mountFloatingWidget,
  };

  // Auto-init if script tag has data-mode="floating"
  var activeScript = document.currentScript;
  if (activeScript && activeScript.getAttribute('data-mode') === 'floating') {
    var autoOpts = {
      childName: activeScript.getAttribute('data-child-name') || 'Explorador(a)',
      childAge: activeScript.getAttribute('data-child-age') || '9',
      grade: activeScript.getAttribute('data-grade') || '4º Ano',
      pedagogicalMode: activeScript.getAttribute('data-pedagogical-mode') || 'tutor_socratico',
      voice: activeScript.getAttribute('data-voice') || 'Kore',
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        mountFloatingWidget(autoOpts);
      });
    } else {
      mountFloatingWidget(autoOpts);
    }
  }
})();
