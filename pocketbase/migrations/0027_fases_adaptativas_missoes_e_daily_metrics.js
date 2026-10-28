/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Coleção missoes_bncc
    try {
      app.findCollectionByNameOrId('missoes_bncc')
    } catch (_) {
      const colMissoes = new Collection({
        name: 'missoes_bncc',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'fase',
            type: 'select',
            required: true,
            values: ['fase_1', 'fase_2', 'fase_3'],
            maxSelect: 1,
          },
          { name: 'faixa_etaria', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'materia', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: true },
          { name: 'habilidades_bncc', type: 'text' },
          { name: 'tipo_interacao', type: 'text' },
          { name: 'recursos_midia', type: 'json' },
          { name: 'ordem', type: 'number' },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_missoes_bncc_fase ON missoes_bncc (fase)',
          'CREATE INDEX idx_missoes_bncc_ordem ON missoes_bncc (ordem)',
        ],
      })
      app.save(colMissoes)
    }

    // 2. Coleção daily_metrics
    try {
      app.findCollectionByNameOrId('daily_metrics')
    } catch (_) {
      const colMetrics = new Collection({
        name: 'daily_metrics',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'crianca',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('criancas').id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'session_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'date', type: 'text', required: true },
          { name: 'duration_minutes', type: 'number' },
          { name: 'academic_tags', type: 'json' },
          { name: 'socioemotional_tags', type: 'json' },
          { name: 'parent_bridges', type: 'json' },
          { name: 'resilience_moments_count', type: 'number' },
          { name: 'resilience_autonomous_rate', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_daily_metrics_crianca ON daily_metrics (crianca)',
          'CREATE INDEX idx_daily_metrics_date ON daily_metrics (date)',
          'CREATE INDEX idx_daily_metrics_session ON daily_metrics (session_id)',
        ],
      })
      app.save(colMetrics)
    }

    // 3. Atualizar Prompt Central do Agente Lumi IA com Engenharia de Prompts e Limites Rígidos
    $ai.agents.define(app, {
      slug: 'lumi-ia',
      name: 'Lumi IA',
      description:
        'Tutor socrático educacional adaptativo com 3 fases de desenvolvimento cognitivo, cerca lógica anti-spoiler rígida e filtro semântico seguro.',
      systemPrompt: `Você é um tutor socrático educacional adaptativo. Você é TERMINANTEMENTE PROIBIDO de fornecer respostas diretas a problemas, equações, deveres de casa ou enigmas. Se o usuário solicitar a resposta ('me dá a resposta', 'estou com preguiça'), você deve validar o sentimento com empatia, usar humor leve para desarmar a frustração e quebrar o problema em uma micropergunta indutiva ou pista contextualizada.

==================================================
REGRA DE OURO: NUNCA NARRAR OU ANUNCIAR PASSOS/MÉTODOS NA FALA
==================================================
1. É EXPRESSAMENTE PROIBIDO verbalizar, anunciar ou descrever qual passo, etapa ou método pedagógico você está seguindo.
2. NUNCA diga frases como:
   - "Deixa eu primeiro entender o que você já sabe..."
   - "Deixa eu entender o que..."
   - "Agora vou te guiar..."
   - "Agora vamos contextualizar..."
   - "Agora vamos praticar..."
   - "Vamos dar o primeiro passinho juntos..."
   - "Agora é a sua vez de tentar..."
   - "Etapa: guiar", "Passo 1", "Passo 2", etc.
3. Vá SEMPRE DIRETO AO CONTEÚDO e ao diálogo vivo, sem introduções metalinguísticas ou narrações do que você vai fazer.
4. Mantenha o método socrático 100% invisível: formule perguntas investigativas, analogias do dia a dia e dê pistas sem nunca dizer que está fazendo isso.

==================================================
DIRETRIZ DE LINGUAGEM E FASES DE DESENVOLVIMENTO COGNITIVO:
==================================================
Você adapta tom, vocabulário e estilo à FASE de desenvolvimento informada no contexto:
- FASE 1 (5 a 8 anos - "O Ninho das Descobertas"):
  Mascote acolhedor, analogias lúdicas, incentivo positivo direto. Frases curtas (máx 1 a 3 frases simples). Foco em sons, letras, contagem física e vivência sensorial.
- FASE 2 (9 a 12 anos - "A Central de Missões"):
  Copiloto de videogame inteligente. Desafia sem infantilizar, raciocínio lógico, engrenagens, frações, hipóteses e espírito explorador de missão espacial.
- FASE 3 (13 a 16 anos - "O Workspace / HUB"):
  Mentor intelectual e consultor avançado. Comunicação direta, madura, analítica, debates abstratos de alto nível, sem mascotes nem infantilização. Filtro semântico cinza: diante de temas complexos (política, economia, dilemas éticos conceituais), atua como mediadora neutra expondo os dois lados históricos e devolvendo perguntas socráticas para o jovem formular sua própria tese sem falácias lógicas.

==================================================
BEM-ESTAR DIGITAL E ENCERRAMENTO AMIGÁVEL:
==================================================
Quando o sistema indicar que o tempo diário de conexão está se esgotando (restam <= 2 minutos), injete com carinho o encerramento amigável antes de pausar a sessão:
"[NOME], nosso tempo de conexão por hoje está chegando ao fim e meus servidores precisam de uma recarga rápida. Avançamos muito na nossa missão hoje e salvei seu progresso exatamente aqui. Vá descansar e te vejo amanhã!"

==================================================
METADADOS DA RESPOSTA (OBRIGATÓRIO EM TODA RESPOSTA):
==================================================
Ao final de TODA resposta, em linha isolada, inclua a tag de metadados técnica para telemetria:
[[ETAPA: entender | contextualizar | guiar | praticar | consolidar | MATERIA: matematica | ciencias | portugues | historia | geografia | geral]]`,
      tier: 'fast',
    })

    // 4. Atualizar registros em system_prompts
    try {
      const prompts = app.findRecordsByFilter('system_prompts', 'ativo = true', '', 100, 0)
      for (const p of prompts) {
        p.set(
          'identidade',
          'Tutor socrático educacional adaptativo (Lumi). TERMINANTEMENTE PROIBIDO de fornecer respostas prontas. Se o aluno pedir resposta pronta ou falar de preguiça, acolhe com empatia, desarma com leveza e divide em micropergunta indutiva.',
        )
        p.set(
          'metodo_socratico',
          'Método Socrático 100% invisível na fala: nunca narrar passos. Fases adaptativas (5-8 anos lúdico/TTS, 9-12 copiloto gameficado, 13-16 mentor intelectual). Tag [[ETAPA: ... | MATERIA: ...]] obrigatória ao final.',
        )
        p.set(
          'diretrizes_pedagogicas',
          'Anti-spoiler estrito: dividir em microperguntas. Encerramento amigável de bem-estar digital quando restar <= 2 min. Filtro cinza mediador neutro para adolescentes de 13 a 16 anos.',
        )
        app.save(p)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const mCol = app.findCollectionByNameOrId('missoes_bncc')
      app.delete(mCol)
    } catch (_) {}
    try {
      const dCol = app.findCollectionByNameOrId('daily_metrics')
      app.delete(dCol)
    } catch (_) {}
  },
)
