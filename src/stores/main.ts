import { computed, type ComputedRef, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Farm } from '@/Interfaces/farm'
import type { User } from '@/Interfaces/user'


export const useMainStore = defineStore('vic', () => {

  const farmData: Ref<string|null> = useLocalStorage('vue/main/farm-data', null)

  const userData: Ref<string|null> = useLocalStorage('vue/main/user-data', null)

  const activeFarm: ComputedRef<Farm|null> = computed((): Farm|null => {
    return farmData.value !== null
      ? JSON.parse(farmData.value)
      : null
  })
  const activeUser: ComputedRef<User|null> = computed((): User|null => {
    return userData.value !== null
      ? JSON.parse(userData.value)
      : null
  })

  function $reset() {
    userData.value = null
    farmData.value = null
  }

  function setUser(user: User|null) {
    if (user !== null) {
      userData.value = JSON.stringify(user)
    } else {
      userData.value = null
    }
  }

  function setFarm(farm: Farm|null) {
    if (farm !== null) {
      farmData.value = JSON.stringify(farm)
    } else {
      farmData.value = null
    }
  }

  return {
    $reset,
    activeFarm,
    activeUser,
    farmData,
    userData,
    setUser,
    setFarm
  }
})
