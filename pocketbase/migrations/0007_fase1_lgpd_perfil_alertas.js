migrate(
  (app) => {
    // 1. Ampliar coleção 'users' com consentimento LGPD/ECA Digital
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('consentimento_lgpd')) {
      usersCol.fields.add(new BoolField({ name: 'consentimento_lgpd', required: false }))
    }
    if (!usersCol.fields.getByName('consentimento_data')) {
      usersCol.fields.add(new TextField({ name: 'consentimento_data', required: false }))
    }
    app.save(usersCol)

    // 2. Ampliar coleção 'criancas' com Perfil Base (Camada 1)
    // localidade, genero, horarios_aula, acessibilidade
    const criancasCol = app.findCollectionByNameOrId('criancas')
    if (!criancasCol.fields.getByName('localidade')) {
      criancasCol.fields.add(new TextField({ name: 'localidade', required: false }))
    }
    if (!criancasCol.fields.getByName('genero')) {
      criancasCol.fields.add(
        new SelectField({
          name: 'genero',
          required: false,
          values: ['Menina', 'Menino', 'Prefiro não informar'],
          maxSelect: 1,
        }),
      )
    }
    if (!criancasCol.fields.getByName('horarios_aula')) {
      criancasCol.fields.add(new TextField({ name: 'horarios_aula', required: false }))
    }
    if (!criancasCol.fields.getByName('acessibilidade')) {
      criancasCol.fields.add(new TextField({ name: 'acessibilidade', required: false }))
    }
    app.save(criancasCol)

    // 3. Criar coleção 'alertas' (Protocolo de escalonamento e proteção à vida)
    const alertasCol = new Collection({
      name: 'alertas',
      type: 'base',
      listRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && crianca.owner = @request.auth.id",
      createRule: "@request.auth.id != ''", // permite gravação autenticada e via hooks
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
          values: ['risco_seguranca', 'tema_sensivel', 'fora_escopo', 'aviso_geral'],
          maxSelect: 1,
        },
        {
          name: 'mensagem',
          type: 'text',
          required: true,
        },
        {
          name: 'conteudo_detectado',
          type: 'text',
          required: false,
        },
        {
          name: 'lido',
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
        'CREATE INDEX idx_alertas_crianca ON alertas (crianca)',
        'CREATE INDEX idx_alertas_lido ON alertas (lido)',
      ],
    })
    app.save(alertasCol)

    // 4. Atualizar crianças demo com dados do Perfil Base plausíveis
    try {
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'roogerio99@gmail.com')
      if (demoUser) {
        // Marca consentimento no demo user
        demoUser.set('consentimento_lgpd', true)
        demoUser.set('consentimento_data', new Date().toISOString())
        app.save(demoUser)

        const criancas = app.findRecordsByFilter('criancas', 'owner = {:owner}', '', 10, 0, {
          owner: demoUser.id,
        })

        for (const c of criancas) {
          const nome = c.getString('nome')
          if (nome.includes('Ana Paula')) {
            c.set('localidade', 'Belo Horizonte, MG')
            c.set('genero', 'Menina')
            c.set('horarios_aula', 'Manhã (07h15 às 12h00)')
            c.set('acessibilidade', 'Apoio visual reforçado')
            app.save(c)
          } else if (nome.includes('Lucas Gabriel')) {
            c.set('localidade', 'São Paulo, SP')
            c.set('genero', 'Menino')
            c.set('horarios_aula', 'Tarde (13h00 às 17h30)')
            c.set('acessibilidade', 'Nenhuma')
            app.save(c)
          } else if (nome.includes('Beatriz Lima')) {
            c.set('localidade', 'Curitiba, PR')
            c.set('genero', 'Menina')
            c.set('horarios_aula', 'Manhã (07h30 às 12h30)')
            c.set('acessibilidade', 'Leitura com fonte grande, Apoio visual reforçado')
            app.save(c)
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const aCol = app.findCollectionByNameOrId('alertas')
      app.delete(aCol)
    } catch (_) {}
  },
)
