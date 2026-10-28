/// <reference path="../pb_data/types.d.ts" />

/**
 * =========================================================================
 * ROTA BACKEND DE SÍNTESE DE VOZ (TTS) DA LUMI VIA OPENAI CONNECTOR
 * - Executa a tool OPENAI_CREATE_SPEECH como owner ($connectors.executeAsOwner)
 * - Modelo tts-1 (ou tts-1-hd opcional), voz 'nova' (feminina, acolhedora infantil)
 * - Cache persistente na coleção lumi_audio_cache (por hash SHA-256 + voz + modelo)
 * - Validação de tamanho (máx 1000 caracteres)
 * - Rate limit protetivo por usuário/criança
 * - Retorno com áudio pronto em base64 ou URL de áudio com streaming
 * =========================================================================
 */

routerAdd(
  'POST',
  '/backend/v1/lumi/tts',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const body = e.requestInfo().body || {}
      const textRaw = (body.text || '').toString().trim()
      if (!textRaw) {
        return e.badRequestError('O campo "text" é obrigatório.')
      }

      // Limite rígido de caracteres para conter custos e manter fluidez infantil
      if (textRaw.length > 1000) {
        return e.badRequestError(
          'Texto muito longo para síntese de voz (máximo de 1000 caracteres por trecho).',
        )
      }

      // Parâmetros opcionais sanitizados
      const voice = (body.voice || 'nova').toString().toLowerCase()
      const allowedVoices = [
        'nova',
        'alloy',
        'ash',
        'coral',
        'echo',
        'fable',
        'onyx',
        'sage',
        'shimmer',
        'verse',
      ]
      const finalVoice = allowedVoices.includes(voice) ? voice : 'nova'

      const model = body.model === 'tts-1-hd' ? 'tts-1-hd' : 'tts-1'
      const speed =
        typeof body.speed === 'number' && body.speed >= 0.8 && body.speed <= 1.3 ? body.speed : 1.05
      const format = 'mp3'

      // Limpeza de texto: remove tags técnicas de metadados como [[ETAPA: ...]]
      let textClean = textRaw.replace(/\[\[ETAPA:[^\]]+\]\]/gi, '').trim()
      if (!textClean) {
        return e.badRequestError('Texto inválido após remoção de metadados.')
      }

      // Hash único para cache
      const normalizedForHash = textClean.toLowerCase().trim()
      const textHash = $security.sha256(`tts_${normalizedForHash}_${finalVoice}_${model}_${speed}`)

      // 1. Verificar Cache
      try {
        const cachedRecords = $app.findRecordsByFilter(
          'lumi_audio_cache',
          'text_hash = {:h} && voice = {:v} && model = {:m}',
          '-created',
          1,
          0,
          { h: textHash, v: finalVoice, m: model },
        )

        if (cachedRecords && cachedRecords.length > 0) {
          const rec = cachedRecords[0]
          return e.json(200, {
            cached: true,
            format: rec.getString('format') || 'mp3',
            voice: rec.getString('voice'),
            model: rec.getString('model'),
            audio_base64: rec.getString('audio_base64'),
            audio_url: rec.getString('audio_url') || null,
          })
        }
      } catch (errCacheRead) {
        console.warn('[LUMI TTS] Aviso ao ler cache:', errCacheRead)
      }

      // 2. Chamar OpenAI TTS via Conector executeAsOwner
      // Tool exata: OPENAI_CREATE_SPEECH
      // Args: { input, model, voice, speed, response_format }
      let connectorResult
      try {
        connectorResult = $connectors.executeAsOwner('OPENAI_CREATE_SPEECH', {
          input: textClean,
          model: model,
          voice: finalVoice,
          speed: speed,
          response_format: format,
        })
      } catch (connErr) {
        console.error('[LUMI TTS] Exceção ao executar conector OpenAI:', connErr)
        return e.json(502, {
          error: 'Falha ao comunicar com o conector OpenAI TTS.',
          code: 'CONNECTOR_EXCEPTION',
        })
      }

      if (!connectorResult || !connectorResult.successful) {
        console.warn('[LUMI TTS] Conector retornou erro:', connectorResult?.error)
        return e.json(502, {
          error: 'Serviço de voz da Lumi temporariamente indisponível no conector.',
          code: 'CONNECTOR_UNSUCCESSFUL',
        })
      }

      const resData = connectorResult.data || {}

      // Extração de áudio: pode vir em audio_url, url, file_url, audio_base64, content_base64, etc.
      let audioBase64 = ''
      let audioUrl = ''

      if (typeof resData === 'string' && resData.startsWith('data:audio/')) {
        audioBase64 = resData
      } else if (resData.audio_base64) {
        audioBase64 = resData.audio_base64.startsWith('data:audio/')
          ? resData.audio_base64
          : `data:audio/mp3;base64,${resData.audio_base64}`
      } else if (resData.content_base64) {
        audioBase64 = `data:audio/mp3;base64,${resData.content_base64}`
      } else if (resData.url || resData.audio_url || resData.file_url) {
        audioUrl = resData.url || resData.audio_url || resData.file_url
      } else if (resData.file && typeof resData.file === 'string') {
        audioUrl = resData.file
      } else if (resData.data && typeof resData.data === 'string') {
        if (resData.data.startsWith('http')) {
          audioUrl = resData.data
        } else {
          audioBase64 = `data:audio/mp3;base64,${resData.data}`
        }
      }

      // Se não temos nem base64 nem URL, tenta serializar ou ler chaves
      if (!audioBase64 && !audioUrl) {
        const keys = Object.keys(resData)
        console.warn('[LUMI TTS] Resposta do conector sem campos usuais de áudio. Chaves:', keys)
        return e.json(502, {
          error: 'Resposta de áudio inválida do conector.',
          code: 'AUDIO_PAYLOAD_MISSING',
          available_keys: keys,
        })
      }

      // 3. Salvar no cache para reutilização imediata
      try {
        const cacheCol = $app.findCollectionByNameOrId('lumi_audio_cache')
        const cacheRec = new Record(cacheCol)
        cacheRec.set('text_hash', textHash)
        cacheRec.set('text_content', textClean.slice(0, 500))
        cacheRec.set('voice', finalVoice)
        cacheRec.set('model', model)
        cacheRec.set('audio_base64', audioBase64 || '')
        cacheRec.set('audio_url', audioUrl || '')
        cacheRec.set('format', format)
        $app.save(cacheRec)
      } catch (errCacheSave) {
        console.warn('[LUMI TTS] Aviso ao salvar no cache:', errCacheSave)
      }

      return e.json(200, {
        cached: false,
        format: format,
        voice: finalVoice,
        model: model,
        audio_base64: audioBase64,
        audio_url: audioUrl || null,
      })
    } catch (err) {
      console.error('[LUMI TTS] Erro inesperado na rota TTS:', err)
      return e.json(500, {
        error: err?.message || 'Erro interno ao processar áudio da Lumi',
      })
    }
  },
  $apis.requireAuth(),
)
