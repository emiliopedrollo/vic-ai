<script setup lang="ts">

import { type ModelRef, onUpdated, ref } from 'vue'
import type { Confirmation, Message } from '@/components/Chat.vue'
import { info } from '@/logger'
import StoreAnimal from '@/components/Confirmations/StoreAnimal.vue'
import UpdateAnimal from '@/components/Confirmations/UpdateAnimal.vue'
import MoveAnimals from '@/components/Confirmations/MoveAnimals.vue'
import StoreBatch from '@/components/Confirmations/StoreBatch.vue'


type AnimalConfirmationTypes = 'prepare_animal_store' | 'prepare_animal_update'
type BatchConfirmationTypes = 'prepare_batch_store' | 'prepare_animals_move'
export type ConfirmationTypes = AnimalConfirmationTypes | BatchConfirmationTypes

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

const last_service_method = (method?: string): string|undefined => {
  switch (method) {
    case 'insemination' : return 'Inseminação artificial'
    case 'embryo_transfer' : return 'Transferência embrionária'
    case 'natural_breeding' : return 'Monta natural'
  }
}

</script>

<template>
  <div v-if="confirmation" class="flex align-center flex-col">
    <div class="
      w-3/5 bg-[#808080] mt-4 mx-4 rounded-[8px] p-4 flex flex-col align-center
    " :class="{ 'cursor-wait': !ready, }">

      <UpdateAnimal v-if="confirmation?.details['prepare_animal_update']" :ready="ready" :confirmation="confirmation" />
      <StoreAnimal v-if="confirmation?.details['prepare_animal_store']" :ready="ready" :confirmation="confirmation" />
      <MoveAnimals v-if="confirmation?.details['prepare_animals_move']" :ready="ready" :confirmation="confirmation" />
      <StoreBatch v-if="confirmation?.details['prepare_batch_store']" :ready="ready" :confirmation="confirmation" />

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
