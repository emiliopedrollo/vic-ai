import { App } from '#/app'
import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'


const assertUsersTable = async (dynamoDB:DynamoDBClient): Promise<void> => {
  return new Promise((resolve, reject) => {
    dynamoDB.send(new DescribeTableCommand({
      TableName: 'users'
    })).then(() => resolve()).catch((e) => {
      if (e.name === 'ResourceNotFoundException') {
        dynamoDB.send(new CreateTableCommand({
          TableName: 'users',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ],
          ProvisionedThroughput: {
            WriteCapacityUnits: 1,
            ReadCapacityUnits: 1,
          }
        })).then(() => resolve())
      } else {
        reject(e)
      }
    })
  })
}

const assertChatsTable = async (dynamoDB:DynamoDBClient): Promise<void> => {
  return new Promise((resolve, reject) => {
    dynamoDB.send(new DescribeTableCommand({
      TableName: 'chats'
    })).then(() => resolve()).catch((e) => {
      if (e.name === 'ResourceNotFoundException') {
        dynamoDB.send(new CreateTableCommand({
          TableName: 'chats',
          AttributeDefinitions: [
            {
              AttributeName: 'user_id',
              AttributeType: 'S'
            },{
              AttributeName: 'chat_id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'user_id',
              KeyType: 'HASH'
            },{
              AttributeName: 'chat_id',
              KeyType: 'RANGE'
            }
          ],
          ProvisionedThroughput: {
            WriteCapacityUnits: 1,
            ReadCapacityUnits: 1,
          }
        })).then(() => resolve())
      } else {
        reject(e)
      }
    })
  })
}

const assertConnectionsTable = async (dynamoDB:DynamoDBClient): Promise<void> => {
  return new Promise((resolve, reject) => {
    dynamoDB.send(new DescribeTableCommand({
      TableName: 'connections'
    })).then(() => resolve()).catch((e) => {
      if (e.name === 'ResourceNotFoundException') {
        dynamoDB.send(new CreateTableCommand({
          TableName: 'connections',
          AttributeDefinitions: [
            {
              AttributeName: 'connection_id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'connection_id',
              KeyType: 'HASH'
            }
          ],
          ProvisionedThroughput: {
            WriteCapacityUnits: 1,
            ReadCapacityUnits: 1,
          }
        })).then(() => resolve())
      } else {
        reject(e)
      }
    })
  })
}

export async function setupEnv(app: App) {
  const dynamoDB: DynamoDBClient = app.getDynamoDBClient()

  return Promise.all([
    assertUsersTable(dynamoDB),
    assertChatsTable(dynamoDB),
    assertConnectionsTable(dynamoDB),
  ])



}
