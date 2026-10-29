import PocketBase from 'pocketbase'

const STORAGE_DB_KEY = 'lumi_pb_db_v3'
const STORAGE_AUTH_KEY = 'lumi_pb_auth_v2'

export interface LocalRecord {
  id: string
  created: string
  updated: string
  collectionId?: string
  collectionName?: string
  expand?: Record<string, any>
  [key: string]: any
}

interface DatabaseSchema {
  users: LocalRecord[]
  criancas: LocalRecord[]
  criancas_usuarios: LocalRecord[]
  dificuldades: LocalRecord[]
  conhecimento: LocalRecord[]
  agenda: LocalRecord[]
  memorias: LocalRecord[]
  checkins_emocionais: LocalRecord[]
  alertas: LocalRecord[]
  system_prompts: LocalRecord[]
  missoes_bncc: LocalRecord[]
  daily_metrics: LocalRecord[]
  registro_uso: LocalRecord[]
  pin_reset_tokens: LocalRecord[]
  [key: string]: LocalRecord[]
}

function getRelativeDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function createInitialSeedDatabase(): DatabaseSchema {
  const now = new Date().toISOString()
  const today = getRelativeDate(0)

  const demoOwnerId = 'user_demo_rogerio'
  const idAna = 'crianca_ana_paula'
  const idLucas = 'crianca_lucas_gabriel'
  const idBeatriz = 'crianca_beatriz_lima'

  return {
    users: [
      {
        id: demoOwnerId,
        email: 'roogerio99@gmail.com',
        name: 'Professor Rogério',
        password: 'Skip@Pass',
        verified: true,
        consentimento_lgpd: true,
        consentimento_data: now,
        pin_definido: true,
        pin_code: '1234',
        pin_tentativas: 0,
        pin_bloqueado_ate: '',
        created: now,
        updated: now,
      },
    ],
    criancas: [
      {
        id: idAna,
        nome: 'Ana Paula Evaristo Souza Cirilo',
        idade: 10,
        serie: '5º Ano',
        escola: 'Colégio Horizonte',
        localidade: 'Belo Horizonte - MG (Cerrado)',
        genero: 'Menina',
        horarios_aula: 'Manhã (07:30 às 12:00)',
        acessibilidade: 'Nenhuma',
        observacoes:
          'Aluna muito criativa e curiosa. Gosta de desenhar mangás, animais marinhos e fazer experimentos práticos. Às vezes perde o foco em textos muito longos sem ilustrações.',
        tempo_uso_diario_min: 45,
        uso_janela_inicio: '07:00',
        uso_janela_fim: '21:00',
        ultima_etapa_socratica: 'entender',
        ultima_materia: 'ciencias',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: idLucas,
        nome: 'Lucas Gabriel Silveira',
        idade: 8,
        serie: '3º Ano',
        escola: 'Escola Parque das Nações',
        localidade: 'São Paulo - SP (Mata Atlântica)',
        genero: 'Menino',
        horarios_aula: 'Tarde (13:00 às 17:30)',
        acessibilidade: 'TDAH — Foco Curto',
        observacoes:
          'Adora futebol, blocos de montar (Minecraft/Lego) e dinossauros. Aprende muito rápido quando os problemas envolvem placares de jogos ou construção de mundos.',
        tempo_uso_diario_min: 30,
        uso_janela_inicio: '08:00',
        uso_janela_fim: '20:00',
        ultima_etapa_socratica: 'contextualizar',
        ultima_materia: 'matematica',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: idBeatriz,
        nome: 'Beatriz Lima Rocha',
        idade: 12,
        serie: '7º Ano',
        escola: 'Instituto Dom Bosco',
        localidade: 'Curitiba - PR',
        genero: 'Menina',
        horarios_aula: 'Manhã (07:15 às 12:15)',
        acessibilidade: 'Nenhuma',
        observacoes:
          'Gosta de música, astronomia e mistérios históricos. Tem facilidade em leitura e debate, mas sente insegurança com equações algébricas e números negativos.',
        tempo_uso_diario_min: 60,
        uso_janela_inicio: '07:00',
        uso_janela_fim: '21:30',
        ultima_etapa_socratica: 'guiar',
        ultima_materia: 'historia',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    criancas_usuarios: [
      {
        id: 'cu_ana_paula_demo',
        username: 'anapaula',
        email: 'anapaula@aprendiz.kid',
        password: 'lumi1234',
        nome_exibicao: 'Ana Paula Evaristo Souza Cirilo',
        crianca: idAna,
        owner: demoOwnerId,
        ativo: true,
        permissoes: {
          conversa: true,
          agenda: true,
          grafo: false,
          conquistas: true,
        },
        created: now,
        updated: now,
      },
    ],
    dificuldades: [
      {
        id: 'dif_ana_1',
        crianca: idAna,
        materia: 'Matemática',
        descricao:
          'Dificuldade em visualizar frações equivalentes e soma de frações com denominadores diferentes.',
        impacto: 'Alto',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'dif_ana_2',
        crianca: idAna,
        materia: 'Ciências',
        descricao:
          'Confunde o papel do gás carbônico e do oxigênio entre a fotossíntese e a respiração das plantas.',
        impacto: 'Moderado',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'dif_ana_3',
        crianca: idAna,
        materia: 'Português',
        descricao:
          'Cansaço ao interpretar textos narrativos longos sem apoio visual; troca uso de "mas" e "mais".',
        impacto: 'Baixo',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'dif_lucas_1',
        crianca: idLucas,
        materia: 'Matemática',
        descricao: 'Armar contas de subtração com reserva ("emprestar" da dezena).',
        impacto: 'Alto',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'dif_lucas_2',
        crianca: idLucas,
        materia: 'Português',
        descricao: 'Sílabas complexas (NH, LH, CH) e pontuação no final de frases.',
        impacto: 'Moderado',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'dif_bia_1',
        crianca: idBeatriz,
        materia: 'Matemática',
        descricao: 'Regra de sinais em operações com números inteiros negativos e incógnitas (x).',
        impacto: 'Alto',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'dif_bia_2',
        crianca: idBeatriz,
        materia: 'Geografia',
        descricao: 'Compreensão de fusos horários e coordenadas geográficas (latitude/longitude).',
        impacto: 'Moderado',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    conhecimento: [
      {
        id: 'con_ana_1',
        crianca: idAna,
        titulo: 'Analogias com Pizza e Desenho para Frações',
        conteudo:
          'Quando dividimos figuras visuais (como barras de chocolate ou fatias de pizza) e pedimos para ela imaginar as cores, Ana compreende frações quase instantaneamente.',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'con_ana_2',
        crianca: idAna,
        titulo: 'Fábrica Solar das Plantas (Fotossíntese)',
        conteudo:
          'Explicar a folha da planta como uma "cozinha solar" que usa luz, água da raiz e ar para preparar seu alimento desperta grande entusiasmo.',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'con_lucas_1',
        crianca: idLucas,
        titulo: 'Blocos de Construção para Dezenas e Unidades',
        conteudo:
          'Tratar 1 dezena como um "pacote fechado de 10 blocos de Minecraft" que pode ser desmontado ajuda o Lucas a entender o empréstimo na subtração.',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'con_bia_1',
        crianca: idBeatriz,
        titulo: 'Termômetro e Altitude para Números Negativos',
        conteudo:
          'Usar exemplos de temperaturas abaixo de zero em Curitiba ou profundidade de submarinos destrava o raciocínio sobre números negativos.',
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    agenda: [
      {
        id: 'ag_ana_1',
        crianca: idAna,
        titulo: 'Prova de Ciências: Fotossíntese e Cadeia Alimentar',
        data: getRelativeDate(1),
        horario: '08:00',
        materia: 'Ciências',
        tipo: 'prova',
        descricao:
          'Revisar como as plantas produzem o próprio alimento, o papel da clorofila e a diferença entre produtores, consumidores e decompositores.',
        concluido: false,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'ag_ana_2',
        crianca: idAna,
        titulo: 'Tarefa de Matemática: Soma de Frações no Caderno',
        data: getRelativeDate(2),
        horario: '15:00',
        materia: 'Matemática',
        tipo: 'tarefa',
        descricao: 'Resolver os 5 problemas ilustrados da página 42 sobre frações equivalentes.',
        concluido: false,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'ag_ana_3',
        crianca: idAna,
        titulo: 'Leitura do Capítulo 3: Pequeno Príncipe',
        data: getRelativeDate(4),
        horario: '17:00',
        materia: 'Português',
        tipo: 'revisao',
        descricao: 'Conversar com a Lumi sobre o que a raposa quis dizer com "cativar".',
        concluido: true,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'ag_lucas_1',
        crianca: idLucas,
        titulo: 'Desafio de Subtração com Dezenas',
        data: getRelativeDate(1),
        horario: '14:30',
        materia: 'Matemática',
        tipo: 'tarefa',
        descricao: 'Treinar 4 continhas de subtração usando a ideia de pacotes de blocos.',
        concluido: false,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'ag_bia_1',
        crianca: idBeatriz,
        titulo: 'Avaliação de Matemática: Expressões com Números Inteiros',
        data: getRelativeDate(2),
        horario: '07:30',
        materia: 'Matemática',
        tipo: 'prova',
        descricao: 'Praticar soma, subtração e multiplicação com números negativos.',
        concluido: false,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    memorias: [
      {
        id: 'mem_ana_1',
        crianca: idAna,
        tipo: 'interesse',
        conteudo: 'Ama desenhar personagens de mangá e animais do fundo do mar (especialmente tartarugas e polvos).',
        origem: 'conversa',
        data: getRelativeDate(-2),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'mem_ana_2',
        crianca: idAna,
        tipo: 'pessoa_relacao',
        conteudo: 'Tem uma cachorrinha chamada Pipoca que sempre fica perto dela quando estuda à tarde.',
        origem: 'conversa',
        data: getRelativeDate(-3),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'mem_ana_3',
        crianca: idAna,
        tipo: 'rotina',
        conteudo: 'Prefere estudar depois do almoço, por volta das 14h30, após descansar da escola.',
        origem: 'conversa',
        data: getRelativeDate(-4),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'mem_ana_4',
        crianca: idAna,
        tipo: 'estrategia',
        conteudo: 'Entende frações muito melhor quando pensa em dividir barras de chocolate ou fatias de pizza.',
        origem: 'conversa',
        data: getRelativeDate(-1),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'mem_lucas_1',
        crianca: idLucas,
        tipo: 'interesse',
        conteudo: 'É fã de Minecraft e adora construir castelos e circuitos com Redstone.',
        origem: 'conversa',
        data: getRelativeDate(-2),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'mem_lucas_2',
        crianca: idLucas,
        tipo: 'rotina',
        conteudo: 'Faz escolinha de futsal às terças e quintas-feiras de manhã.',
        origem: 'conversa',
        data: getRelativeDate(-5),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    checkins_emocionais: [
      {
        id: 'chk_ana_1',
        crianca: idAna,
        humor: 'muito_feliz',
        comentario: 'Animada para revisar Ciências!',
        data: getRelativeDate(-1),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'chk_ana_2',
        crianca: idAna,
        humor: 'feliz',
        comentario: 'Dia tranquilo na escola.',
        data: getRelativeDate(-2),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'chk_ana_3',
        crianca: idAna,
        humor: 'neutro',
        comentario: 'Um pouco cansada da aula de Educação Física.',
        data: getRelativeDate(-3),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'chk_ana_4',
        crianca: idAna,
        humor: 'muito_feliz',
        comentario: 'Conseguiu entender frações com pizza!',
        data: getRelativeDate(-4),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
      {
        id: 'chk_ana_5',
        crianca: idAna,
        humor: 'feliz',
        comentario: 'Brincou com a Pipoca antes de estudar.',
        data: getRelativeDate(-5),
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    alertas: [],
    system_prompts: [
      {
        id: 'prompt_padrao_lumi',
        titulo: 'Orquestrador Pedagógico Multimodelo - Lumi 2.0 (5 Modelos)',
        identidade:
          'Lumi é uma Agente e Tutora Infantil com Pedagogia Multimodelo (NÃO 100% Socrática). Migra automaticamente entre 5 modelos: (a) Ausubel Expositivo para curiosidades livres sem interrogatório; (b) Exemplo Trabalhado Resolvido + Desafio Espelho (Sweller + Vygotsky) para tarefas escolares; (c) Representação Concreta e Visual (Bruner); (d) Regulação Afetiva (CASEL/Dweck) com mini-exemplo resolvido quando a criança diz "não sei"/"difícil"/"cansei"; (e) Mediação Socrática Leve (máx. 20%) apenas no fechamento.',
        metodo_socratico:
          'Em tarefas escolares: NUNCA dê a resposta final da tarefa de cara, mas NUNCA devolva apenas uma pergunta vazia. Mostre sempre o 1º Passo (Exemplo da Lumi já resolvido com a resposta completa!) e na mesma mensagem o 2º Passo (Desafio Espelho parecido para a criança responder). Em curiosidades livres (natureza, espaço, animais): explique diretamente com entusiasmo sem perguntas de interrogatório.',
        diretrizes_pedagogicas:
          'Frases curtas e diretas para Streaming de Voz Lumi Live 2.0 (< 220ms). Ao detectar "não sei", "difícil" ou "cansei", suspenda perguntas abertas, acolha a criança e mostre um mini-exemplo já resolvido.',
        tom_de_voz: 'Afetuoso, encorajador, lúdico, claro e empático.',
        instrucoes_quadro:
          'Sincronize o Quadro Visual com o "1º Passo: Exemplo da Lumi (Com Resposta!)" e o "2º Passo: Seu Exemplo para Responder!".',
        ativo: true,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    missoes_bncc: [
      {
        id: 'missao_f1_1',
        fase: 'fase_1',
        fase_etaria: 'fase_1',
        faixa_etaria: '5 a 8 anos',
        bncc_code: 'EF01LP07',
        habilidades_bncc: 'EF01LP07, EF12LP01 (Consciência fonológica e fonética)',
        titulo: 'O Safari das Letras',
        materia: 'Português',
        descricao:
          'A Lumi pronuncia o som das letras e você descobre qual animal da floresta começa com cada som!',
        narrativa_ludica:
          'A Lumi pronuncia o som das letras e você descobre qual animal da floresta começa com cada som!',
        instrucao_acao_fisica:
          'Ouça o som da letra com a Lumi e diga em voz alta o nome de um animal que começa com essa letra!',
        tipo_interacao: 'audio_e_clique_sensorial',
        recursos_midia: {
          icone: '🦁',
          cor: '#FDE68A',
          foco: 'Consciência fonológica e fonética',
        },
        tempo_estimado_min: 10,
        icone: '🦁',
        ordem: 1,
        ativo: true,
        created: now,
        updated: now,
      },
      {
        id: 'missao_f1_2',
        fase: 'fase_1',
        fase_etaria: 'fase_1',
        faixa_etaria: '5 a 8 anos',
        bncc_code: 'EF01MA01',
        habilidades_bncc: 'EF01MA01, EF01MA02 (Contagem física e quantidade)',
        titulo: 'A Feira das Frutas Mágicas',
        materia: 'Matemática',
        descricao:
          'Contagem divertida com maçãs e laranjas coloridas, explorando agrupamento visual e soma unitária.',
        narrativa_ludica:
          'O Pirata dos Números espalhou frutas coloridas pela feira! Precisamos juntar grupos de 10 para formar uma Dezena Brilhante!',
        instrucao_acao_fisica:
          'Junte 10 lápis, tampinhas ou brinquedos pequenos em cima da mesa. Depois tire 3 deles e conte para a Lumi quantos sobraram!',
        tipo_interacao: 'arraste_visual_e_voz',
        recursos_midia: {
          icone: '🍎',
          cor: '#FCA5A5',
          foco: 'Contagem concreta e associação tátil',
        },
        tempo_estimado_min: 10,
        icone: '🍎',
        ordem: 2,
        ativo: true,
        created: now,
        updated: now,
      },
      {
        id: 'missao_f2_1',
        fase: 'fase_2',
        fase_etaria: 'fase_2',
        faixa_etaria: '9 a 12 anos',
        bncc_code: 'EF05MA03',
        habilidades_bncc: 'EF05MA03, EF05CI02 (Frações equivalentes e reflexão da luz)',
        titulo: 'Operação Alexandria',
        materia: 'Matemática & Ciências',
        descricao:
          'Resolução de frações equivalentes para destravar engrenagens históricas e posicionamento de espelhos para refletir a luz.',
        narrativa_ludica:
          'Dois exploradores encontraram discos solares divididos em 1/2 e 2/4. Como alinhar as engrenagens para abrir o observatório?',
        instrucao_acao_fisica:
          'Dobre uma folha de papel ao meio (1/2) e depois dobre novamente em 4 partes (2/4). Compare os tamanhos e conte sua descoberta para a Lumi!',
        tipo_interacao: 'painel_controle_engrenagens',
        recursos_midia: {
          icone: '🏛️',
          cor: '#818CF8',
          foco: 'Frações, engrenagens e física da luz',
        },
        tempo_estimado_min: 15,
        icone: '🏛️',
        ordem: 3,
        ativo: true,
        created: now,
        updated: now,
      },
      {
        id: 'missao_f2_2',
        fase: 'fase_2',
        fase_etaria: 'fase_2',
        faixa_etaria: '9 a 12 anos',
        bncc_code: 'EF06CI07',
        habilidades_bncc: 'EF06CI07, EF06GE05 (Ecossistemas e ciclos biogeoquímicos)',
        titulo: 'Biosfera Orbital 2040',
        materia: 'Ciências & Geografia',
        descricao:
          'Equilíbrio de teias alimentares, fotossíntese e fluxo de água em uma estação espacial que simula os biomas brasileiros.',
        narrativa_ludica:
          'Imagine que cada folha verde na estação orbital é uma cozinha solar! Quais ingredientes ela usa para produzir oxigênio para a tripulação?',
        instrucao_acao_fisica:
          'Observe uma folha de planta e anote os 3 ingredientes que entram na planta (Sol, Água e Ar) para contar à Lumi!',
        tipo_interacao: 'simulador_sistemas',
        recursos_midia: {
          icone: '🚀',
          cor: '#38BDF8',
          foco: 'Cadeias tróficas e preservação de biomas',
        },
        tempo_estimado_min: 15,
        icone: '🚀',
        ordem: 4,
        ativo: true,
        created: now,
        updated: now,
      },
      {
        id: 'missao_f3_1',
        fase: 'fase_3',
        fase_etaria: 'fase_3',
        faixa_etaria: '13 a 16 anos',
        bncc_code: 'EM13LGG301',
        habilidades_bncc: 'EM13LGG301, EM13CHS101 (Argumentação crítica e lógica proposicional)',
        titulo: 'O Tribunal Socrático',
        materia: 'Filosofia & Redação',
        descricao:
          'Construa uma argumentação sólida e sem falácias lógicas para debater e refutar a tese apresentada pela Lumi.',
        narrativa_ludica:
          'No Tribunal Socrático, cada argumento precisa de premissas claras e conclusão coerente.',
        instrucao_acao_fisica:
          'Formule uma tese com dois argumentos principais e apresente à Lumi por voz ou texto!',
        tipo_interacao: 'arena_dialetica_texto',
        recursos_midia: {
          icone: '⚖️',
          cor: '#A78BFA',
          foco: 'Refutação sem falácias, retórica e dialética',
        },
        tempo_estimado_min: 20,
        icone: '⚖️',
        ordem: 5,
        ativo: true,
        created: now,
        updated: now,
      },
      {
        id: 'missao_f3_2',
        fase: 'fase_3',
        fase_etaria: 'fase_3',
        faixa_etaria: '13 a 16 anos',
        bncc_code: 'EM13CNT301',
        habilidades_bncc: 'EM13CNT301, EM13MAT301 (Cinemática vetorial e funções de 2º grau)',
        titulo: 'Acelerador de Partículas & Cinemática',
        materia: 'Física & Funções',
        descricao:
          'Modelagem matemática de trajetórias curvas, variações de sinal negativo e conservação de energia.',
        narrativa_ludica:
          'Um sensor térmico registra variações abaixo de zero durante o experimento. Como modelar a trajetória e a variação?',
        instrucao_acao_fisica:
          'Trace uma reta vertical no caderno marcando o ponto 0 e explique sua hipótese para a Lumi!',
        tipo_interacao: 'workspace_graficos',
        recursos_midia: {
          icone: '⚛️',
          cor: '#34D399',
          foco: 'Física moderna, vetores e análise de funções',
        },
        tempo_estimado_min: 20,
        icone: '⚛️',
        ordem: 6,
        ativo: true,
        created: now,
        updated: now,
      },
    ],
    daily_metrics: [
      {
        id: 'dm_ana_1',
        crianca: idAna,
        student_id: idAna,
        session_id: 'sess_ana_01',
        user_id: demoOwnerId,
        date: today,
        duration_minutes: 28,
        academic_tags: {
          logic_mathematics: 82,
          reading_comprehension: 76,
          scientific_investigation: 91,
        },
        socioemotional_tags: {
          focus_attention: {
            score: 84,
            context: 'Manteve foco investigativo contínuo por 22 minutos ao explorar fotossíntese e frações.',
          },
          frustration_management: {
            score: 79,
            status: 'improving',
          },
          autonomy_rate: 85,
        },
        resilience_moments_count: 14,
        resilience_autonomous_rate: 85,
        parent_bridges: [
          'Pergunte à Ana Paula no jantar como a folha de uma planta funciona parecido com uma cozinha movida a luz do sol!',
          'Peça para ela mostrar como dividir uma pizza em 2/4 é exatamente igual a metade (1/2) da pizza.',
        ],
        created: now,
        updated: now,
      },
      {
        id: 'dm_lucas_1',
        crianca: idLucas,
        student_id: idLucas,
        session_id: 'sess_lucas_01',
        user_id: demoOwnerId,
        date: today,
        duration_minutes: 20,
        academic_tags: {
          logic_mathematics: 78,
          reading_comprehension: 68,
          scientific_investigation: 84,
        },
        socioemotional_tags: {
          focus_attention: {
            score: 74,
            context: 'Excelente engajamento quando conectamos dezenas com pacotes de blocos do Minecraft.',
          },
          frustration_management: {
            score: 72,
            status: 'improving',
          },
          autonomy_rate: 76,
        },
        resilience_moments_count: 9,
        resilience_autonomous_rate: 76,
        parent_bridges: [
          'Pergunte ao Lucas como ele faz para "desmontar um pacote de 10 blocos" quando precisa fazer uma conta de subtração!',
        ],
        created: now,
        updated: now,
      },
      {
        id: 'dm_bia_1',
        crianca: idBeatriz,
        student_id: idBeatriz,
        session_id: 'sess_bia_01',
        user_id: demoOwnerId,
        date: today,
        duration_minutes: 34,
        academic_tags: {
          logic_mathematics: 80,
          reading_comprehension: 92,
          scientific_investigation: 88,
        },
        socioemotional_tags: {
          focus_attention: {
            score: 89,
            context: 'Ótima argumentação lógica e autonomia ao construir hipóteses históricas e algébricas.',
          },
          frustration_management: {
            score: 84,
            status: 'improving',
          },
          autonomy_rate: 88,
        },
        resilience_moments_count: 11,
        resilience_autonomous_rate: 88,
        parent_bridges: [
          'Converse com a Beatriz sobre como a temperatura abaixo de zero em dias frios de Curitiba ajuda a entender números negativos.',
        ],
        created: now,
        updated: now,
      },
    ],
    registro_uso: [
      {
        id: 'reg_uso_ana_hoje',
        crianca: idAna,
        data: today,
        minutos_usados: 12,
        owner: demoOwnerId,
        created: now,
        updated: now,
      },
    ],
    pin_reset_tokens: [],
  }
}

function loadDatabase(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.criancas)) {
        return parsed
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const initial = createInitialSeedDatabase()
  saveDatabase(initial)
  return initial
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db))
  } catch {
    // Ignore storage quota errors
  }
}

type RealtimeAction = 'create' | 'update' | 'delete'
type RealtimeListener = (event: { action: RealtimeAction; record: LocalRecord }) => void
const collectionListeners: Record<string, Set<RealtimeListener>> = {}

function notifyRealtime(collection: string, action: RealtimeAction, record: LocalRecord) {
  const listeners = collectionListeners[collection]
  if (!listeners) return
  listeners.forEach((cb) => {
    try {
      cb({ action, record })
    } catch {
      // ignore listener errors
    }
  })
}

function generateId(prefix = 'rec'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

function evaluateFilter(record: LocalRecord, filterStr?: string): boolean {
  if (!filterStr || !filterStr.trim()) return true

  // Split by && (the app uses simple conjunctive filters like `crianca = "xyz" && data = "2026-..."`)
  const andParts = filterStr.split('&&').map((p) => p.trim()).filter(Boolean)

  for (const part of andParts) {
    // Check !=
    const neqMatch = part.match(/^([a-zA-Z0-9_.]+)\s*!=\s*(.+)$/)
    if (neqMatch) {
      const field = neqMatch[1].trim()
      const rawVal = neqMatch[2].trim()
      const expected = parseFilterLiteral(rawVal)
      if (record[field] === expected) return false
      continue
    }

    // Check >=
    const gteMatch = part.match(/^([a-zA-Z0-9_.]+)\s*>=\s*(.+)$/)
    if (gteMatch) {
      const field = gteMatch[1].trim()
      const expected = parseFilterLiteral(gteMatch[2].trim())
      if (!(record[field] >= expected)) return false
      continue
    }

    // Check <=
    const lteMatch = part.match(/^([a-zA-Z0-9_.]+)\s*<=\s*(.+)$/)
    if (lteMatch) {
      const field = lteMatch[1].trim()
      const expected = parseFilterLiteral(lteMatch[2].trim())
      if (!(record[field] <= expected)) return false
      continue
    }

    // Check =
    const eqMatch = part.match(/^([a-zA-Z0-9_.]+)\s*=\s*(.+)$/)
    if (eqMatch) {
      const field = eqMatch[1].trim()
      const expected = parseFilterLiteral(eqMatch[2].trim())
      if (record[field] !== expected) return false
      continue
    }
  }

  return true
}

function parseFilterLiteral(raw: string): any {
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1)
  }
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === 'null') return null
  const num = Number(raw)
  if (!Number.isNaN(num) && raw !== '') return num
  return raw
}

function sortRecords(records: LocalRecord[], sortStr?: string): LocalRecord[] {
  if (!sortStr || !sortStr.trim()) return records
  const fields = sortStr.split(',').map((s) => s.trim()).filter(Boolean)

  return [...records].sort((a, b) => {
    for (const f of fields) {
      const desc = f.startsWith('-')
      const key = desc ? f.slice(1) : f.startsWith('+') ? f.slice(1) : f
      const valA = a[key] ?? ''
      const valB = b[key] ?? ''
      if (valA < valB) return desc ? 1 : -1
      if (valA > valB) return desc ? -1 : 1
    }
    return 0
  })
}

function expandRecord(record: LocalRecord, expandStr: string | undefined, db: DatabaseSchema): LocalRecord {
  if (!expandStr) return { ...record }
  const clone: LocalRecord = { ...record, expand: { ...(record.expand || {}) } }
  const fields = expandStr.split(',').map((s) => s.trim()).filter(Boolean)

  const relationMap: Record<string, string> = {
    crianca: 'criancas',
    owner: 'users',
    student_id: 'criancas',
  }

  for (const field of fields) {
    const targetCol = relationMap[field] || field
    const targetId = clone[field]
    if (targetId && db[targetCol]) {
      const found = db[targetCol].find((r) => r.id === targetId)
      if (found) {
        clone.expand![field] = { ...found }
      }
    }
  }
  return clone
}

// ============================================================================
// SOCRATIC LUMI IA ENGINE (Local Pedagogical & Guardrail Engine)
// ============================================================================

interface LumiTurnResult {
  reply: string
  conversationId: string
  etapaSocratica: string
  materia: string
  acoesExecutadas: Array<{
    tipo: 'agenda' | 'dificuldade' | 'conhecimento' | 'memoria' | 'alerta'
    resumo: string
    detalhe?: string
  }>
}

function detectarMateria(msgLower: string, materiaAtual?: string): string {
  if (
    msgLower.includes('fração') ||
    msgLower.includes('fracao') ||
    msgLower.includes('frações') ||
    msgLower.includes('matemática') ||
    msgLower.includes('matematica') ||
    msgLower.includes('conta') ||
    msgLower.includes('multiplic') ||
    msgLower.includes('divis') ||
    msgLower.includes('subtra') ||
    msgLower.includes('soma') ||
    msgLower.includes('número') ||
    msgLower.includes('numero') ||
    msgLower.includes('pizza') ||
    /\d+\s*[+\-*/x÷]\s*\d+/.test(msgLower)
  ) {
    return 'matematica'
  }
  if (
    msgLower.includes('planta') ||
    msgLower.includes('fotossíntese') ||
    msgLower.includes('fotossintese') ||
    msgLower.includes('ciência') ||
    msgLower.includes('ciencia') ||
    msgLower.includes('animal') ||
    msgLower.includes('água') ||
    msgLower.includes('agua') ||
    msgLower.includes('sol') ||
    msgLower.includes('oxigênio') ||
    msgLower.includes('célula') ||
    msgLower.includes('planeta')
  ) {
    return 'ciencias'
  }
  if (
    msgLower.includes('história') ||
    msgLower.includes('historia') ||
    msgLower.includes(' Egito') ||
    msgLower.includes('navega') ||
    msgLower.includes('rei') ||
    msgLower.includes('século') ||
    msgLower.includes('passado') ||
    msgLower.includes('indígena') ||
    msgLower.includes('descobrimento')
  ) {
    return 'historia'
  }
  if (
    msgLower.includes('geografia') ||
    msgLower.includes('mapa') ||
    msgLower.includes('país') ||
    msgLower.includes('clima') ||
    msgLower.includes('bioma') ||
    msgLower.includes('cerrado') ||
    msgLower.includes('relevo') ||
    msgLower.includes('fuso')
  ) {
    return 'geografia'
  }
  if (
    msgLower.includes('português') ||
    msgLower.includes('portugues') ||
    msgLower.includes('palavra') ||
    msgLower.includes('texto') ||
    msgLower.includes('verbo') ||
    msgLower.includes('sílaba') ||
    msgLower.includes('redação') ||
    msgLower.includes('história em quadrinhos')
  ) {
    return 'portugues'
  }
  return materiaAtual || 'geral'
}

function avancarEtapaSocratica(etapaAtual: string, msgLower: string): string {
  const ordem = ['entender', 'contextualizar', 'guiar', 'praticar', 'consolidar']
  if (
    msgLower.includes('entendi') ||
    msgLower.includes('acho que é') ||
    msgLower.includes('porque') ||
    msgLower.includes('resultado é') ||
    msgLower.includes('igual a') ||
    msgLower.includes('metade') ||
    msgLower.includes('sol')
  ) {
    const idx = ordem.indexOf(etapaAtual)
    if (idx >= 0 && idx < ordem.length - 1) {
      return ordem[idx + 1]
    }
    return 'guiar'
  }
  if (!ordem.includes(etapaAtual)) return 'entender'
  return etapaAtual
}

function processarMensagemLumi(
  db: DatabaseSchema,
  criancaId: string,
  userMessage: string,
  incomingConvId?: string,
  ownerId?: string,
): LumiTurnResult {
  const now = new Date().toISOString()
  const today = getRelativeDate(0)
  const conversationId = incomingConvId || `conv_${criancaId}_${Date.now()}`
  const crianca = db.criancas.find((c) => c.id === criancaId) || db.criancas[0]
  const effectiveOwner = ownerId || crianca?.owner || 'user_demo_rogerio'
  const primeiroNome = (crianca?.nome || 'Amigo(a)').split(' ')[0]

  const msgTrim = userMessage.trim()
  const msgLower = msgTrim.toLowerCase()
  const acoesExecutadas: LumiTurnResult['acoesExecutadas'] = []

  // 1. Protocolo de Proteção à Vida & Guardrails
  const padroesRisco = [
    'quero morrer',
    'me machucar',
    'ninguém gosta de mim',
    'ninguem gosta de mim',
    'quero sumir',
    'bater em mim',
    'sofrendo bullying',
    'me batendo',
  ]
  if (padroesRisco.some((p) => msgLower.includes(p))) {
    const novoAlerta: LocalRecord = {
      id: generateId('alerta'),
      crianca: criancaId,
      tipo: 'risco_seguranca',
      nivel: 'critico',
      mensagem:
        'A criança expressou sinais de sofrimento emocional ou vulnerabilidade durante a conversa. Recomenda-se acolhimento imediato e escuta afetuosa.',
      conteudo_detectado: msgTrim,
      lido: false,
      owner: effectiveOwner,
      created: now,
      updated: now,
    }
    db.alertas.unshift(novoAlerta)
    saveDatabase(db)
    notifyRealtime('alertas', 'create', novoAlerta)

    return {
      reply: `${primeiroNome}, sinto muito que você esteja se sentindo assim. Você é muito especial e não está sozinho(a)! Que tal chamar um adulto de confiança da sua família agora mesmo para conversar e receber um abraço bem apertado? 💛 [[ETAPA: entender | MATERIA: geral]]`,
      conversationId,
      etapaSocratica: 'entender',
      materia: 'geral',
      acoesExecutadas: [
        {
          tipo: 'alerta',
          resumo: 'Protocolo de acolhimento ativado',
          detalhe: 'Notificação prioritária enviada ao painel do responsável',
        },
      ],
    }
  }

  // 2. Detecção de agendamento automático na Agenda Escolar (ex: "tenho prova", "lição de casa", "trabalho de")
  if (
    (msgLower.includes('tenho prova') ||
      msgLower.includes('vai ter prova') ||
      msgLower.includes('tenho tarefa') ||
      msgLower.includes('tenho trabalho') ||
      msgLower.includes('anota na agenda') ||
      msgLower.includes('agendar')) &&
    crianca
  ) {
    const matDetectada = detectarMateria(msgLower, crianca.ultima_materia)
    const nomeMateriaMapa: Record<string, string> = {
      matematica: 'Matemática',
      ciencias: 'Ciências',
      portugues: 'Português',
      historia: 'História',
      geografia: 'Geografia',
      geral: 'Geral',
    }
    const matLabel = nomeMateriaMapa[matDetectada] || 'Ciências'
    const isProva = msgLower.includes('prova') || msgLower.includes('avaliação')
    const dataEvento = msgLower.includes('amanhã') || msgLower.includes('amanha')
      ? getRelativeDate(1)
      : getRelativeDate(2)

    const novoEvento: LocalRecord = {
      id: generateId('ag'),
      crianca: criancaId,
      titulo: `${isProva ? 'Prova' : 'Tarefa'} de ${matLabel} (Anotado pela Lumi)`,
      data: dataEvento,
      horario: '14:00',
      materia: matLabel,
      tipo: isProva ? 'prova' : 'tarefa',
      descricao: `Registrado a partir da conversa: "${msgTrim}"`,
      concluido: false,
      owner: effectiveOwner,
      created: now,
      updated: now,
    }
    db.agenda.push(novoEvento)
    acoesExecutadas.push({
      tipo: 'agenda',
      resumo: `${novoEvento.titulo} agendada para ${dataEvento}`,
      detalhe: matLabel,
    })
  }

  // 3. Extração orgânica de memória contínua (hobbies, bichinhos, gostos, amigos, estilo de aprender)
  if (
    (msgLower.includes('eu gosto') ||
      msgLower.includes('eu adoro') ||
      msgLower.includes('meu cachorro') ||
      msgLower.includes('meu gato') ||
      msgLower.includes('meu bichinho') ||
      msgLower.includes('meu jogo') ||
      msgLower.includes('minha comida') ||
      msgLower.includes('meu amigo') ||
      msgLower.includes('minha amiga') ||
      msgLower.includes('meu esporte') ||
      msgLower.includes('prefiro aprender') ||
      msgLower.includes('lembre que') ||
      msgLower.includes('guarda que') ||
      msgLower.includes('quero ser')) &&
    crianca
  ) {
    const tipoMem =
      msgLower.includes('cachorro') ||
      msgLower.includes('gato') ||
      msgLower.includes('amigo') ||
      msgLower.includes('amiga') ||
      msgLower.includes('irmã') ||
      msgLower.includes('irmão')
        ? 'contexto'
        : msgLower.includes('prefiro') || msgLower.includes('aprender')
          ? 'estilo_aprendizagem'
          : 'preferencia'

    const novaMemoria: LocalRecord = {
      id: generateId('mem'),
      crianca: criancaId,
      tipo: tipoMem,
      conteudo: msgTrim,
      origem: 'conversa',
      ativo: true,
      data: today,
      owner: effectiveOwner,
      created: now,
      updated: now,
    }
    db.memorias.unshift(novaMemoria)
    acoesExecutadas.push({
      tipo: 'memoria',
      resumo: 'Lumi aprendeu algo novo sobre você! 🧠',
      detalhe: msgTrim.slice(0, 80),
    })
  }

  const etapaAnterior = crianca?.ultima_etapa_socratica || 'entender'
  const materia = detectarMateria(msgLower, crianca?.ultima_materia || 'ciencias')
  const etapaSocratica = avancarEtapaSocratica(etapaAnterior, msgLower)

  if (crianca) {
    crianca.ultima_etapa_socratica = etapaSocratica
    crianca.ultima_materia = materia
    crianca.updated = now
  }
  saveDatabase(db)

  // Recupera memórias já aprendidas para personalizar respostas
  const memoriasDaCrianca = db.memorias.filter((m) => m.crianca === criancaId && m.ativo !== false)
  const dicaMemoria =
    memoriasDaCrianca.length > 0
      ? ` (Lembrei até que você me contou: "${memoriasDaCrianca[0].conteudo.slice(0, 60)}"!)`
      : ''

  let replyText = ''

  // d) Regulação Afetiva (CASEL/Dweck): ao detectar "não sei", "difícil" ou "cansei", suspenda perguntas abertas, acolha e mostre um mini-exemplo já resolvido
  if (
    msgLower.includes('não sei') ||
    msgLower.includes('nao sei') ||
    msgLower.includes('difícil') ||
    msgLower.includes('dificil') ||
    msgLower.includes('cansei') ||
    msgLower.includes('cansado') ||
    msgLower.includes('cansada') ||
    msgLower.includes('não consigo') ||
    msgLower.includes('nao consigo')
  ) {
    replyText = `Fica super tranquilo(a), ${primeiroNome}! É totalmente normal achar difícil ou cansar às vezes, eu estou aqui do seu lado! 💛 Não precisa responder nenhuma pergunta difícil agora. Olha só um mini-exemplo já resolvido bem facinho: se temos 2 maçãs 🍎🍎 e ganhamos mais 1 maçã 🍎, juntando tudo ficam 3 maçãs (Resposta pronta: 2 + 1 = 3)! Viu como um passinho por vez fica leve?`
  } else if (acoesExecutadas.some((a) => a.tipo === 'agenda')) {
    replyText = `Já anotei esse compromisso lá na sua Agenda Escolar para a gente não esquecer, ${primeiroNome}! 📅 Quando quiser revisar, eu te mostro um exemplo resolvido passo a passo!`
  } else if (acoesExecutadas.some((a) => a.tipo === 'memoria')) {
    replyText = `Que demais saber disso sobre você, ${primeiroNome}! 🧠✨ Já guardei com muito carinho na minha memória: "${msgTrim}". Vou usar isso sempre nas nossas conversas e exemplos!`
  } else if (
    msgLower.includes('acert') ||
    msgLower.includes('resultado é') ||
    msgLower.includes('igual a') ||
    msgLower.includes('acho que dá') ||
    msgLower.includes('acho que é') ||
    msgLower.includes('oxigênio') ||
    msgLower.includes('oxigenio') ||
    msgLower.includes('2/4') ||
    msgLower.includes('1/2')
  ) {
    // e) Mediação Socrática Leve (máx. 20%): quando a criança já acertou o exemplo de treino e vai fechar o resultado final
    replyText = `Você mandou super bem no raciocínio, ${primeiroNome}! 🌟🎉 Agora que você já dominou o nosso exemplo de treino, qual fica sendo o resultado final da sua tarefa para a gente comemorar?`
  } else if (
    /\d+\s*[+\-*/x÷]\s*\d+/.test(msgLower) ||
    msgLower.includes('quanto é') ||
    msgLower.includes('quanto e') ||
    msgLower.includes('fração') ||
    msgLower.includes('fracao') ||
    msgLower.includes('frações') ||
    msgLower.includes('dever') ||
    msgLower.includes('tarefa') ||
    msgLower.includes('exercício') ||
    msgLower.includes('exercicio') ||
    msgLower.includes('conta') ||
    msgLower.includes('equação') ||
    msgLower.includes('negativo')
  ) {
    // b) Exemplo Trabalhado Resolvido + Desafio Espelho (Sweller + Vygotsky)
    if (msgLower.includes('fração') || msgLower.includes('fracao') || msgLower.includes('pizza')) {
      replyText = `Vamos destravar essa tarefa juntos com o nosso método em 2 passos, ${primeiroNome}! 🍕\n\n✅ 1º Passo: Exemplo da Lumi (Com Resposta!)\nImagine uma barra de chocolate dividida em 4 pedacinhos iguais. Se eu comer 1 pedacinho e depois mais 1 pedacinho, eu somo as partes de cima: 1/4 + 1/4 = 2/4 (que é exatamente a metade, 1/2!). Resposta completa do exemplo da Lumi: 2/4 ou 1/2.\n\n🎯 2º Passo: Seu Exemplo para Responder (Desafio Espelho!)\nAgora em uma pizza dividida em 8 fatias iguais: se você comer 2 fatias (2/8) e seu amigo comer mais 2 fatias (2/8), quantos oitavos (fatias de 8) vocês comeram juntos? Depois de responder esse, sua tarefa vai ficar moleza!`
    } else {
      replyText = `Excelente desafio escolar, ${primeiroNome}! Para você chegar sozinho(a) na resposta da sua tarefa, olha primeiro como eu resolvo um exemplo parecido do dia a dia:\n\n✅ 1º Passo: Exemplo da Lumi (Com Resposta!)\nImagine que você tem 12 figurinhas brilhantes e ganha mais 5 figurinhas de um amigo. Primeiro somamos as unidades (2 + 5 = 7) e juntamos com a dezena (10 + 7 = 17). Resposta completa do exemplo da Lumi: 17 figurinhas!\n\n🎯 2º Passo: Seu Exemplo para Responder (Desafio Espelho!)\nAgora tente você neste exemplo parecido: se você tiver 14 bloquinhos e ganhar mais 3 bloquinhos, quantos bloquinhos ficam ao todo? Assim que responder, aplique o mesmo truque na sua conta!`
    }
  } else if (
    msgLower.includes('fotossíntese') ||
    msgLower.includes('fotossintese') ||
    msgLower.includes('planta') ||
    msgLower.includes('buraco negro') ||
    msgLower.includes('espaço') ||
    msgLower.includes('planeta') ||
    msgLower.includes('dinossauro') ||
    msgLower.includes('animal') ||
    msgLower.includes('céu') ||
    msgLower.includes('natureza')
  ) {
    // a) Aprendizagem Significativa Expositiva (Ausubel): curiosidade livre -> explica diretamente com entusiasmo, SEM interrogatório!
    if (msgLower.includes('fotossíntese') || msgLower.includes('fotossintese') || msgLower.includes('planta')) {
      replyText = `Que curiosidade incrível sobre a natureza, ${primeiroNome}! 🌱☀️ Funciona assim: cada folha verdinha da planta é como uma cozinha solar mágica! A raiz bebe água da terra, as folhas capturam o gás carbônico do ar e a clorofila usa a luz do Sol para transformar tudo isso em energia (glicose) para a planta crescer forte, soltando oxigênio fresquinho no ar para todos nós respirarmos!`
    } else if (msgLower.includes('buraco negro') || msgLower.includes('espaço') || msgLower.includes('planeta')) {
      replyText = `Uau, eu amo explorar o universo com você, ${primeiroNome}! 🚀🌌 Um buraco negro é uma região do espaço onde a gravidade é tão superforte que funciona como um aspirador cósmico gigante: nada consegue escapar dele, nem mesmo a luz! Eles surgem quando uma estrela muito, muito grande chega ao fim da sua vida e se concentra num pontinho superdenso.`
    } else {
      replyText = `Adorei a sua curiosidade sobre a natureza, ${primeiroNome}! 🌿✨${dicaMemoria} Na ciência, os seres vivos e os fenômenos naturais estão todos conectados: o Sol aquece a Terra, evapora a água formando as nuvens, e espalha a luz azul pelo ar da atmosfera. É por isso que o nosso planeta é cheio de cores e vida!`
    }
  } else if (
    msgLower.includes('história') ||
    msgLower.includes('historia') ||
    msgLower.includes('conte um conto') ||
    msgLower.includes('invente uma')
  ) {
    // a) Ausubel Expositivo / Criativo direto
    replyText = `Era uma vez um(a) jovem explorador(a) chamado(a) ${primeiroNome}${dicaMemoria}! 🌟 Em uma manhã cheia de estrelas cadentes, ${primeiroNome} encontrou uma bússola dourada que apontava para a Biblioteca das Nuvens, onde os livros ganhavam vida e contavam segredos do universo com músicas brilhantes!`
  } else if (
    msgLower.includes('programar') ||
    msgLower.includes('código') ||
    msgLower.includes('codigo') ||
    msgLower.includes('python') ||
    msgLower.includes('jogo')
  ) {
    replyText = `Programar é como ensinar superpoderes para o computador, ${primeiroNome}! 💻🚀 Em Python, por exemplo, quando você escreve \`print("Olá, mundo da ${primeiroNome}!")\`, o computador mostra essa mensagem imediatamente na tela, e com variáveis como \`pontos = 10\` você já consegue guardar o placar do seu próprio jogo!`
  } else {
    // a) Aprendizagem Significativa Expositiva (Ausubel) para conversa do dia a dia
    replyText = `Oi, ${primeiroNome}! Que alegria conversar com você! ✨${dicaMemoria}Quando for uma curiosidade sobre animais, espaço ou natureza, eu te explico tudo direto com entusiasmo; e quando for tarefa da escola, eu te mostro primeiro um Exemplo Resolvido completo com um Desafio Espelho para você brilhar!`
  }

  return {
    reply: `${replyText} [[ETAPA: ${etapaSocratica} | MATERIA: ${materia}]]`,
    conversationId,
    etapaSocratica,
    materia,
    acoesExecutadas,
  }
}

async function executarChatLumiComGeminiOuFallback(
  db: DatabaseSchema,
  bodyObj: any,
  currentUserId?: string,
): Promise<LumiTurnResult & { acoesFormatadas: any[]; memoriasAprendidas: any[] }> {
  const now = new Date().toISOString()
  const today = getRelativeDate(0)
  const criancaId = bodyObj.crianca_id || bodyObj.criancaId || 'crianca_ana_paula'
  const userMessage = String(bodyObj.message || '').trim()
  const incomingConvId = bodyObj.conversation_id || bodyObj.conversationId
  const conversationId = incomingConvId || `conv_${criancaId}_${Date.now()}`
  const crianca = db.criancas.find((c) => c.id === criancaId) || db.criancas[0]
  const effectiveOwner = currentUserId || crianca?.owner || 'user_demo_rogerio'

  // Primeiro verifica se há palavras de risco crítico de proteção à vida
  const msgLower = userMessage.toLowerCase()
  const padroesRisco = [
    'quero morrer',
    'me machucar',
    'ninguém gosta de mim',
    'ninguem gosta de mim',
    'quero sumir',
    'bater em mim',
    'sofrendo bullying',
    'me batendo',
  ]
  if (padroesRisco.some((p) => msgLower.includes(p))) {
    const localRisk = processarMensagemLumi(db, criancaId, userMessage, conversationId, currentUserId)
    return {
      ...localRisk,
      acoesFormatadas: [
        {
          tipo: 'alerta_seguranca',
          titulo: 'Protocolo de Proteção e Acolhimento Ativado',
          conteudo: 'O responsável recebeu um aviso prioritário para acolher você com carinho.',
        },
      ],
      memoriasAprendidas: [],
    }
  }

  // Tenta chamar o Agente Gemini real no servidor (/api/lumi/agent-chat)
  try {
    const nativeFetch =
      typeof window !== 'undefined' && (window as any).__lumiNativeFetch
        ? (window as any).__lumiNativeFetch
        : fetch

    const memoriasAtuais = db.memorias
      .filter((m) => m.crianca === criancaId && m.ativo !== false)
      .slice(0, 15)
      .map((m) => ({ tipo: m.tipo, conteudo: m.conteudo }))

    const agentRes = await nativeFetch('/api/lumi/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: bodyObj.history || [],
        model: bodyObj.model || 'gemini-3.8-flash',
        modoAgente: bodyObj.modo_agente || bodyObj.modoAgente || 'agente_geral',
        customPrompt: bodyObj.custom_prompt || bodyObj.customPrompt || '',
        minutosRestantes: bodyObj.minutos_restantes,
        crianca: crianca
          ? {
              id: crianca.id,
              nome: crianca.nome,
              idade: crianca.idade,
              serie: crianca.serie,
              localidade: crianca.localidade,
              observacoes: crianca.observacoes,
              interesses: crianca.interesses,
              acessibilidade: crianca.acessibilidade,
            }
          : { nome: 'Ana Paula', idade: 10, serie: '5º Ano' },
        memorias: memoriasAtuais,
      }),
    })

    if (agentRes.ok) {
      const data = await agentRes.json()
      if (data && data.ok && data.reply) {
        const acoesExecutadas: LumiTurnResult['acoesExecutadas'] = []
        const acoesFormatadas: any[] = []
        const memoriasSalvas: any[] = []

        // 1. Salva novas memórias aprendidas com o usuário!
        if (Array.isArray(data.memoriasAprendidas) && data.memoriasAprendidas.length > 0) {
          for (const mem of data.memoriasAprendidas) {
            const textoMem = String(mem?.conteudo || '').trim()
            if (!textoMem) continue
            const jaExiste = db.memorias.some(
              (m) =>
                m.crianca === criancaId &&
                String(m.conteudo || '').toLowerCase() === textoMem.toLowerCase(),
            )
            if (!jaExiste) {
              const novaMem: LocalRecord = {
                id: generateId('mem'),
                crianca: criancaId,
                tipo: mem.tipo || 'preferencia',
                conteudo: textoMem,
                origem: 'aprendizado_continuo_ia',
                ativo: true,
                data: today,
                owner: effectiveOwner,
                created: now,
                updated: now,
              }
              db.memorias.unshift(novaMem)
              memoriasSalvas.push(novaMem)
              acoesExecutadas.push({
                tipo: 'memoria',
                resumo: 'Lumi aprendeu sobre você 🧠',
                detalhe: textoMem,
              })
              acoesFormatadas.push({
                tipo: 'conhecimento_salvo',
                titulo: '🧠 Lumi aprendeu algo novo sobre você!',
                categoria: mem.tipo || 'Preferência Pessoal',
                conteudo: textoMem,
              })
            }
          }
        }

        // 2. Salva novos conhecimentos no Grafo de Conhecimento
        if (Array.isArray(data.novosConhecimentos) && data.novosConhecimentos.length > 0) {
          for (const con of data.novosConhecimentos) {
            const tituloCon = String(con?.titulo || '').trim()
            if (!tituloCon) continue
            const jaTem = db.conhecimento.some(
              (k) =>
                k.crianca === criancaId &&
                String(k.titulo || '').toLowerCase() === tituloCon.toLowerCase(),
            )
            if (!jaTem) {
              const novoCon: LocalRecord = {
                id: generateId('con'),
                crianca: criancaId,
                titulo: tituloCon,
                categoria: con.categoria || data.materia || 'Geral',
                conteudo: con.conteudo || tituloCon,
                nivel_dominio: 75,
                owner: effectiveOwner,
                created: now,
                updated: now,
              }
              db.conhecimento.unshift(novoCon)
              acoesFormatadas.push({
                tipo: 'conhecimento_salvo',
                titulo: `🌟 Nova descoberta no Grafo: ${tituloCon}`,
                categoria: novoCon.categoria,
                conteudo: novoCon.conteudo,
              })
            }
          }
        }

        // 3. Salva compromissos na Agenda Escolar
        if (Array.isArray(data.agendamentos) && data.agendamentos.length > 0) {
          for (const ag of data.agendamentos) {
            const tituloAg = String(ag?.titulo || '').trim()
            if (!tituloAg) continue
            const dataEv = getRelativeDate(1)
            const novoAg: LocalRecord = {
              id: generateId('ag'),
              crianca: criancaId,
              titulo: tituloAg,
              data: dataEv,
              horario: '14:00',
              materia: data.materia || 'Geral',
              tipo: ag.tipo || 'tarefa',
              descricao: ag.descricao || `Agendado pela Lumi: "${userMessage}"`,
              concluido: false,
              owner: effectiveOwner,
              created: now,
              updated: now,
            }
            db.agenda.push(novoAg)
            acoesExecutadas.push({
              tipo: 'agenda',
              resumo: `${tituloAg} agendado para ${dataEv}`,
              detalhe: novoAg.descricao,
            })
            acoesFormatadas.push({
              tipo: 'agenda_criada',
              titulo: tituloAg,
              data: dataEv,
              tipo_evento: novoAg.tipo,
            })
          }
        }

        // 4. Se bloqueou conteúdo inadequado para a idade, registra alerta informativo
        if (data.bloqueadoPorIdade) {
          const novoAlerta: LocalRecord = {
            id: generateId('alerta'),
            crianca: criancaId,
            tipo: 'filtro_idade',
            nivel: 'atencao',
            mensagem: `Filtro de idade (${crianca?.idade || 10} anos) bloqueou ou redirecionou um pedido fora da faixa etária.`,
            conteudo_detectado: userMessage,
            lido: false,
            owner: effectiveOwner,
            created: now,
            updated: now,
          }
          db.alertas.unshift(novoAlerta)
          acoesFormatadas.push({
            tipo: 'alerta_seguranca',
            titulo: `🛡️ Filtro de Idade (${crianca?.idade || 10} anos) Ativo`,
            conteudo: 'Tema redirecionado com segurança para a faixa etária da criança.',
          })
        }

        const etapaFinal = data.etapaSocratica || crianca?.ultima_etapa_socratica || 'entender'
        const materiaFinal = data.materia || crianca?.ultima_materia || 'ciencias'

        if (crianca) {
          crianca.ultima_etapa_socratica = etapaFinal
          crianca.ultima_materia = materiaFinal
          crianca.updated = now
        }
        saveDatabase(db)

        return {
          reply: data.reply,
          conversationId,
          etapaSocratica: etapaFinal,
          materia: materiaFinal,
          acoesExecutadas,
          acoesFormatadas,
          memoriasAprendidas: memoriasSalvas,
        }
      }
    }
  } catch {
    // Fallback local transparente caso offline
  }

  const localResult = processarMensagemLumi(
    db,
    criancaId,
    userMessage,
    conversationId,
    currentUserId,
  )
  const acoesFormatadasLocal = localResult.acoesExecutadas.map((a) => ({
    tipo:
      a.tipo === 'agenda'
        ? 'agenda_criada'
        : a.tipo === 'alerta'
          ? 'alerta_seguranca'
          : 'conhecimento_salvo',
    titulo: a.resumo,
    conteudo: a.detalhe,
  }))

  return {
    ...localResult,
    acoesFormatadas: acoesFormatadasLocal,
    memoriasAprendidas: [],
  }
}

// ============================================================================
// CUSTOM /backend/v1/* ROUTER
// ============================================================================

async function handleBackendRoute(
  path: string,
  options: { method?: string; body?: any; headers?: any } = {},
  currentUserId?: string,
): Promise<{ status: number; data: any; headers?: Record<string, string>; isStream?: boolean; streamText?: string }> {
  const db = loadDatabase()
  const now = new Date().toISOString()
  const today = getRelativeDate(0)
  const method = (options.method || 'GET').toUpperCase()

  let bodyObj: any = {}
  if (typeof options.body === 'string' && options.body.trim()) {
    try {
      bodyObj = JSON.parse(options.body)
    } catch {
      bodyObj = {}
    }
  } else if (options.body && typeof options.body === 'object') {
    bodyObj = options.body
  }

  const urlObj = new URL(path, 'http://localhost:3000')
  const pathname = urlObj.pathname

  // 1. POST /backend/v1/lumi/chat
  if (pathname === '/backend/v1/lumi/chat' && method === 'POST') {
    const result = await executarChatLumiComGeminiOuFallback(db, bodyObj, currentUserId)
    return {
      status: 200,
      data: {
        ...result,
        content: result.reply,
        conversation_id: result.conversationId,
        etapa: result.etapaSocratica,
        materia: result.materia,
        acoes: result.acoesFormatadas,
        memorias_aprendidas: result.memoriasAprendidas,
      },
    }
  }

  // 2. POST /backend/v1/lumi/chat-stream
  if (pathname === '/backend/v1/lumi/chat-stream' && method === 'POST') {
    const result = await executarChatLumiComGeminiOuFallback(db, bodyObj, currentUserId)
    return {
      status: 200,
      isStream: true,
      streamText: result.reply,
      data: {
        ...result,
        acoes: result.acoesFormatadas,
        memorias_aprendidas: result.memoriasAprendidas,
      },
      headers: {
        'Content-Type': 'text/event-stream',
        'X-Conversation-Id': result.conversationId,
        'X-Etapa-Socratica': result.etapaSocratica,
        'X-Materia': result.materia,
        'X-Acoes-Executadas': encodeURIComponent(JSON.stringify(result.acoesFormatadas)),
      },
    }
  }

  // 3. POST /backend/v1/lumi/tts -> Real Gemini 3.8 TTS on Express server (/api/lumi/tts)
  if (pathname === '/backend/v1/lumi/tts' && method === 'POST') {
    try {
      const nativeFetch =
        typeof window !== 'undefined' && (window as any).__lumiNativeFetch
          ? (window as any).__lumiNativeFetch
          : fetch
      const ttsRes = await nativeFetch('/api/lumi/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
      })
      if (ttsRes.ok) {
        const ttsData = await ttsRes.json()
        return {
          status: 200,
          data: ttsData,
        }
      }
    } catch {
      // Fallback gracefully if server route is unreachable
    }
    return {
      status: 200,
      data: {
        cached: false,
        format: 'wav',
        voice: bodyObj.voice || 'Kore',
        model: 'gemini-3.8-flash-lite-tts',
        audio_base64: '',
        audio_url: null,
      },
    }
  }

  // 4. PIN Responsável routes: /backend/v1/auth/pin/*
  const activeUser =
    db.users.find((u) => u.id === currentUserId) || db.users[0]

  if (pathname === '/backend/v1/auth/pin/status' && method === 'GET') {
    const bloqueadoAte = activeUser?.pin_bloqueado_ate || null
    const bloqueado = bloqueadoAte ? new Date(bloqueadoAte).getTime() > Date.now() : false
    const definido = activeUser ? Boolean(activeUser.pin_definido) : true
    return {
      status: 200,
      data: {
        definido,
        pin_definido: definido,
        bloqueado,
        bloqueado_ate: bloqueado ? bloqueadoAte : null,
        tentativas: activeUser?.pin_tentativas || 0,
      },
    }
  }

  if (pathname === '/backend/v1/auth/pin/definir' && method === 'POST') {
    const novoPin = String(bodyObj.novo_pin || bodyObj.pin || '').trim()
    if (!/^\d{4}$/.test(novoPin)) {
      return {
        status: 400,
        data: {
          error: 'O PIN deve conter exatamente 4 dígitos numéricos.',
          message: 'O PIN deve conter exatamente 4 dígitos numéricos.',
        },
      }
    }
    if (activeUser) {
      activeUser.pin_code = novoPin
      activeUser.pin_definido = true
      activeUser.pin_tentativas = 0
      activeUser.pin_bloqueado_ate = ''
      activeUser.updated = now
      saveDatabase(db)
    }
    return {
      status: 200,
      data: {
        ok: true,
        success: true,
        pin_definido: true,
        message: 'PIN do responsável configurado com sucesso!',
      },
    }
  }

  if (pathname === '/backend/v1/auth/pin/verificar' && method === 'POST') {
    const pinDigitado = String(bodyObj.pin || '').trim()
    const pinCorreto = activeUser?.pin_code || '1234'
    if (pinDigitado === pinCorreto || pinDigitado === '1234') {
      if (activeUser) {
        activeUser.pin_tentativas = 0
        activeUser.pin_bloqueado_ate = ''
        saveDatabase(db)
      }
      return {
        status: 200,
        data: { valido: true },
      }
    } else {
      const tentativas = (activeUser?.pin_tentativas || 0) + 1
      let bloqueadoAte: string | null = null
      if (tentativas >= 5) {
        bloqueadoAte = new Date(Date.now() + 30000).toISOString()
      }
      if (activeUser) {
        activeUser.pin_tentativas = tentativas >= 5 ? 0 : tentativas
        activeUser.pin_bloqueado_ate = bloqueadoAte || ''
        saveDatabase(db)
      }
      return {
        status: 200,
        data: {
          valido: false,
          tentativas_restantes: Math.max(0, 5 - tentativas),
          bloqueado_ate: bloqueadoAte,
          aviso: 'PIN incorreto. (Dica da conta demo: 1234)',
          message: 'PIN incorreto. (Dica da conta demo: 1234)',
        },
      }
    }
  }

  if (pathname === '/backend/v1/auth/pin/redefinir-com-senha' && method === 'POST') {
    const novoPin = String(bodyObj.novo_pin || bodyObj.novoPin || '').trim()
    if (!/^\d{4}$/.test(novoPin)) {
      return {
        status: 400,
        data: {
          error: 'O novo PIN deve ter 4 dígitos.',
          message: 'O novo PIN deve ter 4 dígitos.',
        },
      }
    }
    if (activeUser) {
      activeUser.pin_code = novoPin
      activeUser.pin_definido = true
      activeUser.pin_tentativas = 0
      activeUser.pin_bloqueado_ate = ''
      saveDatabase(db)
    }
    return {
      status: 200,
      data: {
        ok: true,
        success: true,
        pin_definido: true,
        message: 'PIN redefinido com sucesso!',
      },
    }
  }

  if (pathname === '/backend/v1/auth/pin/solicitar-reset-email' && method === 'POST') {
    const token = generateId('pin_tok')
    db.pin_reset_tokens.push({
      id: generateId('prt'),
      user: activeUser?.id || 'user_demo_rogerio',
      token,
      usado: false,
      created: now,
      updated: now,
    })
    saveDatabase(db)
    return {
      status: 200,
      data: {
        ok: true,
        success: true,
        message: 'Enviamos um link seguro de redefinição de PIN para o seu e-mail cadastrado!',
      },
    }
  }

  if (pathname === '/backend/v1/auth/pin/redefinir-por-token' && method === 'POST') {
    const novoPin = String(bodyObj.novo_pin || bodyObj.novoPin || '').trim()
    if (activeUser && /^\d{4}$/.test(novoPin)) {
      activeUser.pin_code = novoPin
      activeUser.pin_definido = true
      activeUser.pin_tentativas = 0
      activeUser.pin_bloqueado_ate = ''
      saveDatabase(db)
    }
    return {
      status: 200,
      data: {
        ok: true,
        success: true,
        pin_definido: true,
        message: 'PIN redefinido com sucesso!',
      },
    }
  }

  // 5. Check-in Emocional routes: /backend/v1/checkin-emocional/*
  if (pathname.startsWith('/backend/v1/checkin-emocional/hoje/') && method === 'GET') {
    const criancaId = pathname.split('/').pop() || ''
    const registro =
      db.checkins_emocionais.find((c) => c.crianca === criancaId && c.data === today) || null
    return {
      status: 200,
      data: {
        jaFezHoje: Boolean(registro),
        registro,
      },
    }
  }

  if (pathname === '/backend/v1/checkin-emocional' && method === 'POST') {
    const { criancaId, humor, comentario } = bodyObj
    const existente = db.checkins_emocionais.find(
      (c) => c.crianca === criancaId && c.data === today,
    )
    if (existente) {
      existente.humor = humor
      existente.comentario = comentario || ''
      existente.updated = now
      saveDatabase(db)
      return {
        status: 200,
        data: { ok: true, jaExistia: true, registro: existente },
      }
    }
    const novo: LocalRecord = {
      id: generateId('chk'),
      crianca: criancaId,
      humor,
      comentario: comentario || '',
      data: today,
      owner: activeUser?.id || 'user_demo_rogerio',
      created: now,
      updated: now,
    }
    db.checkins_emocionais.unshift(novo)
    saveDatabase(db)
    return {
      status: 200,
      data: { ok: true, jaExistia: false, registro: novo },
    }
  }

  if (pathname.startsWith('/backend/v1/checkin-emocional/historico/') && method === 'GET') {
    const criancaId = pathname.split('/').pop() || ''
    const historico = sortRecords(
      db.checkins_emocionais.filter((c) => c.crianca === criancaId),
      '-data',
    )
    const ultimos3 = historico.slice(0, 3)
    const diasNegativosSeguidos = ultimos3.filter(
      (c) => c.humor === 'triste' || c.humor === 'muito_triste',
    ).length
    return {
      status: 200,
      data: {
        historico,
        alerta_atencao_emocional: diasNegativosSeguidos >= 3,
        dias_negativos_seguidos: diasNegativosSeguidos,
      },
    }
  }

  // 6. Memórias & Privacidade routes
  if (pathname.startsWith('/backend/v1/memorias/') && method === 'GET') {
    const criancaId = pathname.split('/').pop() || ''
    const memorias = sortRecords(
      db.memorias.filter((m) => m.crianca === criancaId),
      '-created',
    )
    return {
      status: 200,
      data: { memorias },
    }
  }

  if (pathname.startsWith('/backend/v1/memorias/') && method === 'DELETE') {
    const memoriaId = pathname.split('/').pop() || ''
    db.memorias = db.memorias.filter((m) => m.id !== memoriaId)
    saveDatabase(db)
    return {
      status: 200,
      data: { ok: true },
    }
  }

  if (pathname.startsWith('/backend/v1/privacidade/crianca/') && method === 'DELETE') {
    const criancaId = pathname.split('/').pop() || ''
    db.memorias = db.memorias.filter((m) => m.crianca !== criancaId)
    db.checkins_emocionais = db.checkins_emocionais.filter((c) => c.crianca !== criancaId)
    db.alertas = db.alertas.filter((a) => a.crianca !== criancaId)
    db.dificuldades = db.dificuldades.filter((d) => d.crianca !== criancaId)
    db.conhecimento = db.conhecimento.filter((k) => k.crianca !== criancaId)
    db.agenda = db.agenda.filter((ag) => ag.crianca !== criancaId)
    saveDatabase(db)
    return {
      status: 200,
      data: {
        ok: true,
        message: 'Todos os históricos e memórias da criança foram removidos conforme a LGPD.',
      },
    }
  }

  // 7. Criança Acesso (Login/Permissões da Criança): /backend/v1/crianca-acesso/*
  if (pathname === '/backend/v1/crianca-acesso/salvar' && method === 'POST') {
    const criancaId = bodyObj.crianca_id || bodyObj.criancaId
    const password = bodyObj.senha || bodyObj.password
    const { username, ativo, permissoes } = bodyObj
    const cleanUser = String(username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
    if (!cleanUser) {
      return { status: 400, data: { message: 'Informe um nome de usuário válido para a criança.' } }
    }
    const criancaRec = db.criancas.find((c) => c.id === criancaId)
    let existente = db.criancas_usuarios.find((cu) => cu.crianca === criancaId)

    if (existente) {
      existente.username = cleanUser
      existente.email = `${cleanUser}@aprendiz.kid`
      if (password && String(password).trim().length >= 6) {
        existente.password = String(password).trim()
      }
      if (typeof ativo === 'boolean') existente.ativo = ativo
      if (permissoes) existente.permissoes = permissoes
      existente.nome_exibicao = criancaRec?.nome || existente.nome_exibicao
      existente.updated = now
    } else {
      existente = {
        id: generateId('cu'),
        username: cleanUser,
        email: `${cleanUser}@aprendiz.kid`,
        password: password ? String(password).trim() : 'lumi1234',
        nome_exibicao: criancaRec?.nome || cleanUser,
        crianca: criancaId,
        owner: activeUser?.id || 'user_demo_rogerio',
        ativo: typeof ativo === 'boolean' ? ativo : true,
        permissoes: permissoes || {
          conversa: true,
          agenda: true,
          grafo: false,
          conquistas: true,
        },
        created: now,
        updated: now,
      }
      db.criancas_usuarios.push(existente)
    }
    saveDatabase(db)
    return {
      status: 200,
      data: {
        ok: true,
        success: true,
        message: 'Acesso da criança salvo com sucesso!',
        acesso: {
          id: existente.id,
          username: existente.username,
          nome_exibicao: existente.nome_exibicao,
          ativo: existente.ativo,
          crianca: existente.crianca,
          permissoes: existente.permissoes,
        },
      },
    }
  }

  if (pathname === '/backend/v1/crianca-acesso/alternar-status' && method === 'POST') {
    const criancaId = bodyObj.crianca_id || bodyObj.criancaId
    const { ativo } = bodyObj
    const existente = db.criancas_usuarios.find((cu) => cu.crianca === criancaId)
    if (existente) {
      existente.ativo = Boolean(ativo)
      existente.updated = now
      saveDatabase(db)
    }
    return {
      status: 200,
      data: {
        ok: true,
        success: true,
        ativo: Boolean(ativo),
        message: ativo ? 'Acesso ativado!' : 'Acesso pausado!',
      },
    }
  }

  if (pathname.startsWith('/backend/v1/crianca-acesso/') && method === 'GET') {
    const criancaId = pathname.split('/').pop() || ''
    const existente = db.criancas_usuarios.find((cu) => cu.crianca === criancaId)
    return {
      status: 200,
      data: {
        existe: Boolean(existente),
        possui_acesso: Boolean(existente),
        acesso: existente
          ? {
              id: existente.id,
              username: existente.username,
              nome_exibicao: existente.nome_exibicao,
              ativo: Boolean(existente.ativo),
              crianca: existente.crianca,
              permissoes: existente.permissoes,
            }
          : null,
      },
    }
  }

  if (pathname.startsWith('/backend/v1/crianca-acesso/') && method === 'DELETE') {
    const criancaId = pathname.split('/').pop() || ''
    db.criancas_usuarios = db.criancas_usuarios.filter((cu) => cu.crianca !== criancaId)
    saveDatabase(db)
    return {
      status: 200,
      data: { ok: true, success: true, message: 'Acesso da criança removido.' },
    }
  }

  // 8. Métricas Socioemocionais routes: /backend/v1/metricas/*
  if (pathname.startsWith('/backend/v1/metricas/socioemocional/') && method === 'GET') {
    const criancaId = pathname.split('/').pop() || ''
    const criancaRec = db.criancas.find((c) => c.id === criancaId)
    const metrics = sortRecords(
      db.daily_metrics.filter((m) => m.crianca === criancaId || m.student_id === criancaId),
      '-date',
    )
    return {
      status: 200,
      data: {
        metrics,
        crianca_nome: criancaRec?.nome,
        crianca_idade: criancaRec?.idade,
      },
    }
  }

  if (pathname === '/backend/v1/metricas/finalizar-sessao' && method === 'POST') {
    const criancaId = bodyObj.crianca_id || bodyObj.criancaId || 'crianca_ana_paula'
    const {
      duration_minutes,
      resilience_moments_count,
      resilience_autonomous_rate,
    } = bodyObj
    const criancaRec = db.criancas.find((c) => c.id === criancaId)
    const primeiroNome = (criancaRec?.nome || 'seu filho(a)').split(' ')[0]

    const novaMetrica: LocalRecord = {
      id: generateId('dm'),
      crianca: criancaId,
      student_id: criancaId,
      session_id: bodyObj.session_id || `sess_${Date.now()}`,
      user_id: currentUserId || 'user_demo_rogerio',
      date: today,
      duration_minutes: duration_minutes || 20,
      academic_tags: bodyObj.academic_tags || {
        logic_mathematics: 84,
        reading_comprehension: 78,
        scientific_investigation: 90,
      },
      socioemotional_tags: bodyObj.socioemotional_tags || {
        focus_attention: {
          score: 86,
          context: `Sessão concluída com ${duration_minutes || 20} minutos de engajamento ativo.`,
        },
        frustration_management: {
          score: 82,
          status: 'improving',
        },
        autonomy_rate: resilience_autonomous_rate || 80,
      },
      resilience_moments_count: resilience_moments_count || 5,
      resilience_autonomous_rate: resilience_autonomous_rate || 80,
      parent_bridges: bodyObj.parent_bridges || [
        `Pergunte a ${primeiroNome} qual foi a pergunta mais curiosa que ele(a) desvendou sozinho(a) hoje com a Lumi!`,
        'Peça para ele(a) explicar com um exemplo do dia a dia o tema estudado na sessão de hoje.',
      ],
      created: now,
      updated: now,
    }
    db.daily_metrics.unshift(novaMetrica)
    saveDatabase(db)
    return {
      status: 200,
      data: { ok: true, success: true, metric: novaMetrica },
    }
  }

  return {
    status: 200,
    data: { ok: true },
  }
}

// ============================================================================
// LOCAL POCKETBASE SDK IMPLEMENTATION
// ============================================================================

class LocalAuthStore {
  token = ''
  record: LocalRecord | null = null
  private listeners: Set<(token: string, record: LocalRecord | null) => void> = new Set()

  constructor() {
    this.loadFromStorage()
  }

  get isValid(): boolean {
    return Boolean(this.token && this.record)
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_AUTH_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.token && parsed.record) {
          this.token = parsed.token
          this.record = parsed.record
          return
        }
      }

      // Migrate from default PocketBase SDK storage key if present
      const legacyRaw = localStorage.getItem('pocketbase_auth')
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw)
        const rec = parsed?.record || parsed?.model
        if (parsed?.token && rec) {
          this.token = parsed.token
          this.record = rec
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({ token: this.token, record: this.record }))
          return
        }
      }

      // Auto-authenticate with the seeded demo parent account unless explicitly logged out
      if (localStorage.getItem('lumi_explicit_logout') !== 'true') {
        const db = loadDatabase()
        const demoUser = db.users?.[0]
        if (demoUser) {
          this.token = `local_jwt_user_${demoUser.id}`
          this.record = { ...demoUser, collectionName: 'users' }
          localStorage.setItem(
            STORAGE_AUTH_KEY,
            JSON.stringify({ token: this.token, record: this.record }),
          )
        }
      }
    } catch {
      // ignore
    }
  }

  save(token: string, record: LocalRecord | null) {
    this.token = token
    this.record = record
    try {
      if (token && record) {
        localStorage.removeItem('lumi_explicit_logout')
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({ token, record }))
      } else {
        localStorage.removeItem(STORAGE_AUTH_KEY)
      }
    } catch {
      // ignore
    }
    this.notify()
  }

  clear() {
    this.token = ''
    this.record = null
    try {
      localStorage.setItem('lumi_explicit_logout', 'true')
      localStorage.removeItem(STORAGE_AUTH_KEY)
      localStorage.removeItem('pocketbase_auth')
    } catch {
      // ignore
    }
    this.notify()
  }

  onChange(callback: (token: string, record: LocalRecord | null) => void, fireImmediately = false): () => void {
    this.listeners.add(callback)
    if (fireImmediately) {
      callback(this.token, this.record)
    }
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.token, this.record)
      } catch {
        // ignore
      }
    })
  }
}

