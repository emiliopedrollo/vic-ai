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
      <span v-if="(confirmation?.details['prepare_animal_store'] || []).length > 1">Inclusão de animais</span>
      <span v-else-if="(confirmation?.details['prepare_animal_store'] || []).length === 1">Inclusão de animal</span>
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
          <div>{{ animal.extra?.batch || animal.args.batch_slug }}</div>
        </div>
        <div v-if="animal.args.breed" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Raça:</div>
          <div>{{ animal.extra?.breed || animal.args.breed }}</div>
        </div>
        <div v-if="animal.args.birth" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Data de Nascimento:</div>
          <div>{{ (new Date(animal.args.birth)).toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            timeZoneName: 'short'
          }) }}
          </div>
        </div>
        <div v-if="animal.args.pregnant" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Prenhe:</div>
          <div>{{ animal.args.pregnant ? 'Sim' : 'Não' }}</div>
        </div>
        <div v-if="animal.args.last_delivery" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Último parto:</div>
          <div>{{ (new Date(animal.args.last_delivery)).toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            timeZoneName: 'short'
          }) }}
          </div>
        </div>
        <div v-if="animal.args.last_service" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Último serviço:</div>
          <div>{{ (new Date(animal.args.last_service)).toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            timeZoneName: 'short'
          }) }}
          </div>
        </div>
        <div v-if="animal.args.last_service_method" class="w-full flex flex-row gap-4 justify-space-between">
          <div>Método do último serviço:</div>
          <div>{{ last_service_method(animal.args.last_service_method) || 'Outro' }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
