import { Message } from './message'

interface SendFunction {
  (message: string): Promise<any>
}

export interface Chat {
  uuid: string,
  messages: Message[],
  send: SendFunction,
}
