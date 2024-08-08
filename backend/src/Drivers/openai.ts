import OpenAI from 'openai'
import { ChatDriver, ProgressCallback } from '#/Drivers/chat-driver'
import dotenv from 'dotenv'
import { Chat, ChatSendOutput, driverType } from '#/chat'
import { Message as VicMessage } from '#/message'
import { Assistant, AssistantUpdateParams, Threads } from 'openai/resources/beta'
import { RequiredActionFunctionToolCall, RunSubmitToolOutputsParams } from 'openai/src/resources/beta/threads/runs/runs'
import { Messages } from 'openai/resources/beta/threads'
import { Context } from '#/Context'
import { compareObjectsWithCallbacks } from '#/utils'
import { MessageCreationStepDetails, RunStep, ToolCall } from 'openai/resources/beta/threads/runs'
import { ToolCallsStepDetails } from 'openai/src/resources/beta/threads/runs/steps'
import Run = Threads.Run
import Message = Messages.Message
import RunStatus = Threads.RunStatus

dotenv.config()

export class OpenAiChat implements ChatDriver {
  private readonly apiKey: string
  private readonly organization: string
  private readonly chat: Chat
  private readonly openai: OpenAI

  private readonly assistant_id: string
  private readonly vector_store_ids: string[]
  private thread_id?: string

