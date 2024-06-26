<script setup lang="ts">
import { useMainStore } from '@/stores/main'
import Message from '@/components/Message.vue'
import { ref } from 'vue'
import { useOAuthStore } from '@/stores/oauth'
import { useChatStore } from '@/stores/chat'
import type { Farm } from '@/Interfaces/farm'
import { Socket } from '@/Socket'
import { debug, group, groupEnd, info, log } from '@/logger'
import Confirmation, { type ConfirmationStatus, type ConfirmationTypes } from '@/components/Confirmation.vue'
import type { LLM } from '@/Interfaces/llm'

const store = useMainStore()
// store.$reset()

const state = ref<string>('ready')
const message = ref<string>('')
const inputMessage = ref<HTMLInputElement|null>(null)
const chatArea = ref<HTMLElement|null>(null)
const chatId = ref<string|null>(null)
const oauth = useOAuthStore()
const confirmationUpdate = ref<number>(0)
let socket: Socket;

const props = defineProps<{
  farm: Farm | undefined,
  chat_id: string | null,
  llm: LLM
}>()

const emit = defineEmits<{
  (e: 'changeChatId', id: string|null): void
}>()

const loadConfirmations = async () => {
  return Promise.all(
    messages.value
      .map(message =>
        message.metadata?.confirmation
          ? loadConfirmation(message.metadata?.confirmation)
          : null
      ).filter(promise => promise !== null)
  )
}

const loadConfirmation = async (confirmation_id: string): Promise<void> => {
  let confirmation = await socket.loadConfirmation(confirmation_id)
  log("Confirmation loaded:", confirmation)
  confirmations.value[confirmation_id] = confirmation
  confirmationUpdate.value++
}

const updateChatId = (new_id: string|null): void => {
  chatId.value = new_id
  emit('changeChatId', new_id)
}

const removeChat = (chat_id: string) => {
  socket.deleteChat(chat_id)
  if (chat_id === chatId.value) {
    messages.value = []
    updateChatId(null)
  }
}

const loadChat = async (chat_id: string) => {
  if (chat_id !== chatId.value) {
    const {
      status,
      messages: chat_messages
    }  = await socket.loadChat(chat_id)

    group('Load Chat')
    chat_messages.forEach((entry) => info(entry))
    groupEnd()

    // table(chat_messages.map((entry) => ({
    //   role: entry.role,
    //   content: entry.content,
    //   metadata: JSON.stringify(entry.metadata)
    // })))
    state.value = "loading"
    messages.value = chat_messages
    updateChatId(chat_id)
    await loadConfirmations()
    scrollToBottom("instant", 0)
    state.value = ["completed","expired","incomplete"].includes(status) ? "ready" : "processing"
  }
}

const newChat = async () => {
  messages.value = []
  updateChatId(null)
  inputMessage.value?.focus()
}

const getChatId = () => {
  return chatId.value
}

const disconnect = () => {
  socket?.disconnect()
}

defineExpose({
  removeChat,
  loadChat,
  newChat,
  getChatId,
  disconnect,
})

const chats = props.farm ? useChatStore(props.farm?.slug) : null


function scrollToBottom(
  behavior: "auto" | "instant" | "smooth" = "smooth",
  delay: number = 200
) {
  setTimeout(() => {
    if (!chatArea.value) return
    chatArea.value.children[chatArea.value.children.length-1]
      .scrollIntoView({ behavior, block: "end", inline: "nearest" })
  }, delay)
}

function setupWebSocket() {

  socket = new Socket({
    getAuthToken: async () => oauth.accessToken,
    getCurrentFarm: () => props.farm?.slug || '',
    handleAuth: (id, success, chatsData) => {
      chats?.setChatData(chatsData)
      state.value = (success) ? 'ready' : 'error'
    },
    handleResponse: (chat_id: string, text: string, metadata?: Record<string, string>|null ) => {
      debug("RESPONSE", text, metadata)
      if (chatId.value === null || (chatId.value  === chat_id)) {
        updateChatId(chat_id)
        messages.value = [...messages.value, {
          'role': 'assistant',
          'content': text,
          'metadata': metadata,
        }]
        loadConfirmations()
        state.value = 'ready'
        scrollToBottom()
      }
    },
    handleUpdateChats: (chatsData) => {
      debug("UPDATE CHATS", chatsData)
      chats?.setChatData(chatsData)
      if (chatId.value && !chatsData?.find(item => item.id === chatId.value)) {
        updateChatId(null)
        messages.value = []
      }
    },
    handleUnexpectedClose: () => {
      setTimeout(setupWebSocket, 5000);
    }
  })


  // socket.addEventListener('error', () => {
  //   console.log('ws error')
  //   setupWebSocket()
  // })

}
setupWebSocket()

export interface Message {
  uuid?: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, string>|null
}

export interface Confirmation {
  id: string,
  details: Record<ConfirmationTypes, { args: Record<string,string>, extra: Record<string,string> }[]>,
  status: ConfirmationStatus
}

