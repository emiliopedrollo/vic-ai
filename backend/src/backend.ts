import express from "express";
import type { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { env } from 'node:process';
import axios from 'axios'
import * as https from 'https'
import * as fs from 'fs'
import type { UserInfo } from '#/user-info'
// @ts-ignore
import expressWs from "express-ws";
// @ts-ignore
import * as ws from "ws";
// import { Chat } from './chat'
import { Chat } from '#/chat'


dotenv.config()

const webSocket = expressWs(express())
const app: expressWs.Application = webSocket.app;
const port = parseInt(env.PORT || '80')


const httpsAgent = process.env['AXIOS_CA']
  ? new https.Agent({
    ca: fs.readFileSync(process.env['AXIOS_CA'])
  }) : null;

axios.interceptors.request.use(async (config) => {
  config.httpsAgent = httpsAgent
  return config
})


app.ws('/', function(ws: ws, req: Request) {

  let userInfo: UserInfo

  let chat: Chat

  const closeConnection = (ws: ws, timeout: number = 30000): NodeJS.Timeout => setTimeout(() => ws.close(),timeout)
  let connectionCloseTimeout: NodeJS.Timeout = closeConnection(ws)
  const refreshTimeout = (ws: ws, timeout: number = 30000): void => {
    clearTimeout(connectionCloseTimeout);
    connectionCloseTimeout = closeConnection(ws, timeout);
  }

  ws.on('message', async function (msg: any) {
    const data = JSON.parse(msg)
    // console.log(data)

    refreshTimeout(ws)

    // ws.close()

    switch (data.type) {
      case 'auth': {
        axios.get(`https://${process.env['COWMED_API_URL']}/api/user-info`,{
          headers: {
            Authorization: `Bearer ${data.token}`
          }
        }).then((res) => {
          userInfo = res.data.data
          userInfo.rand = crypto.randomUUID();
          ws.send(JSON.stringify({'type': 'auth', 'success': true}))

        }, (err) => {
          console.error(err)
          ws.send(JSON.stringify({'type': 'auth', 'success': false}))
        })
      }
      break;
      case 'message': {

        if (chat == null) {
          console.log('chat is null')
          chat = new Chat
        } else {
          console.log('chat isn\'t null')
        }

        chat.send(data.message).then((response) => {
          console.log('SENT: ', response)
        })

        setTimeout(() => {

          ws.send(JSON.stringify({
            type: 'response',
            text: `Parrot says to ${userInfo.name}: ${data.message}`
          }))
        }, 200)
        break;
      }
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong'
        }))
        break;
    }

  })
})

app.get("/", (req: Request, res: Response) => {
  // const args = process.env
  res.send(`Express + TypeScript Server`);

  let aWss = webSocket.getWss()
  // console.log(aWss.clients)
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[server]: Server is running at port ${port}`);
});
