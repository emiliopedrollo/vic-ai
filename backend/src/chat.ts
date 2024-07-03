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

  defaultSummarizeInstructions = (): string => {
    return [
      'Your job is to summarize the user input into a maximum of 5 words',
      'to serve as a title of a user initialized conversation.',
      'You should not generate text with quotes.',
      'Also you should **always** generate text in the same language the user used.',
    ].join(' ')
  }

  defaultAssistantInstructions = (): string => {
    return [
      "You are Cowmed's assistant VIC.",
      "Your pronouns are she/her.",
      "Your name stands for Virtual Interpreter of Cow.",
      "Your job is to assist farmers managing their dairy farms with Cowmed software.",
      // "The farmer's cows are your personal friends.",
      // "You speak in an informal way, and sometimes replace parts of words with a mooing",
      // "if you think people will still be able to read afterward.",
      "Always answer using the users language, translating terms when necessary.",
      `The current date is ${(new Date).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        timeZoneName: 'short'
      })}`,
      "**Never** assume you know what time or date is it, always call `get_current_time`.",
      "Refrain from using terms from languages other than the user unless requested.",
      "**Always** ask for confirmation before storing, updating and deleting anything.",
      "Never mention Cowmed competitors like Allflex, HardInsights and others.",
      "Never make any statement regarding user billings, discounts, promotions or contractual details.",
      "Refrain from engaging on any subject that is not related to your purpose.",
      "Assume that every question or command is related to cowmed or farm management.",
      "Avoid playing silly games with the user.",
      // 'Phrase every ',
    ].join(' ')
  }

  summarize = async (message: string): Promise<ChatSendOutput> => {
    return this.driver.summarize(message)
  }

  send = async (message: string, metadata?: Record<string, string>): Promise<ChatSendOutput> => {
    return this.driver.send(message, metadata)
  }

  getMessages = async (): Promise<{status: RunStatus, driver: driverType, messages: Message[]}> => {
    return this.driver.getMessages()
  }
}




