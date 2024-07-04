<script setup lang="ts">

import { type ModelRef, onUpdated, ref } from 'vue'
import type { Confirmation, Message } from '@/components/Chat.vue'
import { info } from '@/logger'
import StoreAnimal from '@/components/Confirmations/StoreAnimal.vue'
import UpdateAnimal from '@/components/Confirmations/UpdateAnimal.vue'
import MoveAnimals from '@/components/Confirmations/MoveAnimals.vue'
import StoreBatch from '@/components/Confirmations/StoreBatch.vue'
import AttachCollar from '@/components/Confirmations/AttachCollar.vue'
import DetachCollar from '@/components/Confirmations/DetachCollar.vue'


type AnimalConfirmationTypes = 'prepare_animal_store' | 'prepare_animal_update'
type BatchConfirmationTypes = 'prepare_batch_store' | 'prepare_animals_move'
type CollarConfirmationTypes = 'prepare_collar_attach' | 'prepare_collar_detach'
export type ConfirmationTypes = AnimalConfirmationTypes | BatchConfirmationTypes | CollarConfirmationTypes

export type ConfirmationStatus = 'pending' | 'confirmed' | 'canceled' | 'rejected'

const confirmation: ModelRef<Confirmation|undefined> = defineModel()

const props = defineProps<{
  // confirmation: Confirmation|null|undefined
  ready: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm', confirmation_id: string): void
  (e: 'reject', confirmation_id: string): void
}>()

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
      <AttachCollar v-if="confirmation?.details['prepare_collar_attach']" :ready="ready" :confirmation="confirmation" />
      <DetachCollar v-if="confirmation?.details['prepare_collar_detach']" :ready="ready" :confirmation="confirmation" />

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
