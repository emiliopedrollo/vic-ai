<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue'

// defineProps<{
//   msg: string
// }>()

</script>

<template>
  <div class="h-screen flex">
      <div class="flex-grow dark:bg-[#666666] bg-[#12530d] grid place-items-center max-xl:hidden">

        <img src="/login-dark.svg" class="hidden dark:inline-block" alt="Login"/>
        <img src="/login.svg" class="inline-block dark:hidden" alt="Login"/>
<!--        <header class="-->
<!--          leading-normal max-h-screen md:flex md:place-items-center px-10 md:px-auto-->
<!--      ">-->
<!--          <h1 class="green text-4xl text-center font-medium relative max-md:mb-6">-->
<!--            Bem vindo ao teste da nova<br />-->
<!--            <span class="text-6xl italic font-extrabold text-green-500 uppercase">Vic</span>-->
<!--          </h1>-->
<!--        </header>-->
      </div>
      <div class="text-center px-16 md:px-16 dark:bg-zinc-800 bg-[#FFFFFF]
         flex-column justify-space-around max-xl:flex-grow
         place-items-center flex flex-col">
        <div class="dark:text-neutral-50 text-gray-500">
          <div>
            <span class="text-2xl">
              Bem vindo ao teste da
            </span><br />
              <span class="text-4xl">
             nova Vic!
            </span>
          </div>
          <div class="mt-16">
            <span class="text-base">Você precisa autorizar acesso a sua fazenda para continuar.</span>
          </div>
          <div class="flex justify-center mt-14">
            <LoginButton />
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
