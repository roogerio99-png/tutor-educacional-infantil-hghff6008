/// <reference path="../pb_data/types.d.ts" />

/**
 * =========================================================================
 * ROTAS HTTP DO CHAT LUMI COM PROTOCOLO SOCRÁTICO, GUARDRAILS E FASE 3:
 * 1. Pipeline de Extração de Memórias (PII Scrubber + Extrator + Indexação + Injeção)
 * 2. Check-in Emocional Diário (Acolhimento + Termômetro com sequência recente)
 * 3. Protocolo de Escalonamento e Proteção à Vida (Barreira 1 Ampliada + Alerta Prioritário)
 * 4. Unificação de Contexto e Processamento entre Streaming e Síncrono
 * 5. Rate Limit no Servidor para PIN e Criptografia PBKDF2
 * =========================================================================
 * ATENÇÃO ARQUITETURAL JSVM POCKETBASE:
 * Cada callback registrado via routerAdd roda em um pool isolado de VM Goja.
 * Todas as funções auxiliares e variáveis de estado DEVEM ser declaradas
 * DENTRO do corpo de cada callback para evitar "Hook scoping error".
 * =========================================================================
 */

// ==========================================
// ROTA 1: CHAT LUMI SÍNCRONO
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

      const RESPOSTA_ACOLHIMENTO_PROTECAO =
        'Você é uma pessoa muito especial, única e importante, e seus sentimentos têm muito valor. Eu sou uma tutora digital e quero muito o seu bem, mas nos momentos em que sentimos medo, tristeza profunda ou passamos por algo difícil, o passo mais corajoso e seguro é conversar com um adulto de confiança da sua família ou da sua escola. Respire com calma, você não está sozinho(a). Procure agora quem cuida de você com amor para receber um abraço e apoio!'

      const RESPOSTA_TEMA_SENSIVEL =
        'Hmm, esse assunto é muito importante, mas é melhor conversarmos sobre ele com um adulto de confiança da sua família ou da sua escola. Que tal continuarmos nossa tarefa ou explorar algo do seu estudo?'

      const RESPOSTA_FORA_ESCOPO =
        'Adoro conversar com você! Mas o meu superpoder é ajudar com os seus estudos, matérias da escola e descobertas do conhecimento. Sobre qual matéria ou lição você gostaria de explorar agora?'

      // Funções auxiliares inline
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
          console.error('[ERRO REGISTRAR ALERTA]:', errAlerta)
        }
      }

      // 1. Classificação de Risco
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

      // 2. Extração de Memórias e Agenda (Inline)
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
        const textoLimpo = scrubPII(userMsg)
        const entidades = []
        if (textoLimpo && textoLimpo.length >= 5) {
          const matchInteresse = textoLimpo.match(
            /\b(?:amo|adoro|gosto muito de|sou apaixonad[oa] por|meu hobby e|meu animal favorito e|meu jogo favorito e)\s+([^.,;!?\n]+)/i,
          )
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
          const matchPessoa = textoLimpo.match(
            /\b(?:minha avo|meu avo|minha mae|meu pai|minha tia|meu tio|meu irmao|minha irma|meu primo|minha prima|meu amigo|minha amiga)\s+([^.,;!?\n]+)/i,
          )
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
          const matchRotina = textoLimpo.match(
            /\b(?:treino|faco aula de|jogo bola|tenho natacao|faco danca|todo sabado|toda terca|toda quarta|toda quinta|toda sexta|depois da escola eu)\s+([^.,;!?\n]+)/i,
          )
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
          const matchEstrategia = textoLimpo.match(
            /\b(?:entendi melhor quando|aprendi quando|funciona bem quando|quando usei|desenhei|usei blocos|com musica)\s+([^.,;!?\n]+)/i,
          )
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
          const matchDif = textoLimpo.match(
            /\b(?:acho dificil|tenho muita dificuldade em|nunca consigo entender|me atrapalho com)\s+([^.,;!?\n]+)/i,
          )
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
        }

        const hojeStr = new Date().toISOString().split('T')[0]
        for (let i = 0; i < entidades.length; i++) {
          const ent = entidades[i]
          if (ent.confianca === 'baixa') continue
          try {
            const normNovo = normalizarTexto(ent.conteudo)
            const existentes = $app.findRecordsByFilter(
              'memorias',
              'crianca = {:c} && ativo = true',
              '-created',
              50,
              0,
              { c: criancaAtual.id },
            )
            let achou = false
            for (let j = 0; j < existentes.length; j++) {
              const normExistente = normalizarTexto(existentes[j].getString('conteudo'))
              if (
                normExistente === normNovo ||
                (normNovo.length > 10 && normExistente.includes(normNovo)) ||
                (normExistente.length > 10 && normNovo.includes(normExistente))
              ) {
                achou = true
                break
              }
            }
            if (!achou) {
              const memoriasCol = $app.findCollectionByNameOrId('memorias')
              const rec = new Record(memoriasCol)
              rec.set('crianca', criancaAtual.id)
              rec.set('tipo', ent.tipo)
              rec.set('conteudo', ent.conteudo.slice(0, 300))
              rec.set('categoria', ent.categoria || 'Geral')
              rec.set('confianca', ent.confianca || 'alta')
              rec.set('origem', 'conversa')
              rec.set('data', hojeStr)
              rec.set('ativo', true)
              $app.save(rec)

              acoesExecutadas.push({
                tipo: 'memoria_registrada',
                id: rec.id,
                titulo: `Memória (${ent.tipo})`,
                conteudo: ent.conteudo,
              })
            }
          } catch (errIndex) {
            console.error('[ERRO INDEXAR MEMORIA]:', errIndex)
          }
        }

        // Detecção de agenda
        const normalizadoMsg = normalizarTexto(userMsg)
        const regexAgenda =
          /\b(tenho|marcar|anotar|agendar|adicionar|lembrar|coloque|colocar)\b.*?\b(prova|teste|avaliacao|tarefa|licao|trabalho|revisao)\b/i
        const regexProva = /\bprova\b|\bteste\b|\bavaliacao\b/i
        const regexRevisao = /\brevisao\b|\brevisar\b/i
        const regexProjeto = /\bprojeto\b|\btrabalho\b/i

        if (
          regexAgenda.test(normalizadoMsg) ||
          (normalizadoMsg.includes('prova de') && normalizadoMsg.length < 100)
        ) {
          let mat = 'Ciências'
          if (/\b(matematica|mat|calculo|fracao)\b/.test(normalizadoMsg)) mat = 'Matemática'
          else if (/\b(portugues|redacao|gramatica)\b/.test(normalizadoMsg)) mat = 'Português'
          else if (/\b(historia)\b/.test(normalizadoMsg)) mat = 'História'
          else if (/\b(geografia|mapa)\b/.test(normalizadoMsg)) mat = 'Geografia'
          else if (/\b(ingles)\b/.test(normalizadoMsg)) mat = 'Inglês'
          else if (/\b(artes|arte)\b/.test(normalizadoMsg)) mat = 'Artes'

          let tipoEv = 'tarefa'
          if (regexProva.test(normalizadoMsg)) tipoEv = 'prova'
          else if (regexRevisao.test(normalizadoMsg)) tipoEv = 'revisao'
          else if (regexProjeto.test(normalizadoMsg)) tipoEv = 'projeto'

          const hoje = new Date()
          let dataOffsetDias = 3
          if (/\b(hoje)\b/.test(normalizadoMsg)) dataOffsetDias = 0
          else if (/\b(amanha)\b/.test(normalizadoMsg)) dataOffsetDias = 1
          else if (/\b(segunda)\b/.test(normalizadoMsg))
            dataOffsetDias = (1 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(terca)\b/.test(normalizadoMsg))
            dataOffsetDias = (2 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quarta)\b/.test(normalizadoMsg))
            dataOffsetDias = (3 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quinta)\b/.test(normalizadoMsg))
            dataOffsetDias = (4 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(sexta)\b/.test(normalizadoMsg))
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

      // 3. Montagem do Prompt Contextual Completo
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

        // Calibragem Psicopedagógica Piaget
        let estagioPiaget = 'Operatório Concreto (8–10 anos)'
        let diretrizPiaget =
          'Diálogo investigativo ("explorador"), conectando causa e efeito com situações práticas cotidianas e problemas análogos.'
        if (idade <= 7) {
          estagioPiaget = 'Pré-Operatório / Transição (6–7 anos)'
          diretrizPiaget =
            'Frases curtas (máximo de 2 períodos por turno), entonação lúdica e acolhedora, vocabulário concreto, contagem visual unitária e perguntas binárias simples.'
        } else if (idade >= 11) {
          estagioPiaget = 'Operatório Formal Inicial (11–12 anos)'
          diretrizPiaget =
            'Tom de parceria intelectual curiosa, hipóteses científicas, planejamento autônomo e perguntas metacognitivas ("Como você testaria essa ideia?").'
        }

        const pronomesTratamento =
          genero === 'Menina'
            ? 'ela/dela (amiga)'
            : genero === 'Menino'
              ? 'ele/dele (amigo)'
              : 'neutro/amigável'

        extraContext += `\n[PERFIL BASE DA CRIANÇA]:
- Nome: ${nome} | Idade: ${idade} anos
- Estágio Cognitivo Piaget: ${estagioPiaget}
- Pronomes/Tratamento: ${pronomesTratamento}
- Localidade e Bioma: ${localidade || 'Brasil'}
- Série Escolar: ${serie} | Escola: ${escola || 'Não informada'}
[DIRETRIZ PEDAGÓGICA PIAGET PARA ESTA FAIXA ETÁRIA]: ${diretrizPiaget}`
        if (horariosAula) extraContext += `\n- Turno/Horários: ${horariosAula}.`
        if (acessibilidade && acessibilidade !== 'Nenhuma')
          extraContext += `\n- Acessibilidade: ${acessibilidade}.`
        if (obs) extraContext += `\n- Observações: ${obs}.`
        extraContext += `\n[ETAPA SOCRÁTICA ANTERIOR]: ${ultimaEtapa}. Avance pelo Protocolo Socrático conforme as respostas.`

        // Check-in emocional de hoje
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

        // Memórias do Grafo agrupadas
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
              if (agrupadas[t]) agrupadas[t].push(m.getString('conteudo'))
            })

            let memContext = '\n[GRAFO DE INTERESSES E COTIDIANO - MEMÓRIAS DA CRIANÇA]:'
            memContext +=
              '\n(Instrução: referencie estes fatos organicamente para criar conexão afetiva e analogias ricas, ex: "como quando você falou sobre...")'
            if (agrupadas.interesse.length > 0)
              memContext += `\n- Interesses/Hobbies: ${agrupadas.interesse.slice(0, 4).join('; ')}`
            if (agrupadas.pessoa_relacao.length > 0)
              memContext += `\n- Pessoas e Vínculos: ${agrupadas.pessoa_relacao.slice(0, 3).join('; ')}`
            if (agrupadas.rotina.length > 0)
              memContext += `\n- Rotina e Atividades: ${agrupadas.rotina.slice(0, 3).join('; ')}`
            if (agrupadas.estrategia.length > 0)
              memContext += `\n- Estratégias que deram certo: ${agrupadas.estrategia.slice(0, 3).join('; ')}`
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

      extraContext += `\n[DIRETRIZ DE SEGURANÇA E PROTEÇÃO]: Você é uma tutora infantil, NÃO terapeuta ou médica. Diante de qualquer sinal de risco, sofrimento intenso ou violação, acolha sem julgar e priorize o encaminhamento imediato a um adulto de confiança da família ou da escola.`

      // Diretriz rigorosa de concisão e simplicidade para crianças
      extraContext += `\n[REGRA CRÍTICA DE COMUNICAÇÃO INFANTIL - CONCISÃO & SIMPLICIDADE]:
1. Fale SEMPRE em frases CURTAS e linguagem SIMPLES de criança (máximo 2 a 3 frases curtas por resposta).
2. Se a mensagem for saudação ou social ("oi", "olá", "tudo bem?", "boa tarde"), responda com APENAS UMA FRASE simpática e acolhedora, sem palestras nem textos complexos (ex: "Oi! Que alegria falar com você! O que vamos aprender juntos hoje? ✨").
3. Uma ideia por frase. Nunca use termos adultos, formais ou parágrafos longos.
4. Mantenha o método socrático fazendo UMA pergunta investigativa curta por vez.`

      if (body.custom_prompt) {
        extraContext += `\n[INSTRUÇÃO DE SISTEMA PERSONALIZADA]: ${body.custom_prompt}`
      }

      const composedMessage = extraContext
        ? `${extraContext}\n\n[MENSAGEM DO ALUNO/RESPONSÁVEL]:\n${userMsg}`
        : userMsg

      // 4. Chamada ao Agente Lumi
      const result = $ai.agent('lumi-ia').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: composedMessage,
      })

      // 5. Pós-processamento Socrático e Validador de Concisão
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

      // Validador de comprimento e saudações (Barreira de Concisão Infantil)
      const ehSaudacaoOuSocial = (texto) => {
        const t = (texto || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
        return (
          /^(oi|oii|oiii|ola|opa|e ai|bom dia|boa tarde|boa noite|tudo bem|tudo bom|como vai|salve|fala lumi|oi lumi|ola lumi)$/.test(
            t,
          ) ||
          (/^(oi|ola|bom dia|boa tarde|boa noite)/.test(t) && t.split(/\s+/).length <= 4)
        )
      }

      // Extrai tag de etapa antes de manipular frases para não perder os metadados
      let tagExtraida = ''
      const matchTagTemp = conteudoFinal.match(/\[\[ETAPA:[^\]]+\]\]/i)
      if (matchTagTemp) {
        tagExtraida = matchTagTemp[0]
        conteudoFinal = conteudoFinal.replace(tagExtraida, '').trim()
      }

      // Divisão segura de frases mantendo pontuação
      const dividirFrases = (str) => {
        if (!str) return []
        const partes = str.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g) || []
        return partes.map((p) => p.trim()).filter((p) => p.length > 0)
      }

      const nomeCrianca = criancaAtual ? criancaAtual.getString('nome') : ''

      if (ehSaudacaoOuSocial(userMsg)) {
        // Se a criança apenas deu "oi" ou equivalente social, Lumi deve dar no máximo 1 frase afetuosa
        const frasesSaida = dividirFrases(conteudoFinal)
        if (frasesSaida.length > 1 || conteudoFinal.length > 140) {
          // Seleciona uma saudação amigável curta e limpa
          conteudoFinal = nomeCrianca
            ? `Oi, ${nomeCrianca}! Que alegria falar com você! O que vamos explorar juntos hoje? ✨`
            : `Oi! Que alegria falar com você! O que você gostaria de explorar hoje? ✨`
        }
      } else {
        // Para mensagens gerais: limitar a no máximo 3 frases curtas
        const frasesGerais = dividirFrases(conteudoFinal)
        if (frasesGerais.length > 3) {
          // Mantém as 2 primeiras frases e a última (que costuma conter a pergunta socrática)
          const primeiras = frasesGerais.slice(0, 2)
          const ultima = frasesGerais[frasesGerais.length - 1]
          if (!primeiras.includes(ultima)) {
            conteudoFinal = `${primeiras.join(' ')} ${ultima}`
          } else {
            conteudoFinal = primeiras.join(' ')
          }
        }
      }

      // Restaura a tag de etapa para que o detector de etapas a processe
      if (tagExtraida) {
        conteudoFinal = `${conteudoFinal}\n${tagExtraida}`
      }

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

