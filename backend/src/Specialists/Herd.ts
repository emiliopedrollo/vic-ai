import { HandlerOptions, Specialist, ToolsDefinition } from '#/Specialists/Specialist'
import { ServiceFactory } from '#/Services/factory'
import { InstructorSpecialist } from '#/Specialists/specialist-interface'
export class Herd extends Specialist implements InstructorSpecialist{

  constructor(protected services: ServiceFactory) {
    super()
  }

  protected breeds: Record<string, string> = {
    'aberdeen-angus': 'Aberdeen Angus',
    'braford': 'Braford',
    'brahman': 'Brahman',
    'brangus': 'Brangus',
    'brown-swiss': 'Pardo-Suiço',
    'charolais': 'Charolês',
    'devon': 'Devon',
    'girolando': 'Girolando',
    'guzera-leiteiro': 'Guzerá Leiteiro',
    'gyr': 'Gir Leiteiro',
    'hereford': 'Hereford',
    'holstein': 'Holandesa',
    'inra-95': 'Inra 95',
    'jerseys': 'Jersey',
    'jersolando': 'Jersolando',
    'kiwicross': 'Kiwicross',
    'montbeliarde': 'Montbéliard',
    'nelore': 'Nelore',
    'red-angus': 'Red Angus',
    'senepol': 'Senepol',
    'simmental': 'Simental',
    'sindi': 'Sindi',
    'speckle-park': 'Speckle Park',
    'swedish-red-and-white': 'Sueca Vermelha',
    'wagyu': 'Wagyu',
  }

  private prepare_animal_update = async (options: HandlerOptions) => {
    return this.createPreparation({
      ...options,
      type: 'prepare_animal_update',
      required_arguments: ['slug'],
      args: {
        ...options.args,
        breed: Object.keys(this.breeds).find((k) => this.breeds[k] === options.args.breed)
      },
      extra:{
        breed: options.args.breed
      },
    })

  }
  private prepare_animal_store = async (options: HandlerOptions) => {

    const batches = (await this.services.herd().listBatches({
      per_page: 99999
    }))?.data || []


    if (! batches.map((batch:any) => batch.slug).includes(options.args.batch_slug)) {
      return {
        status: "Error",
        details: "The provided batch does not exists or isn't active",
        valid_options: batches.map( (batch:any) => ({ name: batch.name, slug: batch.slug }))
      }
    }

    return this.createPreparation({
      ...options,
      type: 'prepare_animal_store',
      required_arguments: ['earring','birth','batch_slug'],
      args: {
        ...options.args,
        breed: Object.keys(this.breeds).find((k) => this.breeds[k] === options.args.breed),
      },
      extra:{
        breed: options.args.breed,
        batch: batches.find((batch:any) => batch.slug === options.args.batch_slug).name,
      },
    })
  }

  private prepare_animals_move = async (options: HandlerOptions) => {

    const batches = (await this.services.herd().listBatches({
      per_page: 99999
    }))?.data || []

    if (! batches.map((batch:any) => batch.slug).includes(options.args.batch_slug)) {
      return {
        status: "Error",
        details: "The provided batch does not exists or isn't active",
        valid_options: batches.map( (batch:any) => ({ name: batch.name, slug: batch.slug }))
      }
    }

    return this.createPreparation({
      ...options,
      type: 'prepare_animals_move',
      required_arguments: ['animals', 'batch_slug'],
      extra: {
        batch: batches.find((batch:any) => batch.slug === options.args.batch_slug).name,
      }
    })

  }

  private prepare_batch_store = async (options: HandlerOptions) => {

    const units = (await this.services.herd().listUnits({
      per_page: 99999
    }))?.data || []

    if (! units.map((unit:any) => unit.uuid).includes(options.args.unit_uuid)) {
      return {
        status: "Error",
        details: "The provided unit does not exists or isn't active",
        valid_options: units.map( (unit:any) => ({ name: unit.name, uuid: unit.uuid }))
      }
    }

    return this.createPreparation({
      ...options,
      type: 'prepare_batch_store',
      required_arguments: ['name', 'unit_uuid', 'type', 'description'],
      extra: {
        unit: units.find((unit:any) => unit.uuid === options.args.unit_uuid).name
      }
    })
  }
  private prepare_collar_attach = async (options: HandlerOptions) => {
    return this.createPreparation({
      ...options,
      type: 'prepare_collar_attach',
      required_arguments: ['collar_code', 'animal_slug']
    })
  }
  private prepare_collar_detach = async (options: HandlerOptions) => {
    return this.createPreparation({
      ...options,
      type: 'prepare_collar_detach',
      required_arguments: ['collar_code']
    })
  }

