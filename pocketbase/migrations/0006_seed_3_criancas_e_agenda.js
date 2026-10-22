migrate(
  (app) => {
    const criancasCol = app.findCollectionByNameOrId('criancas')
    const dificuldadesCol = app.findCollectionByNameOrId('dificuldades')
    const conhecimentoCol = app.findCollectionByNameOrId('conhecimento')
    const agendaCol = app.findCollectionByNameOrId('agenda')
    const promptsCol = app.findCollectionByNameOrId('system_prompts')

    let demoUser = null
    try {
      demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'roogerio99@gmail.com')
    } catch (_) {
      return
    }

    // 1. Garantir as 3 crianças demo para o demoUser
    const demoCriancas = [
      {
        nome: 'Ana Paula Evaristo Souza Cirilo',
        idade: 10,
        serie: '5º Ano',
        escola: 'Colégio Horizonte',
        observacoes:
          'Muito curiosa e comunicativa. Aprende muito melhor com recursos visuais, metáforas de jogos e desafios práticos.',
        dificuldades: [
          {
            materia: 'Ciências',
            descricao: 'Confunde fotossíntese e respiração celular das plantas',
            impacto: 'Moderado',
          },
          {
            materia: 'Matemática',
            descricao: 'Dificuldade em divisão com decimais e frações equivalentes',
            impacto: 'Alto',
          },
        ],
        conhecimentos: [
          {
            titulo: 'Mapas mentais coloridos em Ciências',
            conteudo:
              'Adora desenhar esquemas visuais com setas e cores para entender o ciclo da fotossíntese. Histórias em quadrinhos funcionam muito bem.',
          },
          {
            titulo: 'Metáforas com tecnologia e games',
            conteudo:
              'Conectar desafios de lógica a fases de jogos faz com que ela se interesse de imediato e tente resolver de forma autônoma.',
          },
          {
            titulo: 'Pausas ativas de 5 minutos',
            conteudo:
              'Quando a sessão passa de 20 minutos, fazer um breve alongamento ou exercício de respiração restaura o foco.',
          },
        ],
        agenda: [
          {
            titulo: 'Prova Bimestral de Ciências',
            data: '2026-10-28',
            horario: '08:30',
            materia: 'Ciências',
            tipo: 'prova',
            descricao: 'Revisar fotossíntese, cadeias alimentares e reino vegetal.',
            concluido: false,
          },
          {
            titulo: 'Lista de Exercícios: Frações',
            data: '2026-10-24',
            horario: '14:00',
            materia: 'Matemática',
            tipo: 'tarefa',
            descricao: 'Páginas 45 a 48 da apostila de matemática.',
            concluido: false,
          },
          {
            titulo: 'Revisão Socrática com a Lumi',
            data: '2026-10-23',
            horario: '16:00',
            materia: 'Ciências',
            tipo: 'revisao',
            descricao: 'Tirar dúvidas sobre a fotossíntese através do quadro visual.',
            concluido: true,
          },
        ],
      },
      {
        nome: 'Lucas Gabriel Silveira',
        idade: 8,
        serie: '3º Ano',
        escola: 'Escola Parque das Nações',
        observacoes:
          'Muito enérgico e criativo. Gosta de dinossauros, exploração espacial e desenhar.',
        dificuldades: [
          {
            materia: 'Português',
            descricao: 'Ortografia de palavras com Ç, SS e pontuação em frases longas',
            impacto: 'Moderado',
          },
          {
            materia: 'História',
            descricao: 'Compreensão da linha do tempo e períodos históricos',
            impacto: 'Leve',
          },
        ],
        conhecimentos: [
          {
            titulo: 'Histórias com Dinossauros e Espaço',
            conteudo:
              'Ao criar frases usando dinossauros como personagens, ele escreve com muito mais empenho e atenção à pontuação.',
          },
          {
            titulo: 'Linha do tempo desenhada',
            conteudo:
              'Linhas do tempo com ilustrações dos eventos ajudam a fixar antes e depois na história do Brasil.',
          },
        ],
        agenda: [
          {
            titulo: 'Trabalho de História: Os Primeiros Habitantes',
            data: '2026-10-29',
            horario: '10:00',
            materia: 'História',
            tipo: 'projeto',
            descricao: 'Apresentação em cartolina sobre povos indígenas.',
            concluido: false,
          },
          {
            titulo: 'Ditado de Palavras com SS e Ç',
            data: '2026-10-25',
            horario: '09:00',
            materia: 'Português',
            tipo: 'tarefa',
            descricao: 'Praticar 15 palavras no caderno.',
            concluido: false,
          },
        ],
      },
      {
        nome: 'Beatriz Lima Rocha',
        idade: 12,
        serie: '7º Ano',
        escola: 'Instituto Dom Bosco',
        observacoes:
          'Perfeccionista e dedicada, mas sente ansiedade antes de avaliações de exatas.',
        dificuldades: [
          {
            materia: 'Matemática',
            descricao: 'Equações de 1º grau com parênteses e regra de sinais',
            impacto: 'Alto',
          },
          {
            materia: 'Geografia',
            descricao: 'Interpretação de curvas de nível e escalas cartográficas',
            impacto: 'Moderado',
          },
        ],
        conhecimentos: [
          {
            titulo: 'Técnica da Balança de Dois Pratos',
            conteudo:
              'Para equações, visualizar uma balança equilibrada ajudou a compreender que o que faz de um lado deve ser feito do outro.',
          },
          {
            titulo: 'Respiração pré-estudo',
            conteudo:
              '3 respirações guiadas de 4 segundos antes de começar os cálculos reduzem expressivamente os bloqueios por ansiedade.',
          },
        ],
        agenda: [
          {
            titulo: 'Simulado de Matemática e Álgebra',
            data: '2026-10-30',
            horario: '07:30',
            materia: 'Matemática',
            tipo: 'prova',
            descricao: 'Equações de 1º grau, problemas e sistemas simples.',
            concluido: false,
          },
          {
            titulo: 'Exercícios de Cartografia',
            data: '2026-10-26',
            horario: '15:30',
            materia: 'Geografia',
            tipo: 'tarefa',
            descricao: 'Calcular distâncias reais a partir da escala 1:50000.',
            concluido: false,
          },
        ],
      },
    ]

    for (const cData of demoCriancas) {
      let criancaRec = null
      const existing = app.findRecordsByFilter(
        'criancas',
        'owner = {:owner} && nome = {:nome}',
        '',
        1,
        0,
        { owner: demoUser.id, nome: cData.nome },
      )

      if (existing && existing.length > 0) {
        criancaRec = existing[0]
      } else {
        criancaRec = new Record(criancasCol)
        criancaRec.set('owner', demoUser.id)
        criancaRec.set('nome', cData.nome)
        criancaRec.set('idade', cData.idade)
        criancaRec.set('serie', cData.serie)
        criancaRec.set('escola', cData.escola)
        criancaRec.set('observacoes', cData.observacoes)
        app.save(criancaRec)
      }

      // Adiciona dificuldades
      for (const d of cData.dificuldades) {
        const hasDif = app.findRecordsByFilter(
          'dificuldades',
          'crianca = {:crianca} && materia = {:materia} && descricao = {:descricao}',
          '',
          1,
          0,
          { crianca: criancaRec.id, materia: d.materia, descricao: d.descricao },
        )
        if (!hasDif || hasDif.length === 0) {
          const dRec = new Record(dificuldadesCol)
          dRec.set('crianca', criancaRec.id)
          dRec.set('materia', d.materia)
          dRec.set('descricao', d.descricao)
          dRec.set('impacto', d.impacto)
          app.save(dRec)
        }
      }

      // Adiciona conhecimentos
      for (const k of cData.conhecimentos) {
        const hasK = app.findRecordsByFilter(
          'conhecimento',
          'crianca = {:crianca} && titulo = {:titulo}',
          '',
          1,
          0,
          { crianca: criancaRec.id, titulo: k.titulo },
        )
        if (!hasK || hasK.length === 0) {
          const kRec = new Record(conhecimentoCol)
          kRec.set('crianca', criancaRec.id)
          kRec.set('titulo', k.titulo)
          kRec.set('conteudo', k.conteudo)
          app.save(kRec)
        }
      }

      // Adiciona agenda
      for (const a of cData.agenda) {
        const hasA = app.findRecordsByFilter(
          'agenda',
          'crianca = {:crianca} && titulo = {:titulo} && data = {:data}',
          '',
          1,
          0,
          { crianca: criancaRec.id, titulo: a.titulo, data: a.data },
        )
        if (!hasA || hasA.length === 0) {
          const aRec = new Record(agendaCol)
          aRec.set('crianca', criancaRec.id)
          aRec.set('titulo', a.titulo)
          aRec.set('descricao', a.descricao)
          aRec.set('data', a.data)
          aRec.set('horario', a.horario)
          aRec.set('materia', a.materia)
          aRec.set('tipo', a.tipo)
          aRec.set('concluido', a.concluido)
          app.save(aRec)
        }
      }
    }

    // 2. Garantir System Prompt padrão inicial no banco
    const existingPrompt = app.findRecordsByFilter(
      'system_prompts',
      'owner = {:owner} && ativo = true',
      '',
      1,
      0,
      { owner: demoUser.id },
    )
    if (!existingPrompt || existingPrompt.length === 0) {
      const pRec = new Record(promptsCol)
      pRec.set('owner', demoUser.id)
      pRec.set('titulo', 'Prompt Socrático Padrão - Lumi')
      pRec.set(
        'identidade',
        'Lumi é uma tutora inteligente, carinhosa, paciente e focada em despertar a curiosidade de crianças e jovens no aprendizado.',
      )
      pRec.set(
        'metodo_socratico',
        'Nunca entregar a resposta direta. Fazer perguntas provocativas graduais, investigar hipóteses da criança e incentivá-la a deduzir a resposta.',
      )
      pRec.set(
        'diretrizes_pedagogicas',
        'Acolher erros como oportunidades de descoberta. Conectar o conteúdo a exemplos práticos e hobbies da criança.',
      )
      pRec.set('tom_de_voz', 'Afetuoso, encorajador, lúdico e claro, sem jargões complicados.')
      pRec.set(
        'instrucoes_quadro',
        'Ao apresentar um raciocínio, descreva passos visuais claros que possam ser desenhados no quadro mental ou anotados em blocos.',
      )
      pRec.set('ativo', true)
      app.save(pRec)
    }
  },
  (app) => {
    // down idempotente
  },
)
