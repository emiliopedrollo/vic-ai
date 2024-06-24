import { ChatDriver } from '#/Drivers/chat-driver'
import { Chat, ChatSendOutput } from '#/chat'
import { Message } from '#/message'
import { Threads } from 'openai/resources/beta'
import RunStatus = Threads.RunStatus

export class TitanChat implements ChatDriver
{
  private readonly chat: Chat

  constructor(chat: Chat) {
    this.chat = chat
  }

  private getExcerpt = (text: string, length: number): string => {
    return text.length <= length ? text : text.substring(0, text.lastIndexOf(' ', length)) + '...'
  }

  public summarize = async (message: string): Promise<ChatSendOutput> => {
    return {
      response: this.getExcerpt(message, 30)
    }
  }
  public send = async (message: string, metadata?: Record<string, string>): Promise<ChatSendOutput> => {

    let [user, farm] = await Promise.all([
      this.chat.service?.user().info(),
      this.chat.service?.farm().info()
    ])

    const response = `Parrot says to ${user?.name} at ${farm?.name}: ${message}`

    await this.chat.updateContext([...(this.chat.context||[]), {
      role: "user",
      content: message,
      metadata: metadata,
    }, {
      role: "assistant",
      content: response,
      metadata: metadata,
    }])

    return {
      response,
      metadata
    }
  }

  public getMessages = async (): Promise<{
    status: RunStatus,
    messages: Message[]
  }> => {
    return {
      status: 'completed',
      messages: this.chat.context
    }
  }

}
