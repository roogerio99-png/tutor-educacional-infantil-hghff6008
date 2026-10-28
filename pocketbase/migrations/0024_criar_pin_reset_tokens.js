migrate(
  (app) => {
    const collection = new Collection({
      name: 'pin_reset_tokens',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'token_hash', type: 'text', required: true },
        { name: 'expires_at', type: 'text', required: true },
        { name: 'used', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pin_tokens_user ON pin_reset_tokens (user)',
        'CREATE INDEX idx_pin_tokens_hash ON pin_reset_tokens (token_hash)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('pin_reset_tokens')
      app.delete(col)
    } catch (_) {}
  },
)
