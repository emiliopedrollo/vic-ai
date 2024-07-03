<script setup lang="ts">

import { onUpdated } from 'vue'
import type { Confirmation, Message } from '@/components/Chat.vue'
import { info } from '@/logger'


// const confirmation: ModelRef<Confirmation|undefined> = defineModel()

// const confirmation: ModelRef<Confirmation> = defineModel() as ModelRef<Confirmation>

const props = defineProps<{
  confirmation: Confirmation | undefined
  // status: ConfirmationStatus,
  // type: ConfirmationTypes,
  // data: object
  ready: boolean
}>()

// const confirmation = ref<Confirmation|null>(props.confirmation || null)

onUpdated(() => {
  info('updated', props.ready)
})

// const mapAnimalProperties = (slug: string): string|undefined => {
//   switch (slug) {
//     case 'earring': return 'Brinco'
//     case 'batch_slug': return 'Lote'
//     case 'name': return 'Nome'
//     case 'birth': return 'Data de Nascimento'
//   }
// }

const last_service_method = (method?: string): string | undefined => {
  switch (method) {
    case 'insemination' :
      return 'Inseminação artificial'
    case 'embryo_transfer' :
      return 'Transferência embrionária'
    case 'natural_breeding' :
      return 'Monta natural'
  }
}

</script>

<template>
  <div v-if="confirmation" class="flex align-center flex-col">
    <h2 class="font-bold text-lg mb-3">
      <span v-if="(confirmation?.details['prepare_animals_move'] || []).length > 1">Move animais</span>
      <span v-else-if="(confirmation?.details['prepare_animals_move'] || []).length === 1">Move animal</span>
    </h2>
    <div class="flex flex-col gap-5">
      <div v-for="batch in (confirmation?.details['prepare_animals_move'] || [])" class="
          flex flex-col items-center
        ">
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Lote:</div>
          <div>{{ batch.args.batch_slug }}</div>
        </div>
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Animais:</div>
          <div>{{ (batch.args.animals as string[]).join(', ') }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