  defineTools = (): ToolsDefinition => ({
    list_batches: {
      definition: this.buildDefinition({
        description: "Paginated list the batches available within the farm",
        properties: { page: { type: "number" } }
      }),
      handler: async (options: HandlerOptions) => {
        return await this.services.herd().listBatches({
          page: options.args.page
        })
      }
    },
    prepare_batch_store: {
      definition: this.buildDefinition({
        description: "Create batch within the farm",
        properties:{
          name: {
            type: "string",
            description: "The name of the batch"
          },
          unit_uuid: {
            type: "string",
            description: "An existing Farm's unit uuid associated with the batch. Fetch farm"
          },
          type: {
            type: "string",
            enum: ["bull", "calf", "heifer", "lactation", "dry", "pre-calving"],
            description: "The purpose and/or type of animals of the batch"
          },
          description: {
            type: "string",
            description: "The description of the batch"
          },
          minimum_production: {
            type: "number",
            description: "For lactation batches only. The minimum production acceptable for animals at this batch"
          },
          maximum_production: {
            type: "number",
            description: "For lactation batches only. The maximum production acceptable for animals at this batch"
          },
          milking_per_day: {
            type: "number",
            description: "For lactation batches only. The number of milking per day for this batch. Between 1 and 4, inclusive"
          }
        },
        required: ["name", "unit_uuid", "type", "description"]
      }),
      handler: this.prepare_batch_store
    },
    prepare_animals_move: {
      definition: this.buildDefinition({
        description: "Move one or more animal to a desired batch",
        properties: {
          animals: {
            type: "array",
            items: {
              type: "string"
            },
            description: "An array of animal slugs"
          },
          batch_slug: {
            type: "string",
            description: "The destination batch"
          }
        },
        required: ['animals', 'batch_slug']
      }),
      handler: this.prepare_animals_move
    },
    list_animals: {
      definition: this.buildDefinition({
        description: "Paginated list the animals available within the farm",
        properties: {
          page: { type: "number" },
          name_filter: {
            type: "string",
            description: "Filter results by animal name"
          },
          earring_filter: {
            type: "string",
            description: "Filter results by animal earring"
          },
          production_status: {
            type: "string",
            enum: ["lactating", "dry", "no-status"],
            description: "Filter results by production status"
          },
          reproduction_status: {
            type: "string",
            enum: [
              "calf", "calf-new-born", "empty", "empty-port-delivery", "heifer", "inseminated",
              "late-inseminated", "male", "pregnant", "prostaglandin", "pregnant-pre-delivery",
              "waiting-artificial-insemination", "waiting-embryo-transfer",
              "ia-hormone-implemented", "et-hormone-implemented"
            ],
            description: "Filter results by reproduction status"
          },
          batch_slug: {
            type: "string",
            description: "Filter results by animal current batch"
          }
        }
      }),
      handler: async (options: HandlerOptions) => {
        return await this.services.herd().listAnimals({
          page: options.args.page,
          per_page: 200,
          filter: options.args.earring_filter || options.args.name_filter,
          reproduction_status: options.args.reproduction_status,
          production_status: options.args.production_status,
          batch_slug: options.args.batch_slug,
        })
      }
    },
    prepare_animal_update: {
      definition: this.buildDefinition({
        description: "prepare a request fot updating an existing animal withing the farm",
        properties: {
          slug: {
            type: "string",
            description: "Tha lus is the immutable identifier for the animal. This value cannot be changed and is used only to identify the animal"
          },
          earring: {
            type: "string",
            description: "The new earring of the animal",
          },
          name: {
            type: "string",
            description: "The new name of the animal"
          },
          breed: {
            type: "string",
            enum: Object.values(this.breeds),
            description: "The new breed of the animal",
          },
          birth: {
            type: "string",
            description: "An ISO_8601 date with optional time for when the animal was born"
          },
          birth_weight: {
            type: "number",
            description: "The weight, in Kilograms, measured soon after animal birth"
          },
          born_at_farm: {
            type: "boolean",
            description: "Either or not the animal was born in the farm"
          },
        },
        required: ['slug']
      }),
      handler: this.prepare_animal_update
    },
    prepare_animal_store: {
      definition: this.buildDefinition({
        description: "Prepare a request for storing an animal within the farm",
        properties: {
          earring: {
            type: "string",
            description: "A unique identifier for the animal within the farm in form of a management tag, usually a earring"
          },
          name: {
            type: "string"
          },
          batch_slug: {
            type: "string",
            description: "The slug for the physical group, set our batch where the animal is. This is **not** the farm slug"
          },
          is_female: {
            type: "boolean",
            description: "Either or not the animal is a female. The default value is `true`"
          },
          breed: {
            type: "string",
            enum: Object.values(this.breeds),
            description: "The breed of the animal",
          },
          birth: {
            type: "string",
            description: "An ISO_8601 date with optional time for when the animal was born"
          },
          birth_weight: {
            type: "number",
            description: "The weight, in Kilograms, measured soon after animal birth"
          },
          born_at_farm: {
            type: "boolean",
            description: "Either or not the animal was born in the farm"
          },
          collar: {
            type: "string",
            description: "The numeric serial or code of the Cowmed's collar currently attached to the animal"
          },
          last_delivery: {
            type: "string",
            description: "An ISO_8601 date with the last time the animal had a delivery or parturition"
          },
          last_service: {
            type: "string",
            description: "An ISO_8601 date with the last time the animal was serviced (Artificially Inseminated, Embryo Transfer or Natural Breeding)"
          },
          last_service_method: {
            type: "string",
            enum: ['insemination', 'embryo_transfer', 'natural_breeding'],
            description: "The type of the last service",
          },
          pregnant: {
            type: "boolean",
            description: "Either or not the animal is currently pregnant"
          }
        },
        required: ["earring", "birth", "batch_slug"]
      }),
      handler: this.prepare_animal_store
    },
    list_collars: {
      definition: this.buildDefinition({
        description: "List all collars in the farm",
        properties: { page: { type: "number" } }
      }),
      handler: async (options: HandlerOptions) => {
        return await this.services.herd().listCollars({
          page: options.args.page
        })
      }
    },
    prepare_to_detach_collar: {
      definition: this.buildDefinition({
        description: "Prepare to detach a collar from an animal",
        properties: {
          collar_code: {
            type: "string",
            description: "The code/serial of the collar to be detached",
          }
        },
        required: ['collar_code']
      }),
      handler: this.prepare_collar_detach
    },
    prepare_to_attach_collar_to_animal: {
      definition: this.buildDefinition({
        description: "Prepare to attach a collar to an animal",
        properties:{
          collar_code: {
            type: "string",
            description: "The code/serial of the collar to be attached",
          },
          animal_slug: {
            type: "string",
            description: "The slug of the animal to receive the collar"
          }
        },
        required: ['collar_code', 'animal_slug']
      }),
      handler: this.prepare_collar_attach
    }
  })

