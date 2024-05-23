import { SendFunction } from '#/chat'

export interface ChatDriver{
  send: SendFunction
}
