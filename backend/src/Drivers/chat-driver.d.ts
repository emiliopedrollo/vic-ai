import { driverType } from '#/chat'

export type ProgressCallbackOptions = { text?: string, actions?: string[] }
export type ProgressCallback = { (options?: ProgressCallbackOptions): void }

export interface ChatDriver{
  send: { (message: string, metadata?: Record<string, string>, progress?: ProgressCallback): Promise<ChatSendOutput> }
  summarize: { (message: string): Promise<ChatSendOutput> }
  getMessages: { (): Promise<{status: RunStatus, driver: driverType, messages: Message[]}> }
}
