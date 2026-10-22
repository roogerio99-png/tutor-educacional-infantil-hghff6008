import React from 'react'

export interface EsquemaVisualMatéria {
  id: string
  titulo: string
  descricao: string
  icone: string
}

// 1. MATEMÁTICA: Frações (Barra de fração dividida) + Reta Numérica + Blocos de contagem
export const SvgMatematica: React.FC<{ acessibilidadeReforcada?: boolean }> = ({
  acessibilidadeReforcada,
}) => (
  <svg
    viewBox="0 0 400 240"
    className="w-full h-auto rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200"
    role="img"
    aria-label="Esquema visual determinístico de Frações e Reta Numérica"
  >
    <defs>
      <pattern id="grid-math" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fed7aa" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="400" height="240" fill="url(#grid-math)" opacity="0.6" />

    {/* Título visual interno */}
    <text
      x="20"
      y="28"
      fill="#78350f"
      fontSize={acessibilidadeReforcada ? '14' : '12'}
      fontWeight="bold"
      fontFamily="Nunito, sans-serif"
    >
      BARRA DE FRAÇÃO (3/4 = Três partes de quatro)
    </text>

    {/* Barra de fração 4 partes */}
    <g transform="translate(20, 42)">
      {/* 3 partes preenchidas */}
      <rect x="0" y="0" width="85" height="42" fill="#f59e0b" rx="6" />
      <text x="42" y="26" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">
        1/4
      </text>

      <rect x="90" y="0" width="85" height="42" fill="#f59e0b" rx="6" />
      <text x="132" y="26" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">
        1/4
      </text>

      <rect x="180" y="0" width="85" height="42" fill="#f59e0b" rx="6" />
      <text x="222" y="26" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">
        1/4
      </text>

      {/* 1 parte vazia */}
      <rect
        x="270"
        y="0"
        width="85"
        height="42"
        fill="#ffffff"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeDasharray="4 3"
        rx="6"
      />
      <text x="312" y="26" fill="#d97706" fontWeight="bold" fontSize="13" textAnchor="middle">
        1/4
      </text>
    </g>

    {/* Reta Numérica */}
    <g transform="translate(20, 115)">
      <text
        x="0"
        y="12"
        fill="#78350f"
        fontSize={acessibilidadeReforcada ? '13' : '11'}
        fontWeight="bold"
        fontFamily="Nunito, sans-serif"
      >
        RETA NUMÉRICA (Saltos iguais de 0 a 1)
      </text>

      {/* Linha principal */}
      <line
        x1="10"
        y1="36"
        x2="350"
        y2="36"
        stroke="#b45309"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Setas */}
      <polygon points="352,36 344,31 344,41" fill="#b45309" />
      <polygon points="8,36 16,31 16,41" fill="#b45309" />

      {/* Marcações */}
      {/* 0 */}
      <line x1="25" y1="26" x2="25" y2="46" stroke="#b45309" strokeWidth="2.5" />
      <text x="25" y="62" fill="#78350f" fontWeight="bold" fontSize="12" textAnchor="middle">
        0
      </text>

      {/* 1/4 */}
      <line x1="105" y1="29" x2="105" y2="43" stroke="#b45309" strokeWidth="2" />
      <text x="105" y="62" fill="#b45309" fontWeight="600" fontSize="11" textAnchor="middle">
        1/4
      </text>

      {/* 2/4 (1/2) */}
      <line x1="185" y1="26" x2="185" y2="46" stroke="#b45309" strokeWidth="2.5" />
      <text x="185" y="62" fill="#78350f" fontWeight="bold" fontSize="12" textAnchor="middle">
        1/2
      </text>

      {/* 3/4 */}
      <line x1="265" y1="29" x2="265" y2="43" stroke="#d97706" strokeWidth="2" />
      <circle cx="265" cy="36" r="5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
      <text x="265" y="62" fill="#b45309" fontWeight="bold" fontSize="12" textAnchor="middle">
        3/4 ⭐
      </text>

      {/* 1 */}
      <line x1="335" y1="26" x2="335" y2="46" stroke="#b45309" strokeWidth="2.5" />
      <text x="335" y="62" fill="#78350f" fontWeight="bold" fontSize="12" textAnchor="middle">
        1
      </text>
    </g>

    {/* Blocos de contagem */}
    <g transform="translate(20, 195)">
      <rect x="0" y="0" width="360" height="32" fill="#fed7aa" rx="8" />
      <text
        x="180"
        y="21"
        fill="#9a3412"
        fontWeight="bold"
        fontSize={acessibilidadeReforcada ? '12' : '11'}
        textAnchor="middle"
      >
        Dica: Denominador (baixo) = total de partes | Numerador (cima) = partes selecionadas
      </text>
    </g>
  </svg>
)

