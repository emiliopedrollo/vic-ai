import { request } from '#/endpoints'


export class UserService {

  private token: string

  constructor(options: {
    token: string
  }) {
    this.token = options.token
  }

  info = async () => {
    return request({
      endpoint: 'user-info',
      auth: this.token
    }).then(res =>
      Object.fromEntries(Object.entries(res.data.data).filter(([k]) =>
        ['uuid','name','slug','locale','active_farm_count'].includes(k)
      ))
    )
  }
}
