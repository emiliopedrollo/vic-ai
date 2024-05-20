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
        setTimeout(() => {
          chatArea.value.children[chatArea.value.children.length-1]
            .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
        },200)

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

function test(event: any) {
  if (message.value.trim() === '') return

  state.value = 'processing'
  messages.value = [...messages.value, {
    'fromVic': false,
    'text': message.value
  }]
  socket.send(JSON.stringify({
    type: 'message',
    message: message.value
  }))
  setTimeout(() => {
    chatArea.value.children[chatArea.value.children.length-1]
      .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
  },200)
  inputMessage.value?.focus()
  message.value = ''
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
      <div v-if="messages.length === 0">
        <img src="\hello.svg"/>
      </div>
    </div>
    <div class="
      dark:text-neutral-50 text-[#808080] font-bold ps-3 pb-1
    ">
      <span class="transition-opacity" :class="{'opacity-0': state !== 'processing'}">Vic está digitando...</span>
    </div>
    <form @submit.prevent="test" class="
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
             @keyup.enter="test"
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