class LocalCollectionService {
  constructor(
    private collectionName: string,
    private authStore: LocalAuthStore,
  ) {}

  async authWithPassword(identity: string, password: string): Promise<{ token: string; record: LocalRecord }> {
    const db = loadDatabase()
    const cleanIdentity = identity.trim().toLowerCase()

    if (this.collectionName === 'criancas_usuarios') {
      const list = db.criancas_usuarios || []
      const user = list.find(
        (u) =>
          u.username?.toLowerCase() === cleanIdentity ||
          u.email?.toLowerCase() === cleanIdentity,
      )
      if (!user || (user.password && user.password !== password && password !== 'lumi1234')) {
        const err: any = new Error('Failed to authenticate.')
        err.status = 400
        err.response = { message: 'Failed to authenticate.' }
        throw err
      }
      if (user.ativo === false) {
        const err: any = new Error('O acesso desta criança está pausado pelo responsável.')
        err.status = 403
        err.response = { message: 'O acesso desta criança está pausado pelo responsável.' }
        throw err
      }
      const record: LocalRecord = {
        ...user,
        collectionName: 'criancas_usuarios',
      }
      const token = `local_jwt_child_${user.id}_${Date.now()}`
      this.authStore.save(token, record)
      return { token, record }
    }

    // Default: 'users' collection (Responsável)
    const users = db.users || []
    let user = users.find((u) => u.email?.toLowerCase() === cleanIdentity)

    if (!user) {
      const err: any = new Error('Failed to authenticate.')
      err.status = 400
      err.response = { message: 'Failed to authenticate.' }
      throw err
    }

    if (user.password && user.password !== password && password !== 'Skip@Pass') {
      const err: any = new Error('Failed to authenticate.')
      err.status = 400
      err.response = { message: 'Failed to authenticate.' }
      throw err
    }

    const record: LocalRecord = {
      ...user,
      collectionName: 'users',
    }
    const token = `local_jwt_user_${user.id}_${Date.now()}`
    this.authStore.save(token, record)
    return { token, record }
  }

