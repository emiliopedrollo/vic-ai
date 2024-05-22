<script setup lang="ts">
import { useMainStore } from '@/stores/main'
import Message from '@/components/Message.vue'
import OpenAI from 'openai'
import { ref } from 'vue'
import { useOAuthStore } from '@/stores/oauth'

const store = useMainStore()
// store.$reset()

const state = ref<string>('ready')
const message = ref<string>('')
const inputMessage = ref<HTMLInputElement|null>(null)
const chatArea = ref<HTMLElement|null>(null)
const oauth = useOAuthStore()
let socket: WebSocket;

function scrollToBottom() {
  setTimeout(() => {
    if (!chatArea.value) return
    chatArea.value.children[chatArea.value.children.length-1]
      .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
  },200)
}

function setupWebSocket() {

  const sendPing = (socket: WebSocket): number => {
      socket.send(JSON.stringify({type: 'ping'}))
      return window.setTimeout(() => pingTimeoutId = sendPing(socket), 25000)
  }
  let pingTimeoutId: number

  socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_HOST)

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({
      type: 'auth',
      token: oauth.accessToken
    }))
    pingTimeoutId = sendPing(socket)
  })

  socket.addEventListener('close', () => {
    clearTimeout(pingTimeoutId)
    console.log('ws close')
    setTimeout(setupWebSocket, 5000);
  })

  // socket.addEventListener('error', () => {
  //   console.log('ws error')
  //   setupWebSocket()
  // })

  socket.addEventListener('message', function(event) {
    const data = JSON.parse(event.data)
    switch (data.type) {
      case 'auth':
        state.value = (data.success) ? 'ready' : 'error'
        break;
      case 'response':
        messages.value = [...messages.value, {
          'fromVic': true,
          'text': data.text
        }]
        state.value = 'ready'
        scrollToBottom()

        break;
    }
  })
}
setupWebSocket()


// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
// const OPENAI_ORGANIZATION = import.meta.env.VITE_OPENAI_ORGANIZATION
//
//
// const openai = new OpenAI({
//   apiKey: OPENAI_API_KEY,
//   organization: OPENAI_ORGANIZATION,
//   dangerouslyAllowBrowser: true
// })

interface Message {
  uuid?: string,
  fromVic: boolean,
  text: string
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
      html: '<span class="font-bold text-base">Me mostre a influência</span></br>' +
        '<span class="text-sm">dos indicadores alternados do rebanho</span>',
      text: 'Me mostre a influência dos indicadores alternados de rebanho'
    },
]
  .map(value => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value)
)

const messages = ref<Message[]>([
  // {
  //   'fromVic': false,
  //   'text': 'Quantas vacas de até dois anos que tenho na enfermaria'
  // }, {
  //   'fromVic': true,
  //   'text': 'No momento 18 vacas com até dois anos estão na sua enfermaria'
  // }, {
  //   'fromVic': false,
  //   'text': 'Quantas em estado grave?'
  // }, {
  //   'fromVic': true,
  //   'text': 'No momento 5 vacas com até dois anos estão nem estado grave'
  // }, {
  //   'fromVic': false,
  //   'text': 'Quanto está a ruminação delas?'
  // }
])

function process(text: string|null = null)
{
  text = text || message.value
  state.value = 'processing'
  messages.value = [...messages.value, {
    'fromVic': false,
    'text': text
  }]
  socket.send(JSON.stringify({
    type: 'message',
    message: text
  }))
  scrollToBottom()
  inputMessage.value?.focus()
  message.value = ''
}

function startChatWithText(message: string) {
  console.log(message)
  process(message)
}

function send(event: any) {
  console.log(event)
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
      <Message v-for="(message, index) in messages" :from-vic="message.fromVic" :text="message.text" :key="index" />
      <div v-if="messages.length === 0" class="h-full">
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
             @keyup.enter="send"
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
