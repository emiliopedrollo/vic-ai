<script setup lang="ts">

defineProps<{
  role: "user" | "assistant",
  content: string
}>()

</script>

<template>
  <div
    class="flex mb-2 last:mb-0"
    :class="{
       'align-self-start': role === 'assistant',
       'align-self-end': role !== 'assistant',
    }"
  >
    <img v-if="role === 'assistant'" src="\vic.svg" alt="VIC" class="me-1.5"/>
    <div
      class="p-4 rounded-t-[8px] text-base"
      :class="{
        'bg-[#DEF1F9]': role === 'assistant',  'text-[#4D4D4D]': role === 'assistant',  'rounded-br-[8px]': role === 'assistant',
        'bg-[#D6EDD4]': role !== 'assistant', 'text-[#333333]': role !== 'assistant', 'rounded-bl-[8px]': role !== 'assistant',
      }"
    >
      {{ content }}
    </div>
  </div>
</template>

<style scoped>

</style>