  constructor(chat: Chat) {
    this.apiKey = process.env.OPENAI_API_KEY || ''
    this.organization = process.env.OPENAI_ORGANIZATION || ''
    this.vector_store_ids = (process.env.OPENAI_VECTOR_STORE_IDS || '')
      .split(',').filter(e => !!e)
    this.chat = chat
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      organization: this.organization
    })
    this.assistant_id = this.chat.context?.assistant_id || process.env.OPENAI_ASSISTANT
    this.thread_id = this.chat.context?.thread_id
  }

  public summarize = async (message: string): Promise<ChatSendOutput> => {
    return this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: this.chat.defaultSummarizeInstructions()
      }, {
        role: 'user',
        content: message
      }]
    }).then(output => {
      let response = output.choices[0].message.content
      if (response === null) throw 'OpenAI did not respond'
      return {
        response: response
      }
    })
  }

  protected migrateAssistant = async (): Promise<void> => {

    const assistantDefinition: AssistantUpdateParams = {
      name: 'Vic',
      model: 'gpt-3.5-turbo',
      instructions: this.chat.defaultAssistantInstructions(),
      tools: [
        ...(this.chat.specialist.getAllTools()),
        { type: 'file_search' }
      ],
      tool_resources: { file_search: { vector_store_ids: this.vector_store_ids } }
    }

    const assistant: Assistant = await this.openai.beta.assistants.retrieve(this.assistant_id)

    const toolDiffs = compareObjectsWithCallbacks(assistant.tools, assistantDefinition.tools, {
      onRemove(key, value) {
        if ((key === 'description') && (value === null)) {
          return false
        } // ignore null description
      }
    })

    if (Object.entries(toolDiffs).length > 0 ) console.log(toolDiffs)

    const needsUpdate = (
      Object.entries(toolDiffs).length > 0 ||
      (assistant.instructions != assistantDefinition.instructions) ||
      (assistant.model != assistantDefinition.model) ||
      (assistant.name != assistantDefinition.name)
    )

    console.log(assistant)

    if (needsUpdate) {
      console.log('Updating Assistant')
      await this.openai.beta.assistants.update(assistant.id, assistantDefinition)
    }
  }

  protected getThread = async (): Promise<string> => {
    return this.thread_id ??= await this.openai.beta.threads.create()
      .then(async (thread): Promise<string> => {
        await this.chat.updateContext({
          ...this.chat.context,
          thread_id: thread.id
        })
        return thread.id
      })
  }

  protected processConfirmations = async (thread_id: string, context: Context) => {
    return this.openai.beta.threads.messages.list(thread_id).then(async messages => {
      if (messages.data.length === 0) {
        return
      }

      await Promise.all(messages.data.map(async (message: Message, index: number) => {
        let history_metadata: { confirmation?: string } | null = message.metadata as Record<string, string> | null
        return context.processConfirmation(history_metadata?.confirmation, index === 0)
      }))
    })
  }


  private handleActions = async (run: Run, context: Context, progress?: ProgressCallback): Promise<Threads.Message> => {
    if (
      run.required_action &&
      run.required_action.submit_tool_outputs &&
      run.required_action.submit_tool_outputs.tool_calls
    ) {

      !!progress && progress({
        actions: run.required_action.submit_tool_outputs.tool_calls.map((call) => call.function.name)
      })

      const toolOutputs = await Promise.all(run.required_action.submit_tool_outputs.tool_calls.map(
        async (tool: RequiredActionFunctionToolCall): Promise<RunSubmitToolOutputsParams.ToolOutput> => {

          const args = JSON.parse(tool.function.arguments)

          return this.chat.specialist
            .handle(tool.function.name, context, args)
            .then((output: object | undefined) => ({
              tool_call_id: tool.id,
              output: JSON.stringify(output || '{}')
            })).catch((e) => {
              console.error(e)
              throw e
            })

        }
      ))

      if (toolOutputs.length > 0) {
        run = await this.openai.beta.threads.runs.submitToolOutputsAndPoll(
          run.thread_id,
          run.id,
          { tool_outputs: toolOutputs }
        )
      }
    }

    return this.pollRun(run, context, progress)
  }

  private pollRun = async (run: Run, context: Context, progress?: ProgressCallback): Promise<Threads.Message> => {
    if (run.status === 'completed') {
      const messages = await this.openai.beta.threads.messages.list(run.thread_id)
      return messages.data[0]
    } else if (run.status === 'requires_action') {
      return this.handleActions(run, context, progress)
    }
    throw 'Error processing response'
  }

  public send = async (message: string, metadata?: Record<string, string>, progress?: ProgressCallback): Promise<ChatSendOutput> => {

    const hasThread = this.chat.context?.thread_id !== undefined

    if (!hasThread) {
      await this.migrateAssistant()
    }

    let context = new Context(this.chat.user_id, metadata || {}, {})

    const [thread_id] = await Promise.all([
      this.getThread(),
      hasThread && this.thread_id ? this.processConfirmations(this.thread_id, context) : null
    ])

    await this.openai.beta.threads.messages.create(thread_id, {
      role: 'user',
      content: message
    })

    let run: Run = await this.openai.beta.threads.runs.createAndPoll(
      thread_id, { assistant_id: this.assistant_id }
    )

    return this.pollRun(run, context, progress).then(async (message: Threads.Message): Promise<ChatSendOutput> => {

      await this.openai.beta.threads.messages.update(
        thread_id, message.id, {
          metadata: context.getResponseMetadata()
        }
      )

      const actions = await this.openai.beta.threads.runs.steps.list(thread_id, run.id)
        .then((steps) => this.getActionsFromRunSteps(steps.data))

      return {
        response: message?.content[0].type === 'text' ? message.content[0].text.value : '',
        actions: actions,
        metadata: context.getResponseMetadata()
      }
    }).catch((e) => {
      console.trace('Error processing message: ', e)
      return {
        response: 'Error processing message'
      }
    })
  }

  protected getActionsFromRunSteps = (steps: RunStep[]): string[] => {
    return (steps.map((step: RunStep) => step.step_details)
      .map((details: ToolCallsStepDetails | MessageCreationStepDetails) => {
        if (details.type === 'tool_calls') {
          return details.tool_calls.map((call: ToolCall) => {
            if (call.type === 'function') {
              return call.function.name
            } else if (call.type === 'file_search') {
              return 'file_search'
            } else {
              return undefined
            }
          }).filter(e => e !== undefined)
        } else if (details.type === 'message_creation') {
          return undefined
        }
      }).filter(e => e !== undefined).flat().reverse()) as string[]
  }

  public getMessages = async (): Promise<{
    status: RunStatus
    driver: driverType,
    messages: VicMessage[]
  }> => {
    const thread_id = await this.getThread()

    const [messages, runs] = await Promise.all([
      this.openai.beta.threads.messages.list(thread_id),
      this.openai.beta.threads.runs.list(thread_id)
    ])

    const status = runs.data.reduce((a, b) => a.created_at > b.created_at ? a : b).status

    const run_steps: Record<string, RunStep[]> = Object.fromEntries(await Promise.all(runs.data.map((run: Run) =>
      this.openai.beta.threads.runs.steps.list(thread_id, run.id).then((steps) =>
        [run.id, steps.data]
      )
    )))


    return {
      status: status,
      driver: 'chatgpt',
      messages: messages.data.reverse().map((message) => ({
        role: message.role,
        content: message.content[0].type === 'text' ? message.content[0].text.value : '',
        metadata: message.metadata as Record<string, string> | null,
        actions: message.run_id
          ? this.getActionsFromRunSteps(run_steps[message.run_id])
          : undefined
      }))
    }
  }
}
