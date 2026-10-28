/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('lumi_audio_cache')
    } catch (_) {
      const col = new Collection({
        name: 'lumi_audio_cache',
        type: 'base',
        // Acesso aberto para leitura/criação autenticada, mas servido principalmente pelas rotas
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'text_hash', type: 'text', required: true },
          { name: 'text_content', type: 'text', required: true },
          { name: 'voice', type: 'text', required: true },
          { name: 'model', type: 'text', required: true },
          { name: 'audio_base64', type: 'text', required: true },
          { name: 'audio_url', type: 'text', required: false },
          { name: 'format', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_lumi_audio_hash_voice ON lumi_audio_cache (text_hash, voice, model)',
          'CREATE INDEX idx_lumi_audio_created ON lumi_audio_cache (created)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('lumi_audio_cache')
      app.delete(col)
    } catch (_) {}
  },
)
