migrate(
  (app) => {
    const conhecimentoCol = app.findCollectionByNameOrId('conhecimento')

    const entries = [
      {
        childName: 'Anna Souza',
        titulo: 'Material concreto para matemática',
        conteudo:
          'Aprende muito melhor com material concreto, como pedaços de fruta, blocos ou tampinhas ao trabalhar frações e operações. Visualizar a divisão faz os olhos dela brilharem.',
      },
      {
        childName: 'Anna Souza',
        titulo: 'Leitura acompanhada com marcador',
        conteudo:
          'Utilizar uma régua transparente colorida ou o dedo indicador para acompanhar a linha evita que ela troque letras e se sinta sobrecarregada.',
      },
      {
        childName: 'Anna Souza',
        titulo: 'Pausas curtas a cada 20 minutos',
        conteudo:
          'Quando o estudo passa de 25 minutos seguidos, a ansiedade com matemática aumenta. Pausas ativas de 5 minutos restauram totalmente o foco.',
      },
      {
        childName: 'Miguel Alves',
        titulo: 'Mapas mentais coloridos em Ciências',
        conteudo:
          'Adora desenhar esquemas visuais com setas e cores diferentes para entender o ciclo da fotossíntese. Explicar com historinhas em quadrinhos funcionou perfeitamente.',
      },
      {
        childName: 'Miguel Alves',
        titulo: 'Metáforas com tecnologia e games',
        conteudo:
          'Conectar desafios de lógica a fases de jogos faz com que ele se interesse de imediato e tente resolver de forma autônoma.',
      },
      {
        childName: 'Laura Mendes',
        titulo: 'Música e cantigas com as letras do alfabeto',
        conteudo:
          'Reconhece o traçado das letras cantando e traçando em caixas de areia colorida. A abordagem multissensorial acelerou muito a identificação.',
      },
    ]

    for (const item of entries) {
      try {
        const crianca = app.findFirstRecordByData('criancas', 'nome', item.childName)
        // Evita duplicar se já existir
        const existing = app.findRecordsByFilter(
          'conhecimento',
          'crianca = {:crianca} && conteudo = {:conteudo}',
          '',
          1,
          0,
          { crianca: crianca.id, conteudo: item.conteudo },
        )
        if (existing && existing.length > 0) {
          continue
        }

        const record = new Record(conhecimentoCol)
        record.set('crianca', crianca.id)
        record.set('titulo', item.titulo)
        record.set('conteudo', item.conteudo)
        app.save(record)
      } catch (_) {
        // Se a criança não for encontrada nesta réplica, ignora
      }
    }
  },
  (app) => {
    // down: opcional limpeza de dados se necessário
  },
)
