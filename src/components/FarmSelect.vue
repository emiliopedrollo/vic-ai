<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, onErrorCaptured, ref } from 'vue'
import axios from 'axios'
import { useMainStore } from '@/stores/main'
import type { Farm } from '@/Interfaces/farm'
import LoadingSpinner from '@/components/Loading.vue'

const store = useMainStore()

// defineProps<{
//   activeFarm: Farm|null
// }>()

// const name: Ref<string|null> = ref(null)
const farms: Ref<Farm[]> = ref([])
const farmFilterInput = ref<HTMLInputElement | null>(null)

const filteredFarms = computed<Farm[]>(() => {
  return farms.value.filter((farm: Farm) => {
    return (farm.name.toUpperCase().indexOf(filter.value.toUpperCase()) !== -1) ||
      farm.code.toString().indexOf(filter.value) !== -1
    // return farm.name.match(new RegExp(`${filter.value}`,'ig'))
  })
})

const loading = ref(true)
const filter = ref('')

// onMounted(() => {
// })

onErrorCaptured((e: any) => {
  console.log('ERROR', e)
})

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
  setTimeout(() => {
    console.log('now')
    farmFilterInput.value?.focus()
  }, 200)
})


function setFarm(farm: string) {
  let selectedFarm: Farm | undefined = farms.value.find((item) => item.slug === farm)
  if (selectedFarm !== undefined) {
    store.setFarm(selectedFarm)
  }
}

</script>

<template>
  <div v-if="loading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <div class="h-screen max-h-screen md:flex justify-center align-center flex-column md:pt-10">
      <div class="
        max-md:w-full md:w-[475px] bg-neutral-50 dark:bg-zinc-800 p-5 md:rounded-[16px]
        md:max-h-[calc(100%-2.5rem)] max-md:h-full flex flex-column"
      >

        <h2 class="text-2xl text-center dark:text-neutral-50 text-neutral-600 pt-4">
          Bem-vindo {{ store.activeUser?.name }}
        </h2>

        <p class="text-base text-center dark:text-neutral-50 text-neutral-500 mt-3 mb-2">
          Por favor selecione uma fazenda
        </p>

        <div class="w-full grid place-items-center mt-8">
          <div class="flex max-sm:w-full sm:w-96 dark:bg-[#4D4D4D] bg-[#F4F4F4] py-1.5 px-3 rounded">
            <input
              class="grow focus:border-none focus:outline-none dark:text-white text-neutral-600"
              type="text"
              ref="farmFilterInput"
              v-model="filter"
              placeholder="Pesquisar fazenda"
            >
            <img src="\search.svg" alt="search" />
          </div>
        </div>

        <div class="w-full flex justify-center mt-4 overflow-auto">
          <div class="max-sm:w-full sm:w-96 flex flex-column">
            <div v-for="farm in filteredFarms"
                 class="border-b-1 last:border-b-0 p-3 border-[#CCCCCC]"
            >
              <div class="flex justify-between ">
                <span v-on:click="setFarm(farm.slug)" class="
                  cursor-pointer dark:text-[#ACDBA9] text-[#59B834]
                ">
                  {{ farm.name }}
                </span>
                <span class="
                  dark:text-white text-[#4D4D4D]
                ">{{ farm.code }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
