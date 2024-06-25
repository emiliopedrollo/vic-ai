import { Chat as ChatDef } from '#/chat'
import { type Message } from '#/message'
import { ChatDriver } from '#/Drivers/chat-driver'
import { OpenAiChat } from '#/Drivers/openai'
import { ParrotChat } from '#/Drivers/parrot'
import {
  updateChatEntry,
} from '#/dynamo'
import { App } from '#/app'
import { ServiceFactory } from '#/Services/factory'
import { Threads } from 'openai/resources/beta'
import RunStatus = Threads.RunStatus
import { SpecialistFactory } from '#/Specialists/factory'
import { GeminiChat } from '#/Drivers/gemini'
import { TitanChat } from '#/Drivers/titan'


export type driverType = 'chatgpt' | 'titan' | 'gemini' | 'parrot'

export function getDriverTypeFromString(driver?: string): driverType|undefined
{
  switch (driver) {
    case 'chatgpt':
    case 'titan':
    case 'gemini':
    case 'parrot':
      return driver
    default:
      return undefined
      // throw 'string is not a valid driver'
  }
}

export interface ChatSendOutput {
  response: string,
  metadata?: any
}

export interface ChatOptions {
  user_id: string,
  driver?: driverType,
  chat_id?: string,
  service: ServiceFactory,
  context?: any,
}

export class Chat implements ChatDef {
  public app: App

  public user_id: string
  public chat_id?: string
  public context?: any

  private driver: ChatDriver
  public service: ServiceFactory
  public specialist: SpecialistFactory
  public driverType: driverType = 'chatgpt'

  updateContext = async (context: any) => {
    this.context = context
    if (this.chat_id && this.user_id) {
      await updateChatEntry({
        chat_id: this.chat_id,
        user_id: this.user_id,
        context: this.context,
      })
    }
  }

  getDriver = (): ChatDriver => {
    switch (this.driverType) {
      case 'chatgpt':
        return new OpenAiChat(this)
      case 'parrot':
        return new ParrotChat(this)
      case 'gemini':
        return new GeminiChat(this)
      case 'titan':
        return new TitanChat(this)
      default:
        throw 'This driver isn\'t implemented yet'
    }
  }

  constructor(app: App, options: ChatOptions) {
    this.app = app
    this.driverType = options.driver || app.defaultDriver
    this.chat_id = options.chat_id
    this.user_id = options.user_id
    this.context = options.context
    this.service = options.service
    this.specialist = new SpecialistFactory(this.service)
    this.driver  = this.getDriver()
  }

  summarize = async (message: string): Promise<ChatSendOutput> => {
    return this.driver.summarize(message)
  }

  send = async (message: string, metadata?: Record<string, string>): Promise<ChatSendOutput> => {
    return this.driver.send(message, metadata)
  }

  getMessages = async (): Promise<{status: RunStatus, messages: Message[]}> => {
    return this.driver.getMessages()
  }
}



