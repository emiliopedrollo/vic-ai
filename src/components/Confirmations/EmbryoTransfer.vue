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
      <span v-if="(confirmation?.details['prepare_et_store'] || []).length > 1">Transferências embrionárias</span>
      <span v-else-if="(confirmation?.details['prepare_et_store'] || []).length === 1">Transferência embrionária</span>
    </h2>
    <div class="flex flex-col gap-5">
      <div v-for="attachment in (confirmation?.details['prepare_et_store'] || [])" class="
          flex flex-col items-center
        ">
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Animal:</div>
          <div>{{ attachment.extra.animal_earring }} - {{ attachment.extra.animal_status }}</div>
        </div>
        <div v-if="attachment.args.donor" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Doadora:</div>
          <div>{{ attachment.args.donor }}</div>
        </div>
        <div v-if="attachment.args.embryo_type" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Tipo de embrião:</div>
          <div>{{ attachment.args.embryo_type }}</div>
        </div>
        <div v-if="attachment.args.comment" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Animal:</div>
          <div>{{ attachment.args.comment }}</div>
        </div>
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Data:</div>
          <div>{{ (new Date(attachment.args.timestamp)).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          }) }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
