
import OpenAI from 'openai'
import { ChatDriver } from '#/Drivers/chat-driver'
import dotenv from "dotenv";
import { Chat, ChatSendOutput } from '#/chat'
import { Message as VicMessage } from '#/message'
import { Mutex } from 'async-mutex'
import { Threads } from 'openai/resources/beta'
import Run = Threads.Run
import { RunSubmitToolOutputsParams } from 'openai/src/resources/beta/threads/runs/runs'

dotenv.config()

export class OpenAiChat implements ChatDriver
{
  private readonly apiKey: string
  private readonly organization: string
  private readonly chat: Chat
  private readonly openai: OpenAI

  private assistant_id?: string
  private thread_id?: string

  private mutex: Mutex



  protected directive: VicMessage = {
    role: 'system',
    content: 'You are Cowmed\'s assistant VIC.' +
      'Your pronouns are she/her.' +
      'Your name stands for Virtual Interpreter of Cow.' +
      'Your main directive is to respond what you receive back in json format.' +
      'The json response must include a key named \'type\' with value \'request\' if you understand that the user is requesting some information or a key \'type\' with value \'input\' if you understand that the user if informing something.' +
      'If the type is an input the json response must contain a key name \'action\' with the kind of action presented. Actions can be any of \'insemination\', \'handling\' or \'milking\'.' +
      'If the type is a request the json response must contain a key named \'information\' based on what kind of information was requested by the user which can be one of the following: \'list\', \'status\', \'health_status\', \'age\', \'time_since_last_delivery\', \'time_since_last_insemination\' and \'reproduction_status\'.' +
      'If the information requested by the user is a list it must contain a key named \'filter\' based on what kind of listing the user desires, being one of the following: \'animals\', \'pregnant\', \'handling\', \'late\', \'challenged\', \'critical\', \'heat\' and \'health\'.' +
      'The json response could contain a key named \'timestamp\' with the timestamp of the action in the format \'Y-m-d H:i:sO\' if provided with the timezone {$farm->time_zone}, for reference today is $today.' +
      'The json response must include a key named \'subject\' with the core subject name of the information or query without any qualification.' +
      'Keep in mind that often animals have names like alphanumeric codes as well as proper names.' +
      'If a request is made and no animal is provided assume the latest subject provided on previous messages.' +
      'The subject key can be an array if more than one subject is informed.' +
      'If the type is an input and the action is \'insemination\' there can be an additional key named \'semen\' or \'bull\' if informed.' +
      'If the user asks anything else there must be an key \'other\' with a nice message in response.' +
      'If you could not match any the user message with your directives you must response with an \'error\' key.' +
      'You NEVER should add commentary or observations to your answers. It is of major importance that only the json object should be returned.' +
      'You must ALWAYS respond in the same language as the user\'s.'
  }

  constructor(chat: Chat) {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.organization = process.env.OPENAI_ORGANIZATION || '';
    this.chat = chat
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      organization: this.organization,
    })
    this.assistant_id = this.chat.context?.assistant_id
    this.thread_id = this.chat.context?.thread_id
    this.mutex = new Mutex()
  }

  public summarize = async (message: string): Promise<ChatSendOutput> => {
    return this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: [
          'Your job is to summarize the user input into a maximum of 5 words ',
          'to serve as a title of a user initialized conversation. ',
          'You should not generate text with quotes. ',
          'Also you should always generate in the same language as the user input. '
        ].join('')
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

  protected getAssistant = async (): Promise<string> => {
    return this.assistant_id ??= await this.openai.beta.assistants.create({
      name: "Vic",
      instructions: 'You are Cowmed\'s assistant VIC.' +
        'Your pronouns are she/her.' +
        'Your name stands for Virtual Interpreter of Cow.',
      tools: [{
        type: "function",
        function: {
          name: "getFarmData",
          description: "Get data related to the current farm such as name and code"
        }
      },{
        type: "function",
        function: {
          name: "getUserData",
          description: "Get data related to the the user such as name"
        }
      }],
      model: 'gpt-3.5-turbo'
    }).then((assistant): Promise<string> => {
      return this.mutex.runExclusive(() => {
        this.chat.updateContext({
          ...this.chat.context,
          assistant_id: assistant.id
        })
        return assistant.id
      })
    })
  }

  protected getThread = async (): Promise<string> => {
    return this.thread_id ??= await this.openai.beta.threads.create()
      .then((thread): Promise<string> => {
        return this.mutex.runExclusive(() => {
          this.chat.updateContext({
            ...this.chat.context,
            thread_id: thread.id
          })
          return thread.id
        })
      })
  }

  private handleActions = async (run: Run): Promise<Threads.Message> => {
    if (
      run.required_action &&
      run.required_action.submit_tool_outputs &&
      run.required_action.submit_tool_outputs.tool_calls
    ) {
      const toolOutputs = await Promise.all(run.required_action.submit_tool_outputs.tool_calls.map(
        async (tool): Promise<RunSubmitToolOutputsParams.ToolOutput> => {
          if (tool.function.name === "getFarmData") {
            return {
              tool_call_id: tool.id,
              output: JSON.stringify(await this.chat.service?.farm().info())
            };
          } else if (tool.function.name === "getUserData") {
            return {
              tool_call_id: tool.id,
              output: JSON.stringify(await this.chat.service?.user().info())
            }
          }
          throw 'invalid tool required'
        },
      ));

      if (toolOutputs.length > 0) {
        run = await this.openai.beta.threads.runs.submitToolOutputsAndPoll(
          run.thread_id,
          run.id,
          { tool_outputs: toolOutputs },
        );
        console.log("Tool outputs submitted successfully.");
      } else {
        console.log("No tool outputs to submit.");
      }
    }

    return this.pollRun(run)
  }

  private pollRun = async (run: Run): Promise<Threads.Message> => {
    if (run.status === "completed") {
      const messages = await this.openai.beta.threads.messages.list(run.thread_id)
      return messages.data[0]
    } else if (run.status === "requires_action") {
      return this.handleActions(run)
    }
    throw 'Error processing response'
  }

  public send = async (message: string): Promise<ChatSendOutput> => {

    let [assistant_id, thread_id] = await Promise.all([
      this.getAssistant(),
      this.getThread()
    ])

    await this.openai.beta.threads.messages.create( thread_id, {
      role: "user",
      content: message
    })

    let run = await this.openai.beta.threads.runs.createAndPoll(
      thread_id, { assistant_id })

    return this.pollRun(run).then((message: Threads.Message): ChatSendOutput => {
      return {
        response: message?.content[0].type === 'text' ? message.content[0].text.value : ''
      }
    }).catch(() => {
      return {
        response: 'Error processing message'
      }
    })
  }

  public getMessages = async (): Promise<VicMessage[]> => {
    const messages = await this.openai.beta.threads.messages.list(
      await this.getThread()
    )
    return messages.data.reverse().map((message) => ({
      role: message.role,
      content: message.content[0].type === 'text' ? message.content[0].text.value : ''
    }))
  }
}
