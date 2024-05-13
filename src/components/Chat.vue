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
  {
    'fromVic': true,
    'text': 'Olâ, Sou a Vic. Pergunte-me qualquer coisa vaca.'
  }, {
    'fromVic': false,
    'text': 'Vaca?'
  }, {
    'fromVic': true,
    'text': 'Sua mãe!'
  }
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
  inputMessage.value?.focus()
  message.value = ''
}

</script>

<template>
  <div class="w-full px-2 flex flex-col max-h-screen min-h-0 flex-grow">
    <div class="
          dark:bg-neutral-800 bg-neutral-300 text-white rounded-lg
          mb-2 px-3 py-4 flex flex-col align-content-space-around gap-3
          overflow-y-auto flex-grow
        ">
      <Message v-for="(message, index) in messages" :from-vic="message.fromVic" :text="message.text" :key="index" />
    </div>
    <form @submit.prevent="test" class="flex align-content-space-between gap-2 ">

      <input type="text"
             ref="inputMessage"
             :autofocus="true"
             class="px-3 rounded-lg flex-grow dark:bg-white bg-neutral-200 min-w-1"
             :class="{
                'text-gray-500': state !== 'ready',
                'text-black': state === 'ready'
             }"
             :readonly="state !== 'ready'"
             placeholder="Escreva aqui..."
             v-model="message"
             @keyup.enter="test"
      >
      <input type="submit" value="Enviar" class="
            px-4 py-3 border-solid  rounded-lg border-1
            text-green-950 font-bold cursor-pointer
          " :class="{
            'bg-gray-400': state !== 'ready',
            'border-gray-400': state !== 'ready',
            'bg-green-500': state === 'ready',
            'border-green-500': state === 'ready',
          }" :disabled="state !== 'ready'"
      />
    </form>
  </div>
</template>