// 2. CIÊNCIAS: Fotossíntese & Ciclo da Água (Sol + Folha + Raiz + Respiração)
export const SvgCiencias: React.FC<{ acessibilidadeReforcada?: boolean }> = ({
  acessibilidadeReforcada,
}) => (
  <svg
    viewBox="0 0 400 240"
    className="w-full h-auto rounded-2xl bg-gradient-to-b from-sky-50 via-emerald-50 to-amber-50 border border-emerald-200"
    role="img"
    aria-label="Esquema visual determinístico da Fotossíntese e Ciclo da Água"
  >
    {/* Sol */}
    <g transform="translate(45, 45)">
      <circle cx="0" cy="0" r="24" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
      {/* Raios solares */}
      {[-45, 0, 45, 90, 135, 180, 225, 270].map((ang, i) => (
        <line
          key={i}
          x1={Math.cos((ang * Math.PI) / 180) * 30}
          y1={Math.sin((ang * Math.PI) / 180) * 30}
          x2={Math.cos((ang * Math.PI) / 180) * 38}
          y2={Math.sin((ang * Math.PI) / 180) * 38}
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}
      <text x="0" y="5" fill="#78350f" fontSize="11" fontWeight="bold" textAnchor="middle">
        Sol ☀️
      </text>
    </g>

    {/* Nuvem e Chuva (Ciclo da água) */}
    <g transform="translate(320, 40)">
      <path
        d="M -30,0 C -30,-15 -15,-25 0,-20 C 10,-30 30,-25 35,-10 C 45,-10 48,5 40,15 C 35,22 -20,22 -30,0 Z"
        fill="#e0f2fe"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <text x="5" y="2" fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle">
        Nuvem 💧
      </text>
      {/* Gotinhas */}
      <line
        x1="-10"
        y1="24"
        x2="-14"
        y2="34"
        stroke="#0284c7"
        strokeWidth="2"
        strokeDasharray="3 2"
      />
      <line x1="5" y1="24" x2="1" y2="34" stroke="#0284c7" strokeWidth="2" strokeDasharray="3 2" />
      <line
        x1="20"
        y1="24"
        x2="16"
        y2="34"
        stroke="#0284c7"
        strokeWidth="2"
        strokeDasharray="3 2"
      />
    </g>

    {/* Planta Central com Folha e Raiz */}
    <g transform="translate(190, 110)">
      {/* Caule */}
      <path
        d="M 0,90 Q -5,30 5,-15"
        stroke="#15803d"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Folha Esquerda (absorve CO2 e Luz) */}
      <path
        d="M 0,25 C -50,15 -60,-15 0,-5 C -20,10 -30,20 0,25 Z"
        fill="#22c55e"
        stroke="#16a34a"
        strokeWidth="2"
      />
      <line x1="0" y1="25" x2="-35" y2="5" stroke="#15803d" strokeWidth="1.5" />

      {/* Folha Direita (libera O2 e produz Glicose) */}
      <path
        d="M 5,45 C 55,35 65,5 5,15 C 25,30 35,40 5,45 Z"
        fill="#22c55e"
        stroke="#16a34a"
        strokeWidth="2"
      />
      <line x1="5" y1="45" x2="40" y2="25" stroke="#15803d" strokeWidth="1.5" />

      {/* Flor no topo */}
      <circle cx="5" cy="-22" r="12" fill="#f43f5e" />
      <circle cx="5" cy="-22" r="6" fill="#fef08a" />

      {/* Solo e Raízes */}
      <path d="M -90,95 L 90,95" stroke="#854d0e" strokeWidth="4" />
      <path
        d="M 0,95 Q -15,115 -25,125 M 0,95 Q 5,115 10,128 M 0,95 Q 20,110 30,122"
        stroke="#a16207"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>

    {/* Legendas Pedagógicas */}
    {/* Entrada CO2 */}
    <rect
      x="25"
      y="95"
      width="85"
      height="34"
      rx="6"
      fill="#f0fdf4"
      stroke="#86efac"
      strokeWidth="1.5"
    />
    <text x="67" y="110" fill="#166534" fontSize="10" fontWeight="bold" textAnchor="middle">
      Gás Carbônico
    </text>
    <text x="67" y="122" fill="#15803d" fontSize="9" textAnchor="middle">
      Entra pelas folhas 🍃
    </text>

    {/* Saída Oxigênio */}
    <rect
      x="280"
      y="95"
      width="95"
      height="34"
      rx="6"
      fill="#eff6ff"
      stroke="#93c5fd"
      strokeWidth="1.5"
    />
    <text x="327" y="110" fill="#1e40af" fontSize="10" fontWeight="bold" textAnchor="middle">
      Oxigênio (O₂)
    </text>
    <text x="327" y="122" fill="#2563eb" fontSize="9" textAnchor="middle">
      Ar puro que respiramos ✨
    </text>

    {/* Água da Raiz */}
    <rect
      x="25"
      y="170"
      width="105"
      height="32"
      rx="6"
      fill="#f0f9ff"
      stroke="#bae6fd"
      strokeWidth="1.5"
    />
    <text x="77" y="184" fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle">
      Água & Minerais
    </text>
    <text x="77" y="196" fill="#0284c7" fontSize="9" textAnchor="middle">
      Absorvidos da raiz 💧
    </text>

    {/* Glicose / Alimento */}
    <rect
      x="260"
      y="170"
      width="115"
      height="32"
      rx="6"
      fill="#fdf4ff"
      stroke="#f0abfc"
      strokeWidth="1.5"
    />
    <text x="317" y="184" fill="#86198f" fontSize="10" fontWeight="bold" textAnchor="middle">
      Glicose (Alimento)
    </text>
    <text x="317" y="196" fill="#a21caf" fontSize="9" textAnchor="middle">
      Nutre o crescimento 🌱
    </text>

    {/* Rodapé explicativo */}
    <text
      x="200"
      y="228"
      fill="#166534"
      fontSize={acessibilidadeReforcada ? '12' : '10'}
      fontWeight="bold"
      textAnchor="middle"
      fontFamily="Nunito, sans-serif"
    >
      Fórmula: Água + Luz Solar + CO₂ = Glicose + Oxigênio
    </text>
  </svg>
)

// 3. PORTUGUÊS: Mapa de Sílabas, Famílias Silábicas e Estrutura de Frase
export const SvgPortugues: React.FC<{ acessibilidadeReforcada?: boolean }> = ({
  acessibilidadeReforcada,
}) => (
  <svg
    viewBox="0 0 400 240"
    className="w-full h-auto rounded-2xl bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50 border border-rose-200"
    role="img"
    aria-label="Esquema visual determinístico de Português e Formação de Frases"
  >
    <text
      x="20"
      y="26"
      fill="#881337"
      fontSize={acessibilidadeReforcada ? '14' : '12'}
      fontWeight="bold"
      fontFamily="Nunito, sans-serif"
    >
      ESTRUTURA DE UMA FRASE COMPLETA
    </text>

    {/* 3 Blocos de frase: Quem? (Sujeito) + O que faz? (Verbo) + Onde/Como? (Complemento) */}
    <g transform="translate(15, 38)">
      {/* Bloco 1: Sujeito */}
      <rect
        x="0"
        y="0"
        width="115"
        height="54"
        rx="10"
        fill="#fecdd3"
        stroke="#f43f5e"
        strokeWidth="2"
      />
      <text x="57" y="22" fill="#9f1239" fontWeight="bold" fontSize="12" textAnchor="middle">
        1. QUEM?
      </text>
      <text x="57" y="38" fill="#e11d48" fontWeight="600" fontSize="11" textAnchor="middle">
        "A coruja sábia"
      </text>

      {/* Seta */}
      <text x="123" y="32" fill="#f43f5e" fontSize="16" fontWeight="bold">
        +
      </text>

      {/* Bloco 2: Ação */}
      <rect
        x="135"
        y="0"
        width="105"
        height="54"
        rx="10"
        fill="#fed7aa"
        stroke="#f97316"
        strokeWidth="2"
      />
      <text x="187" y="22" fill="#9a3412" fontWeight="bold" fontSize="12" textAnchor="middle">
        2. AÇÃO (Verbo)
      </text>
      <text x="187" y="38" fill="#ea580c" fontWeight="600" fontSize="11" textAnchor="middle">
        "observa"
      </text>

      {/* Seta */}
      <text x="247" y="32" fill="#f97316" fontSize="16" fontWeight="bold">
        +
      </text>

      {/* Bloco 3: Complemento */}
      <rect
        x="260"
        y="0"
        width="110"
        height="54"
        rx="10"
        fill="#bbf7d0"
        stroke="#22c55e"
        strokeWidth="2"
      />
      <text x="315" y="22" fill="#14532d" fontWeight="bold" fontSize="12" textAnchor="middle">
        3. O QUÊ?
      </text>
      <text x="315" y="38" fill="#16a34a" fontWeight="600" fontSize="11" textAnchor="middle">
        "a floresta."
      </text>
    </g>

    {/* Mapa de Sílabas e Dificuldade (Ç, SS, R/RR) */}
    <g transform="translate(15, 110)">
      <text
        x="0"
        y="14"
        fill="#881337"
        fontSize={acessibilidadeReforcada ? '13' : '11'}
        fontWeight="bold"
        fontFamily="Nunito, sans-serif"
      >
        DIVISÃO SILÁBICA & REGRAS DE OURO
      </text>

      <g transform="translate(0, 26)">
        {/* Caixa sílaba 1 */}
        <rect
          x="0"
          y="0"
          width="80"
          height="42"
          rx="8"
          fill="#ffffff"
          stroke="#fda4af"
          strokeWidth="2"
        />
        <text x="40" y="26" fill="#be123c" fontWeight="bold" fontSize="14" textAnchor="middle">
          CO
        </text>

        <text x="86" y="26" fill="#be123c" fontWeight="bold" fontSize="16">
          -
        </text>

        {/* Caixa sílaba 2 */}
        <rect
          x="98"
          y="0"
          width="80"
          height="42"
          rx="8"
          fill="#ffffff"
          stroke="#fda4af"
          strokeWidth="2"
        />
        <text x="138" y="26" fill="#be123c" fontWeight="bold" fontSize="14" textAnchor="middle">
          RA
        </text>

        <text x="184" y="26" fill="#be123c" fontWeight="bold" fontSize="16">
          -
        </text>

        {/* Caixa sílaba 3 com Ç */}
        <rect
          x="196"
          y="0"
          width="80"
          height="42"
          rx="8"
          fill="#ffe4e6"
          stroke="#e11d48"
          strokeWidth="2.5"
        />
        <text
          x="236"
          y="26"
          fill="#9f1239"
          fontWeight="extrabold"
          fontSize="15"
          textAnchor="middle"
        >
          ÇÃO 💖
        </text>

        <rect
          x="286"
          y="0"
          width="85"
          height="42"
          rx="8"
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        <text x="328" y="18" fill="#92400e" fontWeight="bold" fontSize="9" textAnchor="middle">
          3 Sílabas
        </text>
        <text x="328" y="32" fill="#b45309" fontWeight="bold" fontSize="9" textAnchor="middle">
          Trissílaba
        </text>
      </g>
    </g>

    {/* Regra de Ortografia */}
    <g transform="translate(15, 192)">
      <rect
        x="0"
        y="0"
        width="370"
        height="34"
        rx="8"
        fill="#fff1f2"
        stroke="#fecdd3"
        strokeWidth="1"
      />
      <text
        x="185"
        y="21"
        fill="#9f1239"
        fontWeight="bold"
        fontSize={acessibilidadeReforcada ? '12' : '10.5'}
        textAnchor="middle"
      >
        💡 Regra do Ç: nunca no início de palavras! Usa-se antes de A, O, U.
      </text>
    </g>
  </svg>
)

// 4. HISTÓRIA: Linha do Tempo Visual do Brasil e dos Povos
export const SvgHistoria: React.FC<{ acessibilidadeReforcada?: boolean }> = ({
  acessibilidadeReforcada,
}) => (
  <svg
    viewBox="0 0 400 240"
    className="w-full h-auto rounded-2xl bg-gradient-to-b from-amber-50 via-stone-50 to-orange-50 border border-amber-300"
    role="img"
    aria-label="Linha do tempo histórica dos povos e transformações"
  >
    <text
      x="20"
      y="26"
      fill="#451a03"
      fontSize={acessibilidadeReforcada ? '14' : '12'}
      fontWeight="bold"
      fontFamily="Nunito, sans-serif"
    >
      LINHA DO TEMPO: ANTES, DURANTE E DEPOIS 📜
    </text>

    {/* Eixo da Linha do Tempo */}
    <line x1="30" y1="90" x2="370" y2="90" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
    <polygon points="375,90 365,84 365,96" fill="#78350f" />

    {/* Marco 1: Povos Originários */}
    <g transform="translate(60, 90)">
      <circle cx="0" cy="0" r="10" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
      <line x1="0" y1="10" x2="0" y2="28" stroke="#15803d" strokeWidth="2" strokeDasharray="2 2" />
      <rect
        x="-45"
        y="30"
        width="90"
        height="52"
        rx="8"
        fill="#f0fdf4"
        stroke="#86efac"
        strokeWidth="1.5"
      />
      <text x="0" y="46" fill="#166534" fontWeight="bold" fontSize="10" textAnchor="middle">
        🏹 Origens
      </text>
      <text x="0" y="60" fill="#15803d" fontSize="9" textAnchor="middle">
        Povos Indígenas
      </text>
      <text x="0" y="73" fill="#166534" fontSize="8" textAnchor="middle">
        Antes de 1500
      </text>
    </g>

    {/* Marco 2: Encontro de Culturas */}
    <g transform="translate(170, 90)">
      <circle cx="0" cy="0" r="10" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
      <line
        x1="0"
        y1="-10"
        x2="0"
        y2="-28"
        stroke="#0369a1"
        strokeWidth="2"
        strokeDasharray="2 2"
      />
      <rect
        x="-45"
        y="-80"
        width="90"
        height="50"
        rx="8"
        fill="#f0f9ff"
        stroke="#bae6fd"
        strokeWidth="1.5"
      />
      <text x="0" y="-64" fill="#075985" fontWeight="bold" fontSize="10" textAnchor="middle">
        ⛵ Caravelas
      </text>
      <text x="0" y="-50" fill="#0284c7" fontSize="9" textAnchor="middle">
        Grandes Viagens
      </text>
      <text x="0" y="-37" fill="#0369a1" fontSize="8" textAnchor="middle">
        Século XVI
      </text>
    </g>

    {/* Marco 3: Vilas e Transformações */}
    <g transform="translate(270, 90)">
      <circle cx="0" cy="0" r="10" fill="#eab308" stroke="#ca8a04" strokeWidth="2.5" />
      <line x1="0" y1="10" x2="0" y2="28" stroke="#ca8a04" strokeWidth="2" strokeDasharray="2 2" />
      <rect
        x="-45"
        y="30"
        width="90"
        height="52"
        rx="8"
        fill="#fefce8"
        stroke="#fde047"
        strokeWidth="1.5"
      />
      <text x="0" y="46" fill="#854d0e" fontWeight="bold" fontSize="10" textAnchor="middle">
        🏛️ Cidades
      </text>
      <text x="0" y="60" fill="#a16207" fontSize="9" textAnchor="middle">
        Comércio e Vilas
      </text>
      <text x="0" y="73" fill="#854d0e" fontSize="8" textAnchor="middle">
        Séculos XVII-XIX
      </text>
    </g>

    {/* Marco 4: Hoje em dia */}
    <g transform="translate(355, 90)">
      <circle cx="0" cy="0" r="10" fill="#ec4899" stroke="#db2777" strokeWidth="2.5" />
      <text x="0" y="-14" fill="#be185d" fontWeight="bold" fontSize="9" textAnchor="middle">
        Hoje 🌍
      </text>
    </g>

    {/* Dica da Lumi */}
    <g transform="translate(20, 192)">
      <rect x="0" y="0" width="360" height="34" rx="8" fill="#fffbeb" stroke="#fef08a" />
      <text
        x="180"
        y="21"
        fill="#78350f"
        fontWeight="bold"
        fontSize={acessibilidadeReforcada ? '12' : '10.5'}
        textAnchor="middle"
      >
        💡 A História investiga os motivos das decisões humanas em cada época.
      </text>
    </g>
  </svg>
)

// 5. GEOGRAFIA: Rosa dos Ventos, Mapa Simplificado e Camadas de Relevo
export const SvgGeografia: React.FC<{ acessibilidadeReforcada?: boolean }> = ({
  acessibilidadeReforcada,
}) => (
  <svg
    viewBox="0 0 400 240"
    className="w-full h-auto rounded-2xl bg-gradient-to-b from-teal-50 via-emerald-50 to-sky-50 border border-teal-200"
    role="img"
    aria-label="Rosa dos ventos e noções de orientação espacial e relevo"
  >
    <text
      x="20"
      y="26"
      fill="#134e4a"
      fontSize={acessibilidadeReforcada ? '14' : '12'}
      fontWeight="bold"
      fontFamily="Nunito, sans-serif"
    >
      ORIENTAÇÃO ESPACIAL & MAPAS 🧭
    </text>

    {/* Rosa dos Ventos determinística à esquerda */}
    <g transform="translate(90, 120)">
      <circle
        cx="0"
        cy="0"
        r="48"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="2"
        strokeDasharray="3 3"
      />

      {/* Pontos Cardeais */}
      {/* Norte */}
      <polygon points="0,0 -8,-15 0,-44" fill="#0d9488" />
      <polygon points="0,0 8,-15 0,-44" fill="#14b8a6" />
      <text x="0" y="-50" fill="#0f766e" fontWeight="extrabold" fontSize="13" textAnchor="middle">
        N
      </text>

      {/* Sul */}
      <polygon points="0,0 -8,15 0,44" fill="#0d9488" />
      <polygon points="0,0 8,15 0,44" fill="#14b8a6" />
      <text x="0" y="58" fill="#0f766e" fontWeight="extrabold" fontSize="13" textAnchor="middle">
        S
      </text>

      {/* Leste */}
      <polygon points="0,0 15,-8 44,0" fill="#0f766e" />
      <polygon points="0,0 15,8 44,0" fill="#14b8a6" />
      <text x="56" y="4" fill="#0f766e" fontWeight="extrabold" fontSize="13" textAnchor="middle">
        L
      </text>

      {/* Oeste */}
      <polygon points="0,0 -15,-8 -44,0" fill="#0f766e" />
      <polygon points="0,0 -15,8 -44,0" fill="#14b8a6" />
      <text x="-56" y="4" fill="#0f766e" fontWeight="extrabold" fontSize="13" textAnchor="middle">
        O
      </text>

      <circle cx="0" cy="0" r="5" fill="#f59e0b" />
    </g>

    {/* Mapa / Relevo simplificado à direita */}
    <g transform="translate(200, 50)">
      <rect
        x="0"
        y="0"
        width="180"
        height="130"
        rx="12"
        fill="#ffffff"
        stroke="#14b8a6"
        strokeWidth="2"
      />
      <text x="90" y="20" fill="#115e59" fontWeight="bold" fontSize="11" textAnchor="middle">
        CAMADAS DE RELEVO
      </text>

      {/* Montanha mais alta */}
      <polygon points="90,40 40,110 140,110" fill="#a7f3d0" stroke="#059669" strokeWidth="1.5" />
      {/* Cume com neve */}
      <polygon points="90,40 76,60 104,60" fill="#ffffff" />
      {/* Rio correndo */}
      <path d="M 90,65 Q 120,85 100,110" stroke="#0284c7" strokeWidth="3" fill="none" />

      {/* Planície embaixo */}
      <rect x="10" y="105" width="160" height="15" fill="#34d399" rx="4" />
      <text x="90" y="117" fill="#065f46" fontWeight="bold" fontSize="9" textAnchor="middle">
        Planície fértil e rios
      </text>
    </g>

    {/* Legenda de escala */}
    <g transform="translate(20, 195)">
      <rect x="0" y="0" width="360" height="32" rx="8" fill="#f0fdfa" stroke="#99f6e4" />
      <text
        x="180"
        y="20"
        fill="#115e59"
        fontWeight="bold"
        fontSize={acessibilidadeReforcada ? '12' : '10.5'}
        textAnchor="middle"
      >
        O Sol sempre nasce a Leste (L) e se põe a Oeste (O)! ☀️
      </text>
    </g>
  </svg>
)

// 6. GERAL / INTERDISCIPLINAR: Mapa Mental de Ideias & Conexões
export const SvgGeral: React.FC<{ acessibilidadeReforcada?: boolean }> = ({
  acessibilidadeReforcada,
}) => (
  <svg
    viewBox="0 0 400 240"
    className="w-full h-auto rounded-2xl bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 border border-purple-200"
    role="img"
    aria-label="Mapa mental de conexões de ideias e raciocínio socrático"
  >
    <text
      x="20"
      y="26"
      fill="#312e81"
      fontSize={acessibilidadeReforcada ? '14' : '12'}
      fontWeight="bold"
      fontFamily="Nunito, sans-serif"
    >
      MAPA MENTAL: CONECTANDO AS PISTAS 💡
    </text>

    {/* Conexões (Linhas pontilhadas) */}
    <line
      x1="200"
      y1="110"
      x2="80"
      y2="70"
      stroke="#c084fc"
      strokeWidth="2.5"
      strokeDasharray="4 3"
    />
    <line
      x1="200"
      y1="110"
      x2="320"
      y2="70"
      stroke="#c084fc"
      strokeWidth="2.5"
      strokeDasharray="4 3"
    />
    <line
      x1="200"
      y1="110"
      x2="100"
      y2="165"
      stroke="#c084fc"
      strokeWidth="2.5"
      strokeDasharray="4 3"
    />
    <line
      x1="200"
      y1="110"
      x2="300"
      y2="165"
      stroke="#c084fc"
      strokeWidth="2.5"
      strokeDasharray="4 3"
    />

    {/* Ideia Central */}
    <g transform="translate(200, 110)">
      <circle cx="0" cy="0" r="38" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="3" />
      <text x="0" y="-5" fill="#ffffff" fontWeight="extrabold" fontSize="13" textAnchor="middle">
        DESAFIO
      </text>
      <text x="0" y="12" fill="#ede9fe" fontWeight="bold" fontSize="10" textAnchor="middle">
        CENTRAL 🎯
      </text>
    </g>

    {/* Nó 1: O que já sei? */}
    <g transform="translate(80, 70)">
      <rect
        x="-55"
        y="-22"
        width="110"
        height="44"
        rx="10"
        fill="#fdf4ff"
        stroke="#d946ef"
        strokeWidth="2"
      />
      <text x="0" y="-3" fill="#86198f" fontWeight="bold" fontSize="10" textAnchor="middle">
        1. O que já sei?
      </text>
      <text x="0" y="11" fill="#c026d3" fontSize="9" textAnchor="middle">
        Conhecimento prévio
      </text>
    </g>

    {/* Nó 2: Pista nova */}
    <g transform="translate(320, 70)">
      <rect
        x="-55"
        y="-22"
        width="110"
        height="44"
        rx="10"
        fill="#f0f9ff"
        stroke="#0ea5e9"
        strokeWidth="2"
      />
      <text x="0" y="-3" fill="#075985" fontWeight="bold" fontSize="10" textAnchor="middle">
        2. Qual é a pista?
      </text>
      <text x="0" y="11" fill="#0284c7" fontSize="9" textAnchor="middle">
        O que o texto diz?
      </text>
    </g>

    {/* Nó 3: Testar hipótese */}
    <g transform="translate(100, 165)">
      <rect
        x="-55"
        y="-22"
        width="110"
        height="44"
        rx="10"
        fill="#ecfdf5"
        stroke="#10b981"
        strokeWidth="2"
      />
      <text x="0" y="-3" fill="#065f46" fontWeight="bold" fontSize="10" textAnchor="middle">
        3. Testar ideias
      </text>
      <text x="0" y="11" fill="#059669" fontSize="9" textAnchor="middle">
        Tentativa e dedução
      </text>
    </g>

    {/* Nó 4: Minha conclusão */}
    <g transform="translate(300, 165)">
      <rect
        x="-55"
        y="-22"
        width="110"
        height="44"
        rx="10"
        fill="#fffbeb"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      <text x="0" y="-3" fill="#78350f" fontWeight="bold" fontSize="10" textAnchor="middle">
        4. Minha conclusão
      </text>
      <text x="0" y="11" fill="#d97706" fontSize="9" textAnchor="middle">
        Ensinar com palavras!
      </text>
    </g>

    {/* Rodapé */}
    <text
      x="200"
      y="226"
      fill="#4338ca"
      fontSize={acessibilidadeReforcada ? '12' : '10.5'}
      fontWeight="bold"
      textAnchor="middle"
      fontFamily="Nunito, sans-serif"
    >
      ✨ Não há erro: cada tentativa nos aproxima da descoberta!
    </text>
  </svg>
)
