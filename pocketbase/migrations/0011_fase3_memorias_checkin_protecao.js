/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const criancasCol = app.findCollectionByNameOrId('criancas')

    // 1. Coleção 'memorias' (Pipeline de Extração de Memórias da Fase 3)
    // Campos: crianca (relation), tipo (select), conteudo (text), categoria (text), confianca (select: alta|media|baixa), origem (text: 'conversa'), data (text), ativo (bool)
    const memoriasCol = new Collection({
      name: 'memorias',
      type: 'base',
      listRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      createRule: "@request.auth.id != ''",
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
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['interesse', 'pessoa_relacao', 'rotina', 'estrategia', 'dificuldade', 'emocao'],
          maxSelect: 1,
        },
        {
          name: 'conteudo',
          type: 'text',
          required: true,
        },
        {
          name: 'categoria',
          type: 'text',
          required: false,
        },
        {
          name: 'confianca',
          type: 'select',
          required: true,
          values: ['alta', 'media', 'baixa'],
          maxSelect: 1,
        },
        {
          name: 'origem',
          type: 'text',
          required: false, // padrão 'conversa'
        },
        {
          name: 'data',
          type: 'text',
          required: true, // formato YYYY-MM-DD
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false, // default true, false para esquecimento
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
        'CREATE INDEX idx_memorias_crianca ON memorias (crianca)',
        'CREATE INDEX idx_memorias_tipo ON memorias (tipo)',
        'CREATE INDEX idx_memorias_ativo ON memorias (ativo)',
        'CREATE INDEX idx_memorias_data ON memorias (data)',
      ],
    })
    app.save(memoriasCol)

    // 2. Coleção 'checkins_emocionais' (Frente 2: Check-in Emocional Diário)
    // Campos: crianca (relation), data (text YYYY-MM-DD), humor (select: muito_feliz | feliz | neutro | triste | muito_triste), nota (text opcional)
    const checkinsCol = new Collection({
      name: 'checkins_emocionais',
      type: 'base',
      listRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      createRule: "@request.auth.id != ''",
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
          name: 'data',
          type: 'text',
          required: true, // YYYY-MM-DD
        },
        {
          name: 'humor',
          type: 'select',
          required: true,
          values: ['muito_feliz', 'feliz', 'neutro', 'triste', 'muito_triste'],
          maxSelect: 1,
        },
        {
          name: 'nota',
          type: 'text',
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
        'CREATE INDEX idx_checkins_crianca ON checkins_emocionais (crianca)',
        'CREATE INDEX idx_checkins_data ON checkins_emocionais (data)',
      ],
    })
    app.save(checkinsCol)

    // 3. Atualizar coleção 'alertas' para incluir campo 'nivel' (critico | alto | medio)
    // e novos valores de 'tipo' se necessário
    try {
      const alertasCol = app.findCollectionByNameOrId('alertas')
      if (!alertasCol.fields.getByName('nivel')) {
        alertasCol.fields.add(
          new SelectField({
            name: 'nivel',
            required: false,
            values: ['critico', 'alto', 'medio', 'informativo'],
            maxSelect: 1,
          }),
        )
      }
      app.save(alertasCol)
    } catch (_) {}

    // 4. Conceder permissões das novas coleções ao agente nativo lumi-ia
    try {
      $ai.agents.putTools(app, 'lumi-ia', [
        {
          collection: 'memorias',
          perms: { read: true, list: true },
          actAs: 'admin',
          scopeFilter: 'crianca.owner = @request.auth.id',
        },
        {
          collection: 'checkins_emocionais',
          perms: { read: true, list: true },
          actAs: 'admin',
          scopeFilter: 'crianca.owner = @request.auth.id',
        },
      ])
    } catch (errAgent) {
      console.log('[WARN PUT TOOLS LUMI-IA]:', errAgent)
    }

    // 5. Adicionar semente de demonstração inicial para memórias e checkins das crianças demo
    try {
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'roogerio99@gmail.com')
      if (demoUser) {
        const criancas = app.findRecordsByFilter('criancas', 'owner = {:owner}', '', 5, 0, {
          owner: demoUser.id,
        })

        const hoje = new Date()
        const formatData = (d) => d.toISOString().split('T')[0]

        for (const c of criancas) {
          const cNome = c.getString('nome')
          const cId = c.id

          // Semente de memórias orgânicas
          if (cNome.includes('Ana Paula')) {
            const mem1 = new Record(memoriasCol)
            mem1.set('crianca', cId)
            mem1.set('tipo', 'interesse')
            mem1.set('conteudo', 'Adora dinossauros herbívoros e fósseis')
            mem1.set('categoria', 'Animais e Paleontologia')
            mem1.set('confianca', 'alta')
            mem1.set('origem', 'conversa')
            mem1.set('data', formatData(hoje))
            mem1.set('ativo', true)
            app.save(mem1)

            const mem2 = new Record(memoriasCol)
            mem2.set('crianca', cId)
            mem2.set('tipo', 'estrategia')
            mem2.set('conteudo', 'Entendeu frações quando desenhou fatias de pizza coloridas')
            mem2.set('categoria', 'Visual & Desenho')
            mem2.set('confianca', 'alta')
            mem2.set('origem', 'conversa')
            mem2.set('data', formatData(hoje))
            mem2.set('ativo', true)
            app.save(mem2)

            const mem3 = new Record(memoriasCol)
            mem3.set('crianca', cId)
            mem3.set('tipo', 'pessoa_relacao')
            mem3.set('conteudo', 'Planta girassóis e estuda no jardim com a vovó')
            mem3.set('categoria', 'Família')
            mem3.set('confianca', 'alta')
            mem3.set('origem', 'conversa')
            mem3.set('data', formatData(hoje))
            mem3.set('ativo', true)
            app.save(mem3)

            const mem4 = new Record(memoriasCol)
            mem4.set('crianca', cId)
            mem4.set('tipo', 'rotina')
            mem4.set('conteudo', 'Treina capoeira e natação às terças e quintas à tarde')
            mem4.set('categoria', 'Esportes')
            mem4.set('confianca', 'alta')
            mem4.set('origem', 'conversa')
            mem4.set('data', formatData(hoje))
            mem4.set('ativo', true)
            app.save(mem4)

            // Semente de 7 dias de check-ins emocionais
            const humores = [
              'feliz',
              'muito_feliz',
              'feliz',
              'neutro',
              'feliz',
              'muito_feliz',
              'feliz',
            ]
            for (let i = 6; i >= 0; i--) {
              const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000)
              const ch = new Record(checkinsCol)
              ch.set('crianca', cId)
              ch.set('data', formatData(d))
              ch.set('humor', humores[6 - i] || 'feliz')
              ch.set('nota', 'Check-in diário de estudo')
              app.save(ch)
            }
          } else if (cNome.includes('Lucas Gabriel')) {
            const mem1 = new Record(memoriasCol)
            mem1.set('crianca', cId)
            mem1.set('tipo', 'interesse')
            mem1.set('conteudo', 'Gosta de astronomia, planetas e foguetes espaciais')
            mem1.set('categoria', 'Ciências')
            mem1.set('confianca', 'alta')
            mem1.set('origem', 'conversa')
            mem1.set('data', formatData(hoje))
            mem1.set('ativo', true)
            app.save(mem1)

            const mem2 = new Record(memoriasCol)
            mem2.set('crianca', cId)
            mem2.set('tipo', 'estrategia')
            mem2.set('conteudo', 'Prefere desafios rápidos e cronometrados de 10 minutos')
            mem2.set('categoria', 'Foco & Ritmo')
            mem2.set('confianca', 'alta')
            mem2.set('origem', 'conversa')
            mem2.set('data', formatData(hoje))
            mem2.set('ativo', true)
            app.save(mem2)

            // Semente de check-ins
            const humoresLucas = [
              'feliz',
              'neutro',
              'feliz',
              'muito_feliz',
              'feliz',
              'neutro',
              'feliz',
            ]
            for (let i = 6; i >= 0; i--) {
              const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000)
              const ch = new Record(checkinsCol)
              ch.set('crianca', cId)
              ch.set('data', formatData(d))
              ch.set('humor', humoresLucas[6 - i] || 'feliz')
              app.save(ch)
            }
          }
        }
      }
    } catch (errSeed) {
      console.log('[WARN SEED FASE 3]:', errSeed)
    }
  },
  (app) => {
    try {
      const memCol = app.findCollectionByNameOrId('memorias')
      app.delete(memCol)
    } catch (_) {}
    try {
      const chCol = app.findCollectionByNameOrId('checkins_emocionais')
      app.delete(chCol)
    } catch (_) {}
  },
)
