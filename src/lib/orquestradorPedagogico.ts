import type { EtapaSocratica } from '@/types'

export type ModeloPedagogico =
  | 'ausubel_expositivo' // a) Aprendizagem Significativa Expositiva (Ausubel) - Curiosidades livres / conversa
  | 'sweller_exemplo_trabalhado' // b) Exemplo Trabalhado Resolvido + Desafio Espelho (Sweller + Vygotsky) - Tarefa escolar
  | 'bruner_concreto_visual' // c) Representação Concreta e Visual (Bruner) - Apoio visual concreto passo 1 e passo 2
  | 'casel_regulacao_afetiva' // d) Regulação Afetiva (CASEL/Dweck) - Frustração ("não sei", "difícil", "cansei")
  | 'socratico_leve' // e) Mediação Socrática Leve (máx. 20%) - Fechamento após acertar o exemplo de treino

export interface InfoModeloPedagogico {
  id: ModeloPedagogico
  nomeCurto: string
  teoriaBase: string
  icone: string
  corBadge: string
  descricaoRegra: string
  etapaEquivalente: EtapaSocratica
}

export const CATALOGO_MODELOS_PEDAGOGICOS: Record<ModeloPedagogico, InfoModeloPedagogico> = {
  ausubel_expositivo: {
    id: 'ausubel_expositivo',
    nomeCurto: 'Explicação Direta & Curiosa (Ausubel)',
    teoriaBase: 'Aprendizagem Significativa Expositiva (Ausubel)',
    icone: '🌟',
    corBadge: 'bg-sky-100 text-sky-900 border-sky-300',
    descricaoRegra:
      'Curiosidade livre (natureza, animais, espaço, dia a dia): explica diretamente com entusiasmo, sem devolver perguntas de interrogatório.',
    etapaEquivalente: 'contextualizar',
  },
  sweller_exemplo_trabalhado: {
    id: 'sweller_exemplo_trabalhado',
    nomeCurto: 'Exemplo Resolvido + Desafio Espelho (Sweller & Vygotsky)',
    teoriaBase: 'Exemplo Trabalhado (Sweller) + ZDP (Vygotsky)',
    icone: '🧩',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    descricaoRegra:
      'Tarefa escolar: nunca dá a resposta da tarefa de cara; mostra 1º um exemplo parecido JÁ RESOLVIDO COM RESPOSTA e, na mesma mensagem, propõe o Desafio Espelho para a criança responder.',
    etapaEquivalente: 'guiar',
  },
  bruner_concreto_visual: {
    id: 'bruner_concreto_visual',
    nomeCurto: 'Representação Concreta Visual (Bruner)',
    teoriaBase: 'Andaime Concreto-Pictórico-Simbólico (Bruner)',
    icone: '🎨',
    corBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    descricaoRegra:
      'Sincroniza o Quadro Visual com o 1º Passo (Exemplo da Lumi com resposta) e o 2º Passo (Seu Exemplo para Responder).',
    etapaEquivalente: 'praticar',
  },
  casel_regulacao_afetiva: {
    id: 'casel_regulacao_afetiva',
    nomeCurto: 'Acolhimento & Mini-Exemplo Resolvido (CASEL/Dweck)',
    teoriaBase: 'Regulação Afetiva (CASEL) & Mentalidade de Crescimento (Dweck)',
    icone: '💛',
    corBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    descricaoRegra:
      'Ao detectar "não sei", "difícil" ou "cansei", suspende perguntas abertas, acolhe a criança e mostra um mini-exemplo já resolvido.',
    etapaEquivalente: 'entender',
  },
  socratico_leve: {
    id: 'socratico_leve',
    nomeCurto: 'Fechamento Socrático Leve (Máx. 20%)',
    teoriaBase: 'Mediação Socrática de Consolidação',
    icone: '🏆',
    corBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    descricaoRegra:
      'Usado apenas quando a criança já acertou o exemplo de treino e vai fechar o resultado final da própria tarefa.',
    etapaEquivalente: 'consolidar',
  },
}

