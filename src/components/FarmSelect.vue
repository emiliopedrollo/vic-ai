<script setup lang="ts">
import { onBeforeMount, onErrorCaptured, onMounted, onServerPrefetch, onUpdated, ref, type Ref } from 'vue'
import axios from 'axios'
import { useMainStore } from '@/stores/main'
import type { Farm } from '@/Interfaces/farm'
import GlitchText from '@/components/GlitchText.vue'

const store = useMainStore()

// defineProps<{
//   activeFarm: Farm|null
// }>()

// const name: Ref<string|null> = ref(null)
const farms: Ref<Farm[]> = ref([])

const loading = ref(true)

onErrorCaptured((e:any) => {
  console.log("ERROR", e)
})

// onServerPrefetch(() => {
//   console.log('PREFETCH')
   Promise.all([
    new Promise<void>(resolve => {
      if (store.activeUser === null) {
        axios({
          method: 'GET',
          url: `https://${import.meta.env.VITE_COWMED_API_URL}/api/user-info`
        }).then((response) => {
          store.setUser({
            name: response.data.data.name
          })
          resolve()
        })
      } else resolve()
    }),
    new Promise<void>(resolve => {
      if (store.activeFarm === null) {
        axios({
          method: 'GET',
          url: `https://${import.meta.env.VITE_COWMED_API_URL}/api/farm/access`
        }).then((response) => {
          if (response.data.data.length === 1) {
            store.setFarm({
              name: response.data.data[0].name,
              code: response.data.data[0].code,
              slug: response.data.data[0].slug
            })
          } else {
            response.data.data.forEach((farm: any) => {
              let {
                slug, name, code
              } = farm
              farms.value.push({ slug, code, name })
            })
          }
          resolve()
        })
      } else resolve()
    })
  ]).then(() => {
    loading.value = false
  })
// })


function setFarm(farm: string) {
  let selectedFarm: Farm | undefined = farms.value.find((item) => item.slug === farm)
  if (selectedFarm !== undefined) {
    store.setFarm(selectedFarm)
  }
}

</script>

<template>
<!--    <Suspense>-->
  <div v-if="loading">
    <div class="h-screen flex justify-center items-center">
      <div class="text-green-500 text-5xl -mt-14">
        <GlitchText text="Carregando"/>
      </div>
    </div>
  </div>
  <div v-else>

    <h2 class="text-xl text-center pt-4">Bem-vindo <span class="text-green-500">{{ store.activeUser?.name }}</span>
    </h2>

    <p class="text-md text-center mt-3 mb-2">Por favor selecione uma fazenda</p>
    <div class="flex justify-center">
      <div class="max-w-64 flex-grow flex flex-column">
        <div v-for="farm in farms" v-on:click="setFarm(farm.slug)" class="
        text-button border-1 border-solid rounded border-green-900
        mx-4 my-2 py-1 px-4 text-center cursor-pointer
      ">
          <span class="text-green-500">{{ farm.name }}</span>
        </div>
      </div>
    </div>
  </div>
<!--      <template #fallback>-->
<!--        FUCK-->
<!--      </template>-->
<!--    </Suspense>-->
</template>
