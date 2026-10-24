/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Fechar createRule de memorias
    const memoriasCol = app.findCollectionByNameOrId('memorias')
    memoriasCol.createRule = "@request.auth.id != '' && crianca.owner = @request.auth.id"
    app.save(memoriasCol)

    // 2. Fechar createRule de checkins_emocionais
    const checkinsCol = app.findCollectionByNameOrId('checkins_emocionais')
    checkinsCol.createRule = "@request.auth.id != '' && crianca.owner = @request.auth.id"
    app.save(checkinsCol)

    // 3. Fechar createRule de alertas
    const alertasCol = app.findCollectionByNameOrId('alertas')
    alertasCol.createRule = "@request.auth.id != '' && crianca.owner = @request.auth.id"
    app.save(alertasCol)
  },
  (app) => {
    try {
      const memoriasCol = app.findCollectionByNameOrId('memorias')
      memoriasCol.createRule = "@request.auth.id != ''"
      app.save(memoriasCol)
    } catch (_) {}
    try {
      const checkinsCol = app.findCollectionByNameOrId('checkins_emocionais')
      checkinsCol.createRule = "@request.auth.id != ''"
      app.save(checkinsCol)
    } catch (_) {}
    try {
      const alertasCol = app.findCollectionByNameOrId('alertas')
      alertasCol.createRule = "@request.auth.id != ''"
      app.save(alertasCol)
    } catch (_) {}
  },
)
