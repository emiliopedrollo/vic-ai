import { FarmService } from '#/Services/FarmService'
import { UserService } from '#/Services/UserService'
import { HealthService } from '#/Services/HealthService'
import { HerdService } from '#/Services/HerdService'
import { ReproductionService } from '#/Services/ReproductionService'

export class ServiceFactory {

  private readonly token: string
  private readonly farm_slug: string

  protected farmService?: FarmService
  protected userService?: UserService
  protected healthService?: HealthService
  protected herdService?: HerdService
  protected reproductionService?: ReproductionService

  constructor(token: string, farm: string) {
    this.token = token
    this.farm_slug = farm
  }

  farm = () => {
    return this.farmService ??= new FarmService({ token: this.token, farm: this.farm_slug })
  }

  health = () => {
    return this.healthService ??= new HealthService({ token: this.token, farm: this.farm_slug })
  }

  herd = () => {
    return this.herdService ??= new HerdService({ token: this.token, farm: this.farm_slug })
  }

  reproduction = () => {
    return this.reproductionService ??= new ReproductionService({ token: this.token, farm: this.farm_slug })
  }

  user = () => {
    return this.userService ??= new UserService({ token: this.token })
  }
}
