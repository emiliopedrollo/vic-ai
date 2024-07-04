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
      <span v-if="(confirmation?.details['prepare_batch_store'] || []).length > 1">Cria Lotes</span>
      <span v-else-if="(confirmation?.details['prepare_batch_store'] || []).length === 1">Cria Lote</span>
    </h2>
    <div class="flex flex-col gap-5">
      <div v-for="batch in (confirmation?.details['prepare_batch_store'] || [])" class="
          flex flex-col items-center
        ">
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Nome:</div>
          <div>{{ batch.args.name }}</div>
        </div>
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Tipo:</div>
          <div>{{ batch.args.type }}</div>
        </div>
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Descrição:</div>
          <div>{{ batch.args.description }}</div>
        </div>
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Unidade:</div>
          <div>{{ batch.extra?.unit || batch.args.unit }}</div>
        </div>
        <div v-if="batch.args.minimum_production" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Produção mínima:</div>
          <div>{{ batch.args.minimum_production }}</div>
        </div>
        <div v-if="batch.args.maximum_production" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Produção máxima:</div>
          <div>{{ batch.args.maximum_production }}</div>
        </div>
        <div v-if="batch.args.milking_per_day" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Ordenhas por dia:</div>
          <div>{{ batch.args.milking_per_day }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
