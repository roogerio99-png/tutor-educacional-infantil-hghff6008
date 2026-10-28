/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    try {
      const demoUser = app.findFirstRecordByData('users', 'email', 'roogerio99@gmail.com')
      if (!demoUser) {
        console.log('[SEED 0021] demoUser nao encontrado')
        return
      }

      const criancasDemo = app.findRecordsByFilter('criancas', 'owner = {:o}', 'created', 1, 0, {
        o: demoUser.id,
      })
      if (!criancasDemo || criancasDemo.length === 0) {
        console.log('[SEED 0021] criancasDemo vazio')
        return
      }

      const criancaAna = criancasDemo[0]
      const achados = app.findRecordsByFilter('criancas_usuarios', 'crianca = {:c}', '', 1, 0, {
        c: criancaAna.id,
      })

      if (achados && achados.length > 0) {
        console.log('[SEED 0021] acesso ja existe')
        return
      }

      const usersCriancaCol = app.findCollectionByNameOrId('criancas_usuarios')
      const novoAcesso = new Record(usersCriancaCol)
      novoAcesso.set('owner', demoUser.id)
      novoAcesso.set('crianca', criancaAna.id)
      novoAcesso.set('username', 'anapaula')
      novoAcesso.setEmail('anapaula@lumi.local')
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
      console.log('[SEED 0021] Crianca anapaula criada com sucesso')
    } catch (e) {
      console.log('[SEED 0021 ERROR]:', e)
    }
  },
  (app) => {
    try {
      const recs = app.findRecordsByFilter('criancas_usuarios', 'username = "anapaula"', '', 1, 0)
      if (recs && recs.length > 0) {
        app.delete(recs[0])
      }
    } catch (_) {}
  },
)
