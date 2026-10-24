// Utilidades para limpeza de texto antes de síntese de voz (TTS)
// Remove cartões técnicos, markdown, emojis em excesso ou metadados da Lumi

export function limparTextoParaVoz(texto: string): string {
  if (!texto) return ''

  let limpo = texto

  // Remove blocos de código markdown ```...```
  limpo = limpo.replace(/```[\s\S]*?```/g, '')

  // Remove código inline `...`
  limpo = limpo.replace(/`([^`]+)`/g, '$1')

  // Remove tags markdown de cabeçalhos (# Titulo), negritos (**texto** ou *texto*)
  limpo = limpo.replace(/#{1,6}\s+/g, '')
  limpo = limpo.replace(/\*\*([^*]+)\*\*/g, '$1')
  limpo = limpo.replace(/\*([^*]+)\*/g, '$1')
  limpo = limpo.replace(/__([^_]+)__/g, '$1')
  limpo = limpo.replace(/_([^_]+)_/g, '$1')
  limpo = limpo.replace(/~~([^~]+)~~/g, '$1')

  // Remove links markdown [texto](url)
  limpo = limpo.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove marcações de listas -, *, +, números no início de linha
  limpo = limpo.replace(/^\s*[-*+]\s+/gm, '')
  limpo = limpo.replace(/^\s*\d+\.\s+/gm, '')

  // Substitui emojis mais comuns por pausas naturais, preservando pontuação
  // Remove variações de emojis sem quebrar pontuação
  limpo = limpo.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')

  // Remove quebras de linha excessivas e espaços múltiplos
  limpo = limpo.replace(/\n+/g, ' ')
  limpo = limpo.replace(/\s{2,}/g, ' ')

  return limpo.trim()
}
