<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue'

// defineProps<{
//   msg: string
// }>()

</script>

<template>
  <div class="h-screen md:flex md:place-items-center max-md:pt-16">
    <div class="md:grid md:grid-cols-2 mx-auto my-0 ">
      <header class="
          leading-normal max-h-screen md:flex md:place-items-center px-10 md:px-auto
          md:border-r md:border-solid md:border-r-green-500
      ">
        <h1 class="green text-4xl text-center font-medium relative max-md:mb-6">
          Bem vindo ao teste da nova<br />
          <span class="text-6xl italic font-extrabold text-green-500 uppercase">Vic</span>
        </h1>
      </header>
      <div class="text-center px-10 md:px-10
         flex-column justify-space-around
         place-items-center flex flex-col">
        <h3 class="green mb-2 text-xl">Você precisa autorizar acesso a sua fazenda para continuar.</h3>
        <div class="flex justify-center">
          <LoginButton/>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

@media screen(md) {
  header {
    padding-right: calc(var(--section-gap) / 2);
  }
}

</style>
