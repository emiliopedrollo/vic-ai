import {
  DeleteItemCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  PutItemCommand,
  QueryCommand,
  QueryCommandOutput,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import dotenv from 'dotenv'
import { UserInfo } from '#/user-info'
import { AttributeValueUpdate } from '@aws-sdk/client-dynamodb/dist-types/models/models_0'
import { Chat, driverType, getDriverTypeFromString } from '#/chat'
import { App } from '#/app'
import { ServiceFactory } from '#/Services/factory'

dotenv.config()

let dynamoDB: DynamoDBClient

export function getDynamoDBClient(): DynamoDBClient {

  if (dynamoDB === undefined) {
    let configuration: DynamoDBClientConfig = {
      region: 'sa-east-1'
    }

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      configuration.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    }

    if (process.env.DYNAMODB_ENDPOINT) {
      configuration.endpoint = process.env.DYNAMODB_ENDPOINT
    }

    dynamoDB = new DynamoDBClient(configuration)
  }

  return dynamoDB

}

interface UserEntry {
  id: string
  name: string,
  chats: Array<{
    id: string,
    farm: string,
    title: string
  }>
}

interface ChatEntry {
  user_id: string,
  chat_id: string,
  context: any
  farm?: string,
  driver?: driverType,
}

export async function putChatEntry(data: {
  id: string,
  user_id: string,
  resume: string,
  farm: string,
  driver: driverType,
  context: any
}) {
  return Promise.all([
    dynamoDB.send(new PutItemCommand({
      TableName: 'chats',
      Item: {
        chat_id: { S: data.id },
        user_id: { S: data.user_id },
        context: { S: JSON.stringify(data.context) },
        driver: { S: data.driver }
      }
    })),
    getUserEntry(data.user_id).then(user => {
      if (user === null) throw 'User nor found'
      return dynamoDB.send(new UpdateItemCommand({
        TableName: 'users',
        Key: { id: { S: data.user_id } },
        AttributeUpdates: {
          chats: {
            Value: {
              S: JSON.stringify([
                ...(user.chats), {
                  id: data.id,
                  farm: data.farm,
                  resume: data.resume
                }])
            }, Action: 'PUT'
          }
        }
      }))
    })
  ])
}

export async function putConnectionData(data: { id: string, user_id?: string, auth?: string }) {
  return dynamoDB.send(new PutItemCommand({
    TableName: 'connections',
    Item: {
      connection_id: { S: data.id },
      user_id: { S: data.user_id || '' },
      auth: { S: data.auth || '' }
    }
  }))
}

export async function updateConnection(data: { id: string, user_id: string, auth: string }) {
  return dynamoDB.send(new UpdateItemCommand({
    TableName: 'connections',
    Key: { connection_id: { S: data.id } },
    AttributeUpdates: {
      user_id: { Value: { S: data.user_id }, Action: 'PUT' },
      auth: { Value: { S: data.auth }, Action: 'PUT' }
    }
  }))
}

export async function getConnectionData(connection_id: string): Promise<{
  user: UserEntry,
  auth: string
}> {
  // console.log('conn_id', connection_id)
  return dynamoDB.send(new QueryCommand({
    TableName: 'connections',
    KeyConditionExpression: '#connection_id = :connection_id',
    ExpressionAttributeNames: { '#connection_id': 'connection_id' },
    ExpressionAttributeValues: { ':connection_id': { S: connection_id } }
  })).then(async (output: QueryCommandOutput) => {
    if (output.Items && output.Items.length > 0 && output.Items[0].user_id.S !== undefined) {
      let user: UserEntry | null = await getUserEntry(output.Items[0].user_id.S)
      if (user === null) throw 'Invalid user_id'
      return {
        user: user,
        auth: output.Items[0].auth?.S || ''
      }
    } else {
      throw 'invalid connection'
    }
  })
}

export async function getChat(app: App, options: {
  user_id: string
  chat_id: string
  service: ServiceFactory
}): Promise<Chat|null> {
  return getChatEntry(options.user_id, options.chat_id).then((entry: ChatEntry|null) => {
    return entry ? new Chat (app, {
      driver: entry.driver,
      context: entry.context,
      service: options.service,
      user_id: options.user_id,
      chat_id: options.chat_id,
    }) : null
  })
}

