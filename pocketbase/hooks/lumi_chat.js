/// <reference path="../pb_data/types.d.ts" />

/**
 * =========================================================================
 * ROTAS HTTP DO CHAT LUMI COM GUARDRAILS E ESCALONAMENTO
 * (PocketBase JSVM: funções auxiliares mantidas inline em cada callback)
 * =========================================================================
 */

routerAdd(
  'POST',
  '/backend/v1/lumi/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      if (!body.message || !body.message.trim()) {
        return e.badRequestError('Mensagem é obrigatória')
      }

      const userMsg = body.message.trim()

      // Respostas padrão acolhedoras
      const RESPOSTA_TEMA_SENSIVEL =
        'Hmm, esse assunto é muito importante, mas é melhor conversarmos sobre ele com um adulto de confiança da sua família ou da sua escola. Que tal continuarmos nossa tarefa ou explorar algo do seu estudo?'

      const RESPOSTA_FORA_ESCOPO =
        'Adoro conversar com você! Mas o meu superpoder é ajudar com os seus estudos, matérias da escola e descobertas do conhecimento. Sobre qual matéria ou lição você gostaria de explorar agora?'

      const RESPOSTA_RISCO_SEGURANCA =
        'Você é muito especial e importante, e não está sozinho(a). Se você estiver se sentindo triste, com medo ou passando por algo difícil, respire fundo e converse agora mesmo com um adulto que cuida de você ou com seu professor. Eu estou aqui para te apoiar nos estudos com muito carinho!'

      // 1. Classificador de entrada inline
      const normalizado = userMsg
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      let categoria = 'estudo'

      // Padrões de risco
      const padroesRisco = [
        /\b(quero morrer|vontade de morrer|me matar|suicid|cortar meus pulsos|me cortar|me machucar)\b/,
        /\b(nao aguento mais viver|ninguem gosta de mim|sumir pra sempre|acabar com tudo)\b/,
        /\b(me bateram|estou com medo|alguem me tocou|me ameacaram|abuso|socorro me ajuda)\b/,
        /\b(bater em todo mundo|levar arma|matar meus colegas|fazer mal pra alguem)\b/,
      ]
      for (let i = 0; i < padroesRisco.length; i++) {
        if (padroesRisco[i].test(normalizado)) {
          categoria = 'risco_seguranca'
          break
        }
      }

      // Padrões sensíveis/adultos
      if (categoria === 'estudo') {
        const padroesSensiveis = [
          /\b(sexo|porn|nudez|camisinha|penis|vagina|masturba|orgasmo|erecao)\b/,
          /\b(cocaina|maconha|crack|lsd|erva|fumar baseado|beber cerveja|ficar bebado|whisky|vodka)\b/,
          /\b(onde comprar arma|como fazer bomba|fabricar explosivo|assalto|roubar)\b/,
        ]
        for (let i = 0; i < padroesSensiveis.length; i++) {
          if (padroesSensiveis[i].test(normalizado)) {
            categoria = 'tema_sensivel'
            break
          }
        }
      }

      // Padrões fora de escopo
      if (categoria === 'estudo') {
        const padroesForaEscopo = [
          /\b(tigrinho|betano|blaze|aposta online|jogo do bicho|roleta cassino|cassino online)\b/,
          /\b(como hackear|hack de roblox|robux infinito|gemas infinitas free fire)\b/,
          /\b(comprar celular barato|cupom shopee|comprar iphone|oferta mercado livre)\b/,
        ]
        for (let i = 0; i < padroesForaEscopo.length; i++) {
          if (padroesForaEscopo[i].test(normalizado)) {
            categoria = 'fora_escopo'
            break
          }
        }
      }

      // Função inline para registrar alerta
      const registrarAlerta = (criancaId, tipo, mensagem, conteudoDetectado) => {
        if (!criancaId) return
        try {
          const alertasCol = $app.findCollectionByNameOrId('alertas')
          const rec = new Record(alertasCol)
          rec.set('crianca', criancaId)
          rec.set('tipo', tipo)
          rec.set('mensagem', mensagem)
          rec.set('conteudo_detectado', (conteudoDetectado || '').slice(0, 300))
          rec.set('lido', false)
          $app.save(rec)
        } catch (errAlerta) {
          console.error('[ERRO REGISTRAR ALERTA]:', errAlerta)
        }
      }

      // Barreira 2: Redirecionamento gentil e bloqueio de chegada à Lumi
      if (categoria === 'risco_seguranca') {
        registrarAlerta(
          body.crianca_id,
          'risco_seguranca',
          'Sinal de sofrimento intenso, autolesão ou situação de risco detectado na conversa com a Lumi.',
          userMsg,
        )
        return e.json(200, {
          conversation_id: body.conversation_id || 'guardrail_risk',
          content: RESPOSTA_RISCO_SEGURANCA,
          citations: [],
          message_id: 'guardrail_risk',
        })
      }

      if (categoria === 'tema_sensivel') {
        registrarAlerta(
          body.crianca_id,
          'tema_sensivel',
          'Pergunta sobre conteúdo adulto ou sensível redirecionada amigavelmente.',
          userMsg,
        )
        return e.json(200, {
          conversation_id: body.conversation_id || 'guardrail_sensitive',
          content: RESPOSTA_TEMA_SENSIVEL,
          citations: [],
          message_id: 'guardrail_sensitive',
        })
      }

      if (categoria === 'fora_escopo') {
        return e.json(200, {
          conversation_id: body.conversation_id || 'guardrail_scope',
          content: RESPOSTA_FORA_ESCOPO,
          citations: [],
          message_id: 'guardrail_scope',
        })
      }

      // Montagem do contexto do perfil da criança
      let extraContext = ''
      if (body.crianca_id) {
        try {
          const crianca = $app.findRecordById('criancas', body.crianca_id)
          if (crianca && crianca.getString('owner') === userId) {
            const nome = crianca.getString('nome')
            const idade = crianca.getInt('idade')
            const serie = crianca.getString('serie')
            const escola = crianca.getString('escola')
            const obs = crianca.getString('observacoes')
            const localidade = crianca.getString('localidade')
            const genero = crianca.getString('genero')
            const horariosAula = crianca.getString('horarios_aula')
            const acessibilidade = crianca.getString('acessibilidade')

            extraContext += `\n[PERFIL BASE DA CRIANÇA]: Nome: ${nome}, Idade: ${idade} anos, Série: ${serie}, Escola: ${escola || 'Não informada'}.`
            if (localidade) extraContext += ` Localidade/Região: ${localidade}.`
            if (genero && genero !== 'Prefiro não informar') extraContext += ` Gênero: ${genero}.`
            if (horariosAula) extraContext += ` Turno/Horários de aula: ${horariosAula}.`
            if (acessibilidade && acessibilidade !== 'Nenhuma')
              extraContext += ` Preferências de acessibilidade: ${acessibilidade}.`
            if (obs) extraContext += ` Observações gerais: ${obs}.`

            try {
              const difs = $app.findRecordsByFilter(
                'dificuldades',
                'crianca = {:crianca}',
                '-created',
                5,
                0,
                { crianca: crianca.id },
              )
              if (difs && difs.length > 0) {
                const difTexts = difs.map(
                  (d) =>
                    `${d.getString('materia')} (${d.getString('impacto')}): ${d.getString('descricao')}`,
                )
                extraContext += `\nDIFICULDADES MAPEADAS: ${difTexts.join('; ')}.`
              }
            } catch (_) {}

            try {
              const conhecs = $app.findRecordsByFilter(
                'conhecimento',
                'crianca = {:crianca}',
                '-created',
                5,
                0,
                { crianca: crianca.id },
              )
              if (conhecs && conhecs.length > 0) {
                const conhTexts = conhecs.map(
                  (k) => `${k.getString('titulo')}: ${k.getString('conteudo')}`,
                )
                extraContext += `\nESTRATÉGIAS QUE FUNCIONAM BEM: ${conhTexts.join('; ')}.`
              }
            } catch (_) {}
          }
        } catch (_) {}
      }

      if (body.custom_prompt) {
        extraContext += `\n[INSTRUÇÃO DE SISTEMA PERSONALIZADA]: ${body.custom_prompt}`
      }

      const composedMessage = extraContext
        ? `${extraContext}\n\n[MENSAGEM DO ALUNO/RESPONSÁVEL]:\n${userMsg}`
        : userMsg

      const result = $ai.agent('lumi-ia').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: composedMessage,
      })

      // Barreira 4: Validador de saída inline
      let conteudoFinal = result.content || ''
      const saidaNormalizada = conteudoFinal
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      if (
        /\b(porn|sexo explicito|aposte agora|compre ja|promocao exclusiva)\b/.test(saidaNormalizada)
      ) {
        conteudoFinal =
          'Vamos voltar ao nosso desafio de estudos! O que você acha de darmos mais um passo juntos na lição?'
      } else {
        const padraoRespostaPronta =
          /(?:portanto|assim|logo)?\s*(?:a resposta (?:e|é|correta é|certa é)|o resultado (?:e|é|final é)|o valor de x é)\s*([^\n\.\?!]+)/i
        if (padraoRespostaPronta.test(conteudoFinal)) {
          conteudoFinal = conteudoFinal.replace(
            padraoRespostaPronta,
            'Se pensarmos juntos no caminho para chegar a essa conclusão, que pistas os números e o enunciado nos dão?',
          )
        }
      }

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: conteudoFinal,
        citations: result.citations || [],
        message_id: result.message_id,
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Erro ao processar a resposta da Lumi' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'IA temporariamente indisponível' : err.message,
        })
      }
      return e.json(500, { error: err?.message || 'Erro inesperado no servidor' })
    }
  },
  $apis.requireAuth(),
)

