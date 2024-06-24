import { request } from '#/endpoints'


export class HealthService {

  private token: string
  private farm: string

  constructor(options: {
    token: string,
    farm: string
  }) {
    this.token = options.token
    this.farm = options.farm
  }

  listInfirmary = async(options: {
    page?: number
    per_page?: number
  }) => {
    return request({
      endpoint: 'list-infirmary',
      params: { farm: this.farm },
      query: {
        per_page: options.per_page || 100,
        page: options.page || 1
      },
      auth: this.token
    }).then(res => ({
        meta: {
          current_page: res.data.meta.current_page,
          last_page: res.data.meta.last_page,
          total_animals_in_infirmary: res.data.meta.total
        }, data:
          res.data.data
            .map((entry: any) => ({
              animal_earring: entry.animal_earring,
              animal_name: entry.animal_name,
              animal_slug: entry.animal_slug,
              animal_collar_code: entry.collar_code,
              animal_new_at_infirmary: entry.new,
              animal_batch_name: entry.batch_name,
              animal_batch_slug: entry.batch_slug,
              animal_age: entry.animal_age,
              animal_milking_days: entry.animal_dim,
              health_status: entry.health_status.status,
              health_recent_change: entry.health_change,
              breathing_indicator: entry.breathing_indicator?.status,
              diagnostic_events: entry.diagnostic_events.map((diagnostic: {
                name: string,
                text: string
              }) => diagnostic.name),
              days_in_infirmary: parseInt(entry.infirmary_time),
              days_in_the_same_status: parseInt(entry.status_time),
            }))
    }))
  }

}
