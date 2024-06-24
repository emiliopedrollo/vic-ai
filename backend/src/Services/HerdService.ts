import { request } from '#/endpoints'


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

  listBatches = async(options: {
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
        total_batches: res.data.meta.total,
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
            min_milk_production_liters: batch.prod_min,
          })
        )
    }))
  }


}
