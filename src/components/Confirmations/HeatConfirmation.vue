<script setup lang="ts">

import { onUpdated } from 'vue'
import type { Confirmation, Message } from '@/components/Chat.vue'
import { info } from '@/logger'

const props = defineProps<{
  confirmation: Confirmation | undefined
  ready: boolean
}>()

onUpdated(() => {
  info('updated', props.ready)
})

</script>

<template>
  <div v-if="confirmation" class="flex align-center flex-col">
    <h2 class="font-bold text-lg mb-3">
      <span v-if="(confirmation?.details['prepare_confirm_animal_heat'] || []).length > 1">Confirmações de cio</span>
      <span v-else-if="(confirmation?.details['prepare_confirm_animal_heat'] || []).length === 1">Confirmação de cio</span>
    </h2>
    <div class="flex flex-col gap-5">
      <div v-for="attachment in (confirmation?.details['prepare_confirm_animal_heat'] || [])" class="
          flex flex-col items-center
        ">
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Animal:</div>
          <div>{{ attachment.extra.animal_earring }} - {{ attachment.extra.animal_status }}</div>
        </div>
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Data:</div>
          <div>{{ (new Date(attachment.extra.timestamp)).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          }) }}</div>
        </div>
        <div v-if="attachment.args.heat_detection_method" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Método de detecção:</div>
          <div>{{ attachment.args.heat_detection_method }}</div>
        </div>
        <div v-if="attachment.args.heat_intensity" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Intensidade:</div>
          <div>{{ attachment.args.heat_intensity }}</div>
        </div>
        <div v-if="attachment.args.heat_signs" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Sinais:</div>
          <div>{{ attachment.args.heat_signs.join(', ') }}</div>
        </div>
        <div v-if="attachment.args.comments" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Comentário:</div>
          <div>{{ attachment.args.comments }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
