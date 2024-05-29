import { request } from '#/endpoints'


export class FarmService {

  private token: string
  private farm: string

  constructor(options: {
    token: string,
    farm: string
  }) {
    this.token = options.token
    this.farm = options.farm
  }

  info = async () => {
    return request({
      endpoint: 'farm-info',
      params: { farm: this.farm },
      auth: this.token
    }).then(res =>
      ({
        uuid: res.data.data?.uuid,
        name: res.data.data.name,
        slug: res.data.data.slug,
        code: res.data.data.code,
        system: res.data.data.system,
        contracted_collars: res.data.data.contract_collar,
        city: res.data.data.city.name,
        state: res.data.data.city.state.name,
        predominant_breed: res.data.data.predominant_breed,
        latitude: res.data.data.latitude,
        longitude: res.data.data.longitude,
        timezone: res.data.data.timezone,
        plan: res.data.data.plan,
        contract_status: res.data.data.contract_status
      })
    )
  }

}
