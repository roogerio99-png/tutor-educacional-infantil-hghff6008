migrate(
  (app) => {
    const criancasCol = app.findCollectionByNameOrId('criancas')

    // 1. Coleção 'agenda'
    const agendaCollection = new Collection({
      name: 'agenda',
      type: 'base',
      listRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      createRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      updateRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      deleteRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      fields: [
        {
          name: 'crianca',
          type: 'relation',
          required: true,
          collectionId: criancasCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'data',
          type: 'text',
          required: true, // formato YYYY-MM-DD ou data/hora ISO
        },
        {
          name: 'horario',
          type: 'text',
          required: false, // formato HH:mm
        },
        {
          name: 'materia',
          type: 'text',
          required: false,
        },
        {
          name: 'tipo',
          type: 'select',
          required: false,
          values: ['prova', 'tarefa', 'revisao', 'projeto', 'outro'],
          maxSelect: 1,
        },
        {
          name: 'concluido',
          type: 'bool',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_agenda_crianca ON agenda (crianca)',
        'CREATE INDEX idx_agenda_data ON agenda (data)',
      ],
    })
    app.save(agendaCollection)

    // 2. Coleção 'system_prompts' (para personalização dos prompts por usuário/criança)
    const promptCol = new Collection({
      name: 'system_prompts',
      type: 'base',
      listRule: "@request.auth.id != '' && owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: "@request.auth.id != '' && owner = @request.auth.id",
      updateRule: "@request.auth.id != '' && owner = @request.auth.id",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'identidade',
          type: 'text',
          required: true,
        },
        {
          name: 'metodo_socratico',
          type: 'text',
          required: true,
        },
        {
          name: 'diretrizes_pedagogicas',
          type: 'text',
          required: false,
        },
        {
          name: 'tom_de_voz',
          type: 'text',
          required: false,
        },
        {
          name: 'instrucoes_quadro',
          type: 'text',
          required: false,
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: ['CREATE INDEX idx_prompts_owner ON system_prompts (owner)'],
    })
    app.save(promptCol)

    // 3. Definir Agente Lumi IA
    $ai.agents.define(app, {
      slug: 'lumi-ia',
      name: 'Lumi IA',
      description:
        'Tutora educacional infantil socrática que guia o aprendizado com perguntas estimulantes e nunca entrega respostas prontas.',
      systemPrompt:
        'Você é a Lumi, uma tutora educacional infantil socrática, calorosa, paciente e encorajadora. Sua missão é guiar crianças na compreensão de conteúdos escolares (Português, Matemática, Ciências, História, Geografia etc.).\n\nREGRAS SAGRADAS:\n1. NUNCA dê a resposta final pronta de bandeja. Em vez disso, faça perguntas investigativas, dê dicas em etapas pequenas ou use analogias cotidianas simples.\n2. Adapte sua linguagem para a idade e série da criança informada no contexto. Seja afetiva, empática e divertida.\n3. Se a criança errar, celebre a tentativa, aponte o raciocínio positivo e pergunte o que ela acha que aconteceria se tentasse outro caminho.\n4. Sempre que explicar um passo, sugira também um elemento visual simples (ex: "Imagine uma pizza com 4 fatias", "Vamos desenhar uma linha do tempo") para apoiar o Quadro Visual.\n5. Seja concisa: parágrafos curtos e amigáveis para leitura infantil.',
      tier: 'fast',
      tools: [
        {
          collection: 'criancas',
          perms: { read: true, list: true },
          actAs: 'admin',
          scopeFilter: 'owner = @request.auth.id',
        },
        {
          collection: 'dificuldades',
          perms: { read: true, list: true },
          actAs: 'admin',
          scopeFilter: 'crianca.owner = @request.auth.id',
        },
        {
          collection: 'conhecimento',
          perms: { read: true, list: true },
          actAs: 'admin',
          scopeFilter: 'crianca.owner = @request.auth.id',
        },
        {
          collection: 'agenda',
          perms: { read: true, list: true },
          actAs: 'admin',
          scopeFilter: 'crianca.owner = @request.auth.id',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Princípio Socrático na Educação Infantil: Quebrar problemas complexos em micrometas. Fazer perguntas abertas começando com "O que você acha que acontece quando...", "Como poderíamos descobrir...", "Se você tivesse 3 maçãs...". Nunca desqualificar o erro.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Apoio Socioemocional Infantil: Reconhecer a frustração infantil antes de continuar a tarefa técnica. Técnicas de respiração 4-4 e pausas ativas a cada 20 minutos de estudo concentrado.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'lumi-ia')
    } catch (_) {}
    try {
      const pCol = app.findCollectionByNameOrId('system_prompts')
      app.delete(pCol)
    } catch (_) {}
    try {
      const aCol = app.findCollectionByNameOrId('agenda')
      app.delete(aCol)
    } catch (_) {}
  },
)
