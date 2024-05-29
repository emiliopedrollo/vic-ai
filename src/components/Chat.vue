<script setup lang="ts">
import { useMainStore } from '@/stores/main'
import Message from '@/components/Message.vue'
import { ref } from 'vue'
import { useOAuthStore } from '@/stores/oauth'
import { useChatStore } from '@/stores/chat'
import type { Farm } from '@/Interfaces/farm'
import { Socket } from '@/Socket'

const store = useMainStore()
// store.$reset()

const state = ref<string>('ready')
const message = ref<string>('')
const inputMessage = ref<HTMLInputElement|null>(null)
const chatArea = ref<HTMLElement|null>(null)
const chatId = ref<string|null>(null)
const oauth = useOAuthStore()
let socket: Socket;

const props = defineProps<{
  farm: Farm | undefined,
  chat_id: string | null,
}>()

const emit = defineEmits<{
  (e: 'changeChatId', id: string|null): void
}>()

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
    messages.value = await socket.loadChat(chat_id)
    updateChatId(chat_id)
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


function scrollToBottom() {
  setTimeout(() => {
    if (!chatArea.value) return
    chatArea.value.children[chatArea.value.children.length-1]
      .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
  },200)
}

function setupWebSocket() {

  socket = new Socket({
    getAuthToken: async () => oauth.accessToken,
    getCurrentFarm: () => props.farm?.slug || '',
    handleAuth: (id, success, chatsData) => {
      chats?.setChatData(chatsData)
      state.value = (success) ? 'ready' : 'error'
    },
    handleResponse: (chat_id: string, text: string) => {
      updateChatId(chat_id)
      messages.value = [...messages.value, {
        'role': 'assistant',
        'content': text
      }]
      state.value = 'ready'
      scrollToBottom()
    },
    handleUpdateChats: (chatsData) => {
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
  content: string
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

function process(text: string|null = null)
{
  text = text || message.value
  state.value = 'processing'
  messages.value = [...messages.value, {
    'role': 'user',
    'content': text
  }]
  socket.sendMessage(chatId.value, text)
  scrollToBottom()
  inputMessage.value?.focus()
  message.value = ''
}

function startChatWithText(message: string) {
  // console.log(message)
  process(message)
}

function send(event: any) {
  // console.log(event)
  if (message.value.trim() === '') return
  process()
}

</script>

<template>
  <div class="w-full flex flex-col max-h-screen min-h-0 flex-grow">
    <div ref="chatArea" class="
          text-white
          mb-2 px-2 pt-4 flex flex-col align-content-space-around gap-3
          overflow-y-auto flex-grow
        ">
      <Message v-for="(message, index) in messages" :role="message.role" :content="message.content" :key="index" />
      <div v-if="Array.from(messages).length === 0" class="h-full">
        <div class="flex flex-col h-full justify-center">
          <div class="self-center bg-[#FFFFFF] dark:bg-[#4D4D4D] rounded-full w-[100px] h-[100px] text-center">
            <img class="h-[100px] inline-block" src="\hello.svg"/>
          </div>
          <div class="self-center text-2xl mt-12 text-[#666666] dark:text-white">Como posso te ajudar?</div>
          <div class="flex flex-row flex-wrap gap-5 justify-center align-center mt-8 mb-20">
            <div v-for="n in 4" class="w-1/3 text-center text-[#808080] dark:text-white">
              <div class="
                w-full inline-block text-start p-7 dark:bg-[#999999] bg-[#FFFFFF] rounded-[16px] cursor-pointer
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
      <input type="submit" value="Enviar" class="
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