export interface ParExemploEspelho {
  materia: string
  tituloTema: string
  passo1ExemploLumi: {
    titulo: string
    enunciado: string
    resolucaoPassoAPasso: string
    respostaCompleta: string
  }
  passo2DesafioCrianca: {
    titulo: string
    enunciado: string
    dicaRapida: string
    sugestaoRespostaBotao: string
  }
}

export const EXEMPLOS_TRABALHADOS_POR_MATERIA: Record<string, ParExemploEspelho> = {
  matematica: {
    materia: 'matematica',
    tituloTema: 'Frações e Contas do Dia a Dia',
    passo1ExemploLumi: {
      titulo: '1º Passo: Exemplo da Lumi (Com Resposta! ✅)',
      enunciado: 'Imagine uma barra de chocolate dividida em 4 pedaços iguais. Se eu comer 1 pedaço e meu amigo comer mais 2 pedaços, quanto comemos juntos?',
      resolucaoPassoAPasso: 'Somamos os pedaços de cima (1 + 2 = 3) e mantemos o total de partes iguais embaixo (4).',
      respostaCompleta: 'Resposta Resolvida: 3/4 da barra de chocolate (e sobra 1/4)!',
    },
    passo2DesafioCrianca: {
      titulo: '2º Passo: Seu Exemplo para Responder! 🎯',
      enunciado: 'Agora é com você: se uma pizza tem 6 fatias iguais e você comeu 2 fatias e depois mais 2 fatias, quantas fatias você comeu no total (em fração)?',
      dicaRapida: 'Some 2 + 2 na parte de cima e mantenha o 6 embaixo!',
      sugestaoRespostaBotao: 'No seu exemplo da pizza, comi 4/6!',
    },
  },
  portugues: {
    materia: 'portugues',
    tituloTema: 'Sílabas, Ortografia e Frases',
    passo1ExemploLumi: {
      titulo: '1º Passo: Exemplo da Lumi (Com Resposta! ✅)',
      enunciado: 'Vamos separar as sílabas e descobrir por que a palavra CORAÇÃO usa "Ç"?',
      resolucaoPassoAPasso: 'Batemos palmas para cada pedacinho de som: CO - RA - ÇÃO (3 sílabas = trissílaba). Usamos Ç antes de A, O, U para fazer som de "SS".',
      respostaCompleta: 'Resposta Resolvida: CO-RA-ÇÃO tem 3 sílabas e usa Ç antes da vogal A!',
    },
    passo2DesafioCrianca: {
      titulo: '2º Passo: Seu Exemplo para Responder! 🎯',
      enunciado: 'Sua vez de tentar neste exemplo parecido: quantas sílabas tem a palavra PA-ÇOCA e qual letra vem logo depois do Ç?',
      dicaRapida: 'Conte os pedacinhos: PA - ÇO - CA!',
      sugestaoRespostaBotao: 'PA-ÇO-CA tem 3 sílabas e vem a letra O depois do Ç!',
    },
  },
  ciencias: {
    materia: 'ciencias',
    tituloTema: 'Fotossíntese e Natureza Viva',
    passo1ExemploLumi: {
      titulo: '1º Passo: Exemplo da Lumi (Com Resposta! ✅)',
      enunciado: 'Como o girassol fabrica o próprio alimento sem ir ao supermercado?',
      resolucaoPassoAPasso: '1) A raiz bebe água do solo; 2) A folha capta gás carbônico do ar; 3) A luz do Sol funciona como o "forno" que transforma tudo em energia (glicose) e libera Oxigênio!',
      respostaCompleta: 'Resposta Resolvida: Água + Gás Carbônico + Luz do Sol = Alimento da planta + Oxigênio!',
    },
    passo2DesafioCrianca: {
      titulo: '2º Passo: Seu Exemplo para Responder! 🎯',
      enunciado: 'Agora teste neste exemplo: se colocarmos uma plantinha dentro de uma caixa totalmente escura por vários dias, qual ingrediente principal vai faltar para a folha fazer fotossíntese?',
      dicaRapida: 'Lembre-se do que ilumina e aquece a folha durante o dia!',
      sugestaoRespostaBotao: 'Vai faltar a luz do Sol para a plantinha!',
    },
  },
  historia: {
    materia: 'historia',
    tituloTema: 'Linha do Tempo e Transformações',
    passo1ExemploLumi: {
      titulo: '1º Passo: Exemplo da Lumi (Com Resposta! ✅)',
      enunciado: 'Como as pessoas enviavam mensagens urgentes antes de existir internet ou telefone?',
      resolucaoPassoAPasso: 'No passado, as cartas viajavam semanas em cavalos ou navios a vela. Depois vieram o telégrafo, o telefone fixo e hoje o celular instantâneo!',
      respostaCompleta: 'Resposta Resolvida: As cartas levavam semanas porque dependiam do transporte físico em cavalos e caravelas.',
    },
    passo2DesafioCrianca: {
      titulo: '2º Passo: Seu Exemplo para Responder! 🎯',
      enunciado: 'Agora pense neste exemplo parecido: antes de existirem lâmpadas elétricas nas casas, o que as famílias usavam para iluminar a sala à noite?',
      dicaRapida: 'Pense no fogo, velas ou lamparinas!',
      sugestaoRespostaBotao: 'As famílias usavam velas e lamparinas!',
    },
  },
  geografia: {
    materia: 'geografia',
    tituloTema: 'Orientação, Mapas e Clima',
    passo1ExemploLumi: {
      titulo: '1º Passo: Exemplo da Lumi (Com Resposta! ✅)',
      enunciado: 'Se eu abrir os braços apontando a mão direita para onde o Sol nasce (Leste), para onde minha mão esquerda aponta?',
      resolucaoPassoAPasso: 'O Sol nasce sempre no Leste (mão direita). O lado oposto, onde o Sol se põe, é o Oeste (mão esquerda). Na nossa frente fica o Norte e atrás o Sul!',
      respostaCompleta: 'Resposta Resolvida: A mão esquerda aponta para o Oeste (onde o Sol se põe)!',
    },
    passo2DesafioCrianca: {
      titulo: '2º Passo: Seu Exemplo para Responder! 🎯',
      enunciado: 'Agora resolva este exemplo: se você está olhando para o Norte e dá meia-volta completa para trás, para qual ponto cardeal você está olhando agora?',
      dicaRapida: 'Qual é o ponto oposto ao Norte na Rosa dos Ventos?',
      sugestaoRespostaBotao: 'Estou olhando para o Sul!',
    },
  },
  geral: {
    materia: 'geral',
    tituloTema: 'Raciocínio Lógico e Descobertas',
    passo1ExemploLumi: {
      titulo: '1º Passo: Exemplo da Lumi (Com Resposta! ✅)',
      enunciado: 'Sequência das estrelas: ⭐ (2), ⭐⭐ (4), ⭐⭐⭐ (6). Qual é o próximo número?',
      resolucaoPassoAPasso: 'Cada passo soma +2 ao número anterior: 2 + 2 = 4; 4 + 2 = 6; portanto 6 + 2 = 8.',
      respostaCompleta: 'Resposta Resolvida: O próximo número da sequência é 8!',
    },
    passo2DesafioCrianca: {
      titulo: '2º Passo: Seu Exemplo para Responder! 🎯',
      enunciado: 'Agora descubra você neste exemplo parecido: na sequência 5, 10, 15... qual é o próximo número pulando de 5 em 5?',
      dicaRapida: 'Some 15 + 5!',
      sugestaoRespostaBotao: 'O próximo número da sequência é 20!',
    },
  },
}

