import express from "express";
import type {  Request, Response } from "express";
import dotenv from "dotenv";
import { env } from 'node:process';
import axios from 'axios'
import * as https from 'https'
import * as fs from 'fs'
// @ts-ignore
import expressWs from "express-ws";
// @ts-ignore
import * as ws from "ws";
import { Chat, driverType, getDriverTypeFromString } from '#/chat'
import { setupEnv } from '#/setup'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  getChat,
  getChatEntry, getConfirmationEntry,
  getConnectionData,
  getDynamoDBClient,
  getOrCreateUserEntry,
  getUserEntry,
  putChatEntry,
  putConnectionData, removeChatEntry, updateUserEntry
} from '#/dynamo'
import { uuidv4, uuidv7 } from 'uuidv7'
import { ServiceFactory } from '#/Services/factory'

dotenv.config()

const httpsAgent = process.env['AXIOS_CA']
  ? new https.Agent({
    ca: fs.readFileSync(process.env['AXIOS_CA'])
  }) : null;


export class App {

  public defaultDriver: driverType = getDriverTypeFromString(process.env["LLM_BACKEND"]) || "chatgpt"

  protected webSocket: expressWs.Instance = expressWs(express())
  protected app: expressWs.Application = this.webSocket.app
  protected port: number = parseInt(env.PORT || '80')
  protected dynamoDB: DynamoDBClient = getDynamoDBClient()

  protected initAxios = () => {
    axios.interceptors.request.use(async (config) => {
      config.httpsAgent = httpsAgent
      return config
    })
  }

  getAuthenticatedServices = (token: string, farm: string) => {
    return new ServiceFactory(token, farm)
  }

