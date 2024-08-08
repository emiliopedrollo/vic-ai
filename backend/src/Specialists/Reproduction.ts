import { HandlerOptions, Specialist, ToolsDefinition } from '#/Specialists/Specialist'
import { ServiceFactory } from '#/Services/factory'
import { GlossarySpecialist } from '#/Specialists/specialist-interface'


export class Reproduction extends Specialist implements GlossarySpecialist{

  constructor(protected services: ServiceFactory) {
    super()
  }

  private prepare_dismiss_animal_heat = async (options: HandlerOptions) => {

    const heat = await this.services.reproduction().showHeatDetails({
      heat: options.args.heat_id
    }) as { data: any }

    return this.createPreparation({
      ...options,
      type: 'prepare_dismiss_animal_heat',
      required_arguments: ['heat_id'],
      extra: {
        animal_earring: heat.data?.earring,
        animal_status: heat.data?.reproduction_status.text,
        timestamp: heat.data?.date,
      }
    })
  }

  private prepare_insemination_store = async (options: HandlerOptions) => {

    const animal = await this.services.herd().showAnimalDetails({
      animal: options.args.animal_slug
    }) as { data: any }

    return this.createPreparation({
      ...options,
      args: {
        ...options.args,
        timestamp: options.args.timestamp || new Date
      },
      type: 'prepare_ia_store',
      required_arguments: ['animal_slug', 'semen_type'],
      extra: {
        animal_earring: animal.data?.earring,
        animal_status: animal.data?.status_text,
      }
    })
  }
  private prepare_embryo_transfer_store = async (options: HandlerOptions) => {

    const animal = await this.services.herd().showAnimalDetails({
      animal: options.args.animal_slug
    }) as { data: any }

    return this.createPreparation({
      ...options,
      args: {
        ...options.args,
        timestamp: options.args.timestamp || new Date
      },
      type: 'prepare_et_store',
      required_arguments: ['animal_slug'],
      extra: {
        animal_earring: animal.data?.earring,
        animal_status: animal.data?.status_text,
      }
    })
  }
  private prepare_natural_breeding_store = async (options: HandlerOptions) => {

    const animal = await this.services.herd().showAnimalDetails({
      animal: options.args.animal_slug
    }) as { data: any }

    return this.createPreparation({
      ...options,
      args: {
        ...options.args,
        timestamp: options.args.timestamp || new Date
      },
      type: 'prepare_natural_breeding_store',
      required_arguments: ['animal_slug'],
      extra: {
        animal_earring: animal.data?.earring,
        animal_status: animal.data?.status_text,
      }
    })
  }

  private prepare_confirm_animal_heat = async (options: HandlerOptions) => {

    const heat = await this.services.reproduction().showHeatDetails({
      heat: options.args.heat_id
    }) as { data: any }

    return this.createPreparation({
      ...options,
      type: 'prepare_confirm_animal_heat',
      required_arguments: ['heat_id'],
      extra: {
        animal_earring: heat.data?.earring,
        animal_status: heat.data?.reproduction_status.text,
        timestamp: heat.data?.date,
      }
    })
  }