export function obterExemploTrabalhadoPorMateria(materia: string): ParExemploEspelho {
  const norm = (materia || '').toLowerCase()
  if (norm.includes('mat') || norm.includes('fra')) return EXEMPLOS_TRABALHADOS_POR_MATERIA.matematica
  if (norm.includes('port') || norm.includes('silab') || norm.includes('red'))
    return EXEMPLOS_TRABALHADOS_POR_MATERIA.portugues
  if (norm.includes('hist')) return EXEMPLOS_TRABALHADOS_POR_MATERIA.historia
  if (norm.includes('geo')) return EXEMPLOS_TRABALHADOS_POR_MATERIA.geografia
  if (norm.includes('cien') || norm.includes('ciên') || norm.includes('bio') || norm.includes('fis'))
    return EXEMPLOS_TRABALHADOS_POR_MATERIA.ciencias
  return EXEMPLOS_TRABALHADOS_POR_MATERIA.geral
}

/**
 * Classifica automaticamente a intenção da fala da criança entre os 5 modelos pedagógicos
 */
export function detectarModeloPedagogicoIdeal(
  mensagemUsuario: string,
  ultimoModelo?: ModeloPedagogico,
): ModeloPedagogico {
  const norm = (mensagemUsuario || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  // d) Regulação Afetiva (CASEL/Dweck): frustração, cansaço ou bloqueio
  const padroesFrustracao = [
    'nao sei',
    'dificil',
    'muito dificil',
    'cansei',
    'estou cansado',
    'estou cansada',
    'nao consigo',
    'nao entendi nada',
    'desisto',
    'chato',
    'socorro',
    'travado',
  ]
  if (padroesFrustracao.some((p) => norm.includes(p))) {
    return 'casel_regulacao_afetiva'
  }

  // e) Mediação Socrática Leve (máx. 20%): quando a criança acabou de responder o exemplo de treino / desafio espelho
  const padroesRespostaTreino = [
    'no seu exemplo',
    'comi 4/6',
    '4/6',
    '2/4',
    'metade',
    'resultado e',
    'a resposta e',
    'acho que da',
    'acho que e',
    'tem 3 silabas',
    'luz do sol',
    'para o sul',
    'numero e 20',
  ]
  if (
    ultimoModelo === 'sweller_exemplo_trabalhado' ||
    ultimoModelo === 'bruner_concreto_visual' ||
    padroesRespostaTreino.some((p) => norm.includes(p))
  ) {
    return 'socratico_leve'
  }

  // c) Representação Concreta e Visual (Bruner): quando pede desenho, quadro, esquema visual
  if (
    norm.includes('quadro') ||
    norm.includes('mostra no desenho') ||
    norm.includes('exemplo visual') ||
    norm.includes('esquema')
  ) {
    return 'bruner_concreto_visual'
  }

  // b) Exemplo Trabalhado Resolvido + Desafio Espelho (Sweller + Vygotsky): tarefa escolar, dever de casa, conta
  const padroesTarefaEscolar = [
    'dever de casa',
    'licao de casa',
    'tarefa',
    'exercicio',
    'quanto e',
    'quanto da',
    'calcule',
    'resolver',
    'resolva',
    'fracao',
    'fracoes',
    'equacao',
    'dividir',
    'multiplicar',
    'somar',
    'subtrair',
    'silaba',
    'ortografia',
    'verbo',
    'prova de',
  ]
  if (
    /\d+\s*[+\-*/x÷=]\s*\d+/.test(norm) ||
    padroesTarefaEscolar.some((p) => norm.includes(p))
  ) {
    return 'sweller_exemplo_trabalhado'
  }

  // a) Aprendizagem Significativa Expositiva (Ausubel): curiosidade livre sobre natureza, animais, espaço, histórias ou conversa do dia a dia
  return 'ausubel_expositivo'
}
