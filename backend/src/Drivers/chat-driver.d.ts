export interface ChatDriver{
  send: { (message: string, metadata?: Record<string, string>): Promise<ChatSendOutput> }
  summarize: { (message: string): Promise<ChatSendOutput> }
  getMessages: { (): Promise<{status: RunStatus, messages: Message[]}> }
}