const suggestions = ref<{html: string, text:string}[]>([
    {
      html: '<span class="font-bold text-base">Me mostre a influência</span></br>' +
        '<span class="text-sm">dos indicadores alternados do rebanho</span>',
      text: 'Me mostre a influência dos indicadores alternados de rebanho'
    },{
      html: '<span class="font-bold text-base">Me mostre a influência</span></br>' +
        '<span class="text-sm">dos indicadores alternados do rebanho</span>',
      text: 'Me mostre a influência dos indicadores alternados de rebanho'
    },{
      html: '<span class="font-bold text-base">Me mostre a influência</span></br>' +
        '<span class="text-sm">dos indicadores alternados do rebanho</span>',
      text: 'Me mostre a influência dos indicadores alternados de rebanho'
    },{
      html: '<span class="font-bold text-base">Olá, qual seu nome?</span></br>' +
        '<span class="text-sm">E em que você pode me ajudar?</span>',
      text: 'Olá, qual seu nome? e em que você pode me ajudar?'
    },
]
  .map(value => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value)
)

// const chats = ref<{
//   id: string,
//   resume: string
// }[]>([])

const confirmations = ref<Record<string, Confirmation>>({})

const messages = ref<Message[]>([
  // {
  //   'role': 'user',
  //   'text': 'Quantas vacas de até dois anos que tenho na enfermaria'
  // }, {
  //   'role': 'assistant',
  //   'text': 'No momento 18 vacas com até dois anos estão na sua enfermaria'
  // }, {
  //   'role': 'user',
  //   'text': 'Quantas em estado grave?'
  // }, {
  //   'role': 'assistant',
  //   'text': 'No momento 5 vacas com até dois anos estão nem estado grave'
  // }, {
  //   'role': 'user',
  //   'text': 'Quanto está a ruminação delas?'
  // }
])

function process(text: string|null = null, metadata?: Record<string, string>)
{
  text = text || message.value
  state.value = 'processing'
  messages.value = [...messages.value, {
    'role': 'user',
    'content': text,
    'metadata': metadata
  }]
  socket.sendMessage(chatId.value, text, metadata, props.llm)
  scrollToBottom()
  inputMessage.value?.focus()
  message.value = ''
}

function startChatWithText(message: string) {
  process(message)
}

function send() {
  if (message.value.trim() === '') return
  process()
}

function confirmRequest(confirmation_id: string) {
  info("Send confirmation:", confirmation_id)
  process("Confirmar", {
    confirm: confirmation_id,
  })
}
function rejectRequest(confirmation_id: string) {
  info("Send confirmation rejection:", confirmation_id)
  process("Cancelar", {
    reject: confirmation_id,
  })
}

</script>

<template>
  <div class="w-full flex flex-col max-h-screen min-h-0 flex-grow">
    <div ref="chatArea" class="
          text-white
          mb-2 px-2 pt-4 flex flex-col align-content-space-around gap-3
          overflow-y-auto flex-grow
        " :class='{"opacity-0": state === "loading"}'>
      <div v-for="(message, index) in messages" class="flex flex-col">
        <Message :role="message.role" :content="message.content" :key="index" />
        <Confirmation
            v-if="message.metadata && message.metadata['confirmation']"
            @confirm="confirmRequest"
            @reject="rejectRequest"
            :ready="state === 'ready'"
            v-model="confirmations[message?.metadata['confirmation']]"
        />
      </div>
      <div v-if="Array.from(messages).length === 0" class="h-full">
        <div class="flex flex-col h-full justify-center">
          <div class="self-center bg-[#FFFFFF] dark:bg-[#4D4D4D] rounded-full w-[100px] h-[100px] text-center">
            <img class="h-[100px] inline-block" src="\hello.svg" alt="Vic says Hello"/>
          </div>
          <div class="self-center text-2xl mt-12 text-[#666666] dark:text-white">Como posso te ajudar?</div>
          <div class="flex flex-row align-stretch flex-wrap gap-5 justify-center align-center mt-8 mb-20">
            <div v-for="n in 4" class="w-1/3 text-center text-[#808080] dark:text-white">
              <div class="
                w-full h-full inline-block text-start p-7 dark:bg-[#999999] bg-[#FFFFFF] rounded-[16px] cursor-pointer
              " v-on:click="startChatWithText(suggestions[n-1].text)">
                <span class="font-500 text-base" v-html="suggestions[n-1].html"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="
      dark:text-neutral-50 text-[#808080] font-bold ps-3 pb-1
    ">
      <span class="transition-opacity" :class="{'opacity-0': state !== 'processing'}">Vic está digitando...</span>
    </div>
    <form @submit.prevent="send" class="
      flex align-content-space-between gap-2
      p-4 dark:bg-[#333333] bg-[#FFFFFF]
    ">
      <input type="text"
             ref="inputMessage"
             :autofocus="true"
             class="px-3 flex-grow min-w-1 dark:text-white focus:outline-none focus:border-none"
             :readonly="state !== 'ready'"
             placeholder="Escreva sua mensagem aqui"
             v-model="message"
      >
      <input type="submit" :value="( 'Enviar ' + ((!chatId && props.llm !== 'Padrão') ? `[${props.llm}]` : '')).trim()" class="
            px-4 py-3 rounded-[8px] cursor-pointer
          " :class="{
            'bg-[#F2F2F2]': state !== 'ready',
            'dark:bg-[#999999]': state !== 'ready',
            '!text-[#808080]': state !== 'ready',
            'dark:!text-[#F2F2F2]': state !== 'ready',
            'dark:!text-white': state === 'ready',
            'bg-[#59B834]': state === 'ready',
            '!text-white': state === 'ready',
          }" :disabled="state !== 'ready'"
      />
    </form>
  </div>
</template>
