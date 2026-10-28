import React from 'react'
import { MetaKanban } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Plus, Target, ArrowRight } from 'lucide-react'

interface KanbanMetasWorkspaceProps {
  metas: MetaKanban[]
  onAtualizarStatus: (id: string, novoStatus: 'planejado' | 'em_progresso' | 'concluido') => void
  onAdicionarMeta: () => void
}

export const KanbanMetasWorkspace: React.FC<KanbanMetasWorkspaceProps> = ({
  metas,
  onAtualizarStatus,
  onAdicionarMeta,
}) => {
  const planejadas = metas.filter((m) => m.status === 'planejado')
  const emProgresso = metas.filter((m) => m.status === 'em_progresso')
  const concluidas = metas.filter((m) => m.status === 'concluido')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-sm tracking-wide uppercase text-zinc-300">
            Sprint de Metas & Aprendizado (Fase 3 Workspace)
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdicionarMeta}
          className="h-8 text-xs border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Coluna 1: Planejadas */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              A Fazer
            </span>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-[10px] h-5 px-1.5">
              {planejadas.length}
            </Badge>
          </div>
          <div className="space-y-2 flex-1">
            {planejadas.map((meta) => (
              <Card
                key={meta.id}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs shadow-sm"
              >
                <CardHeader className="p-2.5 pb-1">
                  <div className="flex items-center justify-between gap-1">
                    <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-400">
                      {meta.materia}
                    </Badge>
                  </div>
                  <CardTitle className="text-xs font-medium mt-1 leading-snug">
                    {meta.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 pt-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAtualizarStatus(meta.id, 'em_progresso')}
                    className="h-6 text-[10px] px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
                  >
                    Iniciar <ArrowRight className="w-2.5 h-2.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {planejadas.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center py-4 italic">
                Nenhuma meta pendente
              </p>
            )}
          </div>
        </div>

        {/* Coluna 2: Em Progresso */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-400 px-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              Em Foco
            </span>
            <Badge
              variant="secondary"
              className="bg-blue-950/80 text-blue-300 text-[10px] h-5 px-1.5"
            >
              {emProgresso.length}
            </Badge>
          </div>
          <div className="space-y-2 flex-1">
            {emProgresso.map((meta) => (
              <Card
                key={meta.id}
                className="bg-zinc-900 border-blue-900/50 text-zinc-200 text-xs shadow-sm"
              >
                <CardHeader className="p-2.5 pb-1">
                  <Badge
                    variant="outline"
                    className="text-[9px] border-blue-800 text-blue-300 w-fit"
                  >
                    {meta.materia}
                  </Badge>
                  <CardTitle className="text-xs font-medium mt-1 leading-snug text-blue-100">
                    {meta.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 pt-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAtualizarStatus(meta.id, 'concluido')}
                    className="h-6 text-[10px] px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                  >
                    Concluir <CheckCircle2 className="w-2.5 h-2.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {emProgresso.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center py-4 italic">Nenhum foco ativo</p>
            )}
          </div>
        </div>

        {/* Coluna 3: Concluídas */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Entregues
            </span>
            <Badge
              variant="secondary"
              className="bg-emerald-950/80 text-emerald-300 text-[10px] h-5 px-1.5"
            >
              {concluidas.length}
            </Badge>
          </div>
          <div className="space-y-2 flex-1">
            {concluidas.map((meta) => (
              <Card
                key={meta.id}
                className="bg-zinc-900/60 border-zinc-800/60 text-zinc-400 text-xs shadow-sm line-through decoration-zinc-600"
              >
                <CardHeader className="p-2.5 pb-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] border-zinc-800 text-zinc-500 w-fit"
                  >
                    {meta.materia}
                  </Badge>
                  <CardTitle className="text-xs font-medium mt-1 leading-snug">
                    {meta.titulo}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
            {concluidas.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center py-4 italic">
                Nenhuma meta concluída ainda
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
