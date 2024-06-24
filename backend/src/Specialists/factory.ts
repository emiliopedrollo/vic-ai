import { Autonomous } from '#/Specialists/Autonomous'
import { Herd } from '#/Specialists/Herd'
import { ServiceFactory } from '#/Services/factory'
import { Tool } from '#/Specialists/specialist-interface'
import { General } from '#/Specialists/General'
import { Specialist } from '#/Specialists/Specialist'
import { Health } from '#/Specialists/Health'
import { Context } from '#/Context'
import { Reproduction } from '#/Specialists/Reproduction'
import { uuidv7 } from 'uuidv7'


export class SpecialistFactory {

  protected services: ServiceFactory

  protected autonomousSpecialist?: Autonomous
  protected herdSpecialist?: Herd
  protected generalSpecialist?: General
  protected healthSpecialist?: Health
  protected reproductionSpecialist?: Reproduction

  constructor(services: ServiceFactory) {
    this.services = services
  }

  getAllSpecialists = (): Specialist[] => {
    return [
      this.autonomous(),
      this.general(),
      this.herd(),
      this.health(),
      this.reproduction(),
    ]
  }

  getAllTools = (): Tool[] => {
    return this.getAllSpecialists()
      .map(specialist => specialist.getTools())
      .flat()
  }

  handle = async (name: string, context:Context,  args: any): Promise<object|undefined> => {

    const actionId = uuidv7()
    console.log(`[${actionId}] Action required:`, name, args, context.input_metadata)

    const response = await this.getAllSpecialists()
      .find(specialist => specialist.canHandleTool(name))
      ?.handle(name, context, args)

    console.log(`[${actionId}] Action response:`, response, context.output_metadata)

    return response
  }

  autonomous = (): Autonomous => {
    return this.autonomousSpecialist ??= new Autonomous()
  }

  general = (): General => {
    return this.generalSpecialist ??= new General(this.services)
  }

  herd = (): Herd => {
    return this.herdSpecialist ??= new Herd(this.services)
  }

  reproduction = (): Reproduction => {
    return this.reproductionSpecialist ??= new Reproduction(this.services)
  }

  health = (): Health => {
    return this.healthSpecialist ??= new Health(this.services)
  }

}
