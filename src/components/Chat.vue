<script setup lang="ts">
import { useMainStore } from '@/stores/main'
import Message from '@/components/Message.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useOAuthStore } from '@/stores/oauth'
import { useChatStore } from '@/stores/chat'
import type { Farm } from '@/Interfaces/farm'
import { Socket } from '@/Socket'
import { debug, group, groupEnd, info, log } from '@/logger'
import Confirmation, {
  type ConfirmationStatus,
  type ConfirmationTypes
} from '@/components/Confirmation.vue'
import type { LLM } from '@/Interfaces/llm'


const store = useMainStore()
// store.$reset()

const state = ref<string>('ready')
const message = ref<string>('')
const inputMessage = ref<HTMLInputElement | null>(null)
const chatArea = ref<HTMLElement | null>(null)
const chatId = ref<string | null>(null)
const oauth = useOAuthStore()
const confirmationUpdate = ref<number>(0)
let large = ref<boolean>(window.innerWidth > 900)
const updateSize = () => {
  large.value = window.innerWidth > 900
}

onMounted(() => {
  window.addEventListener('resize', updateSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
})
let socket: Socket

const props = defineProps<{
  farm: Farm | undefined
  chat_id: string | null
  llm: LLM
}>()

const emit = defineEmits<{
  (e: 'changeChatId', id: string | null): void
}>()

const loadConfirmations = async () => {
  return Promise.all(
    messages.value
      .map((message) =>
        message.metadata?.confirmation ? loadConfirmation(message.metadata?.confirmation) : null
      )
      .filter((promise) => promise !== null)
  )
}

const loadConfirmation = async (confirmation_id: string): Promise<void> => {
  let confirmation = await socket.loadConfirmation(confirmation_id)
  log('Confirmation loaded:', confirmation)
  confirmations.value[confirmation_id] = confirmation
  confirmationUpdate.value++
}

const updateChatId = (new_id: string | null): void => {
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
    state.value = 'loading'

    const { status, driver, messages: chat_messages } = await socket.loadChat(chat_id)

    group(`Load ${driver} Chat`)
    chat_messages.forEach((entry) => info(entry))
    groupEnd()

    // table(chat_messages.map((entry) => ({
    //   role: entry.role,
    //   content: entry.content,
    //   metadata: JSON.stringify(entry.metadata)
    // })))
    messages.value = chat_messages
    updateChatId(chat_id)
    await loadConfirmations()
    scrollToBottom('instant', 0)
    state.value = ['completed', 'expired', 'incomplete'].includes(status) ? 'ready' : 'processing'
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
  disconnect
})

const chats = props.farm ? useChatStore(props.farm?.slug) : null

function scrollToBottom(behavior: 'auto' | 'instant' | 'smooth' = 'smooth', delay: number = 200) {
  setTimeout(() => {
    if (!chatArea.value) return
    chatArea.value.children[chatArea.value.children.length - 1].scrollIntoView({
      behavior,
      block: 'end',
      inline: 'nearest'
    })
  }, delay)
}

