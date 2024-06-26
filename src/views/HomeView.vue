<script setup lang="ts">
import FarmSelect from '@/components/FarmSelect.vue'
import { useMainStore } from '@/stores/main'
import { ref } from 'vue'
import Chat from '@/components/Chat.vue'
import { useChatStore } from '@/stores/chat'
import type { LLM } from '@/Interfaces/llm'
// import { updateConnection } from '../../backend/src/dynamo'

const store = useMainStore()

let chatList = ref<{ id: string, resume: string }[]>(
  store.activeFarm ? useChatStore(store.activeFarm.slug).getChatData() : []
)

const chatStore = ref(store.activeFarm ? useChatStore(store.activeFarm.slug) : null)

if (chatStore.value) {
  chatStore.value.$subscribe(() => updateChatList())
}

const childChat = ref<typeof Chat>()
const currentChatId = ref<string | null>(null)
const dev = ref<boolean>(import.meta.env.DEV)
const requested_llm = ref<LLM>('Padrão')
// store.$reset()


// const activeFarm: Ref<Farm|null> = ref(store.activeFarm)
// console.log(store.activeFarm, store.activeFarm?.slug)


// const farm = ref(null)

const updateChatList = () => {
  chatList.value = chatStore.value?.getChatData() || []
}

store.$subscribe((mutation, state) => {
  const farm_slug = JSON.parse(state.farmData || '{}')?.slug
  chatStore.value = useChatStore(farm_slug)
  updateChatList()
  chatStore.value.$subscribe(() => updateChatList())
  // console.log('AAAA',chatList.value)
}, { flush: 'sync' })

function changeFarm() {
  childChat.value?.disconnect()
  chatList.value = []
  store.setFarm(null)
}

function selectChat(chat_id: string) {
  const entry = chatList.value.find((item) => item.id === chat_id)
  currentChatId.value = entry?.id || null
  if (entry) childChat.value?.loadChat(chat_id)
}

function deleteChat(chat_id: string) {
  const entry = chatList.value.find((item) => item.id === chat_id)
  if (entry && window.confirm(`Você tem certeza que quer deletar a conversa "${entry.resume}"?`)) {
    childChat.value?.removeChat(chat_id)
    if (currentChatId.value === chat_id) {
      currentChatId.value = null
    }
  }
}

function newChat() {
  childChat.value?.newChat()
  currentChatId.value = null
}

function updateCurrentChatId(id: string | null) {
  currentChatId.value = id
}

// function logout() {
//   router.push({ name: 'logout' })
// }

</script>

<template>
  <main>
    <FarmSelect v-if="store.activeFarm === null" />
    <div v-else class="flex flex-row h-screen">

      <div class="flex flex-col w-72 md:min-w-72">
        <div class="
            dark:bg-[#808080] bg-[#FFFFFF]
            dark:text-neutral-50 text-[#666666]
            text-sm px-2.5 py-5 font-bold
          ">
          <h1>
            Vic IA 2.0
          </h1>
        </div>
        <div class="
            dark:bg-[#666666]
            dark:text-neutral-50
            px-2.5 py-3
            grow flex flex-col justify-between
          ">
          <div>
            <div class="flex justify-space-between align-center  mb-3">
              <h2 class="text-2xl font-bold">Chats</h2>
              <span v-on:click="newChat()" class="
                bg-[#59B834] dark:!text-white !text-white rounded-[8px] px-2 py-1
                cursor-pointer select-none
              ">Novo chat</span>
            </div>
            <div v-if="Array.from(chatList).length > 0">
              <p class="text-sm">Recentes</p>
              <div class="">
                <div v-for="chat in chatList" class="
                  rounded-[8px] cursor-pointer mt-2
                  group flex align-center justify-space-between select-none
                " :class="{
                  'dark:bg-[#8F8F8F]': chat.id === currentChatId,
                  'dark:bg-[#808080]': chat.id !== currentChatId,
                  'bg-[#FFFFFF]': chat.id === currentChatId,
                  'bg-[#FAFAFA]': chat.id !== currentChatId
                }">
                  <div v-on:click="selectChat(chat.id)" class="
                    px-3 py-2 rounded-[8px] group-hover:rounded-e-[0px]
                    text-ellipsis text-no-wrap overflow-hidden grow
                  ">
                    {{ chat.resume }}
                  </div>
                  <span v-on:click="deleteChat(chat.id)" class="
                    min-w-5 justify-self-end px-1.5
                    hidden group-hover:inline-block
                    top-0 text-[#BF2939] dark:!text-[#FFFFFF]
                  ">
                  <svg class="w-5 h-5 inline-block align-middle ">
                    <use xlink:href="\trash.svg#trash" href="\trash.svg#trash" />
                  </svg>
                </span>
                </div>
              </div>
            </div>
            <div v-else>
              Você ainda não tem nenhuma conversa
            </div>
          </div>
          <div>
            <a class="text-[#BF2939] dark:text-white" href="/logout">
              <svg class="w-6 h-5 inline-block align-middle mr-1">
                <use xlink:href="\exit.svg#exit" href="\exit.svg#exit" />
              </svg>
              <span class="font-bold">Sair</span>
            </a>
          </div>
        </div>
      </div>
      <div class="grow flex flex-col bg-[#FAFAFA] dark:bg-[#4D4D4D]">
        <div class="flex flex-row">
          <div v-on:click="changeFarm()" class="
            text-md dark:text-neutral-50 text-[#808080]
            font-bold px-2.5 py-2.5 cursor-pointer inline-block
          ">
            {{ store.activeFarm?.name }}
            <img class="inline-block w-3 ml-1" src="/drop.svg" alt="change farm" />
          </div>
          <div v-if="dev && currentChatId === null"
               class="
            text-md dark:text-neutral-50 text-[#808080] select-none
            font-bold px-2.5 py-2.5 group flex flex-row gap-2
          ">
            <div class="relative font-bold ">
              {{ requested_llm }}
              <img class="inline-block w-3 ml-1" src="/drop.svg" alt="change farm" />
              <div class="
              group-hover:!block absolute
              hidden dark:bg-[#333333] bg-[#FFFFFF] mt-1 min-w-[120px] rounded-[8px] overflow-hidden left-[-12px]
            ">
                <ul>
                  <li
                    v-for="llm in ['Padrão', 'ChatGPT', 'Gemini', 'Titan', 'Parrot']"
                    v-on:click="requested_llm = (llm as LLM)"
                    class="px-3 py-1 w-full cursor-pointer hover:bg-[#222222]"
                  >
                    <span :class="{ 'line-through': ['Titan'].includes(llm) }">{{ llm }}</span>
                    {{ requested_llm === llm ? '✓' : null }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <Chat ref="childChat" :farm="store.activeFarm" :chat_id="currentChatId" :llm="requested_llm"
              @change-chat-id="updateCurrentChatId" />
      </div>
    </div>
  </main>
</template>
