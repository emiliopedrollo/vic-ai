import type { Message } from '@/components/Chat.vue'

interface SocketOptions {
  getAuthToken: { (): Promise<string|null> }
  getCurrentFarm: { (): string }
  handleAuth: { (id: string, success: boolean, chats: { id: string, resume: string }[] | null): void }
  handleResponse: { (chat_id: string, text:string ): void }
  handleUpdateChats: { (chats: {id: string, resume: string}[] | null): void }
  handleUnexpectedClose: { (): void }
}

type messageType = "message" | "delete-chat" | "request-chat"

export class Socket {

  protected socket: WebSocket

  protected options: SocketOptions;

  protected socketId: string|null = null

  protected pingTimeout: number|undefined

  protected closing: boolean = false

  private responseQueue: Record<string, { (data: any): void }> = {}

  responseHandler = (requester: string, data: object) => {
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

  sendMessage = (chat_id: string|null, message: string) => {
    this.send('message',{ chat_id, message })
  }

  deleteChat = (chat_id: string) => {
    this.send('delete-chat', { chat_id })
  }

  loadChat = (chat_id: string): Promise<Message[]> => {
    return new Promise(resolve => {
      const requester = crypto.randomUUID()
      this.responseQueue[requester] = (data: Message[]) => {
        resolve(data)
      }
      this.send('request-chat', { chat_id, requester })
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
      console.info('Connected')
      this.socket.send(JSON.stringify({
        type: 'auth',
        farm: this.options.getCurrentFarm(),
        data: { token: await this.options.getAuthToken() }
      }))
      this.pingTimeout = this.sendPing()
    })


    this.socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'auth':
          this.socketId = data.id
          console.info('Authenticated')
          this.options.handleAuth(data.id, data.success, data.chats)
          break;
        case 'response':
          this.options.handleResponse(data.chat_id, data.text)
          break;
        case 'update_chats':
          this.options.handleUpdateChats(data.chats)
          break;
        case 'chat_history':
          this.responseHandler(data.requester, data.messages)
          break;
      }
    })

    this.socket.addEventListener('close', () => {
      clearTimeout(this.pingTimeout)
      console.info('Disconnected')
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