function setupWebSocket() {
  socket = new Socket({
    getAuthToken: async () => oauth.accessToken,
    getCurrentFarm: () => props.farm?.slug || '',
    handleAuth: (id, success, chatsData) => {
      chats?.setChatData(chatsData)
      state.value = success ? 'ready' : 'error'
    },
    handleResponseProgress: (chat_id: string, text?: string, actions?: string[]) => {
      debug("PROCESSING")
      if (chatId.value === null || (chatId.value  === chat_id)) {
        updateChatId(chat_id)

        const current: Message|undefined = messages.value.find((message) => message.processing)

        messages.value = [...(messages.value).filter((message) => message.processing !== true), {
          'role': 'assistant',
          'processing': true,
          'content': (!!current?.content || !!text) ? (current?.content || '') + (text || '') : undefined,
          'actions': [...(current?.actions || []), ...(actions || [])],
        }]
        console.log('PROGRESS', messages.value)
        scrollToBottom()
      }
    },
    handleResponse: (chat_id: string, text: string, actions?: string[], metadata?: Record<string, string>|null ) => {
      debug("RESPONSE", text, metadata)
      if (chatId.value === null || (chatId.value  === chat_id)) {
        updateChatId(chat_id)
        messages.value = [...(messages.value).filter((message) => message.processing !== true), {
          'role': 'assistant',
          'content': text,
          'actions': actions,
          'metadata': metadata,
        }]
        console.log('RESPONSE', messages.value)
        loadConfirmations()
        state.value = 'ready'
        scrollToBottom()
      }
    },
    handleUpdateChats: (chatsData) => {
      debug('UPDATE CHATS', chatsData)
      chats?.setChatData(chatsData)
      if (chatId.value && !chatsData?.find((item) => item.id === chatId.value)) {
        updateChatId(null)
        messages.value = []
      }
    },
    handleUnexpectedClose: () => {
      setTimeout(setupWebSocket, 5000)
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
  processing?: boolean,
  role: "user" | "assistant",
  content?: string,
  actions?: string[],
  metadata?: Record<string, string>|null
}

export interface Confirmation {
  id: string
  details: Record<ConfirmationTypes, { args: Record<string, any>; extra: Record<string, string> }[]>
  status: ConfirmationStatus
}

const suggestions = ref<{ html: string; text: string }[]>(
  [
    {
      html:
        '<span class="font-bold text-base">Quais os animais doentes</span></br>' +
        '<span class="text-sm">que eu tenho que dar atenção hoje</span>',
      text: 'Quais os animais doentes que eu tenho que dar atenção hoje'
    },
    {
      html:
        '<span class="font-bold text-base">Recomendações de cio</span></br>' +
        '<span class="text-sm">para sêmen sexado hoje</span>',
      text: 'Recomendações de cio para sêmen sexado hoje'
    },
    {
      html:
        '<span class="font-bold text-base">Trocas de lote</span></br>' +
        '<span class="text-sm">de vários animais simultaneamente</span>',
      text: 'Trocas de lote de vários animais simultaneamente'
    },
    {
      html:
        '<span class="font-bold text-base">Listar animais com DEL elevado</span></br>' +
        '<span class="text-sm">considere 200 um DEL acima do normal</span>',
      text: 'Listar animais com DEL elevado, considere 200 um DEL acima do normal'
    },
    {
      html:
        '<span class="font-bold text-base">Criar um lote de lactação</span></br>' +
        '<span class="text-sm">na Unidade Principal da fazenda</span>',
      text: 'Criar um lote de lactação na Unidade Principal da fazenda'
    },
    {
      html:
        '<span class="font-bold text-base">Vincular coleira ao animal</span></br>' +
        '<span class="text-sm">e desvindular coleira antiga</span>',
      text: 'Vincular coleira ao animal e desvincular coleira antiga'
    },
    {
      html:
        '<span class="font-bold text-base">Me mostre status de coleiras</span></br>' +
        '<span class="text-sm">que não estão com status normal</span>',
      text: 'Me mostre status de coleiras que não estão com status normal'
    },
    {
      html:
        '<span class="font-bold text-base">Cadastre um animal novo</span></br>' +
        '<span class="text-sm">e vincule uma coleira a ele</span>',
      text: 'Cadastre um animal novo e vincule uma coleira a ele'
    },
    {
      html:
        '<span class="font-bold text-base">Atualize os dados de um animal</span></br>' +
        '<span class="text-sm">troque o nome e peso ao nascer</span>',
      text: 'Atualize os dados de um animal, troque o nome e peso ao nascer'
    },
    {
      html:
        '<span class="font-bold text-base">Listar lotes de produção</span></br>' +
        '<span class="text-sm">ordenados do mais produtivo ao menos produtivo</span>',
      text: 'Listar lotes de produção ordenados do mais produtivo ao menos produtivo'
    },
    {
      html:
        '<span class="font-bold text-base">Confirme um alerta de cio</span></br>' +
        '<span class="text-sm">e registre uma inseminação artificial</span>',
      text: 'Confirme um alerta de cio e registre uma inseminação artificial'
    },
    {
      html:
        '<span class="font-bold text-base">Cadastre uma monta natual</span></br>' +
        '<span class="text-sm">para ontem a tardinha</span>',
      text: 'Cadastre uma monta natural para ontem a tardinha'
    },
    {
      html:
        '<span class="font-bold text-base">O que significa DEL?</span></br>' +
        '<span class="text-sm">E como isso influência minha estratégia reprodutiva?</span>',
      text: 'O que significa DEL? E como isso influência minha estratégia reprodutiva?'
    },
    {
      html:
        '<span class="font-bold text-base">Quais são os tipos de descarte</span></br>' +
        '<span class="text-sm">que estão disponíveis para rebanho do software cowmed?</span>',
      text: 'Quais são os tipos de descarte que estão disponíveis para rebanho do software cowmed?'
    },
    {
      html:
        '<span class="font-bold text-base">Como posso trocar animais de lotes</span></br>' +
        '<span class="text-sm">no software da cowmed</span>',
      text: 'Como posso trocar animais de lotes no software da cowmed'
    },
    {
      html:
        '<span class="font-bold text-base">O que significa DTR?</span></br>' +
        '<span class="text-sm">E como ele influencia na reprodução do animal?</span>',
      text: 'O que significa DTR? E como ele influencia na reprodução do animal?'
    },
    {
      html:
        '<span class="font-bold text-base">O que significa PPI?</span></br>' +
        '<span class="text-sm">E quais os valores que eu posso esperar encontrar?</span>',
      text: 'O que significa PPI? E quais os valores que eu posso esperar encontrar?'
    },
    {
      html:
        '<span class="font-bold text-base">Olá, qual seu nome?</span></br>' +
        '<span class="text-sm">E em que você pode me ajudar?</span>',
      text: 'Olá, qual seu nome? e em que você pode me ajudar?'
    }
  ]
    .map((value) => ({ value, sort: Math.random() }))
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

function process(text: string | null = null, metadata?: Record<string, string>) {
  text = text || message.value
  state.value = 'processing'
  messages.value = [
    ...messages.value,
    {
      role: 'user',
      content: text,
      metadata: metadata
    }
  ]
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
  info('Send confirmation:', confirmation_id)
  process('Confirmar', {
    confirm: confirmation_id
  })
}
function rejectRequest(confirmation_id: string) {
  info('Send confirmation rejection:', confirmation_id)
  process('Cancelar', {
    reject: confirmation_id
  })
}
</script>

<template>
  <div class="w-full flex flex-col max-h-screen min-h-0 flex-grow overflow-x-auto scroll-px-0">
    <div v-if="state == 'loading'" class="flex-col justify-center items-center gap-2 flex flex-grow">
        <svg
          aria-hidden="true"
          class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-300 fill-green-500 "
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span class="dark:text-gray-300  justify-center">Carregando</span>
    </div>
    <div
      ref="chatArea"
      v-if="state != 'loading'"
      class="text-white mb-2 px-2 pt-4 flex flex-col align-content-space-around gap-3 overflow-y-auto flex-grow scrollbar-light-gray dark:scrollbar-dark-gray"
      :class="{ 'opacity-0': state === 'loading' }"
    >
      <div v-for="(message, index) in messages" class="flex flex-col">
        <Message :role="message.role" :content="message.content" :actions="message.actions" :key="index" />
        <Confirmation
          v-if="message.metadata && message.metadata['confirmation']"
          @confirm="confirmRequest"
          @reject="rejectRequest"
          :ready="state === 'ready'"
          v-model="confirmations[message?.metadata['confirmation']]"
        />
      </div>
      <div
        v-if="Array.from(messages).length === 0"
        class="flex justify-center items-center h-screen"
      >
        <div class="flex flex-col h-full justify-center">
          <div
            class="self-center bg-[#FFFFFF] dark:bg-[#4D4D4D] rounded-full w-[100px] h-[100px] text-center"
          >
            <img class="h-[100px] inline-block" src="\hello.svg" alt="Vic says Hello" />
          </div>
          <div class="self-center text-2xl mt-12 text-[#666666] dark:text-white">
            Como posso te ajudar?
          </div>
          <div>
            <div
              v-if="large"
              class="flex flex-row align-stretch flex-wrap gap-5 justify-center align-center mt-8 mb-20"
            >
              <div v-for="n in 4" :key="n" class="w-1/3 text-center text-[#808080] dark:text-white">
                <div
                  class="w-full h-full inline-block text-start p-7 dark:bg-[#999999] bg-[#FFFFFF] rounded-[16px] cursor-pointer"
                  v-on:click="startChatWithText(suggestions[n - 1].text)"
                >
                  <span
                    class="font-500 text-base font-bold"
                    v-html="suggestions[n - 1].html"
                  ></span>
                </div>
              </div>
            </div>
            <div
              v-else
              class="flex flex-row flex-wrap gap-5 justify-center align-center mt-8 mb-20"
            >
              <div
                v-for="(suggestion, index) in suggestions.slice(0, 4)"
                :key="index"
                class="text-center text-[#808080] dark:text-white"
              >
                <div
                  class="p-4 dark:bg-[#999999] bg-[#FFFFFF] rounded-[16px] cursor-pointer hover:bg-gray-400"
                  v-on:click="startChatWithText(suggestion.text)"
                >
                  <span class="font-500 text-base" v-html="suggestion.html"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="dark:text-neutral-50 text-[#808080] font-bold ps-3 pb-1">
      <span class="transition-opacity" :class="{ 'opacity-0': state !== 'processing' }"
        >Vic está digitando...</span
      >
    </div>
    <div>
      <form
        @submit.prevent="send"
        class="flex align-content-space-between gap-2 p-4 dark:bg-[#333333] bg-[#FFFFFF]"
      >
        <input
          type="text"
          ref="inputMessage"
          :autofocus="true"
          class="px-3 flex-grow min-w-1 dark:text-white focus:outline-none focus:border-none"
          :readonly="state !== 'ready'"
          placeholder="Escreva sua mensagem aqui"
          v-model="message"
        />

        <input
          type="submit"
          :value="('Enviar ' + (!chatId && props.llm !== 'Padrão' ? `[${props.llm}]` : '')).trim()"
          class="px-4 py-3 rounded-[8px] cursor-pointer hover:bg-green-500"
          :class="{
            'bg-[#F2F2F2]': state !== 'ready',
            'dark:bg-[#999999]': state !== 'ready',
            '!text-[#808080]': state !== 'ready',
            'dark:!text-[#F2F2F2]': state !== 'ready',
            'dark:!text-white': state === 'ready',
            'bg-[#59B834]': state === 'ready',
            '!text-white': state === 'ready'
          }"
          :disabled="state !== 'ready'"
        />
      </form>
    </div>
  </div>
  <p class="dark:text-neutral-50 text-[#666666] self-center p-2 text-xs">
    VIC-IA pode cometer erros. Verifique referências importantes.
  </p>
</template>
