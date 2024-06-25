import { HandlerOptions, Specialist, ToolsDefinition } from '#/Specialists/Specialist'
import { ServiceFactory } from '#/Services/factory'
import { GlossarySpecialist } from '#/Specialists/specialist-interface'


export class Reproduction extends Specialist implements GlossarySpecialist{

  constructor(protected services: ServiceFactory) {
    super()
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
        redirect_action: "You should call 'list_animals_in_heat' to get recommendations."
      })
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
