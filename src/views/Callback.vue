<script setup lang="ts">
import router from '@/router'

const props = defineProps<{
  code: string | undefined,
  state: string,
  error: string | undefined
  message: string | undefined
}>()

import { useOAuthStore } from '@/stores/oauth'

const oauth = useOAuthStore()

let display_message:string|undefined  = props.message

if (props.code) {
  try {
    await oauth.issueToken(props.code, props.state)
    router.push({ name: 'home' })
  } catch (e: any) {
    display_message = e.message || e
  }
} else {
  display_message = 'No code given'
}

</script>

<template>

  <div v-if="display_message" class="flex flex-column justify-center h-screen text-center align-center">
    <h2 class="text-red-600 text-2xl p-5">{{
        display_message
    }}</h2>
    <a href="/login" class="mt-3 text-decoration-underline text-blue-700">Tente de novo</a>
  </div>

</template>

<style scoped>
</style>
