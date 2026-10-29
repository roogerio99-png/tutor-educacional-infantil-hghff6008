import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCrianca } from '@/contexts/CriancaContext'
import { useModoCrianca } from '@/contexts/ModoCriancaContext'
import { SairModoCriancaModal } from '@/components/modocrianca/SairModoCriancaModal'
import { ConfigurarPinModal } from '@/components/modocrianca/ConfigurarPinModal'
import { verificarPinResponsavel } from '@/services/pinResponsavel'
import { MessageSquare, Calendar, Lock, ChevronDown, LogOut, ShieldAlert } from 'lucide-react'

export const HeaderModoCrianca: React.FC = () => {
  const { tipoConta, criancaUsuario, permissoes, logout, alternarAcessoRapido } = useAuth()
  const { criancaSelecionada, criancas, selecionarCrianca } = useCrianca()
  const {
    abrirModalSairModo,
    modalSairModoAberto,
    fecharModalSairModo,
    modalConfigurarPinAberto,
    fecharModalConfigurarPin,
  } = useModoCrianca()

  const location = useLocation()
  const navigate = useNavigate()
  const [menuTrocaAluno, setMenuTrocaAluno] = useState(false)

  // Parental Gate Modal quando a criança tenta clicar em "Acessar como Responsável" ou Configurações de Segurança
  const [parentalGateAberto, setParentalGateAberto] = useState(false)
  const [pinDigitado, setPinDigitado] = useState('')
  const [erroPinGate, setErroPinGate] = useState<string | null>(null)
  const [verificandoPinGate, setVerificandoPinGate] = useState(false)

  const isConversa = location.pathname.startsWith('/conversa')
  const isQuadro = location.pathname.startsWith('/quadro')
  const isAgenda = location.pathname.startsWith('/agenda')

  const handleConfirmarParentalGate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pinDigitado.length !== 4 || verificandoPinGate) return
    setVerificandoPinGate(true)
    setErroPinGate(null)
    try {
      const valido = await verificarPinResponsavel(pinDigitado)
      if (valido) {
        setParentalGateAberto(false)
        setPinDigitado('')
        await alternarAcessoRapido('responsavel')
        navigate('/conversa')
      } else {
        setErroPinGate('PIN do Responsável incorreto. (Demo: 1234)')
      }
    } catch {
      setErroPinGate('Não foi possível validar o PIN agora.')
    } finally {
      setVerificandoPinGate(false)
    }
  }

  return (
    <>
      {/* =========================================================================
          CABEÇALHO MODO CRIANÇA MOBILE (< 768px): Compacto 56px, sem ocupar a tela!
         ========================================================================= */}
      <header className="md:hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-white shadow-md sticky top-0 z-30 select-none h-14">
        <div className="h-full px-3 flex items-center justify-between gap-2">
          {/* Logo compacta */}
          <Link
            to="/conversa"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2.5 py-1.5 rounded-2xl transition-all shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-white text-amber-500 flex items-center justify-center text-sm shadow-xs font-black">
              ✨
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-white">
                Lumi
              </span>
              <span className="text-[9px] text-amber-100 font-bold leading-none mt-0.5">
                Criança 🧒
              </span>
            </div>
          </Link>

          {/* Atalho Aluno + Botão Acessar como Responsável (com PIN) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-xs max-w-[100px] truncate">
              <span>⭐</span>
              <span className="truncate">
                {criancaUsuario?.nome_exibicao?.split(' ')[0] ||
                  criancaSelecionada?.nome.split(' ')[0] ||
                  'Aluno'}
              </span>
            </div>

            {tipoConta === 'crianca' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPinDigitado('')
                    setErroPinGate(null)
                    setParentalGateAberto(true)
                  }}
                  className="bg-black/30 hover:bg-black/40 text-white font-extrabold px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Acessar painel do Responsável (Exige PIN)"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pais</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold p-1.5 rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={abrirModalSairModo}
                className="bg-black/30 hover:bg-black/40 active:bg-black/50 text-white px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-inner cursor-pointer"
                title="Acessar como Responsável (Exige PIN)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Pais</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          BARRA DE NAVEGAÇÃO INFERIOR PARA CRIANÇA NO CELULAR (< 768px)
         ========================================================================= */}
      <nav
        aria-label="Navegação da Criança"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-amber-200 h-14 px-2 flex items-center justify-around shadow-lg"
      >
        {permissoes.conversa !== false && (
          <Link
            to="/conversa"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
              isConversa ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isConversa ? 'bg-amber-100 text-amber-600 scale-105' : ''
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">Conversar</span>
          </Link>
        )}

        {permissoes.conversa !== false && (
          <Link
            to="/quadro"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
              isQuadro ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isQuadro ? 'bg-indigo-100 text-indigo-600 scale-105' : ''
              }`}
            >
              <span className="text-base leading-none">🎨</span>
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">Quadro</span>
          </Link>
        )}

        <Link
          to="/agenda"
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
            isAgenda ? 'text-orange-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              isAgenda ? 'bg-orange-100 text-orange-600 scale-105' : ''
            }`}
          >
            {!permissoes.agenda ? <Lock className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-0.5">Agenda</span>
        </Link>
      </nav>

      {/* =========================================================================
          CABEÇALHO DESKTOP (>= 768px): Amplo e completo
         ========================================================================= */}
      <header className="hidden md:block bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-white shadow-md sticky top-0 z-30 select-none">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 flex-wrap">
          {/* Logo infantil fofo com Lumi */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/conversa"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-xs px-3 py-1.5 rounded-2xl transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white text-amber-500 flex items-center justify-center text-lg shadow-sm font-black">
                ✨
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-white block">
                  Lumi
                </span>
                <span className="text-[10px] text-amber-100 font-bold leading-none">
                  Acesso Criança Protegido 🧒
                </span>
              </div>
            </Link>
          </div>

          {/* Abas Infantis Segregadas: Conversar, Quadro & Missões e Minha Agenda */}
          <nav className="flex items-center gap-1.5 bg-black/10 p-1 rounded-2xl">
            {permissoes.conversa !== false && (
              <>
                <Link
                  to="/conversa"
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                    isConversa
                      ? 'bg-white text-amber-900 shadow-sm'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Conversar</span>
                </Link>

                <Link
                  to="/quadro"
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                    isQuadro
                      ? 'bg-white text-amber-900 shadow-sm'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>🎨</span>
                  <span>Quadro & Missões</span>
                </Link>
              </>
            )}

            <Link
              to="/agenda"
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                isAgenda
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              } ${!permissoes.agenda ? 'opacity-70' : ''}`}
            >
              {!permissoes.agenda ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span>Agenda 📅</span>
            </Link>
          </nav>

          {/* Governança Parental: Criança Ativa + Botão "Acessar como Responsável" protegido por PIN */}
          <div className="flex items-center gap-2">
            {tipoConta === 'crianca' ? (
              <>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-xl text-xs font-bold text-white shadow-xs">
                  <span>🧒</span>
                  <span className="max-w-[110px] truncate">
                    {criancaUsuario?.nome_exibicao?.split(' ')[0] ||
                      criancaSelecionada?.nome.split(' ')[0] ||
                      'Criança'}
                  </span>
                </div>

                {/* Botão "Acessar como Responsável" que exige o PIN Parental */}
                <button
                  type="button"
                  onClick={() => {
                    setPinDigitado('')
                    setErroPinGate(null)
                    setParentalGateAberto(true)
                  }}
                  className="bg-black/25 hover:bg-black/40 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Acessar como Responsável ou alterar configurações de segurança (Exige PIN do Responsável)"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acessar como Responsável</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold p-1.5 rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              /* Responsável no Modo Criança (com PIN) */
              <>
                {criancas.length > 1 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuTrocaAluno(!menuTrocaAluno)}
                      className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                    >
                      <span className="max-w-[100px] truncate">
                        {criancaSelecionada?.nome.split(' ')[0] || 'Aluno'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </button>

                    {menuTrocaAluno && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-amber-100 py-1 z-40 text-slate-800">
                        <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                          Trocar de aluno
                        </p>
                        {criancas.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              selecionarCrianca(c)
                              setMenuTrocaAluno(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 flex items-center justify-between ${
                              c.id === criancaSelecionada?.id
                                ? 'text-amber-600 bg-amber-50/50'
                                : 'text-slate-700'
                            }`}
                          >
                            <span className="truncate">{c.nome}</span>
                            {c.id === criancaSelecionada?.id && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-xl text-xs font-bold">
                    <span>⭐</span>
                    <span className="max-w-[100px] truncate">
                      {criancaSelecionada?.nome.split(' ')[0] || 'Aluno'}
                    </span>
                  </div>
                )}

                {/* Botão "Acessar como Responsável" que exige o PIN Parental */}
                <button
                  type="button"
                  onClick={abrirModalSairModo}
                  className="bg-black/25 hover:bg-black/40 active:bg-black/50 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-inner cursor-pointer"
                  title="Acessar como Responsável (Exige PIN Parental)"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acessar como Responsável</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal Parental Gate para conta direta de criança tentando acessar painel do responsável ou configurações de segurança */}
      {parentalGateAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-amber-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Parental Gate — PIN do Responsável
                </h3>
                <p className="text-xs text-slate-500">
                  Configurações de segurança e painel do responsável são bloqueados no acesso da
                  criança.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmarParentalGate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Digite o PIN de 4 dígitos do Responsável:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={pinDigitado}
                  onChange={(e) => setPinDigitado(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-amber-300 text-center text-xl font-black tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Dica da conta de demonstração: <strong>1234</strong>
                </p>
              </div>

              {erroPinGate && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 text-center">
                  {erroPinGate}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setParentalGateAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Continuar como Criança
                </button>
                <button
                  type="submit"
                  disabled={pinDigitado.length !== 4 || verificandoPinGate}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-black shadow-sm cursor-pointer"
                >
                  {verificandoPinGate ? 'Validando...' : 'Desbloquear Painel 🔓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Controle (quando responsável ativou Modo Criança) */}
      {tipoConta !== 'crianca' && (
        <>
          <SairModoCriancaModal isOpen={modalSairModoAberto} onClose={fecharModalSairModo} />
          <ConfigurarPinModal
            isOpen={modalConfigurarPinAberto}
            onClose={fecharModalConfigurarPin}
          />
        </>
      )}
    </>
  )
}
