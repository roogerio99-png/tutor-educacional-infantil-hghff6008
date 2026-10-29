import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { obterPromptAtivo, salvarPrompt } from '@/services/prompts'
import type { SystemPromptRecord } from '@/types'

export const StudioPrompts: React.FC = () => {
  const [promptId, setPromptId] = useState<string | undefined>(undefined)
  const [titulo, setTitulo] = useState('Prompt Socrático Personalizado - Lumi')
  const [identidade, setIdentidade] = useState(
    'Lumi é uma tutora educacional inteligente, calorosa, paciente e focada em despertar o pensamento autônomo de crianças e jovens no aprendizado.',
  )
  const [metodoSocratico, setMetodoSocratico] = useState(
    'NUNCA fornecer respostas diretas. Formular perguntas abertas em sequência lógica, pedir exemplos à criança e sugerir que ela teste suas próprias suposições.',
  )
  const [diretrizesPedagogicas, setDiretrizesPedagogicas] = useState(
    'Acolher erros com entusiasmo como parte natural da descoberta. Relacionar conceitos abstratos ao cotidiano da criança (jogos, desenhos, esportes).',
  )
  const [tomDeVoz, setTomDeVoz] = useState(
    'Afetuoso, encorajador, alegre, paciente e claro, sem utilizar jargões técnicos difíceis.',
  )
  const [instrucoesQuadro, setInstrucoesQuadro] = useState(
    'Sempre que possível, forneça analogias visuais divididas em até 4 etapas claras para acompanhar o Quadro Visual.',
  )

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  useEffect(() => {
    obterPromptAtivo()
      .then((p: SystemPromptRecord | null) => {
        if (p) {
          setPromptId(p.id)
          setTitulo(p.titulo || '')
          setIdentidade(p.identidade || '')
          setMetodoSocratico(p.metodo_socratico || '')
          setDiretrizesPedagogicas(p.diretrizes_pedagogicas || '')
          setTomDeVoz(p.tom_de_voz || '')
          setInstrucoesQuadro(p.instrucoes_quadro || '')
        }
      })
      .finally(() => setCarregando(false))
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSalvando(true)
      const salvo = await salvarPrompt(
        {
          titulo: titulo.trim(),
          identidade: identidade.trim(),
          metodo_socratico: metodoSocratico.trim(),
          diretrizes_pedagogicas: diretrizesPedagogicas.trim() || undefined,
          tom_de_voz: tomDeVoz.trim() || undefined,
          instrucoes_quadro: instrucoesQuadro.trim() || undefined,
          ativo: true,
        },
        promptId,
      )
      setPromptId(salvo.id)
      setMensagemSucesso(
        'Prompt do sistema atualizado com sucesso! A Lumi já está utilizando as novas instruções.',
      )
      toast.success('Prompt do sistema atualizado!')
      setTimeout(() => setMensagemSucesso(null), 4000)
    } catch (err) {
      console.error('Erro ao salvar prompt:', err)
      toast.error('Não foi possível salvar o prompt do sistema.')
    } finally {
      setSalvando(false)
    }
  }

  const restaurarPadrao = () => {
    if (!confirm('Deseja restaurar as instruções recomendadas padrão para a Lumi?')) return
    setTitulo('Prompt Socrático Padrão - Lumi')
    setIdentidade(
      'Lumi é uma tutora infantil socrática, calorosa e divertida. Fala sempre com frases curtas (máximo 1 a 3 frases), linguagem simples e amigável para crianças, indo direto ao assunto sem narrar métodos.',
    )
    setMetodoSocratico(
      'Protocolo Socrático invisível na fala: nunca anuncie a etapa nem use frases como "agora vou te guiar" ou "deixa eu entender". Faça perguntas diretas sobre o conteúdo (máximo 1 pergunta investigativa por vez). Tag [[ETAPA: ... | MATERIA: ...]] obrigatória ao final para telemetria da orbe.',
    )
    setDiretrizesPedagogicas(
      'PROIBIDO narrar ou verbalizar passos pedagógicos. Frases curtas e simples (máximo 1 a 3 frases por resposta). Uma pergunta socrática por vez, sem respostas prontas. Tag [[ETAPA: ... | MATERIA: ...]] obrigatória ao final de toda resposta para telemetria em tempo real.',
    )
    setTomDeVoz('Afetuoso, encorajador, lúdico e claro, sem jargões complicados.')
    setInstrucoesQuadro(
      'Ao apresentar um raciocínio, descreva passos visuais claros que possam ser desenhados no quadro mental ou anotados em blocos.',
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Studio */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-xl font-black text-slate-800">Studio de Prompts do Sistema</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure e refine as diretrizes pedagógicas, a metodologia socrática e a personalidade
            da Lumi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={restaurarPadrao}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Restaurar Padrão
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in-up">
          <span>✓</span>
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Formulário do Studio de Prompts */}
      {carregando ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-sm">
          Carregando diretrizes do sistema...
        </div>
      ) : (
        <form onSubmit={handleSalvar} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nome da Configuração *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Identidade do Agente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>1. Identidade & Papel (Persona) *</span>
                  <span className="text-[10px] text-amber-600 font-normal">Quem a IA é</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={identidade}
                  onChange={(e) => setIdentidade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
                />
              </div>

              {/* Princípio Socrático */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>2. Método Socrático & Regra Áurea *</span>
                  <span className="text-[10px] text-rose-600 font-normal">
                    Nunca dar resposta direta
                  </span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={metodoSocratico}
                  onChange={(e) => setMetodoSocratico(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Diretrizes Pedagógicas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Diretrizes Pedagógicas
                </label>
                <textarea
                  rows={4}
                  value={diretrizesPedagogicas}
                  onChange={(e) => setDiretrizesPedagogicas(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
                />
              </div>

              {/* Tom de Voz */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  4. Tom de Voz & Emoção
                </label>
                <textarea
                  rows={4}
                  value={tomDeVoz}
                  onChange={(e) => setTomDeVoz(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
                />
              </div>

              {/* Instruções para o Quadro Visual */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  5. Esquemas Visuais / Quadro
                </label>
                <textarea
                  rows={4}
                  value={instrucoesQuadro}
                  onChange={(e) => setInstrucoesQuadro(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <span>{salvando ? 'Salvando Alterações...' : 'Salvar Diretrizes de Sistema'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default StudioPrompts
