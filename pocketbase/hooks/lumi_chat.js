/// <reference path="../pb_data/types.d.ts" />

/**
 * =========================================================================
 * ROTAS HTTP DO CHAT LUMI COM PROTOCOLO SOCRÁTICO, GUARDRAILS E FERRAMENTAS DE ESCRITA
 * (Fase 2: Motor Anti-Spoiler + Criação de Agenda & Memórias + Extração de Etapas)
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

      // 1. Classificador de entrada inline (Guardrails Fase 1)
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
          etapa: 'entender',
          materia: 'geral',
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
          etapa: 'entender',
          materia: 'geral',
        })
      }

      if (categoria === 'fora_escopo') {
        return e.json(200, {
          conversation_id: body.conversation_id || 'guardrail_scope',
          content: RESPOSTA_FORA_ESCOPO,
          citations: [],
          message_id: 'guardrail_scope',
          etapa: 'entender',
          materia: 'geral',
        })
      }

      // 2. Auxiliar: detecção conversacional de ações de escrita (agenda / memórias)
      // Garante escrita imediata e robusta na coleção agenda caso o modelo responda diretamente
      const acoesExecutadas = []
      let criancaAtual = null

      if (body.crianca_id) {
        try {
          const cRec = $app.findRecordById('criancas', body.crianca_id)
          if (cRec && cRec.getString('owner') === userId) {
            criancaAtual = cRec
          }
        } catch (_) {}
      }

      // Detecção de solicitação de agendamento: "tenho prova de ciencias na sexta", etc.
      if (criancaAtual) {
        const regexAgenda =
          /\b(tenho|marcar|anotar|agendar|adicionar|lembrar|coloque|colocar)\b.*?\b(prova|teste|avaliacao|tarefa|licao|trabalho|revisao)\b/i
        const regexProva = /\bprova\b|\bteste\b|\bavaliacao\b/i
        const regexTarefa = /\btarefa\b|\blicao\b|\bdever de casa\b|\bexercicios\b/i
        const regexRevisao = /\brevisao\b|\brevisar\b/i
        const regexProjeto = /\bprojeto\b|\btrabalho\b/i

        if (
          regexAgenda.test(normalizado) ||
          (normalizado.includes('prova de') && normalizado.length < 100)
        ) {
          // Detectar matéria
          let mat = 'Ciências'
          if (/\b(matematica|mat|calculo|fracao)\b/.test(normalizado)) mat = 'Matemática'
          else if (/\b(portugues|redacao|gramatica)\b/.test(normalizado)) mat = 'Português'
          else if (/\b(historia)\b/.test(normalizado)) mat = 'História'
          else if (/\b(geografia|mapa)\b/.test(normalizado)) mat = 'Geografia'
          else if (/\b(ingles)\b/.test(normalizado)) mat = 'Inglês'
          else if (/\b(artes|arte)\b/.test(normalizado)) mat = 'Artes'

          // Detectar tipo
          let tipoEv = 'tarefa'
          if (regexProva.test(normalizado)) tipoEv = 'prova'
          else if (regexRevisao.test(normalizado)) tipoEv = 'revisao'
          else if (regexProjeto.test(normalizado)) tipoEv = 'projeto'

          // Calcular data aproximada
          const hoje = new Date()
          let dataOffsetDias = 3 // default 3 dias à frente
          if (/\b(hoje)\b/.test(normalizado)) dataOffsetDias = 0
          else if (/\b(amanha)\b/.test(normalizado)) dataOffsetDias = 1
          else if (/\b(segunda)\b/.test(normalizado))
            dataOffsetDias = (1 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(terca)\b/.test(normalizado))
            dataOffsetDias = (2 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quarta)\b/.test(normalizado))
            dataOffsetDias = (3 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quinta)\b/.test(normalizado))
            dataOffsetDias = (4 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(sexta)\b/.test(normalizado))
            dataOffsetDias = (5 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(sabado)\b/.test(normalizado))
            dataOffsetDias = (6 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(domingo)\b/.test(normalizado))
            dataOffsetDias = (7 - hoje.getDay() + 7) % 7 || 7

          const targetDate = new Date(hoje.getTime() + dataOffsetDias * 24 * 60 * 60 * 1000)
          const dataFormatada = targetDate.toISOString().split('T')[0]

          const tituloEvento = `${tipoEv === 'prova' ? 'Prova' : tipoEv === 'revisao' ? 'Revisão' : 'Tarefa'} de ${mat}`

          try {
            // Verificar se já não existe evento idêntico hoje
            const jaExiste = $app.findRecordsByFilter(
              'agenda',
              'crianca = {:c} && data = {:d} && materia = {:m}',
              '',
              1,
              0,
              { c: criancaAtual.id, d: dataFormatada, m: mat },
            )
            if (!jaExiste || jaExiste.length === 0) {
              const agendaCol = $app.findCollectionByNameOrId('agenda')
              const aRec = new Record(agendaCol)
              aRec.set('crianca', criancaAtual.id)
              aRec.set('titulo', tituloEvento)
              aRec.set('materia', mat)
              aRec.set('tipo', tipoEv)
              aRec.set('data', dataFormatada)
              aRec.set('horario', '08:30')
              aRec.set('descricao', `Criado via conversa com Lumi: ${userMsg}`)
              aRec.set('concluido', false)
              $app.save(aRec)

              acoesExecutadas.push({
                tipo: 'agenda_criada',
                id: aRec.id,
                titulo: tituloEvento,
                materia: mat,
                data: dataFormatada,
                tipo_evento: tipoEv,
              })
            }
          } catch (errAgenda) {
            console.error('[ERRO CRIAR AGENDA]:', errAgenda)
          }
        }

        // Concluir tarefas da agenda se a criança avisou que terminou: "terminei a licao", "fiz a tarefa"
        if (
          /\b(terminei|conclui|fiz|ja fiz|acabei)\b.*?\b(licao|tarefa|exercicio|dever)\b/i.test(
            normalizado,
          )
        ) {
          try {
            const pendentes = $app.findRecordsByFilter(
              'agenda',
              'crianca = {:c} && concluido = false',
              'data',
              3,
              0,
              { c: criancaAtual.id },
            )
            if (pendentes && pendentes.length > 0) {
              const item = pendentes[0]
              item.set('concluido', true)
              $app.save(item)
              acoesExecutadas.push({
                tipo: 'agenda_concluida',
                id: item.id,
                titulo: item.getString('titulo'),
              })
            }
          } catch (_) {}
        }

        // Registrar memórias/estratégias novas na base de conhecimento
        // "gosto de aprender fazendo desenhos", "prefiro blocos", "quando uso musica aprendo mais facil"
        if (
          /\b(gosto de aprender|prefiro aprender|entendo melhor quando|aprendo melhor com|funciona bem pra mim)\b/i.test(
            normalizado,
          )
        ) {
          try {
            const conhecCol = $app.findCollectionByNameOrId('conhecimento')
            const kRec = new Record(conhecCol)
            kRec.set('crianca', criancaAtual.id)
            kRec.set('titulo', 'Estratégia relatada pela criança')
            kRec.set('conteudo', userMsg)
            $app.save(kRec)

            acoesExecutadas.push({
              tipo: 'memoria_registrada',
              id: kRec.id,
              titulo: 'Nova Estratégia de Aprendizado',
              conteudo: userMsg,
            })
          } catch (errK) {
            console.error('[ERRO CRIAR CONHECIMENTO]:', errK)
          }
        }
      }

      // Montagem do contexto do perfil da criança
      let extraContext = ''
      if (criancaAtual) {
        const nome = criancaAtual.getString('nome')
        const idade = criancaAtual.getInt('idade')
        const serie = criancaAtual.getString('serie')
        const escola = criancaAtual.getString('escola')
        const obs = criancaAtual.getString('observacoes')
        const localidade = criancaAtual.getString('localidade')
        const genero = criancaAtual.getString('genero')
        const horariosAula = criancaAtual.getString('horarios_aula')
        const acessibilidade = criancaAtual.getString('acessibilidade')
        const ultimaEtapa = criancaAtual.getString('ultima_etapa_socratica') || 'entender'

        extraContext += `\n[PERFIL BASE DA CRIANÇA]: Nome: ${nome}, Idade: ${idade} anos, Série: ${serie}, Escola: ${escola || 'Não informada'}.`
        if (localidade) extraContext += ` Localidade/Região: ${localidade}.`
        if (genero && genero !== 'Prefiro não informar') extraContext += ` Gênero: ${genero}.`
        if (horariosAula) extraContext += ` Turno/Horários de aula: ${horariosAula}.`
        if (acessibilidade && acessibilidade !== 'Nenhuma')
          extraContext += ` Preferências de acessibilidade: ${acessibilidade}.`
        if (obs) extraContext += ` Observações gerais: ${obs}.`
        extraContext += `\n[ETAPA SOCRÁTICA ANTERIOR]: ${ultimaEtapa}. Continue ou avance pedagogicamente conforme as respostas da criança.`

        try {
          const difs = $app.findRecordsByFilter(
            'dificuldades',
            'crianca = {:crianca}',
            '-created',
            5,
            0,
            { crianca: criancaAtual.id },
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
            { crianca: criancaAtual.id },
          )
          if (conhecs && conhecs.length > 0) {
            const conhTexts = conhecs.map(
              (k) => `${k.getString('titulo')}: ${k.getString('conteudo')}`,
            )
            extraContext += `\nESTRATÉGIAS QUE FUNCIONAM BEM: ${conhTexts.join('; ')}.`
          }
        } catch (_) {}

        if (acoesExecutadas.length > 0) {
          extraContext += `\n[AÇÃO DE SISTEMA JÁ REGISTRADA]: ${JSON.stringify(acoesExecutadas)}. Confirme calorosamente com a criança na sua resposta!`
        }
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

      // Extração de metadados da etapa socrática e da matéria da tag [[ETAPA: ... | MATERIA: ...]]
      let etapaDetectada = 'entender'
      let materiaDetectada = 'geral'

      const matchTag = conteudoFinal.match(/\[\[ETAPA:\s*(\w+)(?:\s*\|\s*MATERIA:\s*(\w+))?\]\]/i)
      if (matchTag) {
        etapaDetectada = matchTag[1].toLowerCase()
        if (matchTag[2]) materiaDetectada = matchTag[2].toLowerCase()
        // Remove a tag interna para exibição limpa para a criança
        conteudoFinal = conteudoFinal.replace(matchTag[0], '').trim()
      } else {
        // Fallback heurístico inteligente
        const textoComp = (userMsg + ' ' + conteudoFinal).toLowerCase()
        if (
          textoComp.includes('explique com suas palavras') ||
          textoComp.includes('como você explicaria') ||
          textoComp.includes('ensinar é aprender') ||
          textoComp.includes('o que você aprendeu')
        ) {
          etapaDetectada = 'consolidar'
        } else if (
          textoComp.includes('tente resolver') ||
          textoComp.includes('desafio para você') ||
          textoComp.includes('agora é sua vez') ||
          textoComp.includes('exercício parecido')
        ) {
          etapaDetectada = 'praticar'
        } else if (
          textoComp.includes('passo') ||
          textoComp.includes('vamos pensar') ||
          textoComp.includes('primeiro') ||
          textoComp.includes('olhando para')
        ) {
          etapaDetectada = 'guiar'
        } else if (
          criancaAtual &&
          (textoComp.includes(criancaAtual.getString('localidade').toLowerCase()) ||
            textoComp.includes('no seu dia a dia') ||
            textoComp.includes('imagine que você'))
        ) {
          etapaDetectada = 'contextualizar'
        }

        if (
          textoComp.includes('fração') ||
          textoComp.includes('divis') ||
          textoComp.includes('matematica') ||
          textoComp.includes('número')
        ) {
          materiaDetectada = 'matematica'
        } else if (
          textoComp.includes('planta') ||
          textoComp.includes('fotossintese') ||
          textoComp.includes('ciencias') ||
          textoComp.includes('corpo')
        ) {
          materiaDetectada = 'ciencias'
        } else if (
          textoComp.includes('frase') ||
          textoComp.includes('portugues') ||
          textoComp.includes('letra') ||
          textoComp.includes('silaba')
        ) {
          materiaDetectada = 'portugues'
        } else if (
          textoComp.includes('historia') ||
          textoComp.includes('indigena') ||
          textoComp.includes('seculo') ||
          textoComp.includes('tempo')
        ) {
          materiaDetectada = 'historia'
        } else if (
          textoComp.includes('geografia') ||
          textoComp.includes('mapa') ||
          textoComp.includes('relevo')
        ) {
          materiaDetectada = 'geografia'
        }
      }

      // Persistir na criança a última etapa e matéria alcançadas
      if (criancaAtual) {
        try {
          criancaAtual.set('ultima_etapa_socratica', etapaDetectada)
          criancaAtual.set('ultima_materia', materiaDetectada)
          $app.save(criancaAtual)
        } catch (_) {}
      }

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: conteudoFinal,
        citations: result.citations || [],
        message_id: result.message_id,
        etapa: etapaDetectada,
        materia: materiaDetectada,
        acoes: acoesExecutadas,
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

// Endpoint de streaming SSE com guardrails e Protocolo Socrático
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

      // Detecção de ações de escrita para agenda e memórias
      let criancaAtual = null
      if (body.crianca_id) {
        try {
          const c = $app.findRecordById('criancas', body.crianca_id)
          if (c && c.getString('owner') === userId) {
            criancaAtual = c
          }
        } catch (_) {}
      }

      if (criancaAtual) {
        const regexAgenda =
          /\b(tenho|marcar|anotar|agendar|adicionar|lembrar|coloque|colocar)\b.*?\b(prova|teste|avaliacao|tarefa|licao|trabalho|revisao)\b/i

        if (
          regexAgenda.test(normalizado) ||
          (normalizado.includes('prova de') && normalizado.length < 100)
        ) {
          let mat = 'Ciências'
          if (/\b(matematica|mat|calculo|fracao)\b/.test(normalizado)) mat = 'Matemática'
          else if (/\b(portugues|redacao|gramatica)\b/.test(normalizado)) mat = 'Português'
          else if (/\b(historia)\b/.test(normalizado)) mat = 'História'
          else if (/\b(geografia|mapa)\b/.test(normalizado)) mat = 'Geografia'
          else if (/\b(ingles)\b/.test(normalizado)) mat = 'Inglês'
          else if (/\b(artes|arte)\b/.test(normalizado)) mat = 'Artes'

          let tipoEv = 'tarefa'
          if (/\bprova\b|\bteste\b|\bavaliacao\b/.test(normalizado)) tipoEv = 'prova'
          else if (/\brevisao\b|\brevisar\b/.test(normalizado)) tipoEv = 'revisao'
          else if (/\bprojeto\b|\btrabalho\b/.test(normalizado)) tipoEv = 'projeto'

          const hoje = new Date()
          let dataOffsetDias = 3
          if (/\b(hoje)\b/.test(normalizado)) dataOffsetDias = 0
          else if (/\b(amanha)\b/.test(normalizado)) dataOffsetDias = 1
          else if (/\b(segunda)\b/.test(normalizado))
            dataOffsetDias = (1 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(terca)\b/.test(normalizado))
            dataOffsetDias = (2 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quarta)\b/.test(normalizado))
            dataOffsetDias = (3 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quinta)\b/.test(normalizado))
            dataOffsetDias = (4 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(sexta)\b/.test(normalizado))
            dataOffsetDias = (5 - hoje.getDay() + 7) % 7 || 7

          const targetDate = new Date(hoje.getTime() + dataOffsetDias * 24 * 60 * 60 * 1000)
          const dataFormatada = targetDate.toISOString().split('T')[0]
          const tituloEvento = `${tipoEv === 'prova' ? 'Prova' : tipoEv === 'revisao' ? 'Revisão' : 'Tarefa'} de ${mat}`

          try {
            const jaExiste = $app.findRecordsByFilter(
              'agenda',
              'crianca = {:c} && data = {:d} && materia = {:m}',
              '',
              1,
              0,
              { c: criancaAtual.id, d: dataFormatada, m: mat },
            )
            if (!jaExiste || jaExiste.length === 0) {
              const agendaCol = $app.findCollectionByNameOrId('agenda')
              const aRec = new Record(agendaCol)
              aRec.set('crianca', criancaAtual.id)
              aRec.set('titulo', tituloEvento)
              aRec.set('materia', mat)
              aRec.set('tipo', tipoEv)
              aRec.set('data', dataFormatada)
              aRec.set('horario', '08:30')
              aRec.set('descricao', `Criado via conversa com Lumi: ${userMsg}`)
              aRec.set('concluido', false)
              $app.save(aRec)
            }
          } catch (errAgenda) {
            console.error('[ERRO CRIAR AGENDA STREAM]:', errAgenda)
          }
        }
      }

      let extraContext = ''
      if (criancaAtual) {
        const nome = criancaAtual.getString('nome')
        const idade = criancaAtual.getInt('idade')
        const serie = criancaAtual.getString('serie')
        const escola = criancaAtual.getString('escola')
        const obs = criancaAtual.getString('observacoes')
        const localidade = criancaAtual.getString('localidade')
        const genero = criancaAtual.getString('genero')
        const horariosAula = criancaAtual.getString('horarios_aula')
        const acessibilidade = criancaAtual.getString('acessibilidade')

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
            { crianca: criancaAtual.id },
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
            { crianca: criancaAtual.id },
          )
          if (conhecs && conhecs.length > 0) {
            const conhTexts = conhecs.map(
              (k) => `${k.getString('titulo')}: ${k.getString('conteudo')}`,
            )
            extraContext += `\nESTRATÉGIAS QUE FUNCIONAM BEM: ${conhTexts.join('; ')}.`
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

// Rota de exclusão de dados e memórias de uma criança (LGPD/ECA Digital)
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

      // 5. Limpar observações e etapas
      crianca.set('observacoes', '')
      crianca.set('ultima_etapa_socratica', 'entender')
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