// Endpoint de streaming SSE com guardrails
routerAdd(
  'POST',
  '/backend/v1/lumi/chat-stream',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      if (!body.message || !body.message.trim()) {
        return e.badRequestError('Mensagem é obrigatória')
      }

      const userMsg = body.message.trim()

      const RESPOSTA_TEMA_SENSIVEL =
        'Hmm, esse assunto é muito importante, mas é melhor conversarmos sobre ele com um adulto de confiança da sua família ou da sua escola. Que tal continuarmos nossa tarefa ou explorar algo do seu estudo?'

      const RESPOSTA_FORA_ESCOPO =
        'Adoro conversar com você! Mas o meu superpoder é ajudar com os seus estudos, matérias da escola e descobertas do conhecimento. Sobre qual matéria ou lição você gostaria de explorar agora?'

      const RESPOSTA_RISCO_SEGURANCA =
        'Você é muito especial e importante, e não está sozinho(a). Se você estiver se sentindo triste, com medo ou passando por algo difícil, respire fundo e converse agora mesmo com um adulto que cuida de você ou com seu professor. Eu estou aqui para te apoiar nos estudos com muito carinho!'

      // 1. Classificador de entrada inline
      const normalizado = userMsg
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      let categoria = 'estudo'

      const padroesRisco = [
        /\b(quero morrer|vontade de morrer|me matar|suicid|cortar meus pulsos|me cortar|me machucar)\b/,
        /\b(nao aguento mais viver|ninguem gosta de mim|sumir pra sempre|acabar com tudo)\b/,
        /\b(me bateram|estou com medo|alguem me tocou|me ameacaram|abuso|socorro me ajuda)\b/,
        /\b(bater em todo mundo|levar arma|matar meus colegas|fazer mal pra alguem)\b/,
      ]
      for (let i = 0; i < padroesRisco.length; i++) {
        if (padroesRisco[i].test(normalizado)) {
          categoria = 'risco_seguranca'
          break
        }
      }

      if (categoria === 'estudo') {
        const padroesSensiveis = [
          /\b(sexo|porn|nudez|camisinha|penis|vagina|masturba|orgasmo|erecao)\b/,
          /\b(cocaina|maconha|crack|lsd|erva|fumar baseado|beber cerveja|ficar bebado|whisky|vodka)\b/,
          /\b(onde comprar arma|como fazer bomba|fabricar explosivo|assalto|roubar)\b/,
        ]
        for (let i = 0; i < padroesSensiveis.length; i++) {
          if (padroesSensiveis[i].test(normalizado)) {
            categoria = 'tema_sensivel'
            break
          }
        }
      }

      if (categoria === 'estudo') {
        const padroesForaEscopo = [
          /\b(tigrinho|betano|blaze|aposta online|jogo do bicho|roleta cassino|cassino online)\b/,
          /\b(como hackear|hack de roblox|robux infinito|gemas infinitas free fire)\b/,
          /\b(comprar celular barato|cupom shopee|comprar iphone|oferta mercado livre)\b/,
        ]
        for (let i = 0; i < padroesForaEscopo.length; i++) {
          if (padroesForaEscopo[i].test(normalizado)) {
            categoria = 'fora_escopo'
            break
          }
        }
      }

      const registrarAlerta = (criancaId, tipo, mensagem, conteudoDetectado) => {
        if (!criancaId) return
        try {
          const alertasCol = $app.findCollectionByNameOrId('alertas')
          const rec = new Record(alertasCol)
          rec.set('crianca', criancaId)
          rec.set('tipo', tipo)
          rec.set('mensagem', mensagem)
          rec.set('conteudo_detectado', (conteudoDetectado || '').slice(0, 300))
          rec.set('lido', false)
          $app.save(rec)
        } catch (errAlerta) {
          console.error('[ERRO REGISTRAR ALERTA]:', errAlerta)
        }
      }

      if (categoria === 'risco_seguranca') {
        registrarAlerta(
          body.crianca_id,
          'risco_seguranca',
          'Sinal de sofrimento intenso, autolesão ou situação de risco detectado na conversa com a Lumi.',
          userMsg,
        )
        e.response.header().set('Content-Type', 'text/event-stream')
        e.response.header().set('Cache-Control', 'no-cache')
        e.response.header().set('X-Conversation-Id', 'guardrail_risk')
        const fakeIter = [
          JSON.stringify({ type: 'delta', delta: RESPOSTA_RISCO_SEGURANCA }),
          JSON.stringify({
            type: 'done',
            content: RESPOSTA_RISCO_SEGURANCA,
            conversation_id: 'guardrail_risk',
          }),
        ]
        $response.stream(e, fakeIter)
        return
      }

      if (categoria === 'tema_sensivel') {
        registrarAlerta(
          body.crianca_id,
          'tema_sensivel',
          'Pergunta sobre conteúdo adulto ou sensível redirecionada amigavelmente.',
          userMsg,
        )
        e.response.header().set('Content-Type', 'text/event-stream')
        e.response.header().set('Cache-Control', 'no-cache')
        e.response.header().set('X-Conversation-Id', 'guardrail_sensitive')
        const fakeIter = [
          JSON.stringify({ type: 'delta', delta: RESPOSTA_TEMA_SENSIVEL }),
          JSON.stringify({
            type: 'done',
            content: RESPOSTA_TEMA_SENSIVEL,
            conversation_id: 'guardrail_sensitive',
          }),
        ]
        $response.stream(e, fakeIter)
        return
      }

      if (categoria === 'fora_escopo') {
        e.response.header().set('Content-Type', 'text/event-stream')
        e.response.header().set('Cache-Control', 'no-cache')
        e.response.header().set('X-Conversation-Id', 'guardrail_scope')
        const fakeIter = [
          JSON.stringify({ type: 'delta', delta: RESPOSTA_FORA_ESCOPO }),
          JSON.stringify({
            type: 'done',
            content: RESPOSTA_FORA_ESCOPO,
            conversation_id: 'guardrail_scope',
          }),
        ]
        $response.stream(e, fakeIter)
        return
      }

      let extraContext = ''
      if (body.crianca_id) {
        try {
          const crianca = $app.findRecordById('criancas', body.crianca_id)
          if (crianca && crianca.getString('owner') === userId) {
            const nome = crianca.getString('nome')
            const idade = crianca.getInt('idade')
            const serie = crianca.getString('serie')
            const escola = crianca.getString('escola')
            const obs = crianca.getString('observacoes')
            const localidade = crianca.getString('localidade')
            const genero = crianca.getString('genero')
            const horariosAula = crianca.getString('horarios_aula')
            const acessibilidade = crianca.getString('acessibilidade')

            extraContext += `\n[PERFIL BASE DA CRIANÇA]: Nome: ${nome}, Idade: ${idade} anos, Série: ${serie}, Escola: ${escola || 'Não informada'}.`
            if (localidade) extraContext += ` Localidade/Região: ${localidade}.`
            if (genero && genero !== 'Prefiro não informar') extraContext += ` Gênero: ${genero}.`
            if (horariosAula) extraContext += ` Turno/Horários de aula: ${horariosAula}.`
            if (acessibilidade && acessibilidade !== 'Nenhuma')
              extraContext += ` Preferências de acessibilidade: ${acessibilidade}.`
            if (obs) extraContext += ` Observações gerais: ${obs}.`

            try {
              const difs = $app.findRecordsByFilter(
                'dificuldades',
                'crianca = {:crianca}',
                '-created',
                5,
                0,
                { crianca: crianca.id },
              )
              if (difs && difs.length > 0) {
                const difTexts = difs.map(
                  (d) =>
                    `${d.getString('materia')} (${d.getString('impacto')}): ${d.getString('descricao')}`,
                )
                extraContext += `\nDIFICULDADES MAPEADAS: ${difTexts.join('; ')}.`
              }
            } catch (_) {}

            try {
              const conhecs = $app.findRecordsByFilter(
                'conhecimento',
                'crianca = {:crianca}',
                '-created',
                5,
                0,
                { crianca: crianca.id },
              )
              if (conhecs && conhecs.length > 0) {
                const conhTexts = conhecs.map(
                  (k) => `${k.getString('titulo')}: ${k.getString('conteudo')}`,
                )
                extraContext += `\nESTRATÉGIAS QUE FUNCIONAM BEM: ${conhTexts.join('; ')}.`
              }
            } catch (_) {}
          }
        } catch (_) {}
      }

      if (body.custom_prompt) {
        extraContext += `\n[INSTRUÇÃO DE SISTEMA PERSONALIZADA]: ${body.custom_prompt}`
      }

      const composedMessage = extraContext
        ? `${extraContext}\n\n[MENSAGEM DO ALUNO/RESPONSÁVEL]:\n${userMsg}`
        : userMsg

      const conv = $ai.agent('lumi-ia').getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
      })

      const iter = $ai.agent('lumi-ia').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: composedMessage,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)

      $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA indisponível' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: err.message })
      }
      return e.json(500, { error: err?.message || 'Erro inesperado' })
    }
  },
  $apis.requireAuth(),
)

