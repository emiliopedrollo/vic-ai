import type { Confirmation, Message } from '@/components/Chat.vue'
import { error, info } from '@/logger'
import type { ConfirmationStatus } from '@/components/Confirmation.vue'
import type { LLM } from '@/Interfaces/llm'

export class Socket {

  protected socket: WebSocket

  protected options: SocketOptions;

  protected socketId: string|null = null

  protected pingTimeout: number|undefined

  protected closing: boolean = false

  private responseQueue: Record<string, { (data: any): void }> = {}

  responseHandler = (requester: string, data: any) => {
    if (this.responseQueue[requester]) {
      this.responseQueue[requester](data)
      delete this.responseQueue[requester]
    }
  }

  sendPing = (): number => {
    this.socket.send(JSON.stringify({type: 'ping'}))
    return window.setTimeout(() => this.pingTimeout = this.sendPing(), 25000)
  }

  protected send = (type: messageType, data: object) => {
    this.socket.send(JSON.stringify({
      id: this.socketId, farm: this.options.getCurrentFarm(), type, data,
    }))
  }

  sendMessage = (
    chat_id: string|null, message: string, metadata?: Record<string,string>, preferred_llm?: LLM
  ) => {
    this.send('message',{
      chat_id, message, metadata: JSON.stringify(metadata), preferred_llm
    })
  }

  deleteChat = (chat_id: string) => {
    this.send('delete-chat', { chat_id })
  }

  loadChat = (chat_id: string): Promise<{status: string, messages: Message[]}> => {
    return new Promise(resolve => {
      const requester = crypto.randomUUID()
      this.responseQueue[requester] = (data: {status: string, messages: Message[]}) => {
        resolve(data)
      }
      this.send('request-chat', { chat_id, requester })
    })
  }

  loadConfirmation = (confirmation_id: string): Promise<Confirmation> => {
    return new Promise(resolve => {
      const requester = crypto.randomUUID()
      this.responseQueue[requester] = (data: Confirmation) => {
        resolve(data)
      }
      this.send('request-confirmation', { confirmation_id, requester })
    })
  }

  disconnect = () => {
    this.closing = true
    this.socket.close()
    clearTimeout(this.pingTimeout)
  }

  constructor(options: SocketOptions) {
    this.socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_HOST)
    this.options = options

    this.socket.addEventListener('open', async () => {
      info('Connected')
      this.socket.send(JSON.stringify({
        type: 'auth',
        farm: this.options.getCurrentFarm(),
        data: { token: await this.options.getAuthToken() }
      }))
      this.pingTimeout = this.sendPing()
    })


    this.socket.addEventListener('message', (event) => {
      const data: Package = JSON.parse(event.data)
      switch (data.type) {
        case 'auth':
          this.socketId = data.id
          if (data.success) {
            info('Authenticated')
          } else {
            error('Failed Authentication')
          }
          this.options.handleAuth(data.id, data.success, data.chats)
          break;
        case 'response':
          this.options.handleResponse(data.chat_id, data.text, data.metadata)
          break;
        case 'update_chats':
          this.options.handleUpdateChats(data.chats)
          break;
        case 'chat_history':
        case 'confirmation':
          this.responseHandler(data.requester, data.data)
          break;
      }
    })

    this.socket.addEventListener('close', () => {
      clearTimeout(this.pingTimeout)
      info('Disconnected')
      if (!this.closing) {
        this.options.handleUnexpectedClose()
      }
    })

    // socket.addEventListener('error', () => {
    //   console.log('ws error')
    //   setupWebSocket()
    // })

  }

}

interface SocketOptions {
  getAuthToken: { (): Promise<string|null> }
  getCurrentFarm: { (): string }
  handleAuth: { (id: string, success: boolean, chats: { id: string, resume: string }[] | null): void }
  handleResponse: { (chat_id: string, text: string, metadata?: Record<string, string>|null ): void }
  handleUpdateChats: { (chats: {id: string, resume: string}[] | null): void }
  handleUnexpectedClose: { (): void }
}

type messageType =
  "message" |
  "delete-chat" |
  "request-chat" |
  "request-confirmation" |
  "update-confirmation"

interface AuthPackage {
  type: "auth"
  id: string,
  success: boolean,
  chats: { id: string, resume: string }[] | null
}

interface ResponsePackage {
  type: "response"
  chat_id: string,
  text: string,
  metadata?: Record<string, any>|null
}

interface UpdateChatPackage {
  type: "update_chats"
  chats: { id: string, resume: string }[] | null
}

interface ChatHistoryPackage {
  type: "chat_history",
  requester: string
  data: Message[]
}
interface ConfirmationPackage {
  type: "confirmation",
  requester: string
  data: Confirmation
}

type Package = AuthPackage | ResponsePackage | UpdateChatPackage | ChatHistoryPackage | ConfirmationPackage
