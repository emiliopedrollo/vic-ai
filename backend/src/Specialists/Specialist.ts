import { InstructorSpecialist, NamelessTool, SpecialistInterface, Tool } from '#/Specialists/specialist-interface'
import { Context } from '#/Context'

export type HandlerOptions = {
  context: Context,
  args: Record<string, any>
}

export type ToolsDefinition = Record<string, {
  definition: NamelessTool,
  handler: { (options: HandlerOptions): Promise<object | undefined> }
}>

export abstract class Specialist implements SpecialistInterface {

  protected tools?: ToolsDefinition

  canHandleTool = (name: string): boolean => {
    return Object.keys(this.tools ??= this.getDefinedTools()).includes(name)
  }

  abstract defineTools: { (): ToolsDefinition }

  getDefinedTools = () => {
    return {
      ...this.defineTools(),
      ...this.getInstructorTools()
    }
  }

  isInstructorSpecialist(specialist: object): specialist is InstructorSpecialist {
    return ((specialist as InstructorSpecialist).getOverview !== undefined) &&
      ((specialist as InstructorSpecialist).getSoftwareTutorials !== undefined) &&
      ((specialist as InstructorSpecialist).getFrequentlyAskedQuestions !== undefined) &&
      ((specialist as InstructorSpecialist).getGlossary !== undefined)
  }

  getTools = (): Tool[] => {
    return Object
      .entries(this.tools ??= this.getDefinedTools())
      .map(([name, def]) => ({
        type: def.definition.type,
        function: { name, ...def.definition.function }
      }))
  }

  getInstructorTools = (): ToolsDefinition => {

    const definitions: ToolsDefinition = {}

    if (this.isInstructorSpecialist(this)) {
      definitions[`get_${this.constructor.name.toLowerCase()}_overview`] = {
        definition: this.buildDefinition({
          description: `Get an overview for the concept of ${this.constructor.name.toLowerCase()}`
        }),
        handler: async (): Promise<object> => ({
          overview: this.getOverview()
        })
      }
      definitions[`get_${this.constructor.name.toLowerCase()}_tutorials_for_cowmed_software`] = {
        definition: this.buildDefinition({
          description: `Get instructions of how to handle ${this.constructor.name.toLowerCase()} as Cowmed software`
        }),
        handler: async (): Promise<object> => ({
          tutorials: this.getSoftwareTutorials()
        })
      }
      definitions[`get_${this.constructor.name.toLowerCase()}_frequently_asked_questions`] = {
        definition: this.buildDefinition({
          description: `Get frequently asked questions regarding ${this.constructor.name.toLowerCase()}`
        }),
        handler: async (): Promise<object> => this.getFrequentlyAskedQuestions()
      }
      definitions[`get_${this.constructor.name.toLowerCase()}_glossary`] = {
        definition: this.buildDefinition({
          description: `Get a collection of definitions related to ${this.constructor.name.toLowerCase()}`
        }),
        handler: async (): Promise<object> => this.getGlossary()
      }
    }

    return definitions
  }

  buildDefinition = (options?: {
    description?: string,
    properties?: Record<string, {
      type: "number" | "string",
      description?: string
    }>,
    required?: Array<string>
  }): NamelessTool => ({
    type: 'function',
    function: {
      description: options?.description || '',
      parameters: {
        type: 'object',
        properties: options?.properties || {},
        required: options?.required
      }
    }
  })

  handle = async (name: string, context: Context, args: Record<string, any>): Promise<object | undefined> => {
    return (this.tools ??= this.getDefinedTools())[name]?.handler({ context, args })
  }

}
