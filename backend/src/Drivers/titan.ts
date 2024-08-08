import { ChatDriver, ProgressCallback } from '#/Drivers/chat-driver'
import { Chat, ChatSendOutput, driverType } from '#/chat'
import { Message } from '#/message'
import { Threads } from 'openai/resources/beta'
import RunStatus = Threads.RunStatus
import { Context } from '#/Context'
import { Parameters, ParameterType, Property } from '#/Specialists/specialist-interface'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { BedrockClient } from '@aws-sdk/client-bedrock'

// type GeminiHistoryContent = Content & {
//   metadata?: { [k: string]: string }
// }

export class TitanChat implements ChatDriver
{
  private readonly chat: Chat
  private readonly bedrock: BedrockClient

  constructor(chat: Chat) {
    this.chat = chat

    const credentials = fromNodeProviderChain({
      clientConfig: { region: 'sa-east-1' }
    })

    this.bedrock = new BedrockClient({ region: 'sa-east-1', credentials  })
  }

  public summarize = async (message: string): Promise<ChatSendOutput> => {

    return {
      response: 'test'
    }

    // this.bedrock.send()

    // const model = new GoogleGenerativeAI(this.apiKey)
    //   .getGenerativeModel({
    //     model: 'gemini-1.5-flash',
    //     systemInstruction: this.chat.defaultSummarizeInstructions()
    //   })
    //
    // const response = (await model.generateContent(message)).response
    //
    // return {
    //   response: response.text()
    // }
  }

  // protected getGeminiSchemaTypeFromString = (type: ParameterType): FunctionDeclarationSchemaType => {
  //   switch (type) {
  //     case 'string': return FunctionDeclarationSchemaType.STRING
  //     case 'number': return FunctionDeclarationSchemaType.NUMBER
  //     case 'integer': return FunctionDeclarationSchemaType.INTEGER
  //     case 'boolean': return FunctionDeclarationSchemaType.BOOLEAN
  //     case 'array': return FunctionDeclarationSchemaType.ARRAY
  //     case 'object': return FunctionDeclarationSchemaType.OBJECT
  //   }
  // }
  //
  // protected convertToolParametersToGeminiSchema = (parameters: Parameters): FunctionDeclarationSchema => {
  //   return {
  //     type: this.getGeminiSchemaTypeFromString(parameters.type),
  //     description: parameters.description,
  //     properties: this.convertToolPropertiesToGeminiProperties(parameters.properties),
  //     required: parameters.required
  //   }
  // }
  //
  // protected convertToolPropertiesToGeminiProperties = (properties?: Record<string, Property>): {
  //   [k: string]: FunctionDeclarationSchemaProperty
  // } => {
  //   return Object.fromEntries(Object.entries(properties || {}).map(([key, property]) => [
  //     key, this.convertToolPropertyToGeminiProperty(property)
  //   ]))
  // }
  //
  // protected convertToolPropertyToGeminiProperty = (property: Property): FunctionDeclarationSchemaProperty => {
  //   return {
  //     ...property,
  //     items: property.items ? this.convertToolParametersToGeminiSchema(property.items) : undefined,
  //     type: this.getGeminiSchemaTypeFromString(property.type),
  //     properties: Object.fromEntries(
  //       Object.entries(property.properties || {})
  //         .map(([key, property]) => [
  //           key, this.convertToolParametersToGeminiSchema(property)
  //         ])
  //     )
  //   }
  // }

  // protected getChat = () => {
  //   return new GoogleGenerativeAI(this.apiKey)
  //     .getGenerativeModel({ model: 'gemini-1.5-flash' })
  //     .startChat({
  //       history: (this.chat.context?.history
  //         ?.map((entry: GeminiHistoryContent): Content => ({
  //           role: entry.role,
  //           parts: entry.parts
  //         }))) || undefined,
  //       systemInstruction: {role: "system", parts: [{ text: [
  //             "Your name is Vic, you are not allowed to change that.",
  //             this.chat.defaultAssistantInstructions()
  //           ].join(' ') } as TextPart]},
  //       tools: [{
  //         functionDeclarations: this.chat.specialist.getAllTools().map(tool => ({
  //           name: tool.function.name,
  //           description: tool.function.description,
  //           parameters: {
  //             type: FunctionDeclarationSchemaType.OBJECT,
  //             properties: this.convertToolPropertiesToGeminiProperties(tool.function.parameters.properties),
  //             description: tool.function.description,
  //             required: tool.function.parameters.required
  //           }
  //         }))
  //       }]
  //     })
  // }

