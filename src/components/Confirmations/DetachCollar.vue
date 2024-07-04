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
      <span v-if="(confirmation?.details['prepare_collar_detach'] || []).length > 1">Desvincula Coleiras</span>
      <span v-else-if="(confirmation?.details['prepare_collar_detach'] || []).length === 1">Desvincula Coleira</span>
    </h2>
    <div class="flex flex-col gap-5">
      <div v-for="attachment in (confirmation?.details['prepare_collar_detach'] || [])" class="
          flex flex-col items-center
        ">
        <div class="w-full flex flex-row gap-4 justify-space-between">
          <div>Coleira:</div>
          <div>{{ attachment.args.collar_code }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
