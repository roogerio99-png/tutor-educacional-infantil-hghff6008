migrate(
  (app) => {
    const criancasCol = app.findCollectionByNameOrId('criancas')

    const collection = new Collection({
      name: 'conhecimento',
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
          required: false,
        },
        {
          name: 'conteudo',
          type: 'text',
          required: true,
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
        'CREATE INDEX idx_conhecimento_crianca ON conhecimento (crianca)',
        'CREATE INDEX idx_conhecimento_created ON conhecimento (created)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('conhecimento')
      app.delete(col)
    } catch (_) {}
  },
)
