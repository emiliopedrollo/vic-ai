import { Specialist, ToolsDefinition } from '#/Specialists/Specialist'

export class Autonomous extends Specialist {
  defineTools = (): ToolsDefinition => ({
    'get_current_time': {
      definition: this.buildDefinition({
        description: "Get the current timestamp",
        properties: { }
      }),
      handler: async (): Promise<object | undefined> => {
        return {
          date: (new Date).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            timeZoneName: 'short'
          })
        }
      }
    }
  })
}
