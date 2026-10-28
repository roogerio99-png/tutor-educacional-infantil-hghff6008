/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Criar a coleção auth 'criancas_usuarios'
    // Verificar se já existe (idempotência)
    let criancasUsuariosCol
    try {
      criancasUsuariosCol = app.findCollectionByNameOrId('criancas_usuarios')
    } catch (_) {
      criancasUsuariosCol = null
    }

    const criancasCol = app.findCollectionByNameOrId('criancas')

    if (!criancasUsuariosCol) {
      const collection = new Collection({
        name: 'criancas_usuarios',
        type: 'auth',
        // Regras:
        // Criança só lê e edita o próprio registro (id = @request.auth.id)
        // Responsável (owner) do perfil tem acesso total
        listRule:
          'id = @request.auth.id || owner = @request.auth.id || crianca.owner = @request.auth.id',
        viewRule:
          'id = @request.auth.id || owner = @request.auth.id || crianca.owner = @request.auth.id',
        createRule: "@request.auth.id != '' && owner = @request.auth.id",
        updateRule:
          'id = @request.auth.id || owner = @request.auth.id || crianca.owner = @request.auth.id',
        deleteRule:
          "@request.auth.id != '' && (owner = @request.auth.id || crianca.owner = @request.auth.id)",
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
            name: 'crianca',
            type: 'relation',
            required: true,
            collectionId: criancasCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'nome_exibicao',
            type: 'text',
            required: false,
          },
          {
            name: 'avatar',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          {
            name: 'ativo',
            type: 'bool',
            required: false,
          },
          {
            name: 'permissoes',
            type: 'json',
            required: false,
            maxSize: 10000,
          },
        ],
        indexes: [
          'CREATE INDEX idx_criancas_usuarios_owner ON criancas_usuarios (owner)',
          'CREATE UNIQUE INDEX idx_criancas_usuarios_crianca ON criancas_usuarios (crianca)',
          'CREATE INDEX idx_criancas_usuarios_ativo ON criancas_usuarios (ativo)',
        ],
      })

      app.save(collection)
      criancasUsuariosCol = collection
    }

    // 2. Atualizar regras das coleções de dados da criança para permitir acesso da criança autenticada
    // Quando a criança está logada via criancas_usuarios, @request.auth.crianca aponta para criancas.id
    // Quando o responsável está logado via users, @request.auth.id aponta para users.id
    // Para 'criancas':
    criancasCol.listRule =
      "@request.auth.id != '' && (owner = @request.auth.id || id = @request.auth.crianca)"
    criancasCol.viewRule =
      "@request.auth.id != '' && (owner = @request.auth.id || id = @request.auth.crianca)"
    app.save(criancasCol)

    // Para coleções filhas de crianca (dificuldades, conhecimento, agenda, memorias, checkins_emocionais, alertas)
    const subCollections = [
      'dificuldades',
      'conhecimento',
      'agenda',
      'memorias',
      'checkins_emocionais',
      'alertas',
    ]

    for (let i = 0; i < subCollections.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(subCollections[i])
        // List e View: responsável ou criança dona do perfil
        col.listRule =
          "@request.auth.id != '' && (crianca.owner = @request.auth.id || crianca = @request.auth.crianca)"
        col.viewRule =
          "@request.auth.id != '' && (crianca.owner = @request.auth.id || crianca = @request.auth.crianca)"

        // Para agenda, checkins_emocionais e memorias, a criança também pode criar/editar se necessário
        if (subCollections[i] === 'agenda') {
          col.createRule =
            "@request.auth.id != '' && (crianca.owner = @request.auth.id || crianca = @request.auth.crianca)"
          col.updateRule =
            "@request.auth.id != '' && (crianca.owner = @request.auth.id || crianca = @request.auth.crianca)"
        } else if (
          subCollections[i] === 'checkins_emocionais' ||
          subCollections[i] === 'memorias' ||
          subCollections[i] === 'alertas'
        ) {
          col.createRule =
            "@request.auth.id != '' && (crianca.owner = @request.auth.id || crianca = @request.auth.crianca)"
        }
        app.save(col)
      } catch (_) {}
    }

    // 3. Seed de demonstração: criar conta da criança para o perfil "Ana Paula" do demo (se existir)
    try {
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'roogerio99@gmail.com')
      if (demoUser) {
        const criancasDemo = app.findRecordsByFilter('criancas', 'owner = {:o}', '-created', 1, 0, {
          o: demoUser.id,
        })
        if (criancasDemo && criancasDemo.length > 0) {
          const criancaAna = criancasDemo[0]
          // Checar se já tem registro
          let recExistente = null
          try {
            const achados = app.findRecordsByFilter(
              'criancas_usuarios',
              'crianca = {:c}',
              '',
              1,
              0,
              { c: criancaAna.id },
            )
            if (achados && achados.length > 0) recExistente = achados[0]
          } catch (_) {}

          if (!recExistente) {
            const usersCriancaCol = app.findCollectionByNameOrId('criancas_usuarios')
            const novoAcesso = new Record(usersCriancaCol)
            novoAcesso.set('owner', demoUser.id)
            novoAcesso.set('crianca', criancaAna.id)
            novoAcesso.set('username', 'anapaula')
            novoAcesso.set('nome_exibicao', criancaAna.getString('nome') || 'Ana Paula')
            novoAcesso.set('ativo', true)
            novoAcesso.set(
              'permissoes',
              JSON.stringify({
                conversa: true,
                agenda: true,
                grafo: false,
                conquistas: true,
              }),
            )
            novoAcesso.setPassword('lumi1234')
            app.save(novoAcesso)
          }
        }
      }
    } catch (e) {
      console.log('[SEED CRIANCA USUARIO ERROR]:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('criancas_usuarios')
      app.delete(col)
    } catch (_) {}
  },
)
