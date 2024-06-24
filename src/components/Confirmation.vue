<script setup lang="ts">

import { type ModelRef, onUpdated, ref } from 'vue'
import type { Confirmation, Message } from '@/components/Chat.vue'
import { info } from '@/logger'

export type ConfirmationTypes = 'prepare_animal_store'

export type ConfirmationStatus = 'pending' | 'confirmed' | 'canceled' | 'rejected'

const confirmation: ModelRef<Confirmation|undefined> = defineModel()

// const confirmation: ModelRef<Confirmation> = defineModel() as ModelRef<Confirmation>

const props = defineProps<{
  // confirmation: Confirmation|null|undefined
  // status: ConfirmationStatus,
  // type: ConfirmationTypes,
  // data: object
  ready: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm', confirmation_id: string): void
  (e: 'reject', confirmation_id: string): void
}>()

// const confirmation = ref<Confirmation|null>(props.confirmation || null)

const status = ref<ConfirmationStatus|null>(confirmation.value?.status || null)

onUpdated(() => {
  info("updated", props.ready)
})

const sendConfirm = () => {
  status.value = 'confirmed'
  // console.log('confirm')
  if (props.ready) emit('confirm', confirmation.value?.id as string)
}
const sendReject = () => {
  status.value = 'rejected'
  // console.log('cancel')
  if (props.ready) emit('reject', confirmation.value?.id as string)
}

// const mapAnimalProperties = (slug: string): string|undefined => {
//   switch (slug) {
//     case 'earring': return 'Brinco'
//     case 'batch_slug': return 'Lote'
//     case 'name': return 'Nome'
//     case 'birth': return 'Data de Nascimento'
//   }
// }

</script>

<template>
  <div v-if="confirmation" class="flex align-center flex-col">
    <div class="
      w-3/5 bg-[#808080] mt-4 mx-4 rounded-[8px] p-4 flex flex-col align-center
    " :class="{ 'cursor-wait': !ready, }">
      <h2 class="font-bold text-lg mb-3">
        <span v-if="(confirmation?.details['prepare_animal_store'] || []).length > 1">Inclusão de animais</span>
        <span v-else>Inclusão de animal</span>
      </h2>
      <div class="flex flex-col gap-5">
        <div v-for="animal in (confirmation?.details['prepare_animal_store'] || [])" class="
          flex flex-col items-center
        ">
          <div v-if="animal.args.name" class="w-full flex flex-row gap-4 justify-space-between">
            <div>Name:</div>
            <div>{{ animal.args.name }}</div>
          </div>
          <div class="w-full flex flex-row gap-4 justify-space-between">
            <div>Brinco:</div>
            <div>{{ animal.args.earring }}</div>
          </div>
          <div class="w-full flex flex-row gap-4 justify-space-between">
            <div>Lote:</div>
            <div>{{ animal.extra?.batch || animal.args?.batch_slug }}</div>
          </div>
          <div v-if="animal.args.birth" class="w-full flex flex-row gap-4 justify-space-between">
            <div>Data de Nascimento:</div>
            <div>{{ animal.args.birth }}</div>
          </div>
        </div>
      </div>
      <div v-if="confirmation?.status === 'confirmed'">
        <div class="text-md mt-3">Você confirmou esta requisição.</div>
      </div>
      <div v-else-if="confirmation?.status === 'rejected'">
        <div class="text-md mt-3">Você cancelou esta requisição.</div>
      </div>
      <div v-else-if="confirmation?.status === 'canceled'">
        <div class="text-md mt-3">Esta confirmação expirou.</div>
      </div>
      <div v-else class="flex gap-3 mt-3">
        <div class="bg-[#59B834] p-3 rounded-[8px] select-none"
             :class="{
                'cursor-pointer': ready,
                'bg-[#F2F2F2]': !ready,
                'dark:bg-[#999999]': !ready,
                '!text-[#808080]': !ready,
                'dark:!text-[#F2F2F2]': !ready,
             }"
             v-on:click="sendConfirm"
        >Confirmar</div>
        <div class="bg-[#333333] p-3 rounded-[8px] select-none"
             :class="{
                'cursor-pointer': ready,
                'bg-[#F2F2F2]': !ready,
                'dark:bg-[#999999]': !ready,
                '!text-[#808080]': !ready,
                'dark:!text-[#F2F2F2]': !ready,
              }"
             v-on:click="sendReject"
        >Cancelar</div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