// ==========================================
// ROTA 2: CHAT LUMI STREAMING (SSE)
// ==========================================
routerAdd('GET', '/backend/v1/lumi/chat-stream', (e) => {
  return e.json(200, {
    status: 'ok',
    endpoint: '/backend/v1/lumi/chat-stream',
    descricao: 'Canal de streaming SSE com IA Lumi e Protocolo Socrático.',
  })
})

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

      // Funções auxiliares inline
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

      // Contexto completo unificado
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
        const textoLimpo = scrubPII(userMsg)
        const entidades = []
        if (textoLimpo && textoLimpo.length >= 5) {
          const matchInteresse = textoLimpo.match(
            /\b(?:amo|adoro|gosto muito de|sou apaixonad[oa] por|meu hobby e|meu animal favorito e|meu jogo favorito e)\s+([^.,;!?\n]+)/i,
          )
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
          const matchPessoa = textoLimpo.match(
            /\b(?:minha avo|meu avo|minha mae|meu pai|minha tia|meu tio|meu irmao|minha irma|meu primo|minha prima|meu amigo|minha amiga)\s+([^.,;!?\n]+)/i,
          )
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
          const matchRotina = textoLimpo.match(
            /\b(?:treino|faco aula de|jogo bola|tenho natacao|faco danca|todo sabado|toda terca|toda quarta|toda quinta|toda sexta|depois da escola eu)\s+([^.,;!?\n]+)/i,
          )
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
          const matchEstrategia = textoLimpo.match(
            /\b(?:entendi melhor quando|aprendi quando|funciona bem quando|quando usei|desenhei|usei blocos|com musica)\s+([^.,;!?\n]+)/i,
          )
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
          const matchDif = textoLimpo.match(
            /\b(?:acho dificil|tenho muita dificuldade em|nunca consigo entender|me atrapalho com)\s+([^.,;!?\n]+)/i,
          )
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
        }

        const hojeStr = new Date().toISOString().split('T')[0]
        for (let i = 0; i < entidades.length; i++) {
          const ent = entidades[i]
          if (ent.confianca === 'baixa') continue
          try {
            const normNovo = normalizarTexto(ent.conteudo)
            const existentes = $app.findRecordsByFilter(
              'memorias',
              'crianca = {:c} && ativo = true',
              '-created',
              50,
              0,
              { c: criancaAtual.id },
            )
            let achou = false
            for (let j = 0; j < existentes.length; j++) {
              const normExistente = normalizarTexto(existentes[j].getString('conteudo'))
              if (
                normExistente === normNovo ||
                (normNovo.length > 10 && normExistente.includes(normNovo)) ||
                (normExistente.length > 10 && normNovo.includes(normExistente))
              ) {
                achou = true
                break
              }
            }
            if (!achou) {
              const memoriasCol = $app.findCollectionByNameOrId('memorias')
              const rec = new Record(memoriasCol)
              rec.set('crianca', criancaAtual.id)
              rec.set('tipo', ent.tipo)
              rec.set('conteudo', ent.conteudo.slice(0, 300))
              rec.set('categoria', ent.categoria || 'Geral')
              rec.set('confianca', ent.confianca || 'alta')
              rec.set('origem', 'conversa')
              rec.set('data', hojeStr)
              rec.set('ativo', true)
              $app.save(rec)

              acoesExecutadas.push({
                tipo: 'memoria_registrada',
                id: rec.id,
                titulo: `Memória (${ent.tipo})`,
                conteudo: ent.conteudo,
              })
            }
          } catch (errIndex) {
            console.error('[ERRO INDEXAR MEMORIA STREAM]:', errIndex)
          }
        }

        // Detecção de agenda
        const normalizadoMsg = normalizarTexto(userMsg)
        const regexAgenda =
          /\b(tenho|marcar|anotar|agendar|adicionar|lembrar|coloque|colocar)\b.*?\b(prova|teste|avaliacao|tarefa|licao|trabalho|revisao)\b/i
        const regexProva = /\bprova\b|\bteste\b|\bavaliacao\b/i
        const regexRevisao = /\brevisao\b|\brevisar\b/i
        const regexProjeto = /\bprojeto\b|\btrabalho\b/i

        if (
          regexAgenda.test(normalizadoMsg) ||
          (normalizadoMsg.includes('prova de') && normalizadoMsg.length < 100)
        ) {
          let mat = 'Ciências'
          if (/\b(matematica|mat|calculo|fracao)\b/.test(normalizadoMsg)) mat = 'Matemática'
          else if (/\b(portugues|redacao|gramatica)\b/.test(normalizadoMsg)) mat = 'Português'
          else if (/\b(historia)\b/.test(normalizadoMsg)) mat = 'História'
          else if (/\b(geografia|mapa)\b/.test(normalizadoMsg)) mat = 'Geografia'
          else if (/\b(ingles)\b/.test(normalizadoMsg)) mat = 'Inglês'
          else if (/\b(artes|arte)\b/.test(normalizadoMsg)) mat = 'Artes'

          let tipoEv = 'tarefa'
          if (regexProva.test(normalizadoMsg)) tipoEv = 'prova'
          else if (regexRevisao.test(normalizadoMsg)) tipoEv = 'revisao'
          else if (regexProjeto.test(normalizadoMsg)) tipoEv = 'projeto'

          const hoje = new Date()
          let dataOffsetDias = 3
          if (/\b(hoje)\b/.test(normalizadoMsg)) dataOffsetDias = 0
          else if (/\b(amanha)\b/.test(normalizadoMsg)) dataOffsetDias = 1
          else if (/\b(segunda)\b/.test(normalizadoMsg))
            dataOffsetDias = (1 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(terca)\b/.test(normalizadoMsg))
            dataOffsetDias = (2 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quarta)\b/.test(normalizadoMsg))
            dataOffsetDias = (3 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(quinta)\b/.test(normalizadoMsg))
            dataOffsetDias = (4 - hoje.getDay() + 7) % 7 || 7
          else if (/\b(sexta)\b/.test(normalizadoMsg))
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
            console.error('[ERRO CRIAR AGENDA STREAM]:', errAgenda)
          }
        }
      }

      let extraContext = ''
      let etapaEstimada = 'entender'
      let materiaEstimada = 'geral'

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
        etapaEstimada = ultimaEtapa

        // Calibragem Psicopedagógica Piaget
        let estagioPiaget = 'Operatório Concreto (8–10 anos)'
        let diretrizPiaget =
          'Diálogo investigativo ("explorador"), conectando causa e efeito com situações práticas cotidianas e problemas análogos.'
        if (idade <= 7) {
          estagioPiaget = 'Pré-Operatório / Transição (6–7 anos)'
          diretrizPiaget =
            'Frases curtas (máximo de 2 períodos por turno), entonação lúdica e acolhedora, vocabulário concreto, contagem visual unitária e perguntas binárias simples.'
        } else if (idade >= 11) {
          estagioPiaget = 'Operatório Formal Inicial (11–12 anos)'
          diretrizPiaget =
            'Tom de parceria intelectual curiosa, hipóteses científicas, planejamento autônomo e perguntas metacognitivas ("Como você testaria essa ideia?").'
        }

        const pronomesTratamento =
          genero === 'Menina'
            ? 'ela/dela (amiga)'
            : genero === 'Menino'
              ? 'ele/dele (amigo)'
              : 'neutro/amigável'

        extraContext += `\n[PERFIL BASE DA CRIANÇA]:
- Nome: ${nome} | Idade: ${idade} anos
- Estágio Cognitivo Piaget: ${estagioPiaget}
- Pronomes/Tratamento: ${pronomesTratamento}
- Localidade e Bioma: ${localidade || 'Brasil'}
- Série Escolar: ${serie} | Escola: ${escola || 'Não informada'}
[DIRETRIZ PEDAGÓGICA PIAGET PARA ESTA FAIXA ETÁRIA]: ${diretrizPiaget}`
        if (horariosAula) extraContext += `\n- Turno/Horários: ${horariosAula}.`
        if (acessibilidade && acessibilidade !== 'Nenhuma')
          extraContext += `\n- Acessibilidade: ${acessibilidade}.`
        if (obs) extraContext += `\n- Observações: ${obs}.`
        extraContext += `\n[ETAPA SOCRÁTICA ANTERIOR]: ${ultimaEtapa}. Avance pelo Protocolo Socrático conforme as respostas.`

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
              if (agrupadas[t]) agrupadas[t].push(m.getString('conteudo'))
            })

            let memContext = '\n[GRAFO DE INTERESSES E COTIDIANO - MEMÓRIAS DA CRIANÇA]:'
            memContext +=
              '\n(Instrução: referencie estes fatos organicamente para criar conexão afetiva e analogias ricas, ex: "como quando você falou sobre...")'
            if (agrupadas.interesse.length > 0)
              memContext += `\n- Interesses/Hobbies: ${agrupadas.interesse.slice(0, 4).join('; ')}`
            if (agrupadas.pessoa_relacao.length > 0)
              memContext += `\n- Pessoas e Vínculos: ${agrupadas.pessoa_relacao.slice(0, 3).join('; ')}`
            if (agrupadas.rotina.length > 0)
              memContext += `\n- Rotina e Atividades: ${agrupadas.rotina.slice(0, 3).join('; ')}`
            if (agrupadas.estrategia.length > 0)
              memContext += `\n- Estratégias que deram certo: ${agrupadas.estrategia.slice(0, 3).join('; ')}`
            extraContext += memContext
          }
        } catch (_) {}

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

      extraContext += `\n[DIRETRIZ DE SEGURANÇA E PROTEÇÃO]: Você é uma tutora infantil, NÃO terapeuta ou médica. Diante de qualquer sinal de risco, sofrimento intenso ou violação, acolha sem julgar e priorize o encaminhamento imediato a um adulto de confiança da família ou da escola.`

      // Diretriz rigorosa de concisão e simplicidade para crianças
      extraContext += `\n[REGRA CRÍTICA DE COMUNICAÇÃO INFANTIL - CONCISÃO & SIMPLICIDADE]:
1. Fale SEMPRE em frases CURTAS e linguagem SIMPLES de criança (máximo 2 a 3 frases curtas por resposta).
2. Se a mensagem for saudação ou social ("oi", "olá", "tudo bem?", "boa tarde"), responda com APENAS UMA FRASE simpática e acolhedora, sem palestras nem textos complexos (ex: "Oi! Que alegria falar com você! O que vamos aprender juntos hoje? ✨").
3. Uma ideia por frase. Nunca use termos adultos, formais ou parágrafos longos.
4. Mantenha o método socrático fazendo UMA pergunta investigativa curta por vez.`

      if (body.custom_prompt) {
        extraContext += `\n[INSTRUÇÃO DE SISTEMA PERSONALIZADA]: ${body.custom_prompt}`
      }

      const composedMessage = extraContext
        ? `${extraContext}\n\n[MENSAGEM DO ALUNO/RESPONSÁVEL]:\n${userMsg}`
        : userMsg

      // Estimativa socrática inicial
      const textoLower = userMsg.toLowerCase()
      if (
        textoLower.includes('explique com suas palavras') ||
        textoLower.includes('o que você aprendeu')
      ) {
        etapaEstimada = 'consolidar'
      } else if (textoLower.includes('exercício') || textoLower.includes('desafio')) {
        etapaEstimada = 'praticar'
      } else if (textoLower.includes('como fazer') || textoLower.includes('passo a passo')) {
        etapaEstimada = 'guiar'
      }

      if (
        textoLower.includes('fração') ||
        textoLower.includes('divis') ||
        textoLower.includes('matematica') ||
        textoLower.includes('número')
      ) {
        materiaEstimada = 'matematica'
      } else if (
        textoLower.includes('planta') ||
        textoLower.includes('ciencias') ||
        textoLower.includes('corpo')
      ) {
        materiaEstimada = 'ciencias'
      } else if (
        textoLower.includes('frase') ||
        textoLower.includes('portugues') ||
        textoLower.includes('letra')
      ) {
        materiaEstimada = 'portugues'
      } else if (textoLower.includes('historia')) {
        materiaEstimada = 'historia'
      } else if (textoLower.includes('mapa') || textoLower.includes('geografia')) {
        materiaEstimada = 'geografia'
      }

      if (criancaAtual) {
        try {
          criancaAtual.set('ultima_etapa_socratica', etapaEstimada)
          criancaAtual.set('ultima_materia', materiaEstimada)
          $app.save(criancaAtual)
        } catch (_) {}
      }

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
      e.response.header().set('X-Etapa-Socratica', etapaEstimada)
      e.response.header().set('X-Materia', materiaEstimada)
      if (acoesExecutadas.length > 0) {
        e.response
          .header()
          .set('X-Acoes-Executadas', encodeURIComponent(JSON.stringify(acoesExecutadas)))
      }

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
// ROTAS DE CHECK-IN EMOCIONAL
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

