import { FarmService } from '#/Services/FarmService'
import { UserService } from '#/Services/UserService'

export class ServiceFactory {

  private readonly token: string
  private readonly farm_slug: string

  protected farmService?: FarmService
  protected userService?: UserService

  constructor(token: string, farm: string) {
    this.token = token
    this.farm_slug = farm
  }

  farm = () => {
    return this.farmService ??= new FarmService({ token: this.token, farm: this.farm_slug })
  }

  user = () => {
    return this.userService ??= new UserService({ token: this.token })
  }
}