  getFrequentlyAskedQuestionsDescriptions = () =>
    "Respond to usual questions such as limit of animals, retroactive data, restriction, etc.."

  getFrequentlyAskedQuestions = () => {
    return {
      lotes: [
        {
          question: "Um animal pode estar em dois lotes ao mesmo tempo?",
          answer: "Não, no conceito do software da CowMed, um animal só pode pertencer a um único lote."
        },{
          question: "Posso registrar movimentações retroativas?",
          answer: "Pode. Na hora de movimentar, basta informar a data da movimentação. Selecione a data em que a movimentação ocorreu. Os dados de monitoramento já processados até a data atual, não poderão ser reprocessados de forma retroativa para o novo lote, somente os dados que forem recebidos a partir da realização da troca."
        },{
          question: "Existe limite de animais nos lotes?",
          answer: "Não. O software CowMed não limita o número de animais por lote."
        },
      ],
      animais: [
        {
          question: "Qual a diferença entre o Cadastro de Animais e Registro de Nascimento?",
          answer: "Ambas as ferramentas criam/registram animais na fazenda. O Registro de nascimento é recomendado para aquele animal que acaba de nascer na fazenda, onde é possível informar uma série de detalhes sobre os primeiros momentos de vida da bezerra. Já o cadastro é recomendado para animais jovens e adultos."
        },{
          question: "Quantos animais consigo cadastrar na importação de cadastro de animais?",
          answer: "Até 5000 animais, porém recomendamos sempre que possível separar em frações menores, assim o software CowMed irá performar melhor."
        },{
          question: "Quantos animais posso registrar na minha conta?",
          answer: "A CowMed não limita o número de animais, o usuário pode cadastrar quantos animais quiser."
        },{
          question: "Como registro animais voltados para o corte (gado de corte)?",
          answer: "O software CowMed foi todo projetado para atender fazendas de leite e produção de leite, logo, todos os recursos foram projetados para atender esta finalidade. Recomendamos a adoção de um software apropriado para a gestão de gado de corte."
        },{
          question: "Posso informar o número de brinco com letras?",
          answer: "Sim, o software CowMed permite a identificação do brinco com letras e números, porém isso pode interferir na ordenação das listas de animais. Outro ponto importante, quando utilizar integrações com outros softwares fique atento, pois a maioria dos softwares não são compatíveis com numeração utilizando letras e números, o que irá gerar uma necessidade de adaptação nos cadastros para integrar."
        },{
          question: "Posso registrar mais do que um animal com o mesmo Brinco?",
          answer: "Não. A única forma de cadastrar é nos casos em que um dos animais já se encontra descartado."
        },{
          question: "Posso vincular a coleira Cowmed no momento do cadastro do animal?",
          answer: "Sim, basta informar no campo 'coleira' o ID da coleira de monitoramento CowMed que será colocada no animal."
        },
      ],
      descarte:[
        {
          question: "Como faço para descartar vários animais ao mesmo tempo?",
          answer: "A única forma de registrar vários descartes simultaneamente é através da importação de descartes.",
        },{
          question: "Descartei de forma errada um animal, posso desfazer essa operação?",
          answer: "Sim, no caso de descartes do tipo descarte ou saída é possível desfazer o descarte. Acesse a lista de animais, marque o filtro \"mostrar descartados\", encontre o animal desejado, no botão de ação selecione a opção \"desfazer descarte\". Esta ação não poderá ser realizada em animais descartados por registro incorreto.",
        },
      ]
    }
  }

