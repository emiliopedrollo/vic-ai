<script setup lang="ts">

import { useOAuthStore } from '@/stores/oauth'

const oauth = useOAuthStore()
oauth.$reset()

// function dec2hex (dec: number) {
//   return dec.toString(16).padStart(2, "0")
// }
//
// // generateId :: Integer -> String
// function getRandomString (len: number) {
//   let arr = new Uint8Array((len || 40) / 2)
//   window.crypto.getRandomValues(arr)
//   return Array.from(arr, dec2hex).join('')
// }

const createRandomString = (len: number): string => {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.'
  let random = ''
  const randomValues = Array.from(window.crypto.getRandomValues(new Uint8Array((len || 40) / 2)))
  randomValues.forEach(v => (random += charset[v % charset.length]))
  return random
}

const domain = import.meta.env.VITE_COWMED_AUTH_URL
const client_id = import.meta.env.VITE_COWMED_OAUTH_CLIENT_ID
const redirect_uri = `${location.protocol}//${location.host}/callback`

const state = createRandomString(40)
const code = createRandomString(128)

oauth.setState(state)
oauth.setVerificationCode(code)

const badBase64CharMap: any = { '+': '-', '/': '_', '=': '' }
const code_challenge = window.btoa(
  String.fromCharCode(
    ...Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          { name: 'SHA-256' },
          new TextEncoder().encode(code)
        )
      )
    )
  )
).replace(/[+\/=]/g, (m) => badBase64CharMap[m])

const params = {
  redirect_uri,
  client_id,
  state,
  code_challenge,
  response_type: 'code',
  scope: 'default-access',
  code_challenge_method: 'S256'
}

const query = (new URLSearchParams(params)).toString()

</script>

<template>
  <a class="
              w-72 py-2 px-2 flex flex-row flex-nowrap gap-x-3
              rounded-lg border-solid justify-center align-center
              bg-[#59B834] text-white hover:cursor-pointer"
     :href="`https://${domain}/oauth/authorize?${query}`"
  >
    <span class="icon bg-center bg-contain align-middle w-7 h-7 mr-2"></span>
    <span class="text-inherit text-sm align-middle font-bold text-center">Login com Cowmed</span>
  </a>
</template>

<style scoped>
span.icon {
  background-image: url("/cowmed-btn.svg");
}
</style>
