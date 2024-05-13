<script setup lang="ts">

defineProps<{
  text: string,
  fromVic: boolean
}>()

</script>

<template>
  <div
    class="p-2 rounded-t-[0.6rem]"
    :class="{
      'bg-green-800': fromVic, 'align-self-start': fromVic, 'rounded-br-[0.6rem]': fromVic,
      'bg-blue-800': !fromVic, 'align-self-end': !fromVic, 'rounded-bl-[0.6rem]': !fromVic,
    }"
  >{{ text }}</div>
</template>

<style scoped>

</style>
