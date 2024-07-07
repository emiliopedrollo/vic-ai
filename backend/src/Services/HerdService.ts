import { request } from '#/endpoints'
import { getInseminationMethod, getRequestFormatedDate } from '#/utils'


export class HerdService {

  private token: string
  private farm: string

  constructor(options: {
    token: string,
    farm: string
  }) {
    this.token = options.token
    this.farm = options.farm
  }


  listBatches = async (options: {
    page?: number
    per_page?: number
  }) => {
    return request({
      endpoint: 'list-batches',
      params: { farm: this.farm },
      query: {
        per_page: options.per_page || 10,
        page: options.page || 1
      },
      auth: this.token
    }).then(res => ({
      meta: {
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
        total_batches: res.data.meta.total
      },
      data: res.data.data
        // .filter((batch:any) => batch.type !== 'no-batch')
        .map((batch: any) => ({
            name: batch.name,
            slug: batch.slug,
            type: batch.type,
            description: batch.desription,
            animals_count: batch.animals_count,
            max_milk_production_liters: batch.prod_max,
            min_milk_production_liters: batch.prod_min
          })
        )
    }))
  }


  storeBatch = async (options: {
    name: string,
    type: string,
    unit_uuid: string,
    description: string,
    minimum_production?: number,
    maximum_production?: number,
    milking_per_day?: number,
  }) => {
    return request({
      endpoint: 'store-batch',
      method: 'post',
      params: { farm: this.farm },
      auth: this.token,
      body: {
        name: options.name,
        type: options.type,
        unit: options.unit_uuid,
        description: options.description,
        prod_min: options.minimum_production,
        prod_max: options.maximum_production,
        milkings_day: options.milking_per_day,
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  listUnits = async (options: {
    page?: number
    per_page?: number
  }) => {
    return request({
      endpoint: 'list-units',
      params: { farm: this.farm },
      query: {
        per_page: options.per_page || 10,
        page: options.page || 1
      },
      auth: this.token
    }).then(res => ({
      meta: {
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
        total_batches: res.data.meta.total
      },
      data: res.data.data
        // .filter((batch:any) => batch.type !== 'no-batch')
        .map((unit: any) => ({
            uuid: unit.id,
            code: unit.code,
            name: unit.name,
            slug: unit.slug,
            description: unit.description,
            collars_count: unit.collars_count,
            cowmed_antennae_count: unit.c_coms_count,
            active: unit.active,
          })
        )
    }))
  }

  moveAnimals = async (options: {
    animals: string[],
    batch_slug: string,
  }) => {
    return request({
      endpoint: 'move-animals',
      method: 'put',
      params: { farm: this.farm },
      auth: this.token,
      body: {
        batch_slug: options.batch_slug,
        animals: options.animals
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })

  }
  showAnimalDetails = async (options: {
    animal: string
  }) => {
    return request({
      endpoint: 'show-animal',
      method: 'get',
      params: { farm: this.farm, animal: options.animal },
      auth: this.token
    }).then(res => ({
      data: res.data.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  listAnimals = async (options: {
    filter?: string,
    production_status?: string,
    reproduction_status?: string,
    batch_slug?: string
    page?: number
    per_page?: number
  }) => {

    const filters = []

    if (options.production_status) {
      filters.push({
        name: 'production-status',
        value: options.production_status
      })
    }

    if (options.batch_slug) {
      filters.push({
        name: 'batch',
        value: options.batch_slug
      })
    }
    if (options.reproduction_status) {
      filters.push({
        name: 'status',
        value: options.reproduction_status
      })
    }

    return request({
      endpoint: 'list-animals',
      params: { farm: this.farm },
      query: {
        search: options.filter,
        per_page: options.per_page || 10,
        page: options.page || 1,
        filters
      },
      auth: this.token
    }).then(res => ({
        meta: {
          current_page: res.data.meta.current_page,
          last_page: res.data.meta.last_page,
          total_filtered_animals: res.data.meta.total
        },
        data: res.data.data
          // .filter((batch:any) => batch.type !== 'no-batch')
          .map((animal: any) => ({
              animal: {
                name: animal.name,
                slug: animal.slug,
                earring: animal.earring,
                status: animal.status,
                days_open: animal.days_open,
                dim: animal.dim,
                age: animal.age,
                last_delivery: animal.last_delivery,
                last_service: animal.last_insemination,
                is_female: animal.is_female,
                production_status: animal.production_status.text,
              },
              collar: {
                code: animal['collar.code'],
                status: animal['collar.status'],
              },
              batch: {
                name: animal['batch.name'],
                slug: animal['batch.slug']
              },
            })
          )
      }
    ))

  }

  updateAnimal = async (options: {
    slug: string,
    earring?: string,
    name?: string
    breed?: string,
    birth?: Date | string,
    birth_weight?: number,
    born_at_farm?: boolean,
  }) => {
    return request({
      endpoint: 'update-animal',
      method: 'put',
      params: { farm: this.farm, animal: options.slug },
      auth: this.token,
      body: {
        birth: getRequestFormatedDate(options.birth),
        birth_weight: options.birth_weight,
        breeds: [{ breed_slug: options.breed }],
        born_at_farm: options.born_at_farm,
        earring: options.earring,
        name: options.name
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }


  storeAnimal = async (options: {
    earring: string,
    name?: string,
    is_female?: boolean
    batch_slug: string,
    breed?: string,
    birth: Date | string,
    birth_weight?: number,
    born_at_farm?: boolean,
    collar?: string,
    last_delivery?: Date | string,
    last_service?: Date | string,
    last_service_method?: string,
    pregnant?: boolean,
  }) => {

    return request({
      endpoint: 'store-animal',
      method: 'post',
      params: { farm: this.farm },
      auth: this.token,
      body: {
        batch_slug: options.batch_slug,
        birth: getRequestFormatedDate(options.birth),
        birth_weight: options.birth_weight,
        breeds: [{ breed_slug: options.breed }],
        born_at_farm: options.born_at_farm,
        collar_code: options.collar,
        earring: options.earring,
        is_female: options.is_female,
        last_delivery: options.last_delivery,
        last_insemination: getRequestFormatedDate(options.last_service),
        last_insemination_method: getInseminationMethod(options.last_service_method),
        name: options.name,
        pregnant: options.pregnant !== undefined ? options.pregnant : false
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  listCollars = async (options: {
    page?: number
    per_page?: number
  }) => {
    return request({
      endpoint: 'list-collars',
      params: { farm: this.farm },
      query: {
        per_page: options.per_page || 10,
        page: options.page || 1
      },
      auth: this.token
    }).then(res => ({
      meta: {
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
        total_collars_at_farm: res.data.meta.total
      },
      data: res.data.data
        // .filter((batch:any) => batch.type !== 'no-batch')
        .map((collar: any) => ({
            code: collar.code,
            status: collar.status,
            attached_animal: {
              name: collar.name,
              slug: collar.slug,
              earring: collar.earring,
              current_batch_name: collar.batch_name
            },
            last_collar_data: collar.last_read,
            attached_at: collar.assignment,
            detached_at: collar.removal,
            is_heifer_collar: collar.is_heifer_collar,
          })
        )
    }))
  }

  attachCollar = async (options: {
    collar: string,
    animal: string,
  }) => {

    return request({
      endpoint: 'attach-collar',
      method: 'put',
      params: { farm: this.farm },
      auth: this.token,
      body: {
        collar_code: options.collar,
        animal_slug: options.animal,
        force: true,
        assignment: getRequestFormatedDate(new Date)
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  detachCollar = async (options: {
    collar: string
  }) => {

    return request({
      endpoint: 'detach-collar',
      method: 'put',
      params: { farm: this.farm, collar: options.collar },
      auth: this.token,
      body: {
        date: getRequestFormatedDate(new Date)
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }


}