export async function getChatEntry(user_id: string, chat_id: string): Promise<ChatEntry | null> {
  return dynamoDB.send(new QueryCommand({
    TableName: 'chats',
    KeyConditionExpression: '#user_id = :user_id AND #chat_id = :chat_id',
    ExpressionAttributeNames: { '#user_id': 'user_id', '#chat_id': 'chat_id' },
    ExpressionAttributeValues: { ':user_id': { S: user_id }, ':chat_id': { S: chat_id } }
  })).then(async (output: QueryCommandOutput): Promise<ChatEntry | null> => {
    return (output.Items && output.Items.length > 0) ? {
      user_id: user_id,
      chat_id: chat_id,
      context: JSON.parse(output.Items[0].context?.S || 'null'),
      driver: getDriverTypeFromString(output.Items[0].driver?.S || '')
    } : null
  })
}


// export async function getOrCreateChatEntry(user_id: string, chat_id: string, data?: object): Promise<ChatEntry> {
//   return getChatEntry(user_id, chat_id).then(async (entry): Promise<ChatEntry> => {
//     return (entry === null) ?
//       dynamoDB.send(new PutItemCommand({
//         TableName: 'chats',
//         Item: {
//           user_id: { S: user_id },
//           chat_id: { S: chat_id },
//           context: { S: JSON.stringify(data || {}) }
//         }
//       })).then((): ChatEntry => {
//         return {
//           user_id: user_id,
//           chat_id: chat_id,
//           context: {}
//         }
//       }) : entry
//   })
// }


export async function updateChatEntry(data: ChatEntry) {

  let changes: Record<string, AttributeValueUpdate> = {}

  if (data.context) {
    changes.context = { Value: { S: JSON.stringify(data.context) }, Action: 'PUT' }
  }

  if (Object.keys(changes).length === 0) return
  try {
    return dynamoDB.send(new UpdateItemCommand({
      TableName: 'chats',
      Key: { user_id: { S: data.user_id }, chat_id: { S: data.chat_id } },
      AttributeUpdates: changes
    })).catch(e => {
      console.log(e)
    })
  } catch (error) {
    console.error(error)
  }
}

export async function removeChatEntry(data: ChatEntry|null) {
  return data ? dynamoDB.send(new DeleteItemCommand({
    TableName: 'chats',
    Key: { user_id: { S: data.user_id }, chat_id: { S: data.chat_id } },
  })) : null
}

export async function getUserEntry(user_id: string): Promise<UserEntry | null> {
  return dynamoDB.send(new QueryCommand({
    TableName: 'users',
    KeyConditionExpression: '#user_id = :user_id',
    ExpressionAttributeNames: { '#user_id': 'id' },
    ExpressionAttributeValues: { ':user_id': { S: user_id } }
  })).then(async (output: QueryCommandOutput): Promise<UserEntry | null> => {
    return (output.Items && output.Items.length > 0) ? {
      id: output.Items[0].id?.S || '',
      name: output.Items[0].name?.S || '',
      chats: JSON.parse(output.Items[0].chats?.S || '[]')
    } : null
  })
}

export async function updateUserEntry(data: UserEntry) {

  let changes: Record<string, AttributeValueUpdate> = {}

  if (data.name) {
    changes.name = { Value: { S: data.name }, Action: 'PUT' }
  }

  if (data.chats) {
    changes.chats = { Value: { S: JSON.stringify(data.chats) }, Action: 'PUT' }
  }

  if (Object.keys(changes).length === 0) return
  try {
    return dynamoDB.send(new UpdateItemCommand({
      TableName: 'users',
      Key: { id: { S: data.id } },
      AttributeUpdates: changes
    })).catch(e => {
      console.log(e)
    })
  } catch (error) {
    console.error(error)
  }
}

export async function getOrCreateUserEntry(user: UserInfo): Promise<UserEntry> {
  return getUserEntry(user.uuid).then(async (entry): Promise<UserEntry> => {
    return (entry === null) ?
      dynamoDB.send(new PutItemCommand({
        TableName: 'users',
        Item: {
          id: { S: user.uuid },
          name: { S: user.name },
          chats: { S: JSON.stringify([]) }
        }
      })).then(() => {
        return {
          id: user.uuid,
          name: user.name,
          chats: []
        }
      }) : entry
  })
}
