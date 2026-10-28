/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const colMissoes = app.findCollectionByNameOrId('missoes_bncc')
    const colCriancas = app.findCollectionByNameOrId('criancas')
    const colDailyMetrics = app.findCollectionByNameOrId('daily_metrics')

    // Sementes de Missões BNCC
    const sementes = [
      // FASE 1: 5 a 8 anos
      {
        fase: 'fase_1',
        faixa_etaria: '5 a 8 anos',
        titulo: 'O Safari das Letras',
        materia: 'Português',
        descricao:
          'A IA emite o áudio do fonema e a criança identifica o animal correto, trabalhando consciência fonológica e sensorial.',
        habilidades_bncc: 'EF01LP07, EF12LP01 (Consciência fonológica e fonética)',
        tipo_interacao: 'audio_e_clique_sensorial',
        recursos_midia: JSON.stringify({
          icone: '🦁',
          cor: '#FDE68A',
          som_exemplo: '/audios/safari-letras.mp3',
          foco: 'Consciência fonológica e fonética',
        }),
        ordem: 1,
        ativo: true,
      },
      {
        fase: 'fase_1',
        faixa_etaria: '5 a 8 anos',
        titulo: 'A Feira das Frutas Mágicas',
        materia: 'Matemática',
        descricao:
          'Contagem física com maçãs e laranjas coloridas, explorando agrupamento visual e soma unitária.',
        habilidades_bncc: 'EF01MA01, EF01MA02 (Contagem física e quantidade)',
        tipo_interacao: 'arraste_visual_e_voz',
        recursos_midia: JSON.stringify({
          icone: '🍎',
          cor: '#FCA5A5',
          foco: 'Contagem concreta e associação tátil',
        }),
        ordem: 2,
        ativo: true,
      },

      // FASE 2: 9 a 12 anos
      {
        fase: 'fase_2',
        faixa_etaria: '9 a 12 anos',
        titulo: 'Operação Alexandria',
        materia: 'Matemática & Ciências',
        descricao:
          'Resolução de frações para abrir engrenagens históricas e posicionamento de espelhos para refletir a luz (óptica).',
        habilidades_bncc: 'EF05MA03, EF05CI02 (Frações equivalentes e reflexão da luz)',
        tipo_interacao: 'painel_controle_engrenagens',
        recursos_midia: JSON.stringify({
          icone: '🏛️',
          cor: '#818CF8',
          foco: 'Frações, engrenagens e física da luz',
        }),
        ordem: 3,
        ativo: true,
      },
      {
        fase: 'fase_2',
        faixa_etaria: '9 a 12 anos',
        titulo: 'Biosfera Orbital 2040',
        materia: 'Ciências & Geografia',
        descricao:
          'Equilíbrio de teias alimentares e fluxo de água em uma estação espacial que simula os biomas brasileiros.',
        habilidades_bncc: 'EF06CI07, EF06GE05 (Ecossistemas e ciclos biogeoquímicos)',
        tipo_interacao: 'simulador_sistemas',
        recursos_midia: JSON.stringify({
          icone: '🚀',
          cor: '#38BDF8',
          foco: 'Cadeias tróficas e preservação de biomas',
        }),
        ordem: 4,
        ativo: true,
      },

      // FASE 3: 13 a 16 anos
      {
        fase: 'fase_3',
        faixa_etaria: '13 a 16 anos',
        titulo: 'O Tribunal Socrático',
        materia: 'Filosofia & Redação',
        descricao:
          'O estudante redige uma argumentação sem falácias lógicas para refutar a tese de defesa apresentada pela IA.',
        habilidades_bncc: 'EM13LGG301, EM13CHS101 (Argumentação crítica e lógica proposicional)',
        tipo_interacao: 'arena_dialetica_texto',
        recursos_midia: JSON.stringify({
          icone: '⚖️',
          cor: '#A78BFA',
          foco: 'Refutação sem falácias, retórica e dialética',
        }),
        ordem: 5,
        ativo: true,
      },
      {
        fase: 'fase_3',
        faixa_etaria: '13 a 16 anos',
        titulo: 'Acelerador de Partículas & Cinemática',
        materia: 'Física & Funções',
        descricao:
          'Modelagem matemática de trajetórias curvas, colisões elásticas e conservação de energia.',
        habilidades_bncc: 'EM13CNT301, EM13MAT301 (Cinemática vetorial e funções de 2º grau)',
        tipo_interacao: 'workspace_graficos',
        recursos_midia: JSON.stringify({
          icone: '⚛️',
          cor: '#34D399',
          foco: 'Física moderna, vetores e análise de funções',
        }),
        ordem: 6,
        ativo: true,
      },
    ]

    for (const s of sementes) {
      try {
        const jaExiste = app.findRecordsByFilter('missoes_bncc', 'titulo = {:t}', '', 1, 0, {
          t: s.titulo,
        })
        if (jaExiste && jaExiste.length > 0) continue

        const r = new Record(colMissoes)
        r.set('fase', s.fase)
        r.set('faixa_etaria', s.faixa_etaria)
        r.set('titulo', s.titulo)
        r.set('materia', s.materia)
        r.set('descricao', s.descricao)
        r.set('habilidades_bncc', s.habilidades_bncc)
        r.set('tipo_interacao', s.tipo_interacao)
        r.set('recursos_midia', s.recursos_midia)
        r.set('ordem', s.ordem)
        r.set('ativo', s.ativo)
        app.save(r)
      } catch (_) {}
    }

    // Semente demonstrativa de daily_metrics vinculada à primeira criança (se houver)
    try {
      const criancas = app.findRecordsByFilter('criancas', '', '-created', 1, 0)
      if (criancas && criancas.length > 0) {
        const c = criancas[0]
        const sessId = 'sess_893247192'
        const metricsExistentes = app.findRecordsByFilter(
          'daily_metrics',
          'session_id = {:s}',
          '',
          1,
          0,
          { s: sessId },
        )
        if (!metricsExistentes || metricsExistentes.length === 0) {
          const mRec = new Record(colDailyMetrics)
          mRec.set('crianca', c.id)
          mRec.set('session_id', sessId)
          mRec.set(
            'user_id',
            'usr_' + (c.getString('nome') || 'lucas').toLowerCase().slice(0, 5) + c.getInt('idade'),
          )
          mRec.set('date', new Date().toISOString())
          mRec.set('duration_minutes', 26)
          mRec.set(
            'academic_tags',
            JSON.stringify({
              logic_mathematics: 80,
              reading_comprehension: 60,
              scientific_investigation: 95,
            }),
          )
          mRec.set(
            'socioemotional_tags',
            JSON.stringify({
              focus_attention: { score: 75, context: 'Foco contínuo por 18 minutos.' },
              frustration_management: { score: 65, status: 'improving' },
              autonomy_rate: 72,
            }),
          )
          mRec.set(
            'parent_bridges',
            JSON.stringify([
              'Pergunte a ele como os marinheiros antigos usavam as estrelas para navegar.',
              'Sugira o experimento do vinagre com bicarbonato de sódio no fim de semana.',
            ]),
          )
          mRec.set('resilience_moments_count', 14)
          mRec.set('resilience_autonomous_rate', 72)
          app.save(mRec)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // down migration
  },
)