  protected initWebSocket = () => {
    this.app.ws('/', (ws: ws, /* req: Request */) => {

      // let userInfo: UserInfo

      // let chat: Chat

      const closeConnection = (ws: ws, timeout: number = 30000): NodeJS.Timeout => setTimeout(() => ws.close(),timeout)
      let connectionCloseTimeout: NodeJS.Timeout = closeConnection(ws)
      const refreshTimeout = (ws: ws, timeout: number = 30000): void => {
        clearTimeout(connectionCloseTimeout);
        connectionCloseTimeout = closeConnection(ws, timeout);
      }

      ws.on('message', async (msg: any) => {
        let req: Package = JSON.parse(msg)

        refreshTimeout(ws)

        switch (req.type) {
          case 'auth': {
            let token = req.data?.token || req.token
            axios.get(`https://${process.env['COWMED_API_URL']}/api/user-info`,{
              headers: {
                Authorization: `Bearer ${token}`
              }
            }).then(async (res) => {
              let userInfo = res.data.data
              const user = await getOrCreateUserEntry(userInfo)

              const connection_id = uuidv4()

              const farm_chats = user.chats
                .filter(chat => chat.farm === req.farm)

              ws.send(JSON.stringify({'type': 'auth', 'success': true, 'chats': farm_chats, 'id': connection_id}))
              await putConnectionData({
                auth: req.data?.token || req.token,
                user_id: user.id,
                id: connection_id
              })
            }, (err) => {
              console.error(err)
              ws.send(JSON.stringify({'type': 'auth', 'success': false}))
            })
            break;
          }
          case 'message': {

            let { user, auth } = await getConnectionData(req.id)

            let context: any = null
            let driver: driverType = this.defaultDriver

            if (req.data.chat_id == null) {
              req.data.chat_id = uuidv7()

              let summarize = await (new Chat(this, {
                driver: driver,
                user_id: user.id,
                service: this.getAuthenticatedServices(auth, req.farm)
              })).summarize(req.data.message)

              await putChatEntry({
                id: req.data.chat_id,
                user_id: user.id,
                resume: summarize.response,
                driver: driver,
                farm: req.farm,
                context: context
              })

              const farm_chats = (await getUserEntry(user.id))?.chats
                .filter(chat => chat.farm === req.farm)

              ws.send(JSON.stringify({
                type: 'update_chats',
                chats: farm_chats || []
              }))

            }

            const chat = (await getChat(this, {
              user_id: user.id,
              chat_id: req.data.chat_id,
              service: this.getAuthenticatedServices(auth, req.farm)
            }))

            const metadata =
              JSON.parse(req.data.metadata || '{}') as Record<string, string>

            chat?.send(req.data.message, metadata).then((output) => {
              ws.send(JSON.stringify({
                type: 'response',
                chat_id: chat.chat_id,
                text: output.response,
                metadata: output.metadata,
              }))
            })

            break;
          }
          case 'delete-chat': {
            let { user, /* auth */} = await getConnectionData(req.id)
            let entry = user.chats.find(item => item.id === req.data.chat_id)
            if (entry) {
              user.chats.splice(user.chats.indexOf(entry),1)
              await Promise.all([
                removeChatEntry(await getChatEntry(user.id, req.data.chat_id) || null),
                updateUserEntry(user)
              ])
              ws.send(JSON.stringify({
                type: 'update_chats',
                chats: (await getUserEntry(user.id))?.chats.filter(chat => {
                  return chat.farm === req.farm
                }) || []
              }))
            }
            break;
          }
          case 'request-chat': {
            let { user, auth } = await getConnectionData(req.id)
            // let entry = user.chats.find(item => item.id === req.data.chat_id)

            const chat = (await getChat(this, {
              user_id: user.id,
              chat_id: req.data.chat_id,
              service: this.getAuthenticatedServices(auth, req.farm)
            }))
            ws.send(JSON.stringify({
              type: 'chat_history',
              requester: req.data.requester,
              data: await chat?.getMessages() || []
            }))
            break;
          }
          case 'request-confirmation': {
            let { user, /* auth */ } = await getConnectionData(req.id)

            const confirmation = await getConfirmationEntry(req.data.confirmation_id, user.id)

            ws.send(JSON.stringify({
              type: 'confirmation',
              requester: req.data.requester,
              data: confirmation
            }))

            break;
          }
          case 'ping': {
            ws.send(JSON.stringify({
              type: 'pong'
            }))
            break;
          }
        }

      })
    })
  }

  protected initHttpServer = () => {
    this.app.get("/", (req: Request, res: Response) => {
      // const args = process.env
      res.send(`Express + TypeScript Server`);

      // let aWss = this.webSocket.getWss()
      // console.log(aWss.clients)
    });

    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`[server]: Server is running at port ${this.port}`);
    });

  }

  protected initialize = async () => {
    await setupEnv(this)
    this.initAxios()
    this.initWebSocket()
    this.initHttpServer()
  }

  public getDynamoDBClient () {
    return this.dynamoDB
  }

  constructor() {
    this.initialize().finally()
  }
}

// noinspection JSUnusedLocalSymbols
const app: App = new App()

interface AuthPackage {
  type: "auth"
  farm: string
  token?: string
  data?: {
    token?: string
  }
}

interface MessagePackage {
  id: string
  type: "message"
  farm: string
  data: {
    chat_id?: string|null
    message: string
    metadata?: string
  }
}

interface DeleteChatPackage {
  id: string
  type: "delete-chat"
  farm: string
  data: {
    chat_id: string
  }
}

interface RequestChatPackage {
  id: string
  type: "request-chat"
  farm: string
  data: {
    chat_id: string
    requester: string
  }
}
interface RequestConfirmationPackage {
  id: string
  type: "request-confirmation"
  farm: string
  data: {
    confirmation_id: string
    requester: string
  }
}

interface PingPackage {
  type: "ping"
}

type Package =
  AuthPackage |
  MessagePackage |
  DeleteChatPackage |
  RequestChatPackage |
  RequestConfirmationPackage |
  PingPackage
