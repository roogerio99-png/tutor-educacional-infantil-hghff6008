import React, { useState, useEffect, useCallback } from 'react'
import { SimpleModal } from '@/components/SimpleModal'
import {
  obterAcessoCrianca,
  salvarAcessoCrianca,
  alternarStatusAcessoCrianca,
  excluirAcessoCrianca,
  type ObterAcessoCriancaResponse,
} from '@/services/criancaAcesso'
import type { CriancaRecord, PermissoesCrianca } from '@/types'
import {
  KeyRound,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  Wand2,
  Lock,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

interface GestaoAcessoCriancaCardProps {
  crianca: CriancaRecord | null
}

const PALAVRAS_FACIL = [
  'lumi',
  'estrela',
  'amigo',
  'lua',
  'sol',
  'pipoca',
  'balaao',
  'foguete',
  'leao',
  'urso',
  'gato',
  'nuvem',
  'arcoiris',
]

export const GestaoAcessoCriancaCard: React.FC<GestaoAcessoCriancaCardProps> = ({ crianca }) => {
  const [carregando, setCarregando] = useState(false)
  const [dadosAcesso, setDadosAcesso] = useState<ObterAcessoCriancaResponse | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    tipo: 'sucesso' | 'erro'
    texto: string
  } | null>(null)

  // Campos do formulário
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [permissoes, setPermissoes] = useState<PermissoesCrianca>({
    conversa: true,
    agenda: true,
    grafo: false,
    conquistas: true,
  })
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const carregarDados = useCallback(async () => {
    if (!crianca?.id) {
      setDadosAcesso(null)
      return
    }
    try {
      setCarregando(true)
      const res = await obterAcessoCrianca(crianca.id)
      setDadosAcesso(res)
      if (res.possui_acesso && res.acesso) {
        setUsername(res.acesso.username)
        setPermissoes(res.acesso.permissoes)
      } else {
        // Sugestão de username amigável baseado no primeiro nome
        const primeiroNome = crianca.nome
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
        setUsername(primeiroNome || 'aluno')
        setSenha('')
        setPermissoes({
          conversa: true,
          agenda: true,
          grafo: false,
          conquistas: true,
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados de acesso:', err)
    } finally {
      setCarregando(false)
    }
  }, [crianca?.id, crianca?.nome])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Gerador de senha amigável para crianças
  const gerarSenhaAmigavel = () => {
    const palavra = PALAVRAS_FACIL[Math.floor(Math.random() * PALAVRAS_FACIL.length)]
    const num = Math.floor(10 + Math.random() * 90) // 2 dígitos
    setSenha(`${palavra}${num}`)
    setShowSenha(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crianca?.id) return

    setFeedbackMsg(null)
    setSalvando(true)
    try {
      await salvarAcessoCrianca({
        crianca_id: crianca.id,
        username: username.trim().toLowerCase(),
        senha: senha ? senha.trim() : undefined,
        nome_exibicao: crianca.nome,
        ativo: dadosAcesso?.acesso ? dadosAcesso.acesso.ativo : true,
        permissoes,
      })
      setModalAberto(false)
      setSenha('')
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: 'Acesso da criança configurado com sucesso! 🎉',
      })
      await carregarDados()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar acesso da criança.'
      setFeedbackMsg({ tipo: 'erro', texto: msg })
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarStatus = async () => {
    if (!crianca?.id || !dadosAcesso?.acesso) return
    const novoStatus = !dadosAcesso.acesso.ativo
    try {
      setCarregando(true)
      await alternarStatusAcessoCrianca(crianca.id, novoStatus)
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: novoStatus ? 'Acesso da criança ativado!' : 'Acesso pausado temporariamente.',
      })
      await carregarDados()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status.'
      setFeedbackMsg({ tipo: 'erro', texto: msg })
    } finally {
      setCarregando(false)
    }
  }

  const handleExcluir = async () => {
    if (!crianca?.id) return
    try {
      setCarregando(true)
      await excluirAcessoCrianca(crianca.id)
      setConfirmandoExclusao(false)
      setFeedbackMsg({ tipo: 'sucesso', texto: 'Acesso da criança excluído.' })
      await carregarDados()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir acesso.'
      setFeedbackMsg({ tipo: 'erro', texto: msg })
    } finally {
      setCarregando(false)
    }
  }

  const togglePermissao = (chave: keyof PermissoesCrianca) => {
    setPermissoes((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }))
  }

  if (!crianca) {
    return null
  }

  const acessoExiste = dadosAcesso?.possui_acesso && dadosAcesso.acesso
  const statusAtivo = acessoExiste && dadosAcesso.acesso.ativo

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#F0E4D8]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F7EFE7]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-md shadow-orange-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#4A3B32]">
                Acesso Próprio da Criança 🔐
              </h3>
              {acessoExiste && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    statusAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {statusAtivo ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Pausado
                    </>
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A796C]">
              {acessoExiste
                ? `Usuário e permissões para ${crianca.nome.split(' ')[0]} acessar o app no próprio celular.`
                : `Crie um usuário e senha exclusivos para ${crianca.nome.split(' ')[0]} usar o app com segurança.`}
            </p>
          </div>
        </div>

        {acessoExiste ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAlternarStatus}
              disabled={carregando}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                statusAtivo
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {statusAtivo ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pausar acesso</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Reativar acesso</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFeedbackMsg(null)
                setSenha('')
                setModalAberto(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Gerenciar</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setFeedbackMsg(null)
              setSenha('')
              gerarSenhaAmigavel()
              setModalAberto(true)
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>🧒</span>
            <span>Criar acesso da criança</span>
          </button>
        )}
      </div>

      {feedbackMsg && (
        <div
          className={`mt-3 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Resumo do Acesso Atual */}
      {acessoExiste ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F0E4D8] flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A796C]">
                Login da Criança
              </span>
              <p className="text-sm font-extrabold text-[#4A3B32] mt-0.5 flex items-center gap-2">
                <span>@{dadosAcesso.acesso.username}</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-amber-700 font-semibold border border-[#EADBCE]">
                  🧒 Criança
                </span>
              </p>
            </div>
            <p className="text-[11px] text-[#8A796C] mt-2">
              Na tela inicial do app, a criança escolhe <strong>"🧒 Sou criança"</strong> e usa este
              usuário com a senha definida por você.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F0E4D8]">
            <span className="text-[10px] uppercase font-bold text-[#8A796C] block mb-1.5">
              O que {crianca.nome.split(' ')[0]} pode usar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                  dadosAcesso.acesso.permissoes.conversa
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400 line-through'
                }`}
              >
                <span>💬</span> Conversa Lumi
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                  dadosAcesso.acesso.permissoes.agenda
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400 line-through'
                }`}
              >
                <span>📅</span> Minha Agenda
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                  dadosAcesso.acesso.permissoes.grafo
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {dadosAcesso.acesso.permissoes.grafo ? (
                  <span>📊</span>
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                Quadro de Progresso
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                  dadosAcesso.acesso.permissoes.conquistas
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <span>⭐</span> Conquistas
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 border border-dashed border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Ao criar o acesso da criança, ela ganha seu próprio login com nome de usuário e senha
            fáceis. Ela entrará <strong>direto no Modo Criança</strong>, sem precisar do seu e-mail
            ou PIN, e sem ver nada do painel de adultos.
          </p>
        </div>
      )}

      {/* Modal de Configuração de Acesso (Criar ou Editar) */}
      <SimpleModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={
          acessoExiste
            ? `Gerenciar Acesso: ${crianca.nome.split(' ')[0]}`
            : `Criar Acesso: ${crianca.nome.split(' ')[0]}`
        }
        description="Defina como a criança entra no app e quais áreas ela pode explorar com a Lumi."
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Nome de Usuário da Criança *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9C8B7D]">
                @
              </span>
              <input
                type="text"
                required
                autoCapitalize="none"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))
                }
                placeholder="ex: anapaula"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-[#4A3B32]"
              />
            </div>
            <p className="text-[11px] text-[#8A796C] mt-1">
              Apenas letras minúsculas, números, ponto ou traço.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#4A3B32]">
                {acessoExiste ? 'Nova Senha (deixe em branco para manter)' : 'Senha da Criança *'}
              </label>
              <button
                type="button"
                onClick={gerarSenhaAmigavel}
                className="text-xs font-bold text-[#F28C28] hover:text-[#D97A1A] flex items-center gap-1 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Gerar senha fácil</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                required={!acessoExiste}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={
                  acessoExiste ? 'Digite apenas se quiser trocar' : 'Ex: balaao42 ou lumi1234'
                }
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-[#4A3B32]"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32] p-1"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Controle de Permissões por Módulo */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-[#4A3B32] uppercase mb-2">
              Controle de Módulos (O que a criança pode ver)
            </h4>

            <div className="space-y-2">
              {/* Conversa com Lumi */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <div>
                    <span className="text-xs font-bold text-[#4A3B32] block">
                      Conversa com a Lumi
                    </span>
                    <span className="text-[10px] text-[#8A796C]">
                      Chat com perguntas socráticas e voz
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissoes.conversa}
                  onChange={() => togglePermissao('conversa')}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-500"
                />
              </label>

              {/* Agenda Escolar */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <div>
                    <span className="text-xs font-bold text-[#4A3B32] block">Minha Agenda</span>
                    <span className="text-[10px] text-[#8A796C]">
                      Ver tarefas e provas escolares marcadas
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissoes.agenda}
                  onChange={() => togglePermissao('agenda')}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-500"
                />
              </label>

              {/* Quadro de Progresso */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    <span className="text-xs font-bold text-[#4A3B32] block">
                      Quadro de Progresso
                    </span>
                    <span className="text-[10px] text-[#8A796C]">
                      Visualização de estrelas e temas já dominados
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissoes.grafo}
                  onChange={() => togglePermissao('grafo')}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-500"
                />
              </label>

              {/* Conquistas e Estrelas */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">⭐</span>
                  <div>
                    <span className="text-xs font-bold text-[#4A3B32] block">
                      Conquistas & Selos
                    </span>
                    <span className="text-[10px] text-[#8A796C]">
                      Gamificação com medalhas de esforço
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissoes.conquistas}
                  onChange={() => togglePermissao('conquistas')}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-500"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {acessoExiste ? (
              confirmandoExclusao ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-rose-600 font-bold">Confirmar?</span>
                  <button
                    type="button"
                    onClick={handleExcluir}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-lg"
                  >
                    Sim, excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(true)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir login</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all"
              >
                {salvando ? 'Salvando...' : 'Salvar Acesso'}
              </button>
            </div>
          </div>
        </form>
      </SimpleModal>
    </div>
  )
}
