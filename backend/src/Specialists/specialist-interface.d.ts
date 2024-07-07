import { Context } from '#/Context'

export type toolTypes = "function"

export type ParameterType = "number" | "string" | "integer" | "boolean" | "array" | "object"

export type Property = {
  type: ParameterType,
  format?: string,
  description?: string,
  nullable?: boolean,
  items?: Parameters
  properties?: Record<string, Parameters>
  enum?: string[],
  example?: unknown
}

export type Parameters = Record<string, any> & {
  type: ParameterType,
  description?: string,
  properties?: Record<string, Property>,
  required?: string[]
}

type NamelessTool = {
  type: toolTypes,
  function: {
    description?: string,
    parameters: Parameters
  }
}

export type Tool = NamelessTool & {
  function: {
    name: string
  }
}

export interface OverviewSpecialist {
  getOverview: { (): object|string }
  getOverviewDescription: { (): string }
}

export interface TutorialSpecialist {
  getSoftwareTutorials: { (): Array<object|string>|object|string }
  getSoftwareTutorialsDescription: { (): string }
}

export interface FAQSpecialist {
  getFrequentlyAskedQuestions: { (): Record<string,{question: string, answer: string}[]> }
  getFrequentlyAskedQuestionsDescription: { (): string }
}

export interface GlossarySpecialist {
  getGlossary: { (): Record<string, string> }
  getGlossaryDescription: { (): string }
}

export interface InstructorSpecialist
  implements OverviewSpecialist, TutorialSpecialist, FAQSpecialist, GlossarySpecialist {}

export interface SpecialistInterface {
  // send: { (message: string, metadata?: Record<string, string>): Promise<ChatSendOutput> }
  // summarize: { (message: string): Promise<ChatSendOutput> }
  // getMessages: { (): Promise<{status: RunStatus, messages: Message[]}> }

  getTools: { (): Tool[]  }
  handle: { (name: string, context: Context, args: Record<string, any>): Promise<object|undefined> }
}
