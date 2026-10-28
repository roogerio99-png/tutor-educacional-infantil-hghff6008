import React, { useState, useEffect } from 'react'
import { Clock, Moon, Check, Save } from 'lucide-react'
import { atualizarCrianca } from '@/services/criancas'
import { obterStatusUsoHoje, type StatusUsoResponse } from '@/services/tempoUso'
import type { CriancaRecord } from '@/types'
import { toast } from 'sonner'

interface ControleTempoUsoCardProps {
  crianca: CriancaRecord
  onAtualizado: () => void
}

const OPCOES_PREDEFINIDAS = [
  { rotulo: 'Sem Limite', valor: 0 },
  { rotulo: '15 min', valor: 15 },
  { rotulo: '30 min', valor: 30 },
  { rotulo: '45 min', valor: 45 },
  { rotulo: '60 min (1h)', valor: 60 },
  { rotulo: '90 min (1h30)', valor: 90 },
  { rotulo: '120 min (2h)', valor: 120 },
]

export const ControleTempoUsoCard: React.FC<ControleTempoUsoCardProps> = ({
  crianca,
  onAtualizado,
}) => {
  const [minutosLimite, setMinutosLimite] = useState<number>(crianca.tempo_uso_diario_min ?? 0)
  const [janelaAtiva, setJanelaAtiva] = useState<boolean>(
    Boolean(crianca.uso_janela_inicio && crianca.uso_janela_fim),
  )
  const [horaInicio, setHoraInicio] = useState<string>(crianca.uso_janela_inicio || '08:00')
  const [horaFim, setHoraFim] = useState<string>(crianca.uso_janela_fim || '20:00')
  const [statusHoje, setStatusHoje] = useState<StatusUsoResponse | null>(null)
  const [carregandoStatus, setCarregandoStatus] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Carregar dados de uso hoje da criança
  const carregarUsoHoje = async () => {
    try {
      setCarregandoStatus(true)
      const st = await obterStatusUsoHoje(crianca.id)
      setStatusHoje(st)
    } catch (err) {
      console.warn('Erro ao obter status de uso:', err)
    } finally {
      setCarregandoStatus(false)
    }
  }

  useEffect(() => {
    carregarUsoHoje()
  }, [crianca.id])

  const handleSalvar = async () => {
    try {
      setSalvando(true)
      await atualizarCrianca(crianca.id, {
        tempo_uso_diario_min: minutosLimite,
        uso_janela_inicio: janelaAtiva ? horaInicio : '',
        uso_janela_fim: janelaAtiva ? horaFim : '',
      })
      toast.success('Configurações de tempo de uso salvas com sucesso! ⏱️')
      carregarUsoHoje()
      onAtualizado()
    } catch (err) {
      console.error('Erro ao salvar tempo de uso:', err)
      toast.error('Erro ao salvar configurações de tempo de uso.')
    } finally {
      setSalvando(false)
    }
  }

  const minutosUsados = statusHoje?.minutos_usados ?? 0
  const limiteAtual = minutosLimite
  const percentual =
    limiteAtual > 0 ? Math.min(100, Math.round((minutosUsados / limiteAtual) * 100)) : 0

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-5 space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              ⏱️ Tempo de Uso Diário
              {limiteAtual > 0 ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {limiteAtual} min/dia
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Sem limite
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500">
              Controle o tempo de tela e estabeleça pausas saudáveis para o aprendizado da criança.
            </p>
          </div>
        </div>

        {/* Botão de Salvar */}
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          {salvando ? (
            <span>Salvando...</span>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Limites</span>
            </>
          )}
        </button>
      </div>

      {/* Rastreamento Hoje: Barra de Progresso */}
      <div className="p-3.5 rounded-xl bg-white border border-amber-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <span>Usado hoje:</span>
            <span className="text-amber-700 font-extrabold text-sm">
              {carregandoStatus ? '...' : `${minutosUsados} min`}
            </span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {limiteAtual > 0
              ? `${Math.max(0, limiteAtual - minutosUsados)} min restantes (${percentual}%)`
              : 'Sem limite configurado'}
          </span>
        </div>

        {/* Barra visual */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentual >= 100
                ? 'bg-rose-500'
                : percentual >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${limiteAtual > 0 ? percentual : Math.min(minutosUsados, 100)}%` }}
          />
        </div>

        {limiteAtual > 0 && minutosUsados >= limiteAtual && (
          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
            ⚠️ O limite de uso diário de hoje foi atingido. A criança verá o descanso carinhoso da
            Lumi.
          </p>
        )}
      </div>

      {/* Seletor Amigável de Minutos */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Limite de Minutos Permitidos por Dia
        </label>
        <div className="flex flex-wrap gap-2">
          {OPCOES_PREDEFINIDAS.map((op) => {
            const selecionado = minutosLimite === op.valor
            return (
              <button
                key={op.valor}
                type="button"
                onClick={() => setMinutosLimite(op.valor)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  selecionado
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                {selecionado && <Check className="w-3.5 h-3.5" />}
                <span>{op.rotulo}</span>
              </button>
            )
          })}
        </div>

        {/* Campo livre se quiser valor customizado */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-500">Ou digite outro valor:</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="720"
              value={minutosLimite}
              onChange={(e) => setMinutosLimite(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-20 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">minutos</span>
          </div>
        </div>
      </div>

      {/* Janela de Horário Permitido (ex: 08:00 às 20:00) */}
      <div className="pt-3 border-t border-amber-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="text-xs font-bold text-slate-800">
                Restringir Janela de Horário (Dia & Noite)
              </span>
              <p className="text-[11px] text-slate-500">
                A Lumi só conversará durante o horário permitido, incentivando o sono saudável.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={janelaAtiva}
              onChange={(e) => setJanelaAtiva(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {janelaAtiva && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">
                Liberado a partir de:
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">
                Bloquear após:
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
