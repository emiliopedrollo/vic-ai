import { Context } from '#/Context'

export type toolTypes = "function"

type NamelessTool = {
  type: toolTypes,
  function: {
    description: string,
    parameters: {
      type: "object",
      properties: Record<string, {
        type: "number" | "string",
        description?: string
      }>,
      required?: Array<string>
    }
  }
}

export type Tool = NamelessTool & {
  function: {
    name: string
  }
}

export interface OverviewSpecialist {
  getOverview: { (): object|string }
}

export interface TutorialSpecialist {
  getSoftwareTutorials: { (): Array<object|string>|object|string }
}

export interface FAQSpecialist {
  getFrequentlyAskedQuestions: { (): Record<string,{question: string, answer: string}[]> }
}

export interface GlossarySpecialist {
  getGlossary: { (): Record<string, string> }
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