<script setup lang="ts">

import MarkdownPreview from '@uivjs/vue-markdown-preview';
import { defineComponent } from 'vue'

defineProps<{
  role: "user" | "assistant",
  content: string
}>()

defineComponent({
  components: {
    MarkdownPreview
  }
});

</script>

<template>
  <div
    class="flex"
    :class="{
       'align-self-start': role === 'assistant',
       'align-self-end': role !== 'assistant',
    }"
  >
    <img v-if="role === 'assistant'" src="\vic.svg" alt="VIC" class="me-1.5 w-[70px]"/>
    <div
      class="p-4 rounded-t-[8px] text-base"
      :class="{
        'bg-[#DEF1F9]': role === 'assistant',  'text-[#4D4D4D]': role === 'assistant',  'rounded-br-[8px]': role === 'assistant',
        'bg-[#D6EDD4]': role !== 'assistant', 'text-[#333333]': role !== 'assistant', 'rounded-bl-[8px]': role !== 'assistant',
      }"
    >
      <markdown-preview class="m-0 bg-transparent">{{ content }}</markdown-preview>
<!--      <pre class="text-pre-wrap">{{ content }}</pre>-->
    </div>
  </div>
</template>

<style scoped>

</style>