// Obter histórico de check-ins (Termômetro Emocional) considerando sequência mais recente
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

      // Cálculo do termômetro emocional: conta a sequência contínua a partir dos dias mais recentes (hoje para trás)
      let sequenciaRecenteNegativa = 0
      for (let i = 0; i < historico.length; i++) {
        const h = historico[i].getString('humor')
        if (h === 'triste' || h === 'muito_triste') {
          sequenciaRecenteNegativa++
        } else {
          break
        }
      }

      const alertaAtencaoEmocional = sequenciaRecenteNegativa >= 3

      return e.json(200, {
        historico,
        alerta_atencao_emocional: alertaAtencaoEmocional,
        dias_negativos_consecutivos: sequenciaRecenteNegativa,
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

      try {
        const mems = $app.findRecordsByFilter('memorias', 'crianca = {:c}', '', 1000, 0, {
          c: criancaId,
        })
        for (let i = 0; i < mems.length; i++) {
          $app.delete(mems[i])
        }
      } catch (_) {}

      try {
        const checkins = $app.findRecordsByFilter(
          'checkins_emocionais',
          'crianca = {:c}',
          '',
          1000,
          0,
          { c: criancaId },
        )
        for (let i = 0; i < checkins.length; i++) {
          $app.delete(checkins[i])
        }
      } catch (_) {}

      try {
        const difs = $app.findRecordsByFilter('dificuldades', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < difs.length; i++) {
          $app.delete(difs[i])
        }
      } catch (_) {}

      try {
        const conhs = $app.findRecordsByFilter('conhecimento', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < conhs.length; i++) {
          $app.delete(conhs[i])
        }
      } catch (_) {}

      try {
        const ags = $app.findRecordsByFilter('agenda', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < ags.length; i++) {
          $app.delete(ags[i])
        }
      } catch (_) {}

      try {
        const alts = $app.findRecordsByFilter('alertas', 'crianca = {:c}', '', 500, 0, {
          c: criancaId,
        })
        for (let i = 0; i < alts.length; i++) {
          $app.delete(alts[i])
        }
      } catch (_) {}

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

// ==========================================
// ROTAS DE PIN DO RESPONSÁVEL COM PBKDF2 E RATE LIMIT INLINE
// ==========================================

// 1. Status do PIN
routerAdd(
  'GET',
  '/backend/v1/auth/pin/status',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const user = $app.findRecordById('users', userId)
      const pinDefinido = !!user.getBool('pin_definido') && !!user.getString('pin_hash')

      return e.json(200, {
        definido: pinDefinido,
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao verificar status do PIN' })
    }
  },
  $apis.requireAuth(),
)

// 2. Definir ou alterar PIN
routerAdd(
  'POST',
  '/backend/v1/auth/pin/definir',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      // Rate limit persistido na collection 'alertas' (tipo: aviso_geral, prefixo [PIN_FALHA])
      const checarRateLimit = (uid) => {
        const agora = Date.now()
        const quinzeMinAtras = new Date(agora - 15 * 60 * 1000).toISOString().replace('T', ' ')
        try {
          const falhasRecentes = $app.findRecordsByFilter(
            'alertas',
            'tipo = "aviso_geral" && mensagem ~ {:prefix} && created >= {:desde}',
            '-created',
            10,
            0,
            { prefix: `[PIN_FALHA:${uid}]`, desde: quinzeMinAtras },
          )
          if (falhasRecentes && falhasRecentes.length >= 5) {
            const maisRecente = new Date(falhasRecentes[0].getString('created')).getTime()
            const desbloqueio = maisRecente + 30 * 60 * 1000
            if (agora < desbloqueio) {
              const minutosRestantes = Math.ceil((desbloqueio - agora) / 60000)
              return {
                bloqueado: true,
                minutosRestantes: minutosRestantes,
                mensagem: `Muitas tentativas incorretas de PIN. Por segurança, tente novamente em ${minutosRestantes} minuto(s).`,
              }
            }
          }
        } catch (_) {}
        return { bloqueado: false }
      }

      const registrarFalha = (uid) => {
        try {
          const col = $app.findCollectionByNameOrId('alertas')
          const r = new Record(col)
          r.set('tipo', 'aviso_geral')
          r.set('nivel', 'medio')
          r.set('mensagem', `[PIN_FALHA:${uid}] Tentativa incorreta de PIN do responsável`)
          r.set('lido', true)
          $app.save(r)
        } catch (_) {}
      }

      const limparFalhas = (uid) => {
        try {
          const recs = $app.findRecordsByFilter(
            'alertas',
            'tipo = "aviso_geral" && mensagem ~ {:prefix}',
            '-created',
            50,
            0,
            { prefix: `[PIN_FALHA:${uid}]` },
          )
          for (let i = 0; i < recs.length; i++) {
            $app.delete(recs[i])
          }
        } catch (_) {}
      }

      const rateLimit = checarRateLimit(userId)
      if (rateLimit.bloqueado) {
        return e.json(429, {
          error: rateLimit.mensagem,
          bloqueado: true,
          minutos_restantes: rateLimit.minutosRestantes,
        })
      }

      const body = e.requestInfo().body || {}
      const novoPin = (body.novo_pin || '').toString().trim()
      const confirmacao = (body.confirmacao || '').toString().trim()
      const pinAtual = (body.pin_atual || '').toString().trim()
      const senhaConta = (body.senha_conta || '').toString().trim()

      if (!/^\d{4}$/.test(novoPin)) {
        return e.badRequestError('O novo PIN deve conter exatamente 4 dígitos numéricos.')
      }

      if (novoPin !== confirmacao) {
        return e.badRequestError('A confirmação do PIN não confere com o novo PIN.')
      }

      // Motor PBKDF2 inline
      const K_CONST = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
      ])

      const hashBlocks = (w, v, p, pos, len) => {
        let a, b, c, d, e, f, g, h, u, i, j, t1, t2
        while (len >= 64) {
          a = v[0]
          b = v[1]
          c = v[2]
          d = v[3]
          e = v[4]
          f = v[5]
          g = v[6]
          h = v[7]
          for (i = 0; i < 16; i++) {
            j = pos + i * 4
            w[i] =
              ((p[j] & 0xff) << 24) |
              ((p[j + 1] & 0xff) << 16) |
              ((p[j + 2] & 0xff) << 8) |
              (p[j + 3] & 0xff)
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2]
            t1 = ((u >>> 17) | (u << (32 - 17))) ^ ((u >>> 19) | (u << (32 - 19))) ^ (u >>> 10)
            u = w[i - 15]
            t2 = ((u >>> 7) | (u << (32 - 7))) ^ ((u >>> 18) | (u << (32 - 18))) ^ (u >>> 3)
            w[i] = ((t1 + w[i - 7]) | 0) + ((t2 + w[i - 16]) | 0)
          }
          for (i = 0; i < 64; i++) {
            t1 =
              ((((((e >>> 6) | (e << (32 - 6))) ^
                ((e >>> 11) | (e << (32 - 11))) ^
                ((e >>> 25) | (e << (32 - 25)))) +
                ((e & f) ^ (~e & g))) |
                0) +
                ((h + ((K_CONST[i] + w[i]) | 0)) | 0)) |
              0
            t2 =
              ((((a >>> 2) | (a << (32 - 2))) ^
                ((a >>> 13) | (a << (32 - 13))) ^
                ((a >>> 22) | (a << (32 - 22)))) +
                ((a & b) ^ (a & c) ^ (b & c))) |
              0
            h = g
            g = f
            f = e
            e = (d + t1) | 0
            d = c
            c = b
            b = a
            a = (t1 + t2) | 0
          }
          v[0] += a
          v[1] += b
          v[2] += c
          v[3] += d
          v[4] += e
          v[5] += f
          v[6] += g
          v[7] += h
          pos += 64
          len -= 64
        }
        return pos
      }

      function Sha256Class() {
        this.state = new Int32Array(8)
        this.temp = new Int32Array(64)
        this.buffer = new Uint8Array(128)
        this.bufferLength = 0
        this.bytesHashed = 0
        this.finished = false
        this.reset = function () {
          this.state[0] = 0x6a09e667
          this.state[1] = 0xbb67ae85
          this.state[2] = 0x3c6ef372
          this.state[3] = 0xa54ff53a
          this.state[4] = 0x510e527f
          this.state[5] = 0x9b05688c
          this.state[6] = 0x1f83d9ab
          this.state[7] = 0x5be0cd19
          this.bufferLength = 0
          this.bytesHashed = 0
          this.finished = false
          return this
        }
        this.update = function (data, dataLength) {
          if (dataLength === undefined) dataLength = data.length
          let dataPos = 0
          this.bytesHashed += dataLength
          if (this.bufferLength > 0) {
            while (this.bufferLength < 64 && dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++]
              dataLength--
            }
            if (this.bufferLength === 64) {
              hashBlocks(this.temp, this.state, this.buffer, 0, 64)
              this.bufferLength = 0
            }
          }
          if (dataLength >= 64) {
            dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength)
            dataLength %= 64
          }
          while (dataLength > 0) {
            this.buffer[this.bufferLength++] = data[dataPos++]
            dataLength--
          }
          return this
        }
        this.finish = function (out) {
          if (!this.finished) {
            const bytesHashed = this.bytesHashed
            const left = this.bufferLength
            const bitLenHi = (bytesHashed / 0x20000000) | 0
            const bitLenLo = bytesHashed << 3
            const padLength = bytesHashed % 64 < 56 ? 64 : 128
            this.buffer[left] = 0x80
            for (let i = left + 1; i < padLength - 8; i++) {
              this.buffer[i] = 0
            }
            this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff
            this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff
            this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff
            this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff
            this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff
            this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff
            this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff
            this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff
            hashBlocks(this.temp, this.state, this.buffer, 0, padLength)
            this.finished = true
          }
          for (let i = 0; i < 8; i++) {
            out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff
            out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff
            out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff
            out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff
          }
          return this
        }
        this.reset()
      }

      function HmacSha256Class(key) {
        const pad = new Uint8Array(64)
        if (key.length > 64) {
          new Sha256Class().update(key).finish(pad)
        } else {
          for (let i = 0; i < key.length; i++) pad[i] = key[i]
        }
        for (let i = 0; i < 64; i++) pad[i] ^= 0x36
        this.inner = new Sha256Class()
        this.inner.update(pad)

        for (let i = 0; i < 64; i++) pad[i] ^= 0x36 ^ 0x5c
        this.outer = new Sha256Class()
        this.outer.update(pad)

        this.istate = new Int32Array(8)
        this.ostate = new Int32Array(8)
        for (let i = 0; i < 8; i++) {
          this.istate[i] = this.inner.state[i]
          this.ostate[i] = this.outer.state[i]
        }

        this.reset = function () {
          for (let i = 0; i < 8; i++) {
            this.inner.state[i] = this.istate[i]
            this.outer.state[i] = this.ostate[i]
          }
          this.inner.bytesHashed = 64
          this.inner.finished = false
          this.inner.bufferLength = 0
          this.outer.bytesHashed = 64
          this.outer.finished = false
          this.outer.bufferLength = 0
          return this
        }
        this.update = function (data, len) {
          this.inner.update(data, len)
          return this
        }
        this.finish = function (out) {
          if (this.outer.finished) {
            this.outer.finish(out)
          } else {
            this.inner.finish(out)
            this.outer.update(out, 32).finish(out)
          }
          return this
        }
      }

      const pbkdf2Sha256 = (passwordStr, saltStr, iterations, dkLen) => {
        const pwBytes = new Uint8Array(passwordStr.length)
        for (let i = 0; i < passwordStr.length; i++) pwBytes[i] = passwordStr.charCodeAt(i) & 0xff
        const saltBytes = new Uint8Array(saltStr.length)
        for (let i = 0; i < saltStr.length; i++) saltBytes[i] = saltStr.charCodeAt(i) & 0xff

        const prf = new HmacSha256Class(pwBytes)
        const len = 32
        const ctr = new Uint8Array(4)
        const t = new Uint8Array(len)
        const u = new Uint8Array(len)
        const dk = new Uint8Array(dkLen)

        for (let i = 0; i * len < dkLen; i++) {
          const c = i + 1
          ctr[0] = (c >>> 24) & 0xff
          ctr[1] = (c >>> 16) & 0xff
          ctr[2] = (c >>> 8) & 0xff
          ctr[3] = (c >>> 0) & 0xff
          prf.reset()
          prf.update(saltBytes)
          prf.update(ctr)
          prf.finish(u)
          for (let j = 0; j < len; j++) t[j] = u[j]
          for (let j = 2; j <= iterations; j++) {
            prf.reset()
            prf.update(u, len)
            prf.finish(u)
            for (let k = 0; k < len; k++) t[k] ^= u[k]
          }
          for (let j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j]
          }
        }
        let hex = ''
        for (let i = 0; i < dk.length; i++) {
          const h = dk[i].toString(16)
          hex += h.length === 1 ? '0' + h : h
        }
        return hex
      }

      const validarHash = (pin, storedHash) => {
        if (!storedHash) return false
        if (storedHash.length === 64 && !storedHash.startsWith('pbkdf2:')) {
          const legado = $security.sha256('lumi_pin_salt_' + pin)
          return legado === storedHash
        }
        const parts = storedHash.split(':')
        if (parts.length === 5 && parts[0] === 'pbkdf2' && parts[1] === 'sha256') {
          const iters = parseInt(parts[2], 10) || 100000
          const salt = parts[3]
          const expected = parts[4]
          const calculated = pbkdf2Sha256(pin, salt, iters, 32)
          return calculated === expected
        }
        return false
      }

      const user = $app.findRecordById('users', userId)
      const pinExistente = user.getString('pin_hash')

      if (pinExistente) {
        let autorizado = false
        if (pinAtual) {
          if (validarHash(pinAtual, pinExistente)) {
            autorizado = true
          }
        }

        if (!autorizado && senhaConta) {
          try {
            const authCheck = $app.findAuthRecordByEmail('_pb_users_auth_', user.getString('email'))
            if (authCheck.validatePassword(senhaConta)) {
              autorizado = true
            }
          } catch (_) {}
        }

        if (!autorizado) {
          registrarFalha(userId)
          return e.badRequestError(
            'Para alterar o PIN, informe o PIN atual correto ou a senha da sua conta.',
          )
        }
      }

      const salt = $security.randomString(16)
      const iterations = 100000
      const hash = pbkdf2Sha256(novoPin, salt, iterations, 32)
      user.set('pin_hash', `pbkdf2:sha256:${iterations}:${salt}:${hash}`)
      user.set('pin_definido', true)
      $app.save(user)

      limparFalhas(userId)

      return e.json(200, {
        success: true,
        message: 'PIN do responsável configurado com sucesso!',
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao configurar PIN' })
    }
  },
  $apis.requireAuth(),
)

