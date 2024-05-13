<script setup lang="ts">
import { RouterView } from 'vue-router'
import GlitchText from '@/components/GlitchText.vue'

</script>

<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <!--      <Transition mode="in-out">-->
      <KeepAlive>
        <Suspense>
          <component :is="Component"></component>
          <template #fallback>
            <div class="h-screen flex justify-center items-center">
              <div class="text-green-500 text-5xl -mt-14">
                <GlitchText text="Carregando"/>
              </div>
            </div>
          </template>
        </Suspense>
      </KeepAlive>
      <!--      </Transition>-->
    </template>
  </RouterView>
</template>

<style scoped>
</style>
