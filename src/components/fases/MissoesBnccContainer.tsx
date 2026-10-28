import React from 'react'
import { MissaoBnccRecord, FaseDesenvolvimentoId } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Sparkles, BookOpen, Volume2, ShieldCheck } from 'lucide-react'

interface MissoesBnccContainerProps {
  missoes: MissaoBnccRecord[]
  fase: FaseDesenvolvimentoId
  onIniciarMissao: (missao: MissaoBnccRecord) => void
  onOuvirMissao?: (texto: string) => void
}

export const MissoesBnccContainer: React.FC<MissoesBnccContainerProps> = ({
  missoes,
  fase,
  onIniciarMissao,
  onOuvirMissao,
}) => {
  if (!missoes || missoes.length === 0) {
    return null
  }

  // Estilização condicional baseada na fase
  const isFase1 = fase === 'fase_1'
  const isFase2 = fase === 'fase_2'
  const isFase3 = fase === 'fase_3'

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFase1 && <span className="text-2xl">🌱</span>}
          {isFase2 && <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />}
          {isFase3 && <BookOpen className="w-4 h-4 text-zinc-400" />}
          <h3
            className={`font-bold ${
              isFase1
                ? 'text-lg text-amber-900 dark:text-amber-200'
                : isFase2
                  ? 'text-base text-purple-200 tracking-wide font-mono uppercase'
                  : 'text-sm text-zinc-200 uppercase tracking-wider font-semibold'
            }`}
          >
            {isFase1 && 'Descobertas do Dia (BNCC)'}
            {isFase2 && 'Missões Interativas em Andamento (BNCC)'}
            {isFase3 && 'Estudos Dirigidos & Dialética (BNCC)'}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={
            isFase1
              ? 'bg-amber-100 text-amber-800 border-amber-300 rounded-full px-3 py-1 font-bold'
              : isFase2
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 text-xs'
          }
        >
          {missoes.length} {missoes.length === 1 ? 'Missão' : 'Missões'}
        </Badge>
      </div>

      <div
        className={`grid gap-3 ${
          isFase1
            ? 'grid-cols-1 sm:grid-cols-2'
            : isFase2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {missoes.map((m) => {
          let midiaObj: Record<string, unknown> = {}
          try {
            if (typeof m.recursos_midia === 'string') {
              midiaObj = JSON.parse(m.recursos_midia)
            } else if (typeof m.recursos_midia === 'object' && m.recursos_midia !== null) {
              midiaObj = m.recursos_midia as Record<string, unknown>
            }
          } catch {
            /* intentionally ignored */
          }

          const icone = (midiaObj.icone as string) || (isFase1 ? '⭐' : isFase2 ? '🎯' : '📄')

          return (
            <Card
              key={m.id}
              className={`transition-all duration-200 flex flex-col justify-between ${
                isFase1
                  ? 'bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 rounded-3xl p-1 shadow-md hover:scale-[1.01]'
                  : isFase2
                    ? 'bg-slate-900/90 dark:bg-slate-950 border border-purple-500/40 rounded-2xl shadow-lg shadow-purple-950/20 hover:border-purple-400'
                    : 'bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 p-0 shadow-sm'
              }`}
            >
              <CardHeader className={`${isFase1 ? 'p-4 pb-2' : isFase2 ? 'p-4 pb-2' : 'p-3 pb-2'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icone}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isFase1
                          ? 'border-amber-400 text-amber-800 bg-amber-100 font-bold'
                          : isFase2
                            ? 'border-cyan-500/60 text-cyan-300 bg-cyan-950/60'
                            : 'border-zinc-700 text-zinc-300 bg-zinc-800'
                      }`}
                    >
                      {m.materia}
                    </Badge>
                  </div>

                  {/* Botão de áudio para crianças em fase de alfabetização */}
                  {isFase1 && onOuvirMissao && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOuvirMissao(`${m.titulo}. ${m.descricao}`)}
                      className="h-8 w-8 p-0 rounded-full text-amber-700 hover:bg-amber-200/60"
                      title="Ouvir instrução da missão"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <CardTitle
                  className={`mt-2 ${
                    isFase1
                      ? 'text-lg font-bold text-amber-950 dark:text-amber-100'
                      : isFase2
                        ? 'text-base font-bold text-slate-100'
                        : 'text-sm font-semibold text-zinc-100'
                  }`}
                >
                  {m.titulo}
                </CardTitle>

                <CardDescription
                  className={`text-xs mt-1 leading-relaxed ${
                    isFase1
                      ? 'text-amber-900/80 dark:text-amber-300/80 font-medium'
                      : isFase2
                        ? 'text-slate-300'
                        : 'text-zinc-400'
                  }`}
                >
                  {m.descricao}
                </CardDescription>

                {m.habilidades_bncc && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{m.habilidades_bncc}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent
                className={`${isFase1 ? 'p-4 pt-1' : isFase2 ? 'p-4 pt-1' : 'p-3 pt-1'}`}
              >
                <Button
                  onClick={() => onIniciarMissao(m)}
                  className={`w-full ${
                    isFase1
                      ? 'h-12 rounded-2xl text-base font-bold bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-md'
                      : isFase2
                        ? 'h-10 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/30'
                        : 'h-8 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  {isFase1 ? 'Iniciar Descoberta!' : isFase2 ? 'Decolar Missão' : 'Explorar Tema'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
