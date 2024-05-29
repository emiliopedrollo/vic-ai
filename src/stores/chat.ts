import { type Ref } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'


export function useChatStore(farm: string) {
  return defineStore(`chats-${farm}`, () => {

    // const chatCompiledData: Ref<string|null> = useLocalStorage(`vue/main/chat-data`, null)

    const chatData: Ref<string> = useLocalStorage(`vue/chat/chat-data/${farm}`, '[]')

    // const chatData: ComputedRef<any|null> = computed((): any|null => {
    //   return chatCompiledData.value !== null
    //     ? JSON.parse(chatCompiledData.value)
    //     : null
    // })

    function $reset() {
      chatData.value = '[]'
    }

    function getChatData(): {id: string, resume: string}[] {
      return JSON.parse(chatData.value)
    }

    function setChatData(data: {id: string, resume: string}[]|null) {
      if (data !== null) {
        chatData.value = JSON.stringify(data.reverse())
      } else {
        chatData.value = '[]'
      }
    }
    function addChatData(data: {id: string, resume: string}) {
      chatData.value = JSON.stringify([...(JSON.parse(chatData.value)), data])
    }

    return {
      $reset,
      chatData,
      getChatData,
      setChatData,
      addChatData,
    }
  })()
}
