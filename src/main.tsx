/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { registerServiceWorker } from './lib/pwa.ts'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

// Oculta splash screen inicial do HTML assim que o React monta
const splashElement = document.getElementById('pwa-splash')
if (splashElement) {
  setTimeout(() => {
    splashElement.classList.add('hidden')
    setTimeout(() => {
      splashElement.remove()
    }, 400)
  }, 250)
}

// Registra Service Worker PWA com update flow gracioso
registerServiceWorker({
  onUpdateAvailable: (reload) => {
    // Se preferir recarregar no background ou na próxima visita
    console.info('[PWA] Nova versão disponível. O app será atualizado na próxima inicialização.')
    // Opcional: dispara evento para UI se necessário
    window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: { reload } }))
  },
  onSuccess: () => {
    console.info('[PWA] Conteúdo em cache para uso offline.')
  },
})
