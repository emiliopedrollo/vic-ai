<script setup lang="ts">
import FarmSelect from '@/components/FarmSelect.vue'
import { useMainStore } from '@/stores/main'
import { ref } from 'vue'
import router from '@/router'
import Message from '@/components/Message.vue'
import Chat from '@/components/Chat.vue'

const store = useMainStore()
// store.$reset()

// const activeFarm: Ref<Farm|null> = ref(store.activeFarm)
// console.log(store.activeFarm, store.activeFarm?.slug)


// const farm = ref(null)

store.$subscribe((mutation, state) => {
  // console.log('AAAA',mutation, state)
})

function changeFarm() {
  store.setFarm(null)
}

// function logout() {
//   router.push({ name: 'logout' })
// }

</script>

<template>
  <main>
    <FarmSelect v-if="store.activeFarm === null" />
    <div v-else class="flex flex-col pt-2 h-screen">
      <div class="flex flex-nowrap align-middle place-items-center justify-space-around mb-2">
        <div class="flex-1 mx-4 text-center">{{ store.activeFarm?.name }}</div>
        <div v-on:click="changeFarm()" class="
          flex-1
          text-button border-1 border-solid rounded border-green-900
          mx-4 py-1 px-4 text-center cursor-pointer
        "> Alterar Fazenda
        </div>
      </div>
      <Chat/>
      <div class="flex flex-row justify-center">
        <a
          href="/logout"
          class="
        w-3/5 m-auto my-3
        text-button border-1 border-solid border-green-500 rounded
        text-center cursor-pointer
      ">Sair</a>
      </div>
    </div>
  </main>
</template>