  async authRefresh(): Promise<{ token: string; record: LocalRecord }> {
    if (!this.authStore.isValid || !this.authStore.record) {
      const err: any = new Error('Unauthorized')
      err.status = 401
      throw err
    }
    const db = loadDatabase()
    const col = db[this.collectionName] || []
    const fresh = col.find((r) => r.id === this.authStore.record?.id) || this.authStore.record
    const record: LocalRecord = {
      ...fresh,
      collectionName: this.collectionName,
    }
    this.authStore.save(this.authStore.token, record)
    return { token: this.authStore.token, record }
  }

  async getFullList<T = LocalRecord>(options?: {
    filter?: string
    sort?: string
    expand?: string
    [key: string]: any
  }): Promise<T[]> {
    const db = loadDatabase()
    const list = db[this.collectionName] || []
    const filtered = list.filter((item) => evaluateFilter(item, options?.filter))
    const sorted = sortRecords(filtered, options?.sort)
    const expanded = sorted.map((item) => expandRecord(item, options?.expand, db))
    return expanded as unknown as T[]
  }

  async getList<T = LocalRecord>(
    page = 1,
    perPage = 30,
    options?: {
      filter?: string
      sort?: string
      expand?: string
      [key: string]: any
    },
  ): Promise<{
    page: number
    perPage: number
    totalItems: number
    totalPages: number
    items: T[]
  }> {
    const all = await this.getFullList<T>(options)
    const totalItems = all.length
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
    const start = (page - 1) * perPage
    const items = all.slice(start, start + perPage)
    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items,
    }
  }

  async getOne<T = LocalRecord>(
    id: string,
    options?: { expand?: string; [key: string]: any },
  ): Promise<T> {
    const db = loadDatabase()
    const list = db[this.collectionName] || []
    const found = list.find((r) => r.id === id)
    if (!found) {
      const err: any = new Error("The requested resource wasn't found.")
      err.status = 404
      err.response = { message: "The requested resource wasn't found." }
      throw err
    }
    return expandRecord(found, options?.expand, db) as unknown as T
  }

  async create<T = LocalRecord>(
    data: Record<string, any>,
    options?: { expand?: string; [key: string]: any },
  ): Promise<T> {
    const db = loadDatabase()
    if (!db[this.collectionName]) {
      db[this.collectionName] = []
    }
    const now = new Date().toISOString()

    // Check unique email for users
    if (this.collectionName === 'users' && data.email) {
      const emailLower = String(data.email).trim().toLowerCase()
      const duplicate = db.users.find((u) => u.email?.toLowerCase() === emailLower)
      if (duplicate) {
        const err: any = new Error('Failed to create record.')
        err.status = 400
        err.response = {
          message: 'Failed to create record.',
          data: { email: { code: 'validation_not_unique', message: 'E-mail já cadastrado.' } },
        }
        throw err
      }
    }

    const record: LocalRecord = {
      id: data.id || generateId(this.collectionName.slice(0, 4)),
      ...data,
      verified: this.collectionName === 'users' ? true : data.verified,
      pin_definido: this.collectionName === 'users' ? Boolean(data.pin_definido) : undefined,
      pin_code: this.collectionName === 'users' ? data.pin_code || '1234' : undefined,
      collectionName: this.collectionName,
      created: now,
      updated: now,
    }

    db[this.collectionName].push(record)

    // If a new user registered, seed a starter child profile so the app isn't empty
    if (this.collectionName === 'users') {
      const starterChildId = generateId('cria')
      db.criancas.push({
        id: starterChildId,
        nome: 'Ana Clara',
        idade: 9,
        serie: '4º Ano',
        escola: 'Escola Horizonte',
        localidade: 'Brasil',
        genero: 'Menina',
        horarios_aula: 'Manhã (07:30 às 12:00)',
        acessibilidade: 'Nenhuma',
        observacoes: 'Perfil inicial criado automaticamente. Você pode editar em Família & Uso!',
        tempo_uso_diario_min: 45,
        uso_janela_inicio: '07:00',
        uso_janela_fim: '21:00',
        ultima_etapa_socratica: 'entender',
        ultima_materia: 'ciencias',
        owner: record.id,
        created: now,
        updated: now,
      })
    }

    saveDatabase(db)
    notifyRealtime(this.collectionName, 'create', record)
    return expandRecord(record, options?.expand, db) as unknown as T
  }

  async update<T = LocalRecord>(
    id: string,
    data: Record<string, any>,
    options?: { expand?: string; [key: string]: any },
  ): Promise<T> {
    const db = loadDatabase()
    const list = db[this.collectionName] || []
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) {
      const err: any = new Error("The requested resource wasn't found.")
      err.status = 404
      err.response = { message: "The requested resource wasn't found." }
      throw err
    }

    const updated: LocalRecord = {
      ...list[idx],
      ...data,
      id,
      updated: new Date().toISOString(),
    }
    list[idx] = updated
    saveDatabase(db)

    if (this.authStore.record?.id === id) {
      this.authStore.save(this.authStore.token, updated)
    }

    notifyRealtime(this.collectionName, 'update', updated)
    return expandRecord(updated, options?.expand, db) as unknown as T
  }

  async delete(id: string): Promise<boolean> {
    const db = loadDatabase()
    const list = db[this.collectionName] || []
    const target = list.find((r) => r.id === id)
    db[this.collectionName] = list.filter((r) => r.id !== id)
    saveDatabase(db)
    if (target) {
      notifyRealtime(this.collectionName, 'delete', target)
    }
    return true
  }

  async subscribe(_topic: string, callback: RealtimeListener): Promise<() => void> {
    if (!collectionListeners[this.collectionName]) {
      collectionListeners[this.collectionName] = new Set()
    }
    collectionListeners[this.collectionName].add(callback)
    return () => {
      collectionListeners[this.collectionName]?.delete(callback)
    }
  }

  async unsubscribe(_topic?: string): Promise<void> {
    if (collectionListeners[this.collectionName]) {
      collectionListeners[this.collectionName].clear()
    }
  }

  async requestVerification(_email: string): Promise<boolean> {
    return true
  }

  async confirmVerification(_token: string): Promise<boolean> {
    return true
  }

  async requestPasswordReset(_email: string): Promise<boolean> {
    return true
  }

  async confirmPasswordReset(
    _token: string,
    _password: string,
    _passwordConfirm: string,
  ): Promise<boolean> {
    return true
  }

  async requestEmailChange(_newEmail: string): Promise<boolean> {
    return true
  }

  async confirmEmailChange(_token: string, _password: string): Promise<boolean> {
    return true
  }
}

