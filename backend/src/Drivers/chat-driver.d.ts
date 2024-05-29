export interface ChatDriver{
  send: { (message: string): Promise<ChatSendOutput> }
  summarize: { (message: string): Promise<ChatSendOutput> }
  getMessages: { (): Promise<Message[]> }
}
