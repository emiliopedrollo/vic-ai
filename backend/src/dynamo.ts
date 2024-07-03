import {
  DeleteItemCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  GetItemCommand,
  GetItemCommandOutput,
  PutItemCommand,
  QueryCommand,
  QueryCommandOutput,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import dotenv from 'dotenv'
import { UserInfo } from '#/user-info'
import { AttributeValue, AttributeValueUpdate } from '@aws-sdk/client-dynamodb/dist-types/models/models_0'
import { Chat, driverType, getDriverTypeFromString } from '#/chat'
import { App } from '#/app'
import { ServiceFactory } from '#/Services/factory'
import deepmerge from 'deepmerge'
import { PreparationTypes } from '#/Specialists/Specialist'

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

export interface UserEntry {
  id: string
  name: string,
  chats: Array<{
    id: string,
    farm: string,
    title: string
  }>
}

export interface ChatEntry {
  user_id: string,
  chat_id: string,
  context: any
  farm?: string,
  driver?: driverType,
}

export type ConfirmationStatus = 'pending' | 'confirmed' | 'canceled' | 'rejected'

export type PreparationDetails = {
  args: Record<string, any>,
  preparation_id: string,
  extra: Record<string, any>
}

export interface ConfirmationEntry {
  id: string,
  user_id: string,
  status: ConfirmationStatus,
  details: Record<PreparationTypes|string, PreparationDetails[]>
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
}): Promise<Chat | null> {
  return getChatEntry(options.user_id, options.chat_id).then((entry: ChatEntry | null) => {
    return entry ? new Chat(app, {
      driver: entry.driver,
      context: entry.context,
      service: options.service,
      user_id: options.user_id,
      chat_id: options.chat_id
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

export async function removeChatEntry(data: ChatEntry | null) {
  return data ? dynamoDB.send(new DeleteItemCommand({
    TableName: 'chats',
    Key: { user_id: { S: data.user_id }, chat_id: { S: data.chat_id } }
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

export async function storeConfirmationEntry(confirmation: ConfirmationEntry): Promise<ConfirmationEntry> {
  return dynamoDB.send(new PutItemCommand({
    TableName: 'confirmations',
    Item: {
      id: { S: confirmation.id },
      user_id: { S: confirmation.user_id },
      status: { S: confirmation.status },
      details: { S: JSON.stringify(confirmation.details) }
    }
  })).then(() => {
    return confirmation
  })
}

export async function updateConfirmationEntry(id: string, user_id: string, options: {
  details?: object,
  status?: ConfirmationStatus
}): Promise<any> {

  let changes: string = "SET "
  let names: Record<string, string> = { '#status': "status"}
  let values: Record<string, AttributeValue> = { ':status': { S: "pending" }}

  if (options.details) {
    changes += "#details=:details"
    names["#details"] = "details"
    values[":details"] = { S: JSON.stringify(options.details) }
  }
  if (options.status) {
    changes += "#status=:new_status"
    values[":new_status"] = { S: options.status }
  }

  return dynamoDB.send(new UpdateItemCommand({
    TableName: 'confirmations',
    Key: { id: { S: id }, user_id: { S: user_id } },
    UpdateExpression: changes,
    ConditionExpression: "#status = :status",
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  })).catch(e => {
    if (e.name !== 'ConditionalCheckFailedException') {
      throw e
    }
  })
}

export async function extendConfirmationEntryDetails(id: string, user_id: string, details: object): Promise<ConfirmationEntry> {
  let confirmation = await getConfirmationEntry(id, user_id)
  return updateConfirmationEntry(id, user_id, { details: deepmerge(
    confirmation.details, details
  )})
}

export async function getConfirmationEntry(id: string, user_id: string): Promise<ConfirmationEntry> {
  return dynamoDB.send(new GetItemCommand({
    TableName: 'confirmations',
    Key: { id: { S: id }, user_id: { S: user_id } }
  })).then((output: GetItemCommandOutput): ConfirmationEntry => {
    return {
      id: output.Item?.id.S || '',
      details: JSON.parse(output.Item?.details.S || '{}'),
      status: output.Item?.status.S as ConfirmationStatus || 'pending',
      user_id: output.Item?.user_id.S || ''
    }
  })
}
