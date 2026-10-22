/// <reference path="../pb_data/types.d.ts" />

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

      // Contexto da criança selecionada
      let extraContext = ''
      if (body.crianca_id) {
        try {
          const crianca = $app.findRecordById('criancas', body.crianca_id)
          if (crianca && crianca.getString('owner') === userId) {
            extraContext += `\n[CONTEXTO DA CRIANÇA]: Nome: ${crianca.getString('nome')}, Idade: ${crianca.getInt('idade')} anos, Série: ${crianca.getString('serie')}, Escola: ${crianca.getString('escola')}. Observações gerais: ${crianca.getString('observacoes')}.`

            // Busca dificuldades
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

            // Busca base de conhecimento
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

      // Prompt customizado se fornecido
      if (body.custom_prompt) {
        extraContext += `\n[INSTRUÇÃO DE SISTEMA PERSONALIZADA]: ${body.custom_prompt}`
      }

      const composedMessage = extraContext
        ? `${extraContext}\n\n[MENSAGEM DO ALUNO/RESPONSÁVEL]:\n${body.message.trim()}`
        : body.message.trim()

      const result = $ai.agent('lumi-ia').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: composedMessage,
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: result.content,
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

// Endpoint de streaming SSE
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

      let extraContext = ''
      if (body.crianca_id) {
        try {
          const crianca = $app.findRecordById('criancas', body.crianca_id)
          if (crianca && crianca.getString('owner') === userId) {
            extraContext += `\n[CONTEXTO DA CRIANÇA]: Nome: ${crianca.getString('nome')}, Idade: ${crianca.getInt('idade')} anos, Série: ${crianca.getString('serie')}, Escola: ${crianca.getString('escola')}. Observações gerais: ${crianca.getString('observacoes')}.`

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
        ? `${extraContext}\n\n[MENSAGEM DO ALUNO/RESPONSÁVEL]:\n${body.message.trim()}`
        : body.message.trim()

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
