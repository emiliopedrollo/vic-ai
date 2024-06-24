import { HandlerOptions, Specialist, ToolsDefinition } from '#/Specialists/Specialist'
import { ServiceFactory } from '#/Services/factory'


export class General extends Specialist {

  constructor(protected services: ServiceFactory) {
    super()
  }

  private execute_preparations = async (options: HandlerOptions) => {
    console.log(options.context.input_metadata)
    let confirmation = options.context.input_metadata?.confirm
      ? await options.context.getConfirmationEntry(options.context.input_metadata.confirm)
      : null

    return (
      confirmation && confirmation.status === "confirmed"
        ? { status: "Ok" }
        : { status: "missing_preparation", details: "You need to prepare first and confirm with the user" }
    )
  }


  defineTools = (): ToolsDefinition => ({
    get_farm_data: {
      definition: {
        type: "function",
        function: {
          description: "Get data related to the current farm such as name and code",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      handler: async () => {
        return await this.services.farm().info()
      }
    },
    get_user_data: {
      definition: {
        type: "function",
        function: {
          description: "Get data related to the the user such as name",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      handler: async () => {
        return await this.services.user().info()
      }
    },
    execute_preparations: {
      definition: this.buildDefinition({
        description: "Execute all stores and updates prepared. Call after user confirmation",
      }),
      handler: this.execute_preparations
    }
  })



}
