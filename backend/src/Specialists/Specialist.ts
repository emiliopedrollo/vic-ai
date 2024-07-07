import {
  FAQSpecialist, GlossarySpecialist,
  InstructorSpecialist,
  NamelessTool,
  OverviewSpecialist, ParameterType,
  SpecialistInterface,
  Tool, TutorialSpecialist
} from '#/Specialists/specialist-interface'
import { Context } from '#/Context'
import { PreparationDetails } from '#/dynamo'
import { uuidv4 } from 'uuidv7'

export type HandlerOptions = {
  context: Context,
  args: Record<string, any>
}

export type ToolsDefinition = Record<string, {
  definition: NamelessTool,
  handler: { (options: HandlerOptions): Promise<object | undefined> }
}>

export type FunctionProperty = {
  type: ParameterType,
  items?: FunctionProperty
  format?: string,
  nullable?: boolean,
  enum?: string[],
  description?: string
}

export type AnimalPreparationTypes = "prepare_animal_store" | "prepare_animal_update"
export type BatchPreparationTypes = "prepare_batch_store" | "prepare_animals_move"
export type CollarPreparationTypes = "prepare_collar_attach" | "prepare_collar_detach"
export type HeatPreparationTypes = "prepare_confirm_animal_heat" | "prepare_dismiss_animal_heat" |
  "prepare_ia_store" | "prepare_et_store" | "prepare_natural_breeding_store"

export type PreparationTypes = AnimalPreparationTypes | BatchPreparationTypes |
  CollarPreparationTypes | HeatPreparationTypes

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

  protected createPreparation = async (options: HandlerOptions & {
    type: PreparationTypes,
    required_arguments: string[],
    extra?: Record<any, any>
  }) => {

    const missing: string[] = [];
    options.required_arguments.forEach((entry) => {
      if (options.args[entry] === undefined) {
        missing.push(entry)
      }
    })

    if (missing.length > 0) {
      return {
        status: "Error",
        details: `Missing required argument(s): ${missing.join(', ')}`,
      }
    }

    const context_args: PreparationDetails = {
      args: options.args,
      preparation_id: uuidv4(),
      extra: options.extra || {}
    }

    await options.context.createOrExtendConfirmation(options.type, context_args)

    return ({
      status: "confirm_to_proceed",
      preparation: context_args.preparation_id,
      details: "Require user confirmation to proceed"
    })
  }

  isOverviewSpecialist(specialist: unknown): specialist is OverviewSpecialist {
    return (specialist as OverviewSpecialist).getOverview !== undefined
  }

  isTutorialSpecialist(specialist: unknown): specialist is TutorialSpecialist {
    return (specialist as TutorialSpecialist).getSoftwareTutorials !== undefined
  }

  isFAQSpecialist(specialist: unknown): specialist is FAQSpecialist {
    return (specialist as FAQSpecialist).getFrequentlyAskedQuestions !== undefined
  }

  isGlossarySpecialist(specialist: unknown): specialist is GlossarySpecialist {
    return (specialist as GlossarySpecialist).getGlossary !== undefined
  }

  isInstructorSpecialist(specialist: object): specialist is InstructorSpecialist {
    return this.isOverviewSpecialist(specialist) &&
      this.isTutorialSpecialist(specialist) &&
      this.isFAQSpecialist(specialist) &&
      this.isGlossarySpecialist(specialist)
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

    if (this.isOverviewSpecialist(this)) {
      definitions[`get_${this.constructor.name.toLowerCase()}_overview`] = {
        definition: this.buildDefinition({
          description: `Get an overview for the concept of ${this.constructor.name.toLowerCase()}`
        }),
        handler: async (): Promise<object> => ({
          overview: (this as OverviewSpecialist).getOverview()
        })
      }
    }

    if (this.isTutorialSpecialist(this)) {
      definitions[`get_${this.constructor.name.toLowerCase()}_tutorials_for_cowmed_software`] = {
        definition: this.buildDefinition({
          description: `Get instructions of how to handle ${this.constructor.name.toLowerCase()} as Cowmed software`
        }),
        handler: async (): Promise<object> => ({
          tutorials: (this as TutorialSpecialist).getSoftwareTutorials()
        })
      }
    }

    if (this.isFAQSpecialist(this)) {
      definitions[`get_${this.constructor.name.toLowerCase()}_frequently_asked_questions`] = {
        definition: this.buildDefinition({
          description: `Get frequently asked questions regarding ${this.constructor.name.toLowerCase()}`
        }),
        handler: async (): Promise<object> => (this as FAQSpecialist).getFrequentlyAskedQuestions()
      }
    }

    if (this.isGlossarySpecialist(this)) {
      definitions[`get_${this.constructor.name.toLowerCase()}_glossary`] = {
        definition: this.buildDefinition({
          description: `Get a collection of definitions related to ${this.constructor.name.toLowerCase()}`
        }),
        handler: async (): Promise<object> => (this as GlossarySpecialist).getGlossary()
      }
    }

    return definitions
  }

  removeUndefined = <T extends Record<string,any>>(obj: T): T => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key]
      }
    })
    return obj;
  }

  buildDefinition = (options?: {
    description?: string,
    properties?: Record<string, FunctionProperty>,
    required?: Array<string>
  }): NamelessTool => ({
    type: 'function',
    function: {
      description: options?.description,
      parameters: this.removeUndefined({
        type: 'object',
        properties: options?.properties || {},
        required: options?.required
      })
    }
  })

  handle = async (name: string, context: Context, args: Record<string, any>): Promise<object | undefined> => {
    return (this.tools ??= this.getDefinedTools())[name]?.handler({ context, args })
  }

}
