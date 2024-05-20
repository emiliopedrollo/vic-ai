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
    <div v-else class="flex flex-row h-screen">

      <div class="flex flex-col w-60 md:min-w-60">
        <div class="
            dark:bg-[#808080] bg-[#FFFFFF]
            dark:text-neutral-50 text-[#666666]
            text-sm px-2.5 py-3 font-bold
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
            <h2 class="text-2xl font-bold mb-3">Chats</h2>
            <p class="text-sm">Recentes</p>
          </div>
          <div>
            <a class="text-[#BF2939] dark:text-white" href="/logout">
              <svg class="w-6 h-5 inline-block align-middle mr-1" >
                <use xlink:href="\exit.svg#exit" href="\exit.svg#exit"/>
              </svg>
<!--              <img class="w-5 align-sub mr-1.5 inline-block" src="/exit.svg" alt="exit"/>-->
              <span class="font-bold">Sair</span>
            </a>
          </div>
        </div>
      </div>
      <div class="grow flex flex-col bg-[#FAFAFA] dark:bg-[#4D4D4D]">
        <div>
          <div v-on:click="changeFarm()" class="
            text-md dark:text-neutral-50 text-[#808080]
            font-bold px-2.5 py-2.5 cursor-pointer inline-block
          ">
            {{ store.activeFarm?.name }}
            <img class="inline-block w-3 ml-1" src="/drop.svg" alt="change farm"/>
          </div>
        </div>
        <Chat/>
      </div>


<!--      <div class="flex flex-nowrap align-middle place-items-center justify-space-around mb-2">-->
<!--        <div class="flex-1 mx-4 text-center">{{ store.activeFarm?.name }}</div>-->
<!--        <div v-on:click="changeFarm()" class="-->
<!--          flex-1-->
<!--          text-button border-1 border-solid rounded border-green-900-->
<!--          mx-4 py-1 px-4 text-center cursor-pointer-->
<!--        "> Alterar Fazenda-->
<!--        </div>-->
<!--      </div>-->
<!--      <div class="flex flex-row justify-center">-->
<!--        <a-->
<!--          href="/logout"-->
<!--          class="-->
<!--        w-3/5 m-auto my-3-->
<!--        text-button border-1 border-solid border-green-500 rounded-->
<!--        text-center cursor-pointer-->
<!--      ">Sair</a>-->
<!--      </div>-->



    </div>
  </main>
</template>
