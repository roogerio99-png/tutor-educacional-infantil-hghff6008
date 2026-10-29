/**
 * Gerenciador do Service Worker, captura global do evento `beforeinstallprompt`
 * e fluxo de instalação/atualização do PWA para celular (Android e iOS).
 */
import { useEffect, useState } from 'react'

export interface SWRegistrationCallbacks {
  onUpdateAvailable?: (reload: () => void) => void
  onSuccess?: () => void
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    globalDeferredPrompt = e as BeforeInstallPromptEvent
    promptListeners.forEach((cb) => cb(globalDeferredPrompt))
  })

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null
    promptListeners.forEach((cb) => cb(null))
  })
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    globalDeferredPrompt,
  )
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
    setIsInstalled(isStandalone)

    const userAgent = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(userAgent))

    const listener = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt)
      if (!prompt) {
        const nowStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
        if (nowStandalone) setIsInstalled(true)
      }
    }

    promptListeners.add(listener)
    return () => {
      promptListeners.delete(listener)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || globalDeferredPrompt
    if (!promptEvent) return false
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      globalDeferredPrompt = null
      setDeferredPrompt(null)
      setIsInstalled(true)
      return true
    }
    return false
  }

  return {
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    install,
  }
}

export function registerServiceWorker(callbacks?: SWRegistrationCallbacks) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (registration.waiting) {
          notifyUpdate(registration, callbacks)
          return
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                notifyUpdate(registration, callbacks)
              } else {
                callbacks?.onSuccess?.()
              }
            }
          })
        })
      })
      .catch((error) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', error)
      })

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
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
