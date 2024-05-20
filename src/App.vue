<script setup lang="ts">
import { RouterView } from 'vue-router'
import Loading from '@/components/Loading.vue'

</script>

<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <!--      <Transition mode="in-out">-->
      <KeepAlive>
        <Suspense>
          <component :is="Component"></component>
          <template #fallback>
            <Loading/>
          </template>
        </Suspense>
      </KeepAlive>
      <!--      </Transition>-->
    </template>
  </RouterView>
</template>

<style scoped>
</style>
