import { HandlerOptions, Specialist, ToolsDefinition } from '#/Specialists/Specialist'
import { ServiceFactory } from '#/Services/factory'


export class Health extends Specialist {

  constructor(protected services: ServiceFactory) {
    super()
  }

  defineTools = (): ToolsDefinition => ({
    list_animals_in_infirmary: {
      definition: this.buildDefinition({
        description: "List animals who have health issues diagnosed or need attention",
        properties: { page: { type: "number" } }
      }),
      handler: async (options: HandlerOptions) => {
        return await this.services.health().listInfirmary({
          page: options.args.page
        })
      }
    }
  })

}