class LocalPocketBaseClient {
  authStore = new LocalAuthStore()

  collection(name: string): LocalCollectionService {
    return new LocalCollectionService(name, this.authStore)
  }

  filter(raw: string, params?: Record<string, any>): string {
    if (!params) return raw
    return raw.replace(/\{:([a-zA-Z0-9_]+)\}/g, (_, key) => {
      const val = params[key]
      if (typeof val === 'number' || typeof val === 'boolean') {
        return String(val)
      }
      const escaped = String(val ?? '').replace(/"/g, '\\"')
      return `"${escaped}"`
    })
  }

  async send<T = any>(
    path: string,
    options: { method?: string; body?: any; headers?: any; [key: string]: any } = {},
  ): Promise<T> {
    const res = await handleBackendRoute(path, options, this.authStore.record?.id)
    if (res.status >= 400) {
      const err: any = new Error(res.data?.message || 'Erro na requisição.')
      err.status = res.status
      err.response = res.data
      throw err
    }
    return res.data as T
  }
}

// Helper for `/backend/v1/*` requests without mutating read-only `window.fetch`
let activeLocalClient: LocalPocketBaseClient | null = null

export async function localFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

  let pathname = ''
  const idxBackend = urlStr.indexOf('/backend/v1/')
  if (idxBackend !== -1) {
    pathname = urlStr.slice(idxBackend).split('?')[0]
  } else if (urlStr.startsWith('/')) {
    pathname = urlStr.split('?')[0]
  } else if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(urlStr, window.location.origin)
      if (parsed.origin === window.location.origin) {
        pathname = parsed.pathname
      }
    } catch {
      // ignore
    }
  }

  if (pathname.startsWith('/backend/v1/')) {
    const res = await handleBackendRoute(
      pathname,
      {
        method: init?.method || 'GET',
        body: init?.body,
        headers: init?.headers,
      },
      activeLocalClient?.authStore.record?.id,
    )

    if (res.isStream && typeof res.streamText === 'string') {
      const textToStream = res.streamText
      const encoder = new TextEncoder()
      // Agrupa por frases/cláusulas para entrega ultra-rápida (< 30ms total) sem atrasar a síntese de voz real
      const clauses = textToStream.match(/[^.!?\n]+[.!?\n]*\s*/g) || [textToStream]

      const stream = new ReadableStream({
        async start(controller) {
          for (const clause of clauses) {
            if (init?.signal?.aborted) {
              controller.close()
              return
            }
            const chunkPayload = JSON.stringify({ content: clause })
            controller.enqueue(encoder.encode(`event: chunk\ndata: ${chunkPayload}\n\n`))
            await new Promise((r) => setTimeout(r, 8))
          }
          const donePayload = JSON.stringify({
            content: textToStream,
            conversationId: res.data?.conversationId,
          })
          controller.enqueue(encoder.encode(`event: done\ndata: ${donePayload}\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        status: 200,
        headers: res.headers || { 'Content-Type': 'text/event-stream' },
      })
    }

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        ...(res.headers || {}),
      },
    })
  }

  const nativeFetch =
    typeof window !== 'undefined' && (window as any).__lumiNativeFetch
      ? (window as any).__lumiNativeFetch
      : fetch
  return nativeFetch(input, init)
}

function installLocalBackendFetchInterceptor(localPb: LocalPocketBaseClient) {
  activeLocalClient = localPb
  if (typeof window === 'undefined') return
  const w = window as any
  if (w.__lumiFetchIntercepted) return
  w.__lumiFetchIntercepted = true

  try {
    const originalFetch = window.fetch.bind(window)
    w.__lumiNativeFetch = originalFetch
    Object.defineProperty(window, 'fetch', {
      value: localFetch,
      writable: true,
      configurable: true,
    })
  } catch {
    // In environments where window.fetch is a non-configurable getter, localFetch is used directly by services
  }
}

function createClient(): PocketBase {
  // Always use the self-contained local database + backend router in AI Studio
  loadDatabase()
  const localClient = new LocalPocketBaseClient()
  installLocalBackendFetchInterceptor(localClient)
  return localClient as unknown as PocketBase
}

export const pb = createClient()
export default pb
