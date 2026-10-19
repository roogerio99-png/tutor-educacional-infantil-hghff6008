import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'
import {
  BookOpen,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserPlus,
  Compass,
  TrendingUp,
  Brain,
  CheckCircle2,
} from 'lucide-react'

export default function Index() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#4A3B32] flex flex-col">
      {/* Topo / Navbar da Landing */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EADBCE]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/filhos')}
                className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                <span>Ir para Meus Filhos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold text-[#4A3B32] hover:text-[#F28C28] px-3 py-2 transition-colors"
                >
                  Já tenho conta
                </Link>
                <Link
                  to="/cadastro"
                  className="bg-[#F28C28] hover:bg-[#D97A1A] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Começar agora
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 1. SEÇÃO HERO */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FBEFE0] border border-[#EADBCE] text-xs font-bold text-[#F28C28]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Educação personalizada e acolhedora</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#4A3B32] tracking-tight leading-[1.15]">
              Um tutor que ensina do jeito que{' '}
              <span className="text-[#F28C28] underline decoration-[#FBEFE0] decoration-wavy underline-offset-8">
                seu filho aprende
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#9C8B7D] font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              O Aprende+ Tutor acompanha as atividades escolares, identifica dificuldades e constrói
              uma base de conhecimento sobre cada criança — sem dar respostas prontas, explorando
              diferentes formas de ensino.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                to="/cadastro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#D97A1A] text-white px-7 py-3.5 rounded-2xl font-bold text-base shadow-soft hover:shadow-soft-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Começar agora</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FBEFE0] border border-[#EADBCE] text-[#4A3B32] px-6 py-3.5 rounded-2xl font-bold text-base transition-all"
              >
                <span>Já tenho conta</span>
              </Link>
            </div>

            {/* Credenciais de demonstração rápida */}
            <div className="pt-4 p-4 rounded-2xl bg-[#FBEFE0]/70 border border-[#EADBCE] text-left max-w-lg">
              <p className="text-xs font-bold text-[#4A3B32] mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#3DA64C]" />
                Conta de teste pronta para validação:
              </p>
              <p className="text-xs text-[#9C8B7D]">
                E-mail: <strong className="text-[#4A3B32] font-mono">
                  roogerio99@gmail.com
                </strong> |
                Senha: <strong className="text-[#4A3B32] font-mono">Skip@Pass</strong>
              </p>
            </div>
          </div>

          {/* Ilustração tridimensional / estilizada com criança, robô arredondado e livros */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[440px] aspect-square rounded-3xl bg-gradient-to-br from-[#FBEFE0] via-white to-[#F6DEC7] p-6 shadow-soft border border-[#EADBCE] flex items-center justify-center overflow-hidden">
              {/* Círculos decorativos de fundo */}
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#F28C28]/15 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#3DA64C]/10 rounded-full blur-2xl" />

              {/* SVG Ilustrativo rico e amigável */}
              <svg viewBox="0 0 400 400" className="w-full h-full relative z-10" fill="none">
                {/* Mesa de estudos */}
                <ellipse cx="200" cy="340" rx="170" ry="32" fill="#EAD5C3" opacity="0.6" />
                <rect x="50" y="310" width="300" height="18" rx="9" fill="#D4B69B" />
                <rect x="70" y="328" width="16" height="50" rx="4" fill="#BC9A7E" />
                <rect x="314" y="328" width="16" height="50" rx="4" fill="#BC9A7E" />

                {/* Livros empilhados */}
                <g>
                  <rect x="70" y="290" width="65" height="12" rx="3" fill="#D64545" />
                  <rect x="74" y="278" width="58" height="11" rx="3" fill="#3DA64C" />
                  <rect x="72" y="266" width="60" height="11" rx="3" fill="#F2A93B" />
                  <path
                    d="M72 266 L132 266"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                </g>

                {/* Tablet com gráfico */}
                <g transform="rotate(-6 150 290)">
                  <rect x="135" y="255" width="48" height="58" rx="6" fill="#4A3B32" />
                  <rect x="138" y="258" width="42" height="52" rx="4" fill="#FFF8F0" />
                  <path
                    d="M143 295 L150 282 L160 288 L174 270"
                    stroke="#F28C28"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="174" cy="270" r="3" fill="#F28C28" />
                </g>

                {/* Robô amigável arredondado (Tutor) */}
                <g>
                  {/* Sombra robô */}
                  <ellipse cx="285" cy="305" rx="40" ry="12" fill="#000000" opacity="0.12" />
                  {/* Antena com coração */}
                  <path
                    d="M285 140 L285 115"
                    stroke="#F28C28"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="285" cy="110" r="9" fill="#F28C28" />
                  <path
                    d="M285 108 C285 105 287 103 289 105 C291 107 291 109 285 113 C279 109 279 107 281 105 C283 103 285 105 285 108 Z"
                    fill="white"
                  />
                  {/* Cabeça do robô */}
                  <rect
                    x="245"
                    y="135"
                    width="80"
                    height="66"
                    rx="28"
                    fill="#FFFFFF"
                    stroke="#EADBCE"
                    strokeWidth="3"
                  />
                  {/* Rosto / Visor */}
                  <rect x="254" y="145" width="62" height="42" rx="18" fill="#4A3B32" />
                  {/* Olhos gentis felizes em arco */}
                  <path
                    d="M266 168 Q271 160 276 168"
                    stroke="#F28C28"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M294 168 Q299 160 304 168"
                    stroke="#F28C28"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Bochechas rosadas */}
                  <ellipse cx="264" cy="176" rx="4" ry="2" fill="#F28C28" opacity="0.6" />
                  <ellipse cx="306" cy="176" rx="4" ry="2" fill="#F28C28" opacity="0.6" />
                  {/* Sorriso do robô */}
                  <path
                    d="M281 176 Q285 180 289 176"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Corpo do robô */}
                  <rect
                    x="250"
                    y="208"
                    width="70"
                    height="74"
                    rx="24"
                    fill="#FBEFE0"
                    stroke="#EADBCE"
                    strokeWidth="3"
                  />
                  {/* Luz no peito */}
                  <circle
                    cx="285"
                    cy="242"
                    r="14"
                    fill="#FFFFFF"
                    stroke="#F28C28"
                    strokeWidth="2"
                  />
                  <path
                    d="M280 242 L290 242 M285 237 L285 247"
                    stroke="#F28C28"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Braço acolhedor */}
                  <path
                    d="M250 230 Q225 240 235 260"
                    stroke="#F28C28"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <circle cx="235" cy="260" r="5" fill="#E06A10" />
                  <path
                    d="M320 230 Q338 245 330 262"
                    stroke="#F28C28"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <circle cx="330" cy="262" r="5" fill="#E06A10" />
                </g>

                {/* Criança estudando e sorrindo */}
                <g>
                  {/* Cabelo de trás */}
                  <circle cx="180" cy="178" r="32" fill="#5C3D2E" />
                  {/* Cabeça */}
                  <circle cx="180" cy="180" r="28" fill="#FFD7BA" />
                  {/* Franja estilosa */}
                  <path d="M154 175 Q175 150 205 170 Q190 156 160 162 Z" fill="#4A2E1B" />
                  <circle cx="165" cy="165" r="12" fill="#4A2E1B" />
                  {/* Olhos e sorriso da criança */}
                  <circle cx="174" cy="180" r="3" fill="#4A3B32" />
                  <circle cx="192" cy="180" r="3" fill="#4A3B32" />
                  <path
                    d="M180 188 Q184 194 188 188"
                    stroke="#C25953"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Bochechas */}
                  <circle cx="168" cy="184" r="3" fill="#FF8E72" opacity="0.5" />
                  <circle cx="196" cy="184" r="3" fill="#FF8E72" opacity="0.5" />

                  {/* Corpo/camisa */}
                  <path d="M155 212 Q180 202 205 212 L215 285 L145 285 Z" fill="#3DA64C" rx="10" />
                  <path d="M176 210 L184 210 L180 226 Z" fill="#FFD7BA" />
                  {/* Braço apoiando caderno */}
                  <path
                    d="M152 230 Q140 260 170 270"
                    stroke="#FFD7BA"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M198 230 Q215 255 190 272"
                    stroke="#FFD7BA"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Lápis na mão */}
                  <path
                    d="M188 266 L178 280"
                    stroke="#F28C28"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <polygon points="178,280 176,284 180,283" fill="#4A3B32" />
                </g>

                {/* Brilhos mágicos de conhecimento */}
                <g>
                  <path
                    d="M210 110 L213 118 L221 121 L213 124 L210 132 L207 124 L199 121 L207 118 Z"
                    fill="#F2A93B"
                  />
                  <path
                    d="M130 140 L132 145 L137 147 L132 149 L130 154 L128 149 L123 147 L128 145 Z"
                    fill="#F28C28"
                  />
                  <path
                    d="M330 110 L332 115 L337 117 L332 119 L330 124 L328 119 L323 117 L328 115 Z"
                    fill="#3DA64C"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO "O QUE OFERECEMOS" */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#EADBCE]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#4A3B32] tracking-tight">
              O que oferecemos
            </h2>
            <p className="text-sm sm:text-base text-[#9C8B7D] mt-2 font-medium">
              Ferramentas inteligentes e sensíveis para apoiar você e seu filho na rotina de
              estudos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Cartão 1 */}
            <div className="p-7 rounded-3xl bg-[#FFF8F0] border border-[#EADBCE] shadow-soft card-hover-lift flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-[#F28C28]/15 text-[#F28C28] flex items-center justify-center mb-5">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#4A3B32] mb-2.5">Atividades escolares</h3>
                <p className="text-sm text-[#9C8B7D] leading-relaxed">
                  Atividades alinhadas ao que a criança estuda na escola, com acompanhamento do
                  progresso.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#EADBCE]/60 flex items-center gap-1.5 text-xs font-bold text-[#F28C28]">
                <span>Acompanhamento real</span>
              </div>
            </div>

            {/* Cartão 2 */}
            <div className="p-7 rounded-3xl bg-[#FFF8F0] border border-[#EADBCE] shadow-soft card-hover-lift flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-[#D64545]/15 text-[#D64545] flex items-center justify-center mb-5">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#4A3B32] mb-2.5">
                  Identificação de dificuldades
                </h3>
                <p className="text-sm text-[#9C8B7D] leading-relaxed">
                  Registre e acompanhe as dificuldades observadas em cada matéria.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#EADBCE]/60 flex items-center gap-1.5 text-xs font-bold text-[#D64545]">
                <span>Diagnóstico contínuo</span>
              </div>
            </div>

            {/* Cartão 3 */}
            <div className="p-7 rounded-3xl bg-[#FFF8F0] border border-[#EADBCE] shadow-soft card-hover-lift flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-[#3DA64C]/15 text-[#3DA64C] flex items-center justify-center mb-5">
                  <Brain className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#4A3B32] mb-2.5">Ensino personalizado</h3>
                <p className="text-sm text-[#9C8B7D] leading-relaxed">
                  Cada criança aprende de um jeito. A base de conhecimento do Aprende+ guarda o que
                  funciona para o seu filho.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#EADBCE]/60 flex items-center gap-1.5 text-xs font-bold text-[#3DA64C]">
                <span>Memória de aprendizagem</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO "COMO FUNCIONA" */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#4A3B32] tracking-tight">
            Como funciona
          </h2>
          <p className="text-sm sm:text-base text-[#9C8B7D] mt-2 font-medium">
            Em quatro passos simples, você constrói uma jornada de estudo muito mais tranquila e
            acolhedora.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Passo 1 */}
          <div className="relative bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-soft flex flex-col items-start card-hover-lift">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="w-8 h-8 rounded-full bg-[#F28C28] text-white font-black text-sm flex items-center justify-center">
                1
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#FBEFE0] text-[#F28C28] flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-extrabold text-base text-[#4A3B32] mb-1.5">
              Crie o perfil do seu filho
            </h3>
            <p className="text-xs sm:text-sm text-[#9C8B7D]">
              Cadastre nome, idade, série escolar e os primeiros detalhes da rotina de aprendizado.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="relative bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-soft flex flex-col items-start card-hover-lift">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="w-8 h-8 rounded-full bg-[#F28C28] text-white font-black text-sm flex items-center justify-center">
                2
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#FBEFE0] text-[#F28C28] flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-extrabold text-base text-[#4A3B32] mb-1.5">
              Registre as dificuldades
            </h3>
            <p className="text-xs sm:text-sm text-[#9C8B7D]">
              Aponte as matérias e os tópicos em que surgem bloqueios ou frustrações nas lições.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="relative bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-soft flex flex-col items-start card-hover-lift">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="w-8 h-8 rounded-full bg-[#F28C28] text-white font-black text-sm flex items-center justify-center">
                3
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#FBEFE0] text-[#F28C28] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-extrabold text-base text-[#4A3B32] mb-1.5">Acompanhe a base</h3>
            <p className="text-xs sm:text-sm text-[#9C8B7D]">
              Anote o que funciona: metáforas, pausas, materiais concretos e abordagens visuais.
            </p>
          </div>

          {/* Passo 4 */}
          <div className="relative bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-soft flex flex-col items-start card-hover-lift">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="w-8 h-8 rounded-full bg-[#F28C28] text-white font-black text-sm flex items-center justify-center">
                4
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#FBEFE0] text-[#F28C28] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-extrabold text-base text-[#4A3B32] mb-1.5">Evolua com o tempo</h3>
            <p className="text-xs sm:text-sm text-[#9C8B7D]">
              Veja a confiança da criança florescer conforme o método se adapta à forma natural como
              ela pensa.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO CTA FINAL COM GRADIENTE QUENTE */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-[1200px] mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-[#F28C28] via-[#E8771A] to-[#D96B10] p-8 sm:p-12 text-white shadow-xl text-center relative overflow-hidden">
          {/* Decorações sutis */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Pronto para começar?</h2>
            <p className="text-white/90 text-sm sm:text-base font-medium">
              Crie sua conta gratuita em menos de 1 minuto e comece a registrar os primeiros passos
              do seu filho.
            </p>
            <div className="pt-2">
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#F28C28] hover:bg-[#FFF8F0] px-8 py-3.5 rounded-2xl font-black text-base shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Criar conta gratuita</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé da Landing */}
      <footer className="border-t border-[#EADBCE] bg-white py-8 px-4 text-center text-xs text-[#9C8B7D] mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <span>
            Aprende+ Tutor — educação personalizada para crianças &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  )
}