// 3. Validar PIN
routerAdd(
  'POST',
  '/backend/v1/auth/pin/verificar',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      // Rate limit persistido na collection 'alertas' (tipo: aviso_geral, prefixo [PIN_FALHA])
      const checarRateLimit = (uid) => {
        const agora = Date.now()
        const quinzeMinAtras = new Date(agora - 15 * 60 * 1000).toISOString().replace('T', ' ')
        try {
          const falhasRecentes = $app.findRecordsByFilter(
            'alertas',
            'tipo = "aviso_geral" && mensagem ~ {:prefix} && created >= {:desde}',
            '-created',
            10,
            0,
            { prefix: `[PIN_FALHA:${uid}]`, desde: quinzeMinAtras },
          )
          if (falhasRecentes && falhasRecentes.length >= 5) {
            const maisRecente = new Date(falhasRecentes[0].getString('created')).getTime()
            const desbloqueio = maisRecente + 30 * 60 * 1000
            if (agora < desbloqueio) {
              const minutosRestantes = Math.ceil((desbloqueio - agora) / 60000)
              return {
                bloqueado: true,
                minutosRestantes: minutosRestantes,
                mensagem: `Muitas tentativas incorretas de PIN. Por segurança, tente novamente em ${minutosRestantes} minuto(s).`,
              }
            }
          }
        } catch (_) {}
        return { bloqueado: false }
      }

      const registrarFalha = (uid) => {
        try {
          const col = $app.findCollectionByNameOrId('alertas')
          const r = new Record(col)
          r.set('tipo', 'aviso_geral')
          r.set('nivel', 'medio')
          r.set('mensagem', `[PIN_FALHA:${uid}] Tentativa incorreta de PIN do responsável`)
          r.set('lido', true)
          $app.save(r)
        } catch (_) {}
      }

      const limparFalhas = (uid) => {
        try {
          const recs = $app.findRecordsByFilter(
            'alertas',
            'tipo = "aviso_geral" && mensagem ~ {:prefix}',
            '-created',
            50,
            0,
            { prefix: `[PIN_FALHA:${uid}]` },
          )
          for (let i = 0; i < recs.length; i++) {
            $app.delete(recs[i])
          }
        } catch (_) {}
      }

      const rateLimit = checarRateLimit(userId)
      if (rateLimit.bloqueado) {
        return e.json(429, {
          valido: false,
          bloqueado: true,
          minutos_restantes: rateLimit.minutosRestantes,
          error: rateLimit.mensagem,
        })
      }

      const body = e.requestInfo().body || {}
      const pin = (body.pin || '').toString().trim()

      if (!/^\d{4}$/.test(pin)) {
        return e.badRequestError('Informe um PIN de 4 dígitos.')
      }

      const user = $app.findRecordById('users', userId)
      const pinHash = user.getString('pin_hash')

      if (!pinHash) {
        return e.json(200, {
          valido: true,
          aviso: 'PIN ainda não configurado',
        })
      }

      // Motor PBKDF2 inline
      const K_CONST = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
      ])

      const hashBlocks = (w, v, p, pos, len) => {
        let a, b, c, d, e, f, g, h, u, i, j, t1, t2
        while (len >= 64) {
          a = v[0]
          b = v[1]
          c = v[2]
          d = v[3]
          e = v[4]
          f = v[5]
          g = v[6]
          h = v[7]
          for (i = 0; i < 16; i++) {
            j = pos + i * 4
            w[i] =
              ((p[j] & 0xff) << 24) |
              ((p[j + 1] & 0xff) << 16) |
              ((p[j + 2] & 0xff) << 8) |
              (p[j + 3] & 0xff)
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2]
            t1 = ((u >>> 17) | (u << (32 - 17))) ^ ((u >>> 19) | (u << (32 - 19))) ^ (u >>> 10)
            u = w[i - 15]
            t2 = ((u >>> 7) | (u << (32 - 7))) ^ ((u >>> 18) | (u << (32 - 18))) ^ (u >>> 3)
            w[i] = ((t1 + w[i - 7]) | 0) + ((t2 + w[i - 16]) | 0)
          }
          for (i = 0; i < 64; i++) {
            t1 =
              ((((((e >>> 6) | (e << (32 - 6))) ^
                ((e >>> 11) | (e << (32 - 11))) ^
                ((e >>> 25) | (e << (32 - 25)))) +
                ((e & f) ^ (~e & g))) |
                0) +
                ((h + ((K_CONST[i] + w[i]) | 0)) | 0)) |
              0
            t2 =
              ((((a >>> 2) | (a << (32 - 2))) ^
                ((a >>> 13) | (a << (32 - 13))) ^
                ((a >>> 22) | (a << (32 - 22)))) +
                ((a & b) ^ (a & c) ^ (b & c))) |
              0
            h = g
            g = f
            f = e
            e = (d + t1) | 0
            d = c
            c = b
            b = a
            a = (t1 + t2) | 0
          }
          v[0] += a
          v[1] += b
          v[2] += c
          v[3] += d
          v[4] += e
          v[5] += f
          v[6] += g
          v[7] += h
          pos += 64
          len -= 64
        }
        return pos
      }

      function Sha256Class() {
        this.state = new Int32Array(8)
        this.temp = new Int32Array(64)
        this.buffer = new Uint8Array(128)
        this.bufferLength = 0
        this.bytesHashed = 0
        this.finished = false
        this.reset = function () {
          this.state[0] = 0x6a09e667
          this.state[1] = 0xbb67ae85
          this.state[2] = 0x3c6ef372
          this.state[3] = 0xa54ff53a
          this.state[4] = 0x510e527f
          this.state[5] = 0x9b05688c
          this.state[6] = 0x1f83d9ab
          this.state[7] = 0x5be0cd19
          this.bufferLength = 0
          this.bytesHashed = 0
          this.finished = false
          return this
        }
        this.update = function (data, dataLength) {
          if (dataLength === undefined) dataLength = data.length
          let dataPos = 0
          this.bytesHashed += dataLength
          if (this.bufferLength > 0) {
            while (this.bufferLength < 64 && dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++]
              dataLength--
            }
            if (this.bufferLength === 64) {
              hashBlocks(this.temp, this.state, this.buffer, 0, 64)
              this.bufferLength = 0
            }
          }
          if (dataLength >= 64) {
            dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength)
            dataLength %= 64
          }
          while (dataLength > 0) {
            this.buffer[this.bufferLength++] = data[dataPos++]
            dataLength--
          }
          return this
        }
        this.finish = function (out) {
          if (!this.finished) {
            const bytesHashed = this.bytesHashed
            const left = this.bufferLength
            const bitLenHi = (bytesHashed / 0x20000000) | 0
            const bitLenLo = bytesHashed << 3
            const padLength = bytesHashed % 64 < 56 ? 64 : 128
            this.buffer[left] = 0x80
            for (let i = left + 1; i < padLength - 8; i++) {
              this.buffer[i] = 0
            }
            this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff
            this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff
            this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff
            this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff
            this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff
            this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff
            this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff
            this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff
            hashBlocks(this.temp, this.state, this.buffer, 0, padLength)
            this.finished = true
          }
          for (let i = 0; i < 8; i++) {
            out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff
            out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff
            out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff
            out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff
          }
          return this
        }
        this.reset()
      }

      function HmacSha256Class(key) {
        const pad = new Uint8Array(64)
        if (key.length > 64) {
          new Sha256Class().update(key).finish(pad)
        } else {
          for (let i = 0; i < key.length; i++) pad[i] = key[i]
        }
        for (let i = 0; i < 64; i++) pad[i] ^= 0x36
        this.inner = new Sha256Class()
        this.inner.update(pad)

        for (let i = 0; i < 64; i++) pad[i] ^= 0x36 ^ 0x5c
        this.outer = new Sha256Class()
        this.outer.update(pad)

        this.istate = new Int32Array(8)
        this.ostate = new Int32Array(8)
        for (let i = 0; i < 8; i++) {
          this.istate[i] = this.inner.state[i]
          this.ostate[i] = this.outer.state[i]
        }

        this.reset = function () {
          for (let i = 0; i < 8; i++) {
            this.inner.state[i] = this.istate[i]
            this.outer.state[i] = this.ostate[i]
          }
          this.inner.bytesHashed = 64
          this.inner.finished = false
          this.inner.bufferLength = 0
          this.outer.bytesHashed = 64
          this.outer.finished = false
          this.outer.bufferLength = 0
          return this
        }
        this.update = function (data, len) {
          this.inner.update(data, len)
          return this
        }
        this.finish = function (out) {
          if (this.outer.finished) {
            this.outer.finish(out)
          } else {
            this.inner.finish(out)
            this.outer.update(out, 32).finish(out)
          }
          return this
        }
      }

      const pbkdf2Sha256 = (passwordStr, saltStr, iterations, dkLen) => {
        const pwBytes = new Uint8Array(passwordStr.length)
        for (let i = 0; i < passwordStr.length; i++) pwBytes[i] = passwordStr.charCodeAt(i) & 0xff
        const saltBytes = new Uint8Array(saltStr.length)
        for (let i = 0; i < saltStr.length; i++) saltBytes[i] = saltStr.charCodeAt(i) & 0xff

        const prf = new HmacSha256Class(pwBytes)
        const len = 32
        const ctr = new Uint8Array(4)
        const t = new Uint8Array(len)
        const u = new Uint8Array(len)
        const dk = new Uint8Array(dkLen)

        for (let i = 0; i * len < dkLen; i++) {
          const c = i + 1
          ctr[0] = (c >>> 24) & 0xff
          ctr[1] = (c >>> 16) & 0xff
          ctr[2] = (c >>> 8) & 0xff
          ctr[3] = (c >>> 0) & 0xff
          prf.reset()
          prf.update(saltBytes)
          prf.update(ctr)
          prf.finish(u)
          for (let j = 0; j < len; j++) t[j] = u[j]
          for (let j = 2; j <= iterations; j++) {
            prf.reset()
            prf.update(u, len)
            prf.finish(u)
            for (let k = 0; k < len; k++) t[k] ^= u[k]
          }
          for (let j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j]
          }
        }
        let hex = ''
        for (let i = 0; i < dk.length; i++) {
          const h = dk[i].toString(16)
          hex += h.length === 1 ? '0' + h : h
        }
        return hex
      }

      const validarHash = (pinVal, storedHash) => {
        if (!storedHash) return false
        if (storedHash.length === 64 && !storedHash.startsWith('pbkdf2:')) {
          const legado = $security.sha256('lumi_pin_salt_' + pinVal)
          return legado === storedHash
        }
        const parts = storedHash.split(':')
        if (parts.length === 5 && parts[0] === 'pbkdf2' && parts[1] === 'sha256') {
          const iters = parseInt(parts[2], 10) || 100000
          const salt = parts[3]
          const expected = parts[4]
          const calculated = pbkdf2Sha256(pinVal, salt, iters, 32)
          return calculated === expected
        }
        return false
      }

      const valido = validarHash(pin, pinHash)

      if (valido) {
        limparFalhas(userId)
        if (!pinHash.startsWith('pbkdf2:')) {
          try {
            const salt = $security.randomString(16)
            const iterations = 100000
            const hash = pbkdf2Sha256(pin, salt, iterations, 32)
            user.set('pin_hash', `pbkdf2:sha256:${iterations}:${salt}:${hash}`)
            $app.save(user)
          } catch (_) {}
        }
      } else {
        registrarFalha(userId)
        const checkApos = checarRateLimit(userId)
        if (checkApos.bloqueado) {
          return e.json(429, {
            valido: false,
            bloqueado: true,
            minutos_restantes: checkApos.minutosRestantes,
            error: checkApos.mensagem,
          })
        }
      }

      return e.json(200, {
        valido: valido,
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao validar PIN' })
    }
  },
  $apis.requireAuth(),
)