  getGlossaryDescription = () => "Returns the definition of terms like collar, earring, service, del, dea, and others."
  getGlossary = () => {
    // noinspection JSNonASCIINames
    return {
      "collar": "A coleira da Cowmed é como o sistema coleta dados dos animais. Um animal só pode ter uma coleira por vez e uma coleira só pode estar associada a um animal por vez.",
      "earring": "Este é o brinco do animal. Deve ser um identificador único entre todos os animais ativos na fazenda. É um valor alfanumérico",
      "serviço": "Termo utilizado para denominar serviço de inseminação artificial, transferência embrionária ou monta natural no animal.",
      "del": "Dias em lactação. Também pode aparecer como DIM (days in milking). Esta é a contagem de dias desde a última vez que o animal teve um parto ou uma indução de lactação.",
      "dea": "Dias em aberto. Também pode aparecer como days_open. Esta é uma contagem de dias desde o último parto do animal ou indução de lactação até o último serviço realizado. Se nenhum serviço foi realizado desde o último parto ou indução de lactação então conta-se os dias até o presente ou até o momento de descarte do animal",
      "descarte": "Este é o ato de descartar o animal. Geralmente implica abate mas nem sempre é o caso",
    }
  }

  getOverviewDescription = () =>
    "Return an overview of batches, animals and discards and types of discards on cowmed software."
  getOverview = () => {
    return {
      lotes: [
        "Em uma fazenda de leite, os animais são organizados em lotes, que são grupos de vacas agrupadas com base em características específicas, como idade, estágio de lactação, produção de leite e condições de saúde. Essa organização permite um manejo mais eficiente, facilitando a alimentação adequada, controle de saúde, monitoramento de produção e aplicação de tratamentos específicos. Além disso, os lotes ajudam a otimizar a utilização dos recursos da fazenda e a melhorar a produtividade, pois é possível direcionar estratégias de manejo e nutrição específicas para cada grupo, maximizando a eficiência e o bem-estar dos animais.",
        "Além disso, o conceito de lotes é utilizado para agrupar informações de análises de nutrição, consumo, conforto e bem-estar, geradas pelas coleiras de monitoramento CowMed.",
        "Para nós da CowMed diferente de outros softwares que organizam os animais em grupos, um animal só pode permanecer a um único lote. Não dispomos do conceito de animais \"sem lote\" disponível na interface do sistema, este recurso só está disponível para manipulação de animais na API de parceiros.",
        "No cadastro de lote o usuário irá nomear o lote de forma que este seja único dentro da fazenda. No atributo do lote é possível informar ao que se destina esse lote, se se trata de um lote de lactação, de bezerras, de vacas secas, etc. De acordo com o atributo, outras informações poderão ser solicitadas para completar a caracterização do lote. Em lotes de lactação é importante informar o número de ordenhas, pois em diversos recursos do software CowMed essa informação é requerida. Ainda é possível detalhar ainda mais, na descrição do lote, um campo livre para que o usuário complete com informações que desejar.",
        "Os lotes podem ser removidos sempre que desejar, desde que nenhum animal esteja nele. Não se pode excluir lotes que tenham ao menos um animal. Não existe restrição de número de animais nos lotes, cada fazenda pode incluir quantos animais desejar.",
      ].join('\n'),
      animais: [
        "Nos animais você encontra a lista completa de animais da fazenda, todos os cadastrados pelos usuários do software CowMed. É através deste cadastro que sabemos que um determinado animal existe de fato na fazenda.",
        "Na lista é possível aplicar filtros por lote, status de reprodução, status produtivo, estágio de reprodução. A lista oferece ainda uma série de informações básicas sobre os animais: Brinco, Nome do animal, Lote, Status de reprodução, Status de lactação, DEL (dias em lactação), DEA (Dias em aberto), Idade do animal, data do último parto e data da última inseminação.",
        "Ao clicar em qualquer animal da lista, é possível acessar todos os detalhes relacionados ao comportamento e vida destes animais na fazenda: histórico de dados de comportamento de monitoramento, histórico de eventos de saúde, reprodução, produção, e muitos outros detalhes sobre cada animal.",
        "Marcando a opção \"Mostrar descartados\" é possível ainda incluir nesta lista todos os animais que foram descartados na fazenda (mortes, perdas, etc), sendo possível acessá-los para consultar o seu histórico.",
        "Neste ambiente também é possível cadastrar novos animais e fazer a gestão individual dos animais da fazenda.",
        "O cadastro pode ser feito de 3 formas distintas: cadastro de animais, registrar nascimento e importação de animais.",
        "O **cadastro de animais** é indicado para o registro de animais de forma mais completa e individualizada. Nesta funcionalidade você só irá cadastrar um animal por vez. Este formulário permite um registro completo e detalhado de um animal, informando sua identificação, seus aspectos genéticos e informações relacionadas a sua vida reprodutiva. Este registro é recomendado para registrar animais que já estão na fazenda a um certo tempo, ou animais que foram adquiridos pela fazenda.",
        "A **importação de animais**, possui uma estrutura similar ao cadastro de animais, porém se trata de uma importação em massa. Recomenda-se para aquelas fazendas que estão dando início ao uso do software CowMed, ou migrando a operação da fazenda de outro software para a CowMed. Com ele o usuário pode registrar até 5000 animais de forma simultânea utilizando uma planilha modelo em excel.",
        "O **registro de nascimento** possui um objetivo distinto dos demais. É recomendado para cadastrar animais que nasceram na fazenda. Além de informações básicas para identificação do animal na fazenda é possível registrar informações sobre os primeiros momentos de vida da bezerra como: cura do umbigo, características da colostragem e transferência de imunidade passiva.",
  ].join('\n'),
      descarte: [
        "O descarte de animais em uma fazenda de leite refere-se ao processo de remover vacas do rebanho produtivo, geralmente devido a fatores que comprometem sua eficiência ou saúde. Esses fatores incluem baixa produção de leite, problemas reprodutivos, doenças crônicas, idade avançada, ou condições de saúde que não respondem a tratamentos. Os animais descartados são normalmente classificados em duas categorias: descarte voluntário e descarte involuntário. O descarte voluntário ocorre quando a decisão é baseada em critérios econômicos ou de eficiência produtiva, enquanto o descarte involuntário é motivado por problemas de saúde ou emergência que exigem a remoção imediata do animal do rebanho. O objetivo é manter um rebanho saudável e produtivo, garantindo a sustentabilidade da operação leiteira.",
        "No software CowMed não realizamos esta classificação (voluntário e involuntário), haja visto que existem critérios discutíveis. Por vezes o que é voluntário para uma fazenda não é para outra, e por isso não utilizamos essa caracterização. De qualquer forma a fazenda pode classificar de acordo com o motivo do descarte: se foi por problema de saúde, problemas relacionados à produção, adaptação de dietas, entre outros tantos possíveis motivos de descarte.",
        "No software CowMed temos 3 tipos de descarte, que podem ser informados:",
        "- Descarte, onde o usuário informará uma morte seja por causas voluntárias e involuntárias, informará o motivo e o método de descarte deste animal.",
        "- Saídas, onde o usuário informa que este animal não pertence mais ao rebanho por alguma oportunidade comercial ou saída temporária de um animal da fazenda.",
        "- Registro incorreto, onde o usuário remove animais da base que foram registrados de forma incorreta. Os animais removidos por este método não são contabilizados nas estatísticas de descarte.",
        "Uma vez que os animais são descartados, eles são removidos da lista de animais e podem ser consultados a qualquer momento utilizando o filtro \"mostrar descartados\" que aparece na lista de animais da fazenda.",
        "Os registros de descarte são feitos individualmente através do software e do aplicativo CowMed. Porém se preferir o usuário também pode utilizar o recurso da importação, onde ele preenche em uma planilha modelo de excel todas as informações e estas podem ser processadas todas de uma única vez.",
      ].join('\n')
    }
  }

