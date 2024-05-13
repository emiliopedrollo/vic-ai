<script setup lang="ts">
import router from '@/router'

defineProps<{
  msg: string
}>()

import { useOAuthStore } from '@/stores/oauth'
import { useMainStore } from '@/stores/main'

const oauth = useOAuthStore()
const store = useMainStore()

oauth.logout()
store.$reset()

// console.log(oauth.accessToken)

router.push({ name: 'login' })

</script>

<template>
</template>

<style scoped>
</style>