// 4. Redefinir PIN esquecido exigindo senha da conta
routerAdd(
  'POST',
  '/backend/v1/auth/pin/redefinir-com-senha',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      // Rate limit persistido na collection 'alertas' (tipo: aviso_geral, prefixo [PIN_FALHA])
      const checarRateLimit = (uid) => {
        const agora = Date.now()
        const quinzeMinAtras = new Date(agora - 15 * 60 * 1000).toISOString().replace('T', ' ')
        try {
          const falhasRecentes = $app.findRecordsByFilter(
            'alertas',
            'tipo = "aviso_geral" && mensagem ~ {:prefix} && created >= {:desde}',
            '-created',
            10,
            0,
            { prefix: `[PIN_FALHA:${uid}]`, desde: quinzeMinAtras },
          )
          if (falhasRecentes && falhasRecentes.length >= 5) {
            const maisRecente = new Date(falhasRecentes[0].getString('created')).getTime()
            const desbloqueio = maisRecente + 30 * 60 * 1000
            if (agora < desbloqueio) {
              const minutosRestantes = Math.ceil((desbloqueio - agora) / 60000)
              return {
                bloqueado: true,
                minutosRestantes: minutosRestantes,
                mensagem: `Muitas tentativas incorretas de PIN. Por segurança, tente novamente em ${minutosRestantes} minuto(s).`,
              }
            }
          }
        } catch (_) {}
        return { bloqueado: false }
      }

      const registrarFalha = (uid) => {
        try {
          const col = $app.findCollectionByNameOrId('alertas')
          const r = new Record(col)
          r.set('tipo', 'aviso_geral')
          r.set('nivel', 'medio')
          r.set('mensagem', `[PIN_FALHA:${uid}] Tentativa incorreta de PIN do responsável`)
          r.set('lido', true)
          $app.save(r)
        } catch (_) {}
      }

      const limparFalhas = (uid) => {
        try {
          const recs = $app.findRecordsByFilter(
            'alertas',
            'tipo = "aviso_geral" && mensagem ~ {:prefix}',
            '-created',
            50,
            0,
            { prefix: `[PIN_FALHA:${uid}]` },
          )
          for (let i = 0; i < recs.length; i++) {
            $app.delete(recs[i])
          }
        } catch (_) {}
      }

      const rateLimit = checarRateLimit(userId)
      if (rateLimit.bloqueado) {
        return e.json(429, {
          error: rateLimit.mensagem,
          bloqueado: true,
          minutos_restantes: rateLimit.minutosRestantes,
        })
      }

      const body = e.requestInfo().body || {}
      const senhaConta = (body.senha_conta || '').toString().trim()
      const novoPin = (body.novo_pin || '').toString().trim()
      const confirmacao = (body.confirmacao || '').toString().trim()

      if (!senhaConta) {
        return e.badRequestError('Senha da conta é obrigatória para redefinir o PIN.')
      }

      if (!/^\d{4}$/.test(novoPin)) {
        return e.badRequestError('O novo PIN deve conter exatamente 4 dígitos numéricos.')
      }

      if (novoPin !== confirmacao) {
        return e.badRequestError('A confirmação do PIN não confere com o novo PIN.')
      }

      const user = $app.findRecordById('users', userId)
      if (!user.validatePassword(senhaConta)) {
        registrarFalha(userId)
        return e.badRequestError('Senha da conta incorreta.')
      }

      // Motor PBKDF2 inline
      const K_CONST = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
      ])

      const hashBlocks = (w, v, p, pos, len) => {
        let a, b, c, d, e, f, g, h, u, i, j, t1, t2
        while (len >= 64) {
          a = v[0]
          b = v[1]
          c = v[2]
          d = v[3]
          e = v[4]
          f = v[5]
          g = v[6]
          h = v[7]
          for (i = 0; i < 16; i++) {
            j = pos + i * 4
            w[i] =
              ((p[j] & 0xff) << 24) |
              ((p[j + 1] & 0xff) << 16) |
              ((p[j + 2] & 0xff) << 8) |
              (p[j + 3] & 0xff)
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2]
            t1 = ((u >>> 17) | (u << (32 - 17))) ^ ((u >>> 19) | (u << (32 - 19))) ^ (u >>> 10)
            u = w[i - 15]
            t2 = ((u >>> 7) | (u << (32 - 7))) ^ ((u >>> 18) | (u << (32 - 18))) ^ (u >>> 3)
            w[i] = ((t1 + w[i - 7]) | 0) + ((t2 + w[i - 16]) | 0)
          }
          for (i = 0; i < 64; i++) {
            t1 =
              ((((((e >>> 6) | (e << (32 - 6))) ^
                ((e >>> 11) | (e << (32 - 11))) ^
                ((e >>> 25) | (e << (32 - 25)))) +
                ((e & f) ^ (~e & g))) |
                0) +
                ((h + ((K_CONST[i] + w[i]) | 0)) | 0)) |
              0
            t2 =
              ((((a >>> 2) | (a << (32 - 2))) ^
                ((a >>> 13) | (a << (32 - 13))) ^
                ((a >>> 22) | (a << (32 - 22)))) +
                ((a & b) ^ (a & c) ^ (b & c))) |
              0
            h = g
            g = f
            f = e
            e = (d + t1) | 0
            d = c
            c = b
            b = a
            a = (t1 + t2) | 0
          }
          v[0] += a
          v[1] += b
          v[2] += c
          v[3] += d
          v[4] += e
          v[5] += f
          v[6] += g
          v[7] += h
          pos += 64
          len -= 64
        }
        return pos
      }

      function Sha256Class() {
        this.state = new Int32Array(8)
        this.temp = new Int32Array(64)
        this.buffer = new Uint8Array(128)
        this.bufferLength = 0
        this.bytesHashed = 0
        this.finished = false
        this.reset = function () {
          this.state[0] = 0x6a09e667
          this.state[1] = 0xbb67ae85
          this.state[2] = 0x3c6ef372
          this.state[3] = 0xa54ff53a
          this.state[4] = 0x510e527f
          this.state[5] = 0x9b05688c
          this.state[6] = 0x1f83d9ab
          this.state[7] = 0x5be0cd19
          this.bufferLength = 0
          this.bytesHashed = 0
          this.finished = false
          return this
        }
        this.update = function (data, dataLength) {
          if (dataLength === undefined) dataLength = data.length
          let dataPos = 0
          this.bytesHashed += dataLength
          if (this.bufferLength > 0) {
            while (this.bufferLength < 64 && dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++]
              dataLength--
            }
            if (this.bufferLength === 64) {
              hashBlocks(this.temp, this.state, this.buffer, 0, 64)
              this.bufferLength = 0
            }
          }
          if (dataLength >= 64) {
            dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength)
            dataLength %= 64
          }
          while (dataLength > 0) {
            this.buffer[this.bufferLength++] = data[dataPos++]
            dataLength--
          }
          return this
        }
        this.finish = function (out) {
          if (!this.finished) {
            const bytesHashed = this.bytesHashed
            const left = this.bufferLength
            const bitLenHi = (bytesHashed / 0x20000000) | 0
            const bitLenLo = bytesHashed << 3
            const padLength = bytesHashed % 64 < 56 ? 64 : 128
            this.buffer[left] = 0x80
            for (let i = left + 1; i < padLength - 8; i++) {
              this.buffer[i] = 0
            }
            this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff
            this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff
            this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff
            this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff
            this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff
            this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff
            this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff
            this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff
            hashBlocks(this.temp, this.state, this.buffer, 0, padLength)
            this.finished = true
          }
          for (let i = 0; i < 8; i++) {
            out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff
            out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff
            out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff
            out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff
          }
          return this
        }
        this.reset()
      }

      function HmacSha256Class(key) {
        const pad = new Uint8Array(64)
        if (key.length > 64) {
          new Sha256Class().update(key).finish(pad)
        } else {
          for (let i = 0; i < key.length; i++) pad[i] = key[i]
        }
        for (let i = 0; i < 64; i++) pad[i] ^= 0x36
        this.inner = new Sha256Class()
        this.inner.update(pad)

        for (let i = 0; i < 64; i++) pad[i] ^= 0x36 ^ 0x5c
        this.outer = new Sha256Class()
        this.outer.update(pad)

        this.istate = new Int32Array(8)
        this.ostate = new Int32Array(8)
        for (let i = 0; i < 8; i++) {
          this.istate[i] = this.inner.state[i]
          this.ostate[i] = this.outer.state[i]
        }

        this.reset = function () {
          for (let i = 0; i < 8; i++) {
            this.inner.state[i] = this.istate[i]
            this.outer.state[i] = this.ostate[i]
          }
          this.inner.bytesHashed = 64
          this.inner.finished = false
          this.inner.bufferLength = 0
          this.outer.bytesHashed = 64
          this.outer.finished = false
          this.outer.bufferLength = 0
          return this
        }
        this.update = function (data, len) {
          this.inner.update(data, len)
          return this
        }
        this.finish = function (out) {
          if (this.outer.finished) {
            this.outer.finish(out)
          } else {
            this.inner.finish(out)
            this.outer.update(out, 32).finish(out)
          }
          return this
        }
      }

      const pbkdf2Sha256 = (passwordStr, saltStr, iterations, dkLen) => {
        const pwBytes = new Uint8Array(passwordStr.length)
        for (let i = 0; i < passwordStr.length; i++) pwBytes[i] = passwordStr.charCodeAt(i) & 0xff
        const saltBytes = new Uint8Array(saltStr.length)
        for (let i = 0; i < saltStr.length; i++) saltBytes[i] = saltStr.charCodeAt(i) & 0xff

        const prf = new HmacSha256Class(pwBytes)
        const len = 32
        const ctr = new Uint8Array(4)
        const t = new Uint8Array(len)
        const u = new Uint8Array(len)
        const dk = new Uint8Array(dkLen)

        for (let i = 0; i * len < dkLen; i++) {
          const c = i + 1
          ctr[0] = (c >>> 24) & 0xff
          ctr[1] = (c >>> 16) & 0xff
          ctr[2] = (c >>> 8) & 0xff
          ctr[3] = (c >>> 0) & 0xff
          prf.reset()
          prf.update(saltBytes)
          prf.update(ctr)
          prf.finish(u)
          for (let j = 0; j < len; j++) t[j] = u[j]
          for (let j = 2; j <= iterations; j++) {
            prf.reset()
            prf.update(u, len)
            prf.finish(u)
            for (let k = 0; k < len; k++) t[k] ^= u[k]
          }
          for (let j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j]
          }
        }
        let hex = ''
        for (let i = 0; i < dk.length; i++) {
          const h = dk[i].toString(16)
          hex += h.length === 1 ? '0' + h : h
        }
        return hex
      }

      const salt = $security.randomString(16)
      const iterations = 100000
      const hash = pbkdf2Sha256(novoPin, salt, iterations, 32)
      user.set('pin_hash', `pbkdf2:sha256:${iterations}:${salt}:${hash}`)
      user.set('pin_definido', true)
      $app.save(user)

      limparFalhas(userId)

      return e.json(200, {
        success: true,
        message: 'PIN redefinido com sucesso!',
      })
    } catch (err) {
      return e.json(500, { error: err?.message || 'Erro ao redefinir PIN' })
    }
  },
  $apis.requireAuth(),
)
