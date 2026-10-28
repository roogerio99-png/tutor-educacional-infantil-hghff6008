/**
 * Gerenciador do Service Worker e fluxo de atualização do PWA
 */

export interface SWRegistrationCallbacks {
  onUpdateAvailable?: (reload: () => void) => void
  onSuccess?: () => void
}

export function registerServiceWorker(callbacks?: SWRegistrationCallbacks) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    // Registra o sw.js com escopo raiz
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Verifica se há uma atualização aguardando
        if (registration.waiting) {
          notifyUpdate(registration, callbacks)
          return
        }

        // Detecta quando um novo service worker foi encontrado
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nova versão pronta para assumir
                notifyUpdate(registration, callbacks)
              } else {
                // Conteúdo em cache para uso offline
                callbacks?.onSuccess?.()
              }
            }
          })
        })
      })
      .catch((error) => {
        // Falhas normais em ambientes sem HTTPS ou iframes restritos
        console.warn('[PWA] Falha ao registrar Service Worker:', error)
      })

    // Ao mudar o controller (skipWaiting), recarrega se o usuário aceitou
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      // Opcional: auto-recarregar se desejado
    })
  })
}

function notifyUpdate(
  registration: ServiceWorkerRegistration,
  callbacks?: SWRegistrationCallbacks,
) {
  const reload = () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (callbacks?.onUpdateAvailable) {
    callbacks.onUpdateAvailable(reload)
  }
}
