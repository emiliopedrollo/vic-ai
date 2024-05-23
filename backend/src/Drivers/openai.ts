
import OpenAI from 'openai'
import { ChatDriver } from '#/Drivers/chat-driver'
import dotenv from "dotenv";
import { Chat } from '#/chat'

dotenv.config()

export class OpenAiChat implements ChatDriver
{
  private readonly apiKey: string
  private readonly organization: string
  private readonly chat: Chat

  constructor(chat: Chat) {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.organization = process.env.OPENAI_ORGANIZATION || '';
    this.chat = chat
  }

  send = async (message: string): Promise<any> => {


    const openai = new OpenAI({
      apiKey: this.apiKey,
      organization: this.organization,
      // dangerouslyAllowBrowser: true
    })

    return openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      messages: [...this.chat.messages, {
        role: 'user',
        content: message
      }]
    }).catch(reason => {
      console.error(reason)
    })
  }
}