  defineTools = (): ToolsDefinition => ({
    list_animals_in_heat: {
      definition: this.buildDefinition({
        description: "List animals currently in heat",
        properties: { page: { type: "number" } }
      }),
      handler: async (options: HandlerOptions) => {
        return this.services.reproduction().listAnimalsInHeat({
          page: options.args.page
        })
      }
    },
    list_service_recommendations: {
      definition: this.buildDefinition(),
      handler: async () => ({
        redirect_action: "You should call 'list_animals_in_heat' to get recommendations. You should **not** recommend expired heats."
      })
    },
    get_heat_details: {
      definition: this.buildDefinition({
        description: "Get details about a specific animal heat",
        properties: {
          heat_id: {
            type: "string",
          }
        },
        required: ['heat_id']
      }),
      handler: async (options: HandlerOptions) => {
        return this.services.reproduction().showHeatDetails({
          heat: options.args.heat_id
        })
      }
    },
    prepare_insemination_store: {
      definition: this.buildDefinition({
        description: 'Prepare an artificial insemination for an animal',
        properties: {
          animal_slug: {
            type: "string",
            description: "The slug of the animal to be inseminated"
          },
          timestamp: {
            type: "string",
            description: "ISO_8601 date and time of the insemination"
          },
          semen_type: {
            type: "string",
            enum: ["sexed","conventional"]
          },
          comment: {
            type: "string",
          }
        },
        required: ["animal_slug", "semen_type"]
      }),
      handler: this.prepare_insemination_store
    },
    prepare_embryo_transfer_store: {
      definition: this.buildDefinition({
        description: 'Prepare an embryo transfer for an animal',
        properties: {
          animal_slug: {
            type: "string",
            description: "The slug of the animal to receive the embryo"
          },
          timestamp: {
            type: "string",
            description: "ISO_8601 date and time of the insemination"
          },
          donor: {
            type: "string",
            description: "The embryo donor"
          },
          embryo_type: {
            type: "string",
            enum: ["fresh","frozen"],
          },
          comment: {
            type: "string",
          }
        },
        required: ["animal_slug"]
      }),
      handler: this.prepare_embryo_transfer_store
    },
    prepare_natural_breeding_store: {
      definition: this.buildDefinition({
        description: 'Prepare an artificial insemination for an animal',
        properties: {
          animal_slug: {
            type: "string",
            description: "The slug of the animal to be inseminated"
          },
          timestamp: {
            type: "string",
            description: "ISO_8601 date and time of the insemination"
          },
          comment: {
            type: "string",
          }
        },
        required: ["animal_slug"]
      }),
      handler: this.prepare_natural_breeding_store
    },
    prepare_dismiss_animal_heat: {
      definition: this.buildDefinition({
        description: "Dismisses (or confirm negatively) an animal heat",
        properties: {
          heat_id: {
            type: "string",
            description: "The id of the head being dismissed"
          }
        },
        required: ["heat_id"]
      }),
      handler: this.prepare_dismiss_animal_heat
    },
    prepare_confirm_animal_heat: {
      definition: this.buildDefinition({
        description: "Confirm animal heat",
        properties: {
          heat_id: {
            type: "string",
            description: "The id of the heat being confirmed"
          },
          comments: {
            type: "string",
            description: "User comments about the heat"
          },
          heat_detection_method: {
            type: "string",
            enum: ["chemical","milk-measure","pedometer","visual","other"],
            description: "The method used to confirm the heat"
          },
          heat_intensity: {
            type: "string",
            enum: ["very-weak","weak","normal","strong","very-strong"]
          },
          heat_signs: {
            type: "array",
            items: {
              type: "string",
              enum: ["bawling","blood","clear-slime","interested-in-other-animals","slime","stands-under"]
            }
          }
        },
        required: ["heat_id"]
      }),
      handler: this.prepare_confirm_animal_heat
    }
  })

  // getFrequentlyAskedQuestions = () => {
  //   return [
  //     {
  //       question: "",
  //       answer: ""
  //     }
  //   ]
  // }
  getGlossaryDescription = () =>
    "Show definitions for terms like DTR, PPI and heat_strength."
  getGlossary = () => {
    return {
      "dtr": "Termo que significa desafio térmico para reprodução, também pode aparecer como TCR (thermal challenge for reproduction). Pode ser 'normal', 'moderado' ou 'intenso'.",
      "ppi": "Indicie de pós parto, do ingês 'post partum index'. Indicador Cowmed para recuperação do animal após parto. Pode ser 'normal' ou 'desafiada'.",
      "heat_strength": "Força do comportamento de cio identificado pela coleira Cowmed. Varia de 1 até 5, sendo 1 muito fraco e 5 muito forte."
    }
  }
  // getOverview = (): string => {
  //   return ''
  // }
  // getSoftwareTutorials = (): string => {
  //   return ''
  // }

}
