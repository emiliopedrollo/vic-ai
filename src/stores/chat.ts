import { computed, type ComputedRef, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Farm } from '@/Interfaces/farm'
import type { User } from '@/Interfaces/user'


export const useChatStore = defineStore('vic', () => {

  const chatCompiledData: Ref<string|null> = useLocalStorage(`vue/main/chat-data`, null)

  const chatData: ComputedRef<Farm|null> = computed((): Farm|null => {
    return chatCompiledData.value !== null
      ? JSON.parse(chatCompiledData.value)
      : null
  })

  function $reset() {
    chatCompiledData.value = null
  }

  function setChatData(data: object) {
    if (data !== null) {
      chatCompiledData.value = JSON.stringify(data)
    } else {
      chatCompiledData.value = null
    }
  }

  return {
    $reset,
    chatCompiledData,
    chatData,
    setChatData,
  }
})
