import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { User, Mail, Lock, LogOut, Save, KeyRound, Send, Eye, EyeOff } from 'lucide-react'

export default function Perfil() {
  const { user, updateProfileName, updatePassword, requestEmailChange, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

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

      {/* Seção 3: Troca de E-mail */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EADBCE] shadow-soft space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F0E4D8]">
          <Mail className="w-5 h-5 text-[#F28C28]" />
          <h2 className="text-lg font-bold text-[#4A3B32]">Trocar E-mail</h2>
        </div>

        <form onSubmit={handleRequestEmail} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#9C8B7D] mb-1">E-mail atual</label>
            <p className="text-sm font-bold text-[#4A3B32] bg-[#FFF8F0] px-4 py-2.5 rounded-2xl border border-[#EADBCE]">
              {user?.email}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5" htmlFor="novo-email">
              Novo e-mail
            </label>
            <input
              id="novo-email"
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="novo@email.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF8F0]/40 border border-[#EADBCE] focus:ring-[#F28C28] text-sm text-[#4A3B32] placeholder-[#9C8B7D] focus:outline-none focus:ring-2 transition-all"
            />
            {emailError && <p className="mt-1 text-xs text-[#D64545] font-medium">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={requestingEmail}
            className="inline-flex items-center gap-2 bg-[#FBEFE0] hover:bg-[#F5E2CE] text-[#4A3B32] font-bold px-5 py-2.5 rounded-xl text-sm border border-[#EADBCE] transition-all"
          >
            {requestingEmail ? (
              <div className="w-4 h-4 border-2 border-[#F28C28] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-[#F28C28]" />
            )}
            <span>Solicitar alteração de e-mail</span>
          </button>
        </form>
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

      {/* Modal de confirmação de logout */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-3xl p-6 border border-[#EADBCE]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4A3B32] flex items-center gap-2">
              <LogOut className="w-5 h-5 text-[#D64545]" />
              <span>Deseja sair da conta?</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-[#9C8B7D] pt-1">
              Sua sessão será encerrada e você será redirecionado para a tela de login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#EADBCE] text-[#4A3B32] font-bold text-sm hover:bg-[#FBEFE0]"
            >
              Permanecer
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D64545] hover:bg-red-700 text-white font-bold text-sm"
            >
              Sim, sair
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
