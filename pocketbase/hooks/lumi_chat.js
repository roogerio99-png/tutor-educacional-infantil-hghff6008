/// <reference path="../pb_data/types.d.ts" />

/**
 * =========================================================================
 * ROTAS HTTP DO CHAT LUMI COM PROTOCOLO SOCRÁTICO, GUARDRAILS E FASE 3:
 * 1. Pipeline de Extração de Memórias (PII Scrubber + Extrator + Indexação + Injeção)
 * 2. Check-in Emocional Diário (Acolhimento + Termômetro)
 * 3. Protocolo de Escalonamento e Proteção à Vida (Barreira 1 Ampliada + Alerta Prioritário)
 * =========================================================================
 */

// ==========================================
// ROTA PRINCIPAL: CHAT LUMI COM AS 3 FRENTES
// ==========================================

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
      const RESPOSTA_ACOLHIMENTO_PROTECAO =
        'Você é uma pessoa muito especial, única e importante, e seus sentimentos têm muito valor. Eu sou uma tutora digital e quero muito o seu bem, mas nos momentos em que sentimos medo, tristeza profunda ou passamos por algo difícil, o passo mais corajoso e seguro é conversar com um adulto de confiança da sua família ou da sua escola. Respire com calma, você não está sozinho(a). Procure agora quem cuida de você com amor para receber um abraço e apoio!'

      const RESPOSTA_TEMA_SENSIVEL =
        'Hmm, esse assunto é muito importante, mas é melhor conversarmos sobre ele com um adulto de confiança da sua família ou da sua escola. Que tal continuarmos nossa tarefa ou explorar algo do seu estudo?'

      const RESPOSTA_FORA_ESCOPO =
        'Adoro conversar com você! Mas o meu superpoder é ajudar com os seus estudos, matérias da escola e descobertas do conhecimento. Sobre qual matéria ou lição você gostaria de explorar agora?'

      // Funções auxiliares inlines para respeitar o JSVM isolado de hooks do PocketBase
      const scrubPII = (text) => {
        if (!text) return ''
        let cleaned = text
        // Telefones
        cleaned = cleaned.replace(
          /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}\b/g,
          '[TELEFONE_REMOVIDO]',
        )
        // CPF / Documentos
        cleaned = cleaned.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[DOCUMENTO_REMOVIDO]')
        // CEP
        cleaned = cleaned.replace(/\b\d{5}-\d{3}\b/g, '[CEP_REMOVIDO]')
        // Emails
        cleaned = cleaned.replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[EMAIL_REMOVIDO]',
        )
        // Endereços
        cleaned = cleaned.replace(
          /\b(?:rua|avenida|av\.?|travessa|alameda|estrada|rodovia)\s+[a-z0-9\s,.-]+(?:n[ºo]?\s*\d+|\d+)/gi,
          '[ENDERECO_REMOVIDO]',
        )
        // Escola específica
        cleaned = cleaned.replace(
          /\b(?:estudo no|estudo na|meu colegio e|minha escola e|colegio|escola)\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)+)/g,
          'estudo na [ESCOLA_REMOVIDA]',
        )
        return cleaned
      }

      const normalizarTexto = (str) => {
        return (str || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
      }

      const classificarRiscoAmpliado = (texto) => {
        const norm = (texto || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

        // 1. Autolesão / Risco à vida (CRÍTICO)
        if (
          /\b(quero morrer|vontade de morrer|me matar|suicid|cortar meus pulsos|me cortar|me machucar|acabar com tudo|sumir pra sempre|nao aguento mais viver|queria nao ter nascido)\b/.test(
            norm,
          )
        ) {
          return {
            categoria: 'risco_seguranca',
            subcategoria: 'autolesao_risco_vida',
            nivel: 'critico',
            mensagemAlerta:
              'Sinal de sofrimento extremo ou risco de autolesão detectado na conversa com a Lumi. Prioridade Máxima.',
            canais: 'CVV - Centro de Valorização da Vida (Ligue 188 - atendimento 24h gratuito)',
          }
        }

        // 2. Violência doméstica, abuso ou maus tratos (CRÍTICO)
        if (
          /\b(me bateram em casa|apanho todo dia|alguem me tocou|abuso|tenho medo do meu pai|tenho medo da minha mae|me trancaram no quarto|nao me dao comida|violencia em casa)\b/.test(
            norm,
          )
        ) {
          return {
            categoria: 'risco_seguranca',
            subcategoria: 'violencia_domestica_abuso',
            nivel: 'critico',
            mensagemAlerta:
              'Relato indicando possível violência doméstica, maus-tratos ou abuso. Proteção prioritária à integridade da criança.',
            canais: 'Disque 100 (Disque Direitos Humanos / Conselho Tutelar - gratuito e sigiloso)',
          }
        }

        // 3. Bullying ou violência escolar (ALTO)
        if (
          /\b(estao me batendo na escola|sofrendo bullying|me xingam todo dia|ninguem senta comigo|me ameacam no recreio|tenho medo de ir pra escola|me bateram no colegio|levar faca|levar arma pro colegio)\b/.test(
            norm,
          )
        ) {
          return {
            categoria: 'risco_seguranca',
            subcategoria: 'bullying_violencia_escolar',
            nivel: 'alto',
            mensagemAlerta:
              'Sinal de bullying sistemático, intimidação ou violência no ambiente escolar.',
            canais: 'Coordenação escolar e conversa preventiva com os responsáveis',
          }
        }

        // 4. Pedido de socorro direto (CRÍTICO)
        if (
          /\b(socorro me ajuda|estou em perigo|me tira daqui|socorro por favor|estou com muito medo|alguem me ajuda)\b/.test(
            norm,
          )
        ) {
          return {
            categoria: 'risco_seguranca',
            subcategoria: 'pedido_socorro',
            nivel: 'critico',
            mensagemAlerta:
              'Pedido de socorro ou alerta de perigo imediato manifestado pela criança.',
            canais: 'Apoio imediato do responsável ou canais de emergência (190 / 100 / 188)',
          }
        }

        // 5. Sofrimento emocional intenso (ALTO)
        if (
          /\b(estou chorando muito|me sinto um lixo|ninguem gosta de mim|odeio minha vida|estou em desespero|tristeza insuportavel|nao sirvo pra nada)\b/.test(
            norm,
          )
        ) {
          return {
            categoria: 'risco_seguranca',
            subcategoria: 'sofrimento_emocional_intenso',
            nivel: 'alto',
            mensagemAlerta:
              'Expressão de sofrimento emocional agudo ou crise de autoestima severa.',
            canais:
              'Escuta acolhedora, presença ativa e avaliação psicológica especializada se persistir',
          }
        }

        // Temas sensíveis / adultos
        if (
          /\b(sexo|porn|nudez|camisinha|penis|vagina|masturba|orgasmo|erecao)\b/.test(norm) ||
          /\b(cocaina|maconha|crack|lsd|erva|fumar baseado|beber cerveja|ficar bebado|whisky|vodka)\b/.test(
            norm,
          ) ||
          /\b(onde comprar arma|como fazer bomba|fabricar explosivo|assalto|roubar)\b/.test(norm)
        ) {
          return {
            categoria: 'tema_sensivel',
            subcategoria: 'conteudo_adulto_ou_ilicito',
            nivel: 'medio',
            mensagemAlerta:
              'Pergunta sobre conteúdo adulto ou sensível redirecionada amigavelmente.',
            canais: null,
          }
        }

        // Fora de escopo
        if (
          /\b(tigrinho|betano|blaze|aposta online|jogo do bicho|roleta cassino|cassino online)\b/.test(
            norm,
          ) ||
          /\b(como hackear|hack de roblox|robux infinito|gemas infinitas free fire)\b/.test(norm) ||
          /\b(comprar celular barato|cupom shopee|comprar iphone|oferta mercado livre)\b/.test(norm)
        ) {
          return {
            categoria: 'fora_escopo',
            subcategoria: 'apostas_ou_hacks',
            nivel: 'informativo',
            mensagemAlerta: 'Tentativa de abordagem fora do escopo educacional.',
            canais: null,
          }
        }

        return null
      }

      const extrairEntidadesMemoria = (textoLimpo) => {
        if (!textoLimpo || textoLimpo.length < 5) return []
        const entidades = []

        // 1. Interesses
        const regexInteresse =
          /\b(?:amo|adoro|gosto muito de|sou apaixonad[oa] por|meu hobby e|meu animal favorito e|meu jogo favorito e)\s+([^.,;!?\n]+)/i
        const matchInteresse = textoLimpo.match(regexInteresse)
        if (matchInteresse && matchInteresse[1]) {
          const item = matchInteresse[1].trim()
          if (item.length >= 3 && item.length <= 80) {
            entidades.push({
              tipo: 'interesse',
              conteudo: `Interesse: ${item}`,
              categoria: 'Interesses e Hobbies',
              confianca: 'alta',
            })
          }
        }

        // 2. Relações / Pessoas
        const regexPessoa =
          /\b(?:minha avo|meu avo|minha mae|meu pai|minha tia|meu tio|meu irmao|minha irma|meu primo|minha prima|meu amigo|minha amiga)\s+([^.,;!?\n]+)/i
        const matchPessoa = textoLimpo.match(regexPessoa)
        if (matchPessoa) {
          const trecho = matchPessoa[0].trim()
          if (trecho.length >= 8 && trecho.length <= 90) {
            entidades.push({
              tipo: 'pessoa_relacao',
              conteudo: trecho,
              categoria: 'Relações & Família',
              confianca: 'alta',
            })
          }
        }

        // 3. Rotina
        const regexRotina =
          /\b(?:treino|faco aula de|jogo bola|tenho natacao|faco danca|todo sabado|toda terca|toda quarta|toda quinta|toda sexta|depois da escola eu)\s+([^.,;!?\n]+)/i
        const matchRotina = textoLimpo.match(regexRotina)
        if (matchRotina) {
          const trecho = matchRotina[0].trim()
          if (trecho.length >= 8 && trecho.length <= 90) {
            entidades.push({
              tipo: 'rotina',
              conteudo: trecho,
              categoria: 'Rotina e Cotidiano',
              confianca: 'alta',
            })
          }
        }

        // 4. Estratégia de estudo
        const regexEstrategia =
          /\b(?:entendi melhor quando|aprendi quando|funciona bem quando|quando usei|desenhei|usei blocos|com musica)\s+([^.,;!?\n]+)/i
        const matchEstrategia = textoLimpo.match(regexEstrategia)
        if (matchEstrategia) {
          const trecho = matchEstrategia[0].trim()
          if (trecho.length >= 8 && trecho.length <= 100) {
            entidades.push({
              tipo: 'estrategia',
              conteudo: trecho,
              categoria: 'Estratégia Pedagógica',
              confianca: 'alta',
            })
          }
        }

        // 5. Dificuldade mencionada
        const regexDif =
          /\b(?:acho dificil|tenho muita dificuldade em|nunca consigo entender|me atrapalho com)\s+([^.,;!?\n]+)/i
        const matchDif = textoLimpo.match(regexDif)
        if (matchDif) {
          const trecho = matchDif[0].trim()
          if (trecho.length >= 6 && trecho.length <= 90) {
            entidades.push({
              tipo: 'dificuldade',
              conteudo: trecho,
              categoria: 'Ponto de Dificuldade',
              confianca: 'media',
            })
          }
        }

        return entidades
      }

      const indexarMemoria = (criancaId, entidade) => {
        if (!criancaId || !entidade || !entidade.conteudo) return null
        if (entidade.confianca === 'baixa') return null

        try {
          const hojeStr = new Date().toISOString().split('T')[0]
          const normNovo = normalizarTexto(entidade.conteudo)

          const existentes = $app.findRecordsByFilter(
            'memorias',
            'crianca = {:c} && ativo = true',
            '-created',
            50,
            0,
            { c: criancaId },
          )

          for (let i = 0; i < existentes.length; i++) {
            const normExistente = normalizarTexto(existentes[i].getString('conteudo'))
            if (
              normExistente === normNovo ||
              (normNovo.length > 10 && normExistente.includes(normNovo)) ||
              (normExistente.length > 10 && normNovo.includes(normExistente))
            ) {
              return existentes[i]
            }
          }

          const memoriasCol = $app.findCollectionByNameOrId('memorias')
          const rec = new Record(memoriasCol)
          rec.set('crianca', criancaId)
          rec.set('tipo', entidade.tipo)
          rec.set('conteudo', entidade.conteudo.slice(0, 300))
          rec.set('categoria', entidade.categoria || 'Geral')
          rec.set('confianca', entidade.confianca || 'alta')
          rec.set('origem', 'conversa')
          rec.set('data', hojeStr)
          rec.set('ativo', true)
          $app.save(rec)
          return rec
        } catch (err) {
          console.error('[ERRO INDEXAR MEMORIA]:', err)
          return null
        }
      }

      const registrarAlertaPrioritario = (criancaId, tipo, nivel, mensagem, conteudoBruto) => {
        if (!criancaId) return
        try {
          const conteudoLimpo = scrubPII(conteudoBruto || '')
          const alertasCol = $app.findCollectionByNameOrId('alertas')
          const rec = new Record(alertasCol)
          rec.set('crianca', criancaId)
          rec.set('tipo', tipo)
          rec.set('nivel', nivel || 'alto')
          rec.set('mensagem', mensagem)
          rec.set('conteudo_detectado', conteudoLimpo.slice(0, 300))
          rec.set('lido', false)
          $app.save(rec)
        } catch (errAlerta) {
          console.error('[ERRO REGISTRAR ALERTA PRIORITARIO]:', errAlerta)
        }
      }

      // 1. FRENTE 3: Classificador de Entrada Ampliado (Barreira 1)
      const riscoDetectado = classificarRiscoAmpliado(userMsg)

      if (riscoDetectado) {
        if (riscoDetectado.categoria === 'risco_seguranca') {
          registrarAlertaPrioritario(
            body.crianca_id,
            'risco_seguranca',
            riscoDetectado.nivel,
            `${riscoDetectado.mensagemAlerta} ${riscoDetectado.canais ? `[Canal de Apoio: ${riscoDetectado.canais}]` : ''}`,
            userMsg,
          )
          return e.json(200, {
            conversation_id: body.conversation_id || 'guardrail_risk',
            content: RESPOSTA_ACOLHIMENTO_PROTECAO,
            citations: [],
            message_id: 'guardrail_risk',
            etapa: 'entender',
            materia: 'geral',
            acoes: [],
          })
        }

        if (riscoDetectado.categoria === 'tema_sensivel') {
          registrarAlertaPrioritario(
            body.crianca_id,
            'tema_sensivel',
            riscoDetectado.nivel,
            riscoDetectado.mensagemAlerta,
            userMsg,
          )
          return e.json(200, {
            conversation_id: body.conversation_id || 'guardrail_sensitive',
            content: RESPOSTA_TEMA_SENSIVEL,
            citations: [],
            message_id: 'guardrail_sensitive',
            etapa: 'entender',
            materia: 'geral',
            acoes: [],
          })
        }

        if (riscoDetectado.categoria === 'fora_escopo') {
          return e.json(200, {
            conversation_id: body.conversation_id || 'guardrail_scope',
            content: RESPOSTA_FORA_ESCOPO,
            citations: [],
            message_id: 'guardrail_scope',
            etapa: 'entender',
            materia: 'geral',
            acoes: [],
          })
        }
      }

      // 2. FRENTE 1: Pipeline de Extração de Memórias (Grafo de Interesses e Cotidiano)
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

      if (criancaAtual) {
        // Etapa 1: PII Scrubber
        const textoLimpo = scrubPII(userMsg)

        // Etapa 2: Extrator de Entidades estruturadas
        const entidadesExtraidas = extrairEntidadesMemoria(textoLimpo)

        // Etapa 3: Indexação e Deduplicação na coleção 'memorias'
        for (let i = 0; i < entidadesExtraidas.length; i++) {
          const memSalva = indexarMemoria(criancaAtual.id, entidadesExtraidas[i])
          if (memSalva) {
            acoesExecutadas.push({
              tipo: 'memoria_registrada',
              id: memSalva.id,
              titulo: `Memória (${entidadesExtraidas[i].tipo})`,
              conteudo: entidadesExtraidas[i].conteudo,
            })
          }
        }
      }

      // Detecção de agenda conversacional (Fase 2)
      if (criancaAtual) {
        const normalizado = userMsg
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

        const regexAgenda =
          /\b(tenho|marcar|anotar|agendar|adicionar|lembrar|coloque|colocar)\b.*?\b(prova|teste|avaliacao|tarefa|licao|trabalho|revisao)\b/i
        const regexProva = /\bprova\b|\bteste\b|\bavaliacao\b/i
        const regexRevisao = /\brevisao\b|\brevisar\b/i
        const regexProjeto = /\bprojeto\b|\btrabalho\b/i

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
          if (regexProva.test(normalizado)) tipoEv = 'prova'
          else if (regexRevisao.test(normalizado)) tipoEv = 'revisao'
          else if (regexProjeto.test(normalizado)) tipoEv = 'projeto'

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
              aRec.set('descricao', `Criado via conversa com Lumi: ${scrubPII(userMsg)}`)
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
      }

      // 3. FRENTE 1 & FRENTE 2: Injeção Contextual no Sistema da Lumi
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
        extraContext += `\n[ETAPA SOCRÁTICA ANTERIOR]: ${ultimaEtapa}. Avance pelo Protocolo Socrático conforme as respostas.`

        // FRENTE 2: Injeção do Check-in Emocional do Dia
        try {
          const hojeStr = new Date().toISOString().split('T')[0]
          const checkinsHoje = $app.findRecordsByFilter(
            'checkins_emocionais',
            'crianca = {:c} && data = {:d}',
            '-created',
            1,
            0,
            { c: criancaAtual.id, d: hojeStr },
          )
          if (checkinsHoje && checkinsHoje.length > 0) {
            const humorHoje = checkinsHoje[0].getString('humor')
            extraContext += `\n[CHECK-IN EMOCIONAL DE HOJE]: Humor registrado: "${humorHoje}".`
            if (humorHoje === 'triste' || humorHoje === 'muito_triste') {
              extraContext += ` A criança está se sentindo para baixo hoje. Abra a conversa com acolhimento carinhoso e afetuoso, sem cobranças, e sugira gentilmente um momento de respiração calma (Momento Calma & Foco) antes de estudar.`
            } else if (humorHoje === 'muito_feliz' || humorHoje === 'feliz') {
              extraContext += ` A criança está animada e motivada hoje! Celebre a energia positiva.`
            }
          }
        } catch (_) {}

        // FRENTE 1: Injeção Contextual de Memórias Relevantes (últimas N + alta confiança, agrupadas)
        try {
          const mems = $app.findRecordsByFilter(
            'memorias',
            'crianca = {:c} && ativo = true',
            '-created',
            15,
            0,
            { c: criancaAtual.id },
          )
          if (mems && mems.length > 0) {
            const agrupadas = {
              interesse: [],
              pessoa_relacao: [],
              rotina: [],
              estrategia: [],
              dificuldade: [],
              emocao: [],
            }
            mems.forEach((m) => {
              const t = m.getString('tipo')
              if (agrupadas[t]) {
                agrupadas[t].push(m.getString('conteudo'))
              }
            })

            let memContext = '\n[GRAFO DE INTERESSES E COTIDIANO - MEMÓRIAS DA CRIANÇA]:'
            memContext +=
              '\n(Instrução: referencie estes fatos organicamente para criar conexão afetiva e analogias ricas, ex: "como quando você falou sobre...")'
            if (agrupadas.interesse.length > 0) {
              memContext += `\n- Interesses/Hobbies: ${agrupadas.interesse.slice(0, 4).join('; ')}`
            }
            if (agrupadas.pessoa_relacao.length > 0) {
              memContext += `\n- Pessoas e Vínculos: ${agrupadas.pessoa_relacao.slice(0, 3).join('; ')}`
            }
            if (agrupadas.rotina.length > 0) {
              memContext += `\n- Rotina e Atividades: ${agrupadas.rotina.slice(0, 3).join('; ')}`
            }
            if (agrupadas.estrategia.length > 0) {
              memContext += `\n- Estratégias que deram certo: ${agrupadas.estrategia.slice(0, 3).join('; ')}`
            }
            extraContext += memContext
          }
        } catch (_) {}

        // Dificuldades clássicas
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

        if (acoesExecutadas.length > 0) {
          extraContext += `\n[AÇÃO DE SISTEMA JÁ REGISTRADA]: ${JSON.stringify(acoesExecutadas)}. Confirme calorosamente com a criança na sua resposta!`
        }
      }

      // Diretriz permanente de Proteção à Vida nos prompts da Lumi
      extraContext += `\n[DIRETRIZ DE SEGURANÇA E PROTEÇÃO]: Você é uma tutora infantil, NÃO terapeuta ou médica. Diante de qualquer sinal de risco, sofrimento intenso ou violação, acolha sem julgar e priorize o encaminhamento imediato a um adulto de confiança da família ou da escola.`

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

      // Extração de metadados da etapa socrática e matéria
      let etapaDetectada = 'entender'
      let materiaDetectada = 'geral'

      const matchTag = conteudoFinal.match(/\[\[ETAPA:\s*(\w+)(?:\s*\|\s*MATERIA:\s*(\w+))?\]\]/i)
      if (matchTag) {
        etapaDetectada = matchTag[1].toLowerCase()
        if (matchTag[2]) materiaDetectada = matchTag[2].toLowerCase()
        conteudoFinal = conteudoFinal.replace(matchTag[0], '').trim()
      } else {
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

      const RESPOSTA_ACOLHIMENTO_PROTECAO =
        'Você é uma pessoa muito especial, única e importante, e seus sentimentos têm muito valor. Eu sou uma tutora digital e quero muito o seu bem, mas nos momentos em que sentimos medo, tristeza profunda ou passamos por algo difícil, o passo mais corajoso e seguro é conversar com um adulto de confiança da sua família ou da sua escola. Respire com calma, você não está sozinho(a). Procure agora quem cuida de você com amor para receber um abraço e apoio!'

      const RESPOSTA_TEMA_SENSIVEL =
        'Hmm, esse assunto é muito importante, mas é melhor conversarmos sobre ele com um adulto de confiança da sua família ou da sua escola. Que tal continuarmos nossa tarefa ou explorar algo do seu estudo?'

      const RESPOSTA_FORA_ESCOPO =
        'Adoro conversar com você! Mas o meu superpoder é ajudar com os seus estudos, matérias da escola e descobertas do conhecimento. Sobre qual matéria ou lição você gostaria de explorar agora?'

      const scrubPII = (text) => {
        if (!text) return ''
        let cleaned = text
        cleaned = cleaned.replace(
          /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}\b/g,
          '[TELEFONE_REMOVIDO]',
        )
        cleaned = cleaned.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[DOCUMENTO_REMOVIDO]')
        cleaned = cleaned.replace(/\b\d{5}-\d{3}\b/g, '[CEP_REMOVIDO]')
        cleaned = cleaned.replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[EMAIL_REMOVIDO]',
        )
        cleaned = cleaned.replace(
          /\b(?:rua|avenida|av\.?|travessa|alameda|estrada|rodovia)\s+[a-z0-9\s,.-]+(?:n[ºo]?\s*\d+|\d+)/gi,
          '[ENDERECO_REMOVIDO]',
        )
        return cleaned
      }

      const registrarAlertaPrioritario = (criancaId, tipo, nivel, mensagem, conteudoBruto) => {
        if (!criancaId) return
        try {
          const conteudoLimpo = scrubPII(conteudoBruto || '')
          const alertasCol = $app.findCollectionByNameOrId('alertas')
          const rec = new Record(alertasCol)
          rec.set('crianca', criancaId)
          rec.set('tipo', tipo)
          rec.set('nivel', nivel || 'alto')
          rec.set('mensagem', mensagem)
          rec.set('conteudo_detectado', conteudoLimpo.slice(0, 300))
          rec.set('lido', false)
          $app.save(rec)
        } catch (errAlerta) {
          console.error('[ERRO REGISTRAR ALERTA STREAM]:', errAlerta)
        }
      }

      const norm = userMsg
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      let riscoTipo = null
      if (
        /\b(quero morrer|vontade de morrer|me matar|suicid|cortar meus pulsos|me cortar|me machucar|acabar com tudo|sumir pra sempre|nao aguento mais viver|queria nao ter nascido|me bateram em casa|apanho todo dia|alguem me tocou|abuso|socorro me ajuda|estou em perigo)\b/.test(
          norm,
        )
      ) {
        riscoTipo = 'risco_seguranca'
      } else if (
        /\b(sexo|porn|nudez|camisinha|penis|vagina|masturba|orgasmo|erecao|cocaina|maconha|crack|lsd|onde comprar arma)\b/.test(
          norm,
        )
      ) {
        riscoTipo = 'tema_sensivel'
      } else if (
        /\b(tigrinho|betano|blaze|aposta online|jogo do bicho|como hackear|hack de roblox|comprar iphone)\b/.test(
          norm,
        )
      ) {
        riscoTipo = 'fora_escopo'
      }

      if (riscoTipo === 'risco_seguranca') {
        registrarAlertaPrioritario(
          body.crianca_id,
          'risco_seguranca',
          'critico',
          'Sinal prioritário de risco à integridade da criança detectado no chat com Lumi.',
          userMsg,
        )
        e.response.header().set('Content-Type', 'text/event-stream')
        e.response.header().set('Cache-Control', 'no-cache')
        e.response.header().set('X-Conversation-Id', 'guardrail_risk')
        const fakeIter = [
          JSON.stringify({ type: 'delta', delta: RESPOSTA_ACOLHIMENTO_PROTECAO }),
          JSON.stringify({
            type: 'done',
            content: RESPOSTA_ACOLHIMENTO_PROTECAO,
            conversation_id: 'guardrail_risk',
          }),
        ]
        $response.stream(e, fakeIter)
        return
      }

      if (riscoTipo === 'tema_sensivel') {
        registrarAlertaPrioritario(
          body.crianca_id,
          'tema_sensivel',
          'medio',
          'Pergunta sobre conteúdo sensível redirecionada amigavelmente.',
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

      if (riscoTipo === 'fora_escopo') {
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

      let criancaAtual = null
      if (body.crianca_id) {
        try {
          const c = $app.findRecordById('criancas', body.crianca_id)
          if (c && c.getString('owner') === userId) {
            criancaAtual = c
          }
        } catch (_) {}
      }

      let extraContext = ''
      if (criancaAtual) {
        const nome = criancaAtual.getString('nome')
        const idade = criancaAtual.getInt('idade')
        const serie = criancaAtual.getString('serie')
        extraContext += `\n[PERFIL]: ${nome}, ${idade} anos, ${serie}.`

        try {
          const mems = $app.findRecordsByFilter(
            'memorias',
            'crianca = {:c} && ativo = true',
            '-created',
            5,
            0,
            { c: criancaAtual.id },
          )
          if (mems && mems.length > 0) {
            extraContext += `\n[MEMÓRIAS RECENTES]: ${mems.map((m) => m.getString('conteudo')).join('; ')}.`
          }
        } catch (_) {}
      }

      if (body.custom_prompt) {
        extraContext += `\n[INSTRUÇÃO PERSONALIZADA]: ${body.custom_prompt}`
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

// ==========================================
// ROTAS DE CHECK-IN EMOCIONAL (FRENTE 2)
// ==========================================

// Obter check-in de hoje para uma criança
routerAdd(
  'GET',
  '/backend/v1/checkin-emocional/hoje/{criancaId}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const criancaId = e.request.pathValue('criancaId')
      if (!criancaId) return e.badRequestError('ID da criança é obrigatório')

      const crianca = $app.findRecordById('criancas', criancaId)
      if (!crianca || crianca.getString('owner') !== userId) {
        return e.forbiddenError('Não autorizado')
      }

      const hojeStr = new Date().toISOString().split('T')[0]
      const records = $app.findRecordsByFilter(
        'checkins_emocionais',
        'crianca = {:c} && data = {:d}',
        '-created',
        1,
        0,
        { c: criancaId, d: hojeStr },
      )

      if (records && records.length > 0) {
        return e.json(200, {
          fez_checkin: true,
          checkin: records[0],
        })
      }

      return e.json(200, {
        fez_checkin: false,
        checkin: null,
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao consultar check-in' })
    }
  },
  $apis.requireAuth(),
)

// Salvar check-in emocional do dia
routerAdd(
  'POST',
  '/backend/v1/checkin-emocional',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const body = e.requestInfo().body || {}
      const criancaId = body.crianca_id
      const humor = body.humor
      const nota = body.nota || ''

      if (!criancaId) return e.badRequestError('crianca_id é obrigatório')
      if (!humor) return e.badRequestError('humor é obrigatório')

      const humoresValidos = ['muito_feliz', 'feliz', 'neutro', 'triste', 'muito_triste']
      if (!humoresValidos.includes(humor)) {
        return e.badRequestError('Humor inválido')
      }

      const crianca = $app.findRecordById('criancas', criancaId)
      if (!crianca || crianca.getString('owner') !== userId) {
        return e.forbiddenError('Não autorizado')
      }

      const hojeStr = new Date().toISOString().split('T')[0]

      const existentes = $app.findRecordsByFilter(
        'checkins_emocionais',
        'crianca = {:c} && data = {:d}',
        '-created',
        1,
        0,
        { c: criancaId, d: hojeStr },
      )

      let record
      if (existentes && existentes.length > 0) {
        record = existentes[0]
        record.set('humor', humor)
        if (nota) record.set('nota', nota)
        $app.save(record)
      } else {
        const checkinsCol = $app.findCollectionByNameOrId('checkins_emocionais')
        record = new Record(checkinsCol)
        record.set('crianca', criancaId)
        record.set('data', hojeStr)
        record.set('humor', humor)
        record.set('nota', nota)
        $app.save(record)
      }

      // Se humor for triste ou muito_triste, indexa memória socioemocional
      if (humor === 'triste' || humor === 'muito_triste') {
        try {
          const memoriasCol = $app.findCollectionByNameOrId('memorias')
          const memRec = new Record(memoriasCol)
          memRec.set('crianca', criancaId)
          memRec.set('tipo', 'emocao')
          memRec.set('conteudo', `Check-in indicou momento de desânimo ou tristeza em ${hojeStr}`)
          memRec.set('categoria', 'Socioemocional')
          memRec.set('confianca', 'alta')
          memRec.set('origem', 'conversa')
          memRec.set('data', hojeStr)
          memRec.set('ativo', true)
          $app.save(memRec)
        } catch (_) {}
      }

      return e.json(200, {
        success: true,
        checkin: record,
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao registrar check-in emocional' })
    }
  },
  $apis.requireAuth(),
)

// Obter histórico de check-ins (Termômetro Emocional) dos últimos 14 dias
routerAdd(
  'GET',
  '/backend/v1/checkin-emocional/historico/{criancaId}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const criancaId = e.request.pathValue('criancaId')
      if (!criancaId) return e.badRequestError('ID da criança é obrigatório')

      const crianca = $app.findRecordById('criancas', criancaId)
      if (!crianca || crianca.getString('owner') !== userId) {
        return e.forbiddenError('Não autorizado')
      }

      const historico = $app.findRecordsByFilter(
        'checkins_emocionais',
        'crianca = {:c}',
        '-data',
        14,
        0,
        { c: criancaId },
      )

      let diasConsecutivosNegativos = 0
      let maxConsecutivosNegativos = 0

      for (let i = 0; i < historico.length; i++) {
        const h = historico[i].getString('humor')
        if (h === 'triste' || h === 'muito_triste') {
          diasConsecutivosNegativos++
          if (diasConsecutivosNegativos > maxConsecutivosNegativos) {
            maxConsecutivosNegativos = diasConsecutivosNegativos
          }
        } else {
          if (i < 3 && diasConsecutivosNegativos < 3) {
            diasConsecutivosNegativos = 0
          }
        }
      }

      const alertaAtencaoEmocional = maxConsecutivosNegativos >= 3

      return e.json(200, {
        historico,
        alerta_atencao_emocional: alertaAtencaoEmocional,
        dias_negativos_consecutivos: maxConsecutivosNegativos,
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao buscar histórico emocional' })
    }
  },
  $apis.requireAuth(),
)

// ==========================================
// ROTAS DE MEMÓRIAS (FRENTE 1 & LGPD)
// ==========================================

// Listar memórias ativas de uma criança
routerAdd(
  'GET',
  '/backend/v1/memorias/{criancaId}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const criancaId = e.request.pathValue('criancaId')
      if (!criancaId) return e.badRequestError('ID da criança é obrigatório')

      const crianca = $app.findRecordById('criancas', criancaId)
      if (!crianca || crianca.getString('owner') !== userId) {
        return e.forbiddenError('Não autorizado')
      }

      const mems = $app.findRecordsByFilter(
        'memorias',
        'crianca = {:c} && ativo = true',
        '-created',
        100,
        0,
        { c: criancaId },
      )

      return e.json(200, mems)
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao listar memórias' })
    }
  },
  $apis.requireAuth(),
)

// Excluir memória individualmente (Direito ao Esquecimento)
routerAdd(
  'DELETE',
  '/backend/v1/memorias/{memoriaId}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const memoriaId = e.request.pathValue('memoriaId')
      if (!memoriaId) return e.badRequestError('ID da memória é obrigatório')

      const memRec = $app.findRecordById('memorias', memoriaId)
      const criancaId = memRec.getString('crianca')
      const crianca = $app.findRecordById('criancas', criancaId)

      if (!crianca || crianca.getString('owner') !== userId) {
        return e.forbiddenError('Não autorizado')
      }

      $app.delete(memRec)

      return e.json(200, {
        success: true,
        message: 'Memória esquecida e removida com sucesso.',
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao esquecer memória' })
    }
  },
  $apis.requireAuth(),
)

// Rota de exclusão de dados e memórias de uma criança (LGPD/ECA Digital ampliada)
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

      // 1. Excluir todas as memórias do Grafo da criança
      try {
        const mems = $app.findRecordsByFilter('memorias', 'crianca = {:c}', '', 1000, 0, {
          c: criancaId,
        })
        for (let i = 0; i < mems.length; i++) {
          $app.delete(mems[i])
        }
      } catch (_) {}

      // 2. Excluir check-ins emocionais
      try {
        const checkins = $app.findRecordsByFilter(
          'checkins_emocionais',
          'crianca = {:c}',
          '',
          1000,
          0,
          {
            c: criancaId,
          },
        )
        for (let i = 0; i < checkins.length; i++) {
          $app.delete(checkins[i])
        }
      } catch (_) {}

      // 3. Excluir todas as dificuldades da criança
      try {
        const difs = $app.findRecordsByFilter('dificuldades', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < difs.length; i++) {
          $app.delete(difs[i])
        }
      } catch (_) {}

      // 4. Excluir toda a base de conhecimento da criança
      try {
        const conhs = $app.findRecordsByFilter('conhecimento', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < conhs.length; i++) {
          $app.delete(conhs[i])
        }
      } catch (_) {}

      // 5. Excluir todos os eventos de agenda da criança
      try {
        const ags = $app.findRecordsByFilter('agenda', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < ags.length; i++) {
          $app.delete(ags[i])
        }
      } catch (_) {}

      // 6. Excluir todos os alertas da criança
      try {
        const alts = $app.findRecordsByFilter('alertas', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < alts.length; i++) {
          $app.delete(alts[i])
        }
      } catch (_) {}

      // 7. Limpar observações e etapas
      crianca.set('observacoes', '')
      crianca.set('ultima_etapa_socratica', 'entender')
      $app.save(crianca)

      return e.json(200, {
        success: true,
        message:
          'Todas as memórias, check-ins e dados de aprendizagem foram excluídos em conformidade com a LGPD.',
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao excluir dados de aprendizagem' })
    }
  },
  $apis.requireAuth(),
)