  getSoftwareTutorialsDescription = () =>
    "Show instruction on how to make changes on batches, animals and how to discard animals on cowmed software."

  getSoftwareTutorials = () => {
    // noinspection JSNonASCIINames
    return {
      lote: {
        "Cadastro e edição de lote":
          '- Acesse o botão "cadastrar" e selecione a opção "cadastrar lote".\n' +
          '- Ao abrir o modal, preencha com todas as informações obrigatórias. Quanto mais dados você fornecer melhor será a capacidade de análise da CowMed.\n' +
          '- Ao final clique em "registrar" para salvar as informações.\n' +
          '- Para editar o lote, basta acessar a lista de lotes cadastrados, selecionar a opção "editar" nos botões de ação do lote que se deseja editar. Ao final clicar em "registrar" para salvar as alterações.\n' +
          '- Para remover, basta acessar a lista de lotes cadastrados, selecionar a opção "remover" para excluir o lote. Ao confirmar o lote será removido. Caso exista algum animal no lote, é preciso remover os animais deste lote antes de excluir.',
        "Troca de Lote, arrasta e solta":
          '- Acesse o menu Rebanho e selecione a opção "troca de lote". Neste ambiente, seguindo um modelo kanban é possível movimentar os animais entre os diferentes lotes utilizando o arrasta e solta.\n' +
          '- Clique sobre o animal que deseja movimentar, e arraste até o lote desejado. Confirme ao final do processo para salvar a movimentação.\n' +
          '- Para movimentar mais que um animal simultaneamente, basta utilizar as teclas CTRL ou SHIFT para selecionar mais do que um animal simultaneamente. No botão "opções" no canto superior direito, selecione troca de lote, informe mais detalhes e o lote de destino e clique em "registrar" para salvar a movimentação de todos animais selecionados.\n' +
          '- No ambiente de troca de lote, ainda é possível descartar animais clicando no "x" que aparece junto ao chip de cada brinco de animal, e também criar lotes utilizando o botão de opções.',
        "Opção de troca de lote na lista de animais":
          '- Acesse a lista de animais.\n' +
          '- Buscar na lista o animal que deseja trocar de lote, e selecionar a ação "troca de lote".\n' +
          '- Informe a data da movimentação e o lote de destino do animal.\n' +
          '- Clique em "registrar" para salvar as alterações.',
      },
      animais: {
        "Cadastro de animal":
          '- Acesse o módulo rebanho, e a opção animais. Clique no botão "Cadastrar" no canto superior direito, e selecione a opção "Cadastrar animal". No software e app esta opção está disponível no registro rápido, disponível na tela inicial do aplicativo.\n' +
          '- No formulário preencha com todas as informações do animal. As informações marcadas com um asterisco, precisam ser obrigatoriamente preenchidas.\n' +
          '- Após preencher todas as informações clique em "registrar" para criar o animal na fazenda.',
        "Importar animais":
          '- Acesse o módulo rebanho, e a opção animais. Clique no botão "Cadastrar" no canto superior direito, e selecione a opção "Importar animais". Este recurso está disponível apenas na aplicação web.\n' +
          '- Ao abrir o modal na sua tela, baixe a planilha modelo, clicando no link que aparece e preencha seguindo as orientações dos balões de ajuda (todo das colunas do excel). Ao copiar de outras bases de dados, cole com a opção "sem formatação".\n' +
          '- Após preenchida a planilha, certifique-se de que as informações obrigatórias foram preenchidas e clique em importar. O processo de importação roda em segundo plano, você pode continuar a utilizar o software enquanto os dados são processados (pode levar alguns minutos).\n' +
          '- Ao final você pode acessar o menu ferramentas / importar dados, e acompanhar o andamento, e visualizar o relatório final da importação. Este relatório indica com detalhes o que foi registrado e as informações que eventualmente não puderam ser processadas.',
        "Registro de Nascimento":
          '- Acesse o módulo "rebanho" e clique no botão "Cadastrar" no canto superior direito, e selecione a opção "Registrar nascimento". No software e app esta opção está disponível no registro rápido, disponível na tela inicial do aplicativo.\n' +
          '- No formulário preencha com todas as informações do animal. As informações marcadas com um asterisco, precisam ser obrigatoriamente preenchidas. Na sessão "colostragem" você pode registrar até 4 procedimentos de colostragem.\n' +
          '- Após preencher todas as informações clique em "registrar" para criar o animal na fazenda.',
      },
      descartes: {
        "Registro de descarte na lista de animais":
          '- Na tela Rebanho / Animais procure o animal desejado.\n' +
          '- No botão de ação, selecione a opção "descarte/saída".\n' +
          '- No modal informe todos os detalhes do descarte como o tipo de descarte, motivo, método e comentários desejados.\n' +
          '- Ao clicar em "descartar" o mesmo será excluído da lista de animais do plantel.',
        "Registro de descarte na troca de lote":
          '- Na tela Rebanho / Troca de lote localize o brinco do animal que deseja descartar.\n' +
          '- Clique sobre o "x" que aparece ao passar o mouse sobre o chip.\n' +
          '- No modal informe todos os detalhes do descarte como o tipo de descarte, motivo, método e comentários desejados.\n' +
          '- Ao clicar em "descartar" o mesmo será excluído da lista de animais do plantel.',
        "Importação de descarte de animais":
          '- Acesse o menu Ferramentas, e selecione a opção "Importar dados".\n' +
          '- Clique no botão "importar" e selecione a opção "Descartes"\n' +
          '- Baixe a planilha modelo sugerida no modal, e preencha com as informações dos animais que serão descartados, informando o tipo de descarte.\n' +
          '- Selecione o arquivo da planilha preenchida conforme as orientações, e clique em Importar.\n' +
          '- O processo é assíncrono, ou seja, não é instantâneo, pode levar alguns minutos. Acompanhe o status da importação na lista de importações.',
      }
    }
  }



}
