<script setup lang="ts">

import MarkdownPreview from '@uivjs/vue-markdown-preview'
import { defineComponent } from 'vue'

defineProps<{
  role: 'user' | 'assistant',
  actions?: string[],
  content?: string
}>()

defineComponent({
  components: {
    MarkdownPreview
  }
})

const action_map: Record<string, string> = {
  file_search: 'Consultando documentação',
  get_current_time: 'Consultando data e hora atual',
  get_farm_data: 'Consultando dados da fazenda',
  get_farm_units: 'Consultando preferencias de unidades da fazenda',
  get_user_data: 'Consultando dados do usuário',
  execute_preparations: 'Executando preparações',
  list_batches: 'Consultando lotes',
  prepare_batch_store: 'Preparando para inserir lotes',
  prepare_animals_move: 'Preparando para mover animais',
  list_animals: 'Consultando animais',
  prepare_animal_update: 'Prepara para atualizar animal',
  prepare_animal_store: 'Preparando para inserir animal',
  list_collars: 'Consultando coleiras',
  prepare_to_detach_collar: 'Preparando para desvincular coleira',
  prepare_to_attach_collar_to_animal: 'Preparando para vincular coleira a animal',
  list_animals_in_infirmary: 'Consultando animais na enfermaria',
  list_animals_in_heat: 'Consultando animais em cio',
  list_service_recommendations: 'Consultando recomendações de serviço',
  get_heat_details: 'Consultando detalhes de cio',
  prepare_insemination_store: 'Preparando para cadastrar inseminação',
  prepare_embryo_transfer_store: 'Preparando para cadastrar transferência embrionaria',
  prepare_natural_breeding_store: 'Preparando para cadastrar monta natural',
  prepare_dismiss_animal_heat: 'Preparando para descartar cio',
  prepare_confirm_animal_heat: 'Preparando para confirmar cio',
  get_herd_overview: 'Consultando visão geral do rebanho',
  get_herd_tutorials_for_cowmed_software: 'Consultando tutoriais do software Cowmed',
  get_herd_glossary: 'Consultando glossário de rebanho',
  get_reproduction_glossary: 'Consultando glossário de reprodução'
}

</script>

<template>
  <div
    class="flex flex-col"
    :class="{
       'align-self-start': role === 'assistant',
       'align-self-end': role !== 'assistant',
    }">
    <div>
      <div v-for="action in actions" :key="action" class="flex justify-start">
        <div v-if="action !== 'file_search'" class="ms-[10px] mb-4">{{ action_map[action] }}.</div>
      </div>
    </div>
    <div v-if="!!content" class="flex">
      <img v-if="role === 'assistant'" src="\vic.svg" alt="VIC" class="me-1.5 w-[70px]" />
      <div
        class="p-1 rounded-t-[8px] text-base"
        :class="{
        'bg-[#DEF1F9]': role === 'assistant',  'text-[#4D4D4D]': role === 'assistant',  'rounded-br-[8px]': role === 'assistant',
        'bg-[#D6EDD4]': role !== 'assistant', 'text-[#333333]': role !== 'assistant', 'rounded-bl-[8px]': role !== 'assistant',
      }"
      >
        <markdown-preview class="m-0 bg-transparent">{{ content.replace(/【\d+:\d+†source】/g,'') }}</markdown-preview>
        <!--      <pre class="text-pre-wrap">{{ content }}</pre>-->
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