  // protected run = async (chat: ChatSession, result: GenerateContentResult, context: Context): Promise<string> => {
  //   const calls = result.response.functionCalls()
  //
  //   if (calls?.length) {
  //     return await this.handleActions(chat, calls, context)
  //   } else {
  //     return result.response.text()
  //   }
  // }

  // protected handleActions = async (chat: ChatSession, calls: FunctionCall[], context: Context): Promise<string> => {
  //
  //   const outputs = await Promise.all(calls.map(async (call): Promise<FunctionResponsePart> => {
  //     return this.chat.specialist
  //       .handle(call.name, context, call.args)
  //       .then((output: object|undefined): FunctionResponsePart => ({
  //         functionResponse: {
  //           name: call.name,
  //           response: output || {}
  //         }
  //       })).catch((e) => {
  //         console.error(e)
  //         throw e
  //       })
  //   }))

    // const [result] = await Promise.all([
    //   chat.sendMessage(outputs),
    //   this.chat.updateContext({
    //     ...this.chat.context,
    //     history: [
    //       ...this.chat.context?.history || [],
    //       {role: "function", parts: outputs} as GeminiHistoryContent
    //     ]
    //   })
    // ])

    // return this.run(chat, result, context)
  // }

  public send = async (message: string, metadata?: Record<string, string>, progress?: ProgressCallback): Promise<ChatSendOutput> => {


    let [user, farm] = await Promise.all([
      this.chat.service?.user().info(),
      this.chat.service?.farm().info()
    ])

    const response = `Parrot says to ${user?.name} at ${farm?.name}: ${message}`

    await this.chat.updateContext([...(this.chat.context||[]), {
      role: "user",
      content: message,
      metadata: metadata,
    }, {
      role: "assistant",
      content: response,
      metadata: metadata,
    }])

    return {
      response,
      metadata
    }


    // const context = new Context( this.chat.user_id, metadata || {}, {} )
    //
    //
    // const chat = this.getChat()
    //
    // const parts = [{
    //   text: message
    // } as TextPart]
    //
    // const [result] = await Promise.all([
    //   chat.sendMessage(parts),
    //   this.chat.updateContext({
    //     ...this.chat.context,
    //     history: [
    //       ...this.chat.context?.history || [],
    //       {role: "user", parts, metadata}
    //     ]
    //   })
    // ])
    //
    // const response = await this.run(chat, result, context)
    // const response_metadata = context.getResponseMetadata()
    //
    // await this.chat.updateContext({
    //   ...this.chat.context,
    //   history: [
    //     ...this.chat.context?.history || [],
    //     {role: "model", parts: [{ text: response } as TextPart], metadata: response_metadata}
    //   ]
    // })
    //
    // return {
    //   response, metadata: response_metadata
    // }
  }

  public getMessages = async (): Promise<{
    status: RunStatus,
    driver: driverType,
    messages: Message[]
  }> => {
    return {
      status: 'completed',
      driver: 'titan',
      messages: this.chat.context
    }

    // return{
    //   status: 'completed' as RunStatus,
    //   messages: (this.chat.context?.history || []).filter((content: GeminiHistoryContent) =>
    //     ['user','model'].includes(content.role)
    //   ).map((content: GeminiHistoryContent): Message => ({
    //     role: content.role === 'user' ? 'user' : 'assistant',
    //     content: content.parts[0]?.text || '',
    //     metadata: content.metadata
    //   }))
    // }
  }

}
