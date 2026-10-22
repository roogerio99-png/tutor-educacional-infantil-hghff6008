/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Adicionar campo ultima_etapa_socratica e ultima_materia na coleção criancas
    const criancasCol = app.findCollectionByNameOrId('criancas')
    if (!criancasCol.fields.getByName('ultima_etapa_socratica')) {
      criancasCol.fields.add(
        new SelectField({
          name: 'ultima_etapa_socratica',
          required: false,
          values: ['entender', 'contextualizar', 'guiar', 'praticar', 'consolidar'],
          maxSelect: 1,
        }),
      )
    }
    if (!criancasCol.fields.getByName('ultima_materia')) {
      criancasCol.fields.add(
        new TextField({
          name: 'ultima_materia',
          required: false,
        }),
      )
    }
    app.save(criancasCol)
  },
  (app) => {
    try {
      const criancasCol = app.findCollectionByNameOrId('criancas')
      criancasCol.fields.removeByName('ultima_etapa_socratica')
      criancasCol.fields.removeByName('ultima_materia')
      app.save(criancasCol)
    } catch (_) {}
  },
)
