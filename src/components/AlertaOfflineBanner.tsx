import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export const AlertaOfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div className="bg-[#FFF0E0] border-b border-[#F2A93B]/40 px-4 py-2.5 text-[#4A3B32] text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 sticky top-0 z-50 shadow-sm animate-fade-in-up">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-[#F28C28]/20 text-[#D95C08] flex items-center justify-center flex-shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
        </div>
        <span>
          <strong>Você está offline.</strong> Recursos online e conversa com Lumi precisam de rede.
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 text-[#D95C08] hover:text-[#9C4304] underline text-xs font-bold flex-shrink-0 cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Reconectar</span>
      </button>
    </div>
  )
}
