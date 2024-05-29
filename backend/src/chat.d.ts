import { Message } from './message'
import { ChatSendOutput } from './chat'

export interface Chat {
  uuid: string,
  messages: Message[],
  send: { (message: string): Promise<ChatSendOutput> },
}