// Listar conversas do usuário com a Lumi
routerAdd(
  'GET',
  '/backend/v1/lumi/conversations',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')
    const limit = parseInt(e.requestInfo().query?.limit || '20', 10) || 20
    const list = $ai.agent('lumi-ia').listConversations({ user_id: userId, limit })
    return e.json(200, list)
  },
  $apis.requireAuth(),
)

// Listar mensagens de uma conversa
routerAdd(
  'GET',
  '/backend/v1/lumi/conversations/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const convId = e.request.pathValue('conversationId')
      const msgs = $ai.agent('lumi-ia').listMessages({
        conversation_id: convId,
        user_id: userId,
      })
      return e.json(200, msgs)
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Conversa não encontrada' : err.message })
      }
      return e.json(500, { error: 'Erro ao buscar mensagens' })
    }
  },
  $apis.requireAuth(),
)

// Rota de exclusão de dados e memórias de uma criança (Direito de exclusão parental LGPD/ECA Digital)
routerAdd(
  'DELETE',
  '/backend/v1/privacidade/crianca/{criancaId}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const criancaId = e.request.pathValue('criancaId')
      if (!criancaId) return e.badRequestError('ID da criança é obrigatório')

      const crianca = $app.findRecordById('criancas', criancaId)
      if (!crianca || crianca.getString('owner') !== userId) {
        return e.forbiddenError('Não autorizado a gerenciar dados desta criança')
      }

      // 1. Excluir todas as dificuldades da criança
      try {
        const difs = $app.findRecordsByFilter('dificuldades', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < difs.length; i++) {
          $app.delete(difs[i])
        }
      } catch (_) {}

      // 2. Excluir toda a base de conhecimento da criança
      try {
        const conhs = $app.findRecordsByFilter('conhecimento', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < conhs.length; i++) {
          $app.delete(conhs[i])
        }
      } catch (_) {}

      // 3. Excluir todos os eventos de agenda da criança
      try {
        const ags = $app.findRecordsByFilter('agenda', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < ags.length; i++) {
          $app.delete(ags[i])
        }
      } catch (_) {}

      // 4. Excluir todos os alertas da criança
      try {
        const alts = $app.findRecordsByFilter('alertas', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < alts.length; i++) {
          $app.delete(alts[i])
        }
      } catch (_) {}

      // 5. Limpar observações e dados sensíveis do registro da criança mantendo cadastro base
      crianca.set('observacoes', '')
      $app.save(crianca)

      return e.json(200, {
        success: true,
        message: 'Memórias e dados de aprendizagem excluídos com sucesso.',
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao excluir dados de aprendizagem' })
    }
  },
  $apis.requireAuth(),
)
