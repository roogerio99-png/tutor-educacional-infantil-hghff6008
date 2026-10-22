/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'pin_hash' (string de hash SHA256 do PIN numérico de 4 dígitos com salt)
    if (!usersCol.fields.getByName('pin_hash')) {
      usersCol.fields.add(
        new TextField({
          name: 'pin_hash',
          required: false,
          hidden: true, // Não expõe o hash ao cliente na listagem/view
        }),
      )
    }

    // 2. Adicionar campo 'pin_definido' (booleano para indicar se o responsável já configurou o PIN)
    if (!usersCol.fields.getByName('pin_definido')) {
      usersCol.fields.add(
        new BoolField({
          name: 'pin_definido',
          required: false,
        }),
      )
    }

    app.save(usersCol)

    // 3. Configurar PIN padrão inicial para a conta demo roogerio99@gmail.com (PIN: "1234" para facilitar testes imediatos)
    try {
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'roogerio99@gmail.com')
      if (demoUser) {
        // Hash SHA256 com salt fixo do projeto para "1234"
        const hash = $security.sha256('lumi_pin_salt_' + '1234')
        demoUser.set('pin_hash', hash)
        demoUser.set('pin_definido', true)
        app.save(demoUser)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('pin_hash')) {
        usersCol.fields.removeByName('pin_hash')
      }
      if (usersCol.fields.getByName('pin_definido')) {
        usersCol.fields.removeByName('pin_definido')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
