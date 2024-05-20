<script setup lang="ts">

defineProps<{
  text: string,
  fromVic: boolean
}>()

</script>

<template>
  <div
    class="flex mb-2 last:mb-0"
    :class="{
       'align-self-start': fromVic,
       'align-self-end': !fromVic,
    }"
  >
    <img v-if="fromVic" src="\vic.svg" alt="VIC" class="me-1.5"/>
    <div
      class="p-4 rounded-t-[8px] text-base"
      :class="{
        'bg-[#DEF1F9]': fromVic,  'text-[#4D4D4D]': fromVic,  'rounded-br-[8px]': fromVic,
        'bg-[#D6EDD4]': !fromVic, 'text-[#333333]': !fromVic, 'rounded-bl-[8px]': !fromVic,
      }"
    >
      {{ text }}
    </div>
  </div>
</template>

<style scoped>

</style>
