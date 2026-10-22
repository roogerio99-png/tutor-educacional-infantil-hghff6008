import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { SimpleModal } from '@/components/SimpleModal'
import { listarCriancas } from '@/services/criancas'
import type { CriancaRecord } from '@/types'
import pb from '@/lib/pocketbase/client'
import {
  User,
  Mail,
  Lock,
  LogOut,
  Save,
  KeyRound,
  Send,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

export default function Perfil() {
  const { user, updateProfileName, updatePassword, requestEmailChange, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Crianças para gestão de privacidade / exclusão de memórias
  const [criancas, setCriancas] = useState<CriancaRecord[]>([])
  const [carregandoCriancas, setCarregandoCriancas] = useState(false)
  const [criancaParaLimpar, setCriancaParaLimpar] = useState<CriancaRecord | null>(null)
  const [limpandoMemoria, setLimpandoMemoria] = useState(false)

  const carregarListaCriancas = async () => {
    try {
      setCarregandoCriancas(true)
      const lista = await listarCriancas()
      setCriancas(lista)
    } catch {
      // silencioso
    } finally {
      setCarregandoCriancas(false)
    }
  }

  useEffect(() => {
    carregarListaCriancas()
  }, [])

  // 1. Edição de Nome
  const [nome, setNome] = useState(user?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // 2. Alteração de Senha
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [generalPassError, setGeneralPassError] = useState<string | null>(null)

  // 3. Solicitação de Troca de E-mail
  const [novoEmail, setNovoEmail] = useState('')
  const [requestingEmail, setRequestingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // 4. Modal de Confirmação de Logout
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  // Salvar Nome
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)

    if (!nome.trim()) {
      setNameError('Informe seu nome completo')
      return
    }

    setSavingName(true)
    try {
      await updateProfileName(nome)
      toast({
        title: 'Perfil atualizado!',
        description: 'Seu nome foi alterado com sucesso.',
      })
    } catch {
      setNameError('Erro ao atualizar nome. Tente novamente.')
    } finally {
      setSavingName(false)
    }
  }

  // Atualizar Senha
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})
    setGeneralPassError(null)

    const errors: Record<string, string> = {}
    if (!oldPassword) errors.oldPassword = 'Digite sua senha atual'
    if (!newPassword || newPassword.length < 8) {
      errors.newPassword = 'A nova senha deve ter no mínimo 8 caracteres'
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setSavingPassword(true)
    try {
      await updatePassword(oldPassword, newPassword, confirmPassword)
      toast({
        title: 'Senha atualizada com sucesso!',
        description: 'Sua nova senha já está ativa.',
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setPasswordErrors(extracted)
      } else {
        setGeneralPassError('Senha atual incorreta ou erro ao atualizar.')
      }
    } finally {
      setSavingPassword(false)
    }
  }

  // Solicitar troca de email
  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)

    if (!novoEmail.trim()) {
      setEmailError('Informe o novo endereço de e-mail')
      return
    }

    setRequestingEmail(true)
    try {
      await requestEmailChange(novoEmail)
      toast({
        title: 'Confirmação enviada!',
        description: 'Enviamos um link de confirmação para o novo e-mail.',
      })
      setNovoEmail('')
    } catch {
      setEmailError(
        'Não foi possível solicitar a alteração de e-mail. Verifique o endereço digitado.',
      )
    } finally {
      setRequestingEmail(false)
    }
  }

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false)
    logout()
    navigate('/login')
  }

  const handleExcluirMemorias = async () => {
    if (!criancaParaLimpar) return
    setLimpandoMemoria(true)
    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const token = pb.authStore.token
      const res = await fetch(`${baseUrl}/backend/v1/privacidade/crianca/${criancaParaLimpar.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao excluir dados')
      }

      toast({
        title: 'Dados excluídos com sucesso!',
        description: `Todas as memórias, dificuldades e histórico de ${criancaParaLimpar.nome} foram apagados.`,
      })
      setCriancaParaLimpar(null)
      carregarListaCriancas()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar exclusão'
      toast({
        title: 'Falha na exclusão',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLimpandoMemoria(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Topo do perfil */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-soft">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F28C28] to-[#E06A10] text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-black text-[#4A3B32]">{user?.name || 'Responsável'}</h1>
          <p className="text-sm text-[#9C8B7D] font-medium mt-0.5">{user?.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3DA64C]/10 text-xs font-bold text-[#3DA64C]">
            <span>Conta verificada e ativa</span>
          </div>
        </div>
      </div>

      {/* Seção 1: Editar Nome */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-soft space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F0E4D8]">
          <User className="w-5 h-5 text-[#F28C28]" />
          <h2 className="text-lg font-bold text-[#4A3B32]">Dados Pessoais</h2>
        </div>

        <form onSubmit={handleSaveName} className="space-y-4 pt-1">
          <div>
            <label
              className="block text-xs font-bold text-[#4A3B32] mb-1.5"
              htmlFor="nome-completo"
            >
              Nome completo
            </label>
            <input
              id="nome-completo"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all"
            />
            {nameError && <p className="mt-1 text-xs text-[#D64545] font-medium">{nameError}</p>}
          </div>

          <button
            type="submit"
            disabled={savingName}
            className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all"
          >
            {savingName ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Salvar alterações</span>
          </button>
        </form>
      </div>

      {/* Seção 2: Alteração de Senha */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-soft space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F0E4D8]">
          <Lock className="w-5 h-5 text-[#F28C28]" />
          <h2 className="text-lg font-bold text-[#4A3B32]">Alterar Senha</h2>
        </div>

        {generalPassError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-[#D64545] font-semibold">
            {generalPassError}
          </div>
        )}

        <form onSubmit={handleSavePassword} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="old-pass">
              Senha atual
            </label>
            <div className="relative">
              <input
                id="old-pass"
                type={showOldPass ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className={`w-full px-4 py-2.5 pr-11 rounded-2xl bg-[#FFF8F0]/40 border ${
                  passwordErrors.oldPassword ? 'border-[#D64545]' : 'border-[#EADBCE]'
                } focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32] p-1"
              >
                {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordErrors.oldPassword && (
              <p className="mt-1 text-xs text-[#D64545] font-medium">
                {passwordErrors.oldPassword}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="new-pass">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="new-pass"
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full px-4 py-2.5 pr-11 rounded-2xl bg-[#FFF8F0]/40 border ${
                    passwordErrors.newPassword ? 'border-[#D64545]' : 'border-[#EADBCE]'
                  } focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8B7D] hover:text-[#4A3B32] p-1"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-bold text-[#4A3B32] mb-1.5"
                htmlFor="confirm-pass"
              >
                Confirmar nova senha
              </label>
              <input
                id="confirm-pass"
                type={showNewPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className={`w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border ${
                  passwordErrors.confirmPassword ? 'border-[#D64545]' : 'border-[#EADBCE]'
                } focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all`}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-xs text-[#D64545] font-medium">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all"
          >
            {savingPassword ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>Atualizar senha</span>
          </button>
        </form>
      </div>

      {/* Seção 3: Privacidade e Dados da Criança (LGPD & ECA Digital) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-soft space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F0E4D8]">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-[#4A3B32]">
              Privacidade e Dados da Criança (LGPD & ECA Digital)
            </h2>
            <p className="text-xs text-[#9C8B7D]">
              Controle parental total sobre as memórias e aprendizado gerados pelo tutor
              inteligente.
            </p>
          </div>
        </div>

        {/* Status do Consentimento Parental */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Consentimento Parental Ativo</span>
          </div>
          <p className="text-xs text-[#5A4B40] leading-relaxed">
            Seu consentimento foi registrado sob a{' '}
            <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong> e o{' '}
            <strong>ECA Digital (Lei 15.211/2025)</strong>. Os dados da sua criança são estritamente
            confidenciais, nunca comercializados e utilizados exclusivamente para personalizar o
            suporte socrático da Lumi.
          </p>
          {user?.consentimento_data && (
            <p className="text-[11px] text-emerald-700/80 font-medium">
              Data da autorização:{' '}
              {new Date(user.consentimento_data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Gestão e Exclusão de Memórias por Criança */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[#4A3B32] uppercase tracking-wider">
            Direito de Exclusão e Esquecimento (por Criança)
          </h3>
          <p className="text-xs text-[#9C8B7D]">
            Apaga permanentemente as dificuldades mapeadas, estratégias da base de conhecimento,
            histórico de tarefas e observações armazenadas da criança selecionada.
          </p>

          {carregandoCriancas ? (
            <p className="text-xs text-slate-400 py-2">Carregando crianças...</p>
          ) : criancas.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 italic">
              Nenhuma criança cadastrada nesta conta.
            </p>
          ) : (
            <div className="space-y-2.5">
              {criancas.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FFF8F0]/50 border border-[#EADBCE] hover:border-amber-300 transition-colors"
                >
                  <div>
                    <span className="text-sm font-bold text-[#4A3B32] block">{c.nome}</span>
                    <span className="text-[11px] text-[#9C8B7D]">
                      {c.idade} anos • {c.serie} {c.localidade ? `• ${c.localidade}` : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCriancaParaLimpar(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors w-fit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir memórias e dados</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seção 4: Sair da conta com confirmação */}
      <div className="bg-red-50/50 p-6 sm:p-8 rounded-3xl border border-red-200 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#D64545]">Encerrar sessão</h3>
          <p className="text-xs text-[#9C8B7D] mt-0.5">
            Você precisará informar seu e-mail e senha novamente para entrar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#D64545] hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>

      {/* Modal leve de confirmação de exclusão de memórias (SimpleModal - sem Radix Dialog) */}
      <SimpleModal
        isOpen={!!criancaParaLimpar}
        onClose={() => setCriancaParaLimpar(null)}
        title="Excluir memórias e dados de aprendizagem"
        description="Ação irreversível assegurada pelo ECA Digital e pela LGPD."
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-800 leading-relaxed">
              Você está prestes a excluir <strong>todas as dificuldades mapeadas</strong>,{' '}
              <strong>estratégias de retenção</strong>, <strong>compromissos de agenda</strong> e{' '}
              <strong>observações pedagógicas</strong> de{' '}
              <span className="font-bold">{criancaParaLimpar?.nome}</span>.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            A Lumi esquecerá todo o histórico cognitivo desta criança, reiniciando o acompanhamento
            pedagógico do zero.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={limpandoMemoria}
              onClick={() => setCriancaParaLimpar(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={limpandoMemoria}
              onClick={handleExcluirMemorias}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
            >
              {limpandoMemoria ? (
                <span>Excluindo permanentemente...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Exclusão</span>
                </>
              )}
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Modal leve de confirmação de logout (SimpleModal - sem Radix Dialog) */}
      <SimpleModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Deseja sair da conta?"
        description="Sua sessão será encerrada e você precisará logar novamente para acessar."
      >
        <div className="space-y-4 pt-1">
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Permanecer
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#D64545] hover:bg-red-700 shadow-sm transition-all inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sim, sair</span>
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  )
}
