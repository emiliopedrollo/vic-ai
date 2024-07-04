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

    if (confirmation === null) {
      return { status: 'missing_preparation', details: 'You need to prepare first and confirm with the user' }
    } else if (confirmation.status === 'rejected') {
      return { status: 'user_canceled', details: 'The user has rejected the confirmation. aborting.' }
    } else if (confirmation.status === 'canceled') {
      return { status: 'expired', details: 'The preparations had been superseded' }
    } else if (confirmation.status === 'pending') {
      return { status: 'pending_confirmation', details: 'The user has not confirmed the preparation yet' }
    }

    let results: any[] = []

    results = [...results, ...(await Promise.all(confirmation?.details.prepare_animal_store?.map(async (details): Promise<any> => {
      if (['earring', 'birth', 'batch_slug'].some(key => details.args[key] === undefined)) {
        return { status: 'error', details: `missing required keys` }
      }
      return this.services.herd().storeAnimal({
        ...details.args,
        earring: details.args.earring,
        birth: details.args.birth,
        batch_slug: details.args.batch_slug
      }).then((data) => ({
        preparation_id: details.preparation_id,
        result: data
      }))
    }) || []))]

    results = [...results, ...(await Promise.all(confirmation?.details.prepare_animal_update?.map(async (details): Promise<any> => {
      if (['slug'].some(key => details.args[key] === undefined)) {
        return { status: 'error', details: `missing required keys` }
      }
      return this.services.herd().updateAnimal({
        ...details.args,
        slug: details.args.slug,
      }).then((data) => ({
        preparation_id: details.preparation_id,
        result: data
      }))
    }) || []))]

    results = [...results, ...(await Promise.all(confirmation?.details.prepare_animals_move?.map(async (details): Promise<any> => {
      if (['animals', 'batch_slug'].some(key => details.args[key] === undefined)) {
        return { status: 'error', details: `missing required keys` }
      }
      return this.services.herd().moveAnimals({
        animals: details.args.animals,
        batch_slug: details.args.batch_slug,
      }).then((data) => ({
        preparation_id: details.preparation_id,
        result: data
      }))
    }) || []))]

    results = [...results, ...(await Promise.all(confirmation?.details.prepare_batch_store?.map(async (details): Promise<any> => {
      if (['name', 'unit_uuid', 'type', 'description'].some(key => details.args[key] === undefined)) {
        return { status: 'error', details: `missing required keys` }
      }
      return this.services.herd().storeBatch({
        ...details.args,
        name: details.args.name,
        unit_uuid: details.args.unit_uuid,
        type: details.args.type,
        description: details.args.description,
      }).then((data) => ({
        preparation_id: details.preparation_id,
        result: data
      }))
    }) || []))]

    results = [...results, ...(await Promise.all(confirmation?.details.prepare_collar_attach?.map(async (details): Promise<any> => {
      if (['animal_slug','collar_code'].some(key => details.args[key] === undefined)) {
        return { status: 'error', details: `missing required keys` }
      }
      return this.services.herd().attachCollar({
        animal: details.args.animal_slug,
        collar: details.args.collar_code,
      }).then((data) => ({
        preparation_id: details.preparation_id,
        result: data
      }))
    }) || []))]

    results = [...results, ...(await Promise.all(confirmation?.details.prepare_collar_detach?.map(async (details): Promise<any> => {
      if (['collar_code'].some(key => details.args[key] === undefined)) {
        return { status: 'error', details: `missing required keys` }
      }
      return this.services.herd().detachCollar({
        collar: details.args.collar_code,
      }).then((data) => ({
        preparation_id: details.preparation_id,
        result: data
      }))
    }) || []))]

    return results

  }


  defineTools = (): ToolsDefinition => ({
    get_farm_data: {
      definition: {
        type: 'function',
        function: {
          description: 'Get data related to the current farm such as name and code',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      handler: async () => {
        return await this.services.farm().info()
      }
    },
    get_farm_units: {
      definition: this.buildDefinition({
        description: "Paginated list the farm units",
        properties: { page: { type: "number" } }
      }),
      handler: async (options: HandlerOptions) => {
        return await this.services.herd().listBatches({
          page: options.args.page
        })
      }
    },
    get_user_data: {
      definition: {
        type: 'function',
        function: {
          description: 'Get data related to the the user such as name',
          parameters: {
            type: 'object',
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
        description: 'Execute all stores and updates prepared. Call after user confirmation'
      }),
      handler: this.execute_preparations
    }
  })


}
