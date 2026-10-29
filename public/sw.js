/**
 * Service Worker do Aprendiz — Tutor Educacional
 * Estratégia de cache e funcionamento offline:
 * - Precache do app shell (HTML offline, manifest, ícones)
 * - Cache-first para assets estáticos estritos (/assets/, imagens, fontes) com background update
 * - Network-first com fallback para index.html/offline.html em requisições de navegação
 * - Não intercepta requisições de API PocketBase (/api/) nem WebSockets
 */

const CACHE_NAME = 'lumi-pwa-v2'
const OFFLINE_URL = '/offline.html'

const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable-192.svg',
  '/icon-maskable-512.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL)
      })
      .then(() => {
        // Ativa imediatamente sem aguardar abas antigas fecharem
        return self.skipWaiting()
      }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
            return null
          }),
        )
      }),
      // Assume o controle de todos os clientes abertos
      self.clients.claim(),
    ]),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Não intercepta chamadas não-GET
  if (request.method !== 'GET') {
    return
  }

  // Não intercepta chamadas à API (/api/, /backend/), módulos de dev do Vite nem WebSockets
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/backend/') ||
    url.pathname.startsWith('/_/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.protocol.startsWith('ws')
  ) {
    return
  }

  // Estratégia 1: Requisições de Navegação (HTML) -> Network-first com fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Atualiza o cache do index.html se vier com status 200
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(async () => {
          // Tenta carregar do cache a página navegada
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Tenta o index.html em cache (SPA)
          const spaIndex = await caches.match('/')
          if (spaIndex) {
            return spaIndex
          }
          // Fallback final: tela amigável offline
          const offlinePage = await caches.match(OFFLINE_URL)
          if (offlinePage) {
            return offlinePage
          }
          return new Response('Sem conexão à internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }),
    )
    return
  }

  // Estratégia 2: Assets estáticos e imagens do app -> Stale-while-revalidate / Cache-first
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff'))

  // Fontes do Google Fonts
  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'

  if (isStaticAsset || isGoogleFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return networkResponse
          })
          .catch(() => {
            // Em caso de falha de rede para static asset, nada a fazer além do cache
            return null
          })

        // Retorna do cache se existir; se não, aguarda a rede
        return (
          cachedResponse ||
          fetchPromise.then((res) => {
            if (res) return res
            return new Response('', { status: 408, statusText: 'Request Timeout' })
          })
        )
      }),
    )
    return
  }

  // Outras requisições: tenta a rede normalmente
})
