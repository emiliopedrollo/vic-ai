import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { isPast, addSeconds } from 'date-fns'
import axios, { type AxiosResponse } from 'axios'

interface SuccessAuthResponse {
  access_token: string,
  refresh_token: string,
  expires_in: number,
  token_type: "Bearer"
}

export const useOAuthStore = defineStore('oauth', () => {
  const accessToken: Ref<string|null> = useLocalStorage('vue/oauth/accessToken', null)
  const refreshToken: Ref<string|null> = useLocalStorage('vue/oauth/refreshToken', null)
  const expireAt: Ref<Date|null> = useLocalStorage('vue/oauth/expireAt', null)
  const generatedState: Ref<string|null> = useLocalStorage('vue/oauth/generatedState', null)
  const verificationCode: Ref<string|null> = useLocalStorage('vue/oauth/verificationCode', null)

  const isLoggedIn: ComputedRef<boolean> = computed(
    () => accessToken.value !== null
  )
  // const needsRefresh = computed(() => {})

  function $reset(): void {
    console.log("RESETTING")
    accessToken.value = null
    refreshToken.value = null
    expireAt.value = null
    generatedState.value = null
    verificationCode.value = null
  }

  function needsRefresh(): boolean {
    return (expireAt.value !== null && isPast(expireAt.value))
  }

  function setState(state: string): void {
    generatedState.value = state
  }

  function setVerificationCode(code: string): void {
    verificationCode.value = code
  }

  // function setup(): void {
  //   console.log("SETTING UP")
  //   expireAt.value = addSeconds(new Date, 10)
  // }
  async function refresh(): Promise<boolean> {
    console.log("Refreshing token")
    return new Promise((resolve, reject) => {
      const domain = import.meta.env.VITE_COWMED_AUTH_URL
      const client_id = import.meta.env.VITE_COWMED_OAUTH_CLIENT_ID
      const redirect_uri = `${location.protocol}//${location.host}/callback`

      axios({
        method: 'post',
        url: `https://${domain}/oauth/token`,
        data: {
          grant_type: 'refresh_token',
          client_id: client_id,
          refresh_token: refreshToken.value,
          scope: 'default-access'
          // code_verifier: verificationCode.value,
          // code: code,
        }
      }).then((response: AxiosResponse<SuccessAuthResponse>) => {
        setToken(response.data.access_token, response.data.refresh_token, response.data.expires_in)
        resolve(true)
      },(e) => {
        reject(e.response.data)
      })
    })
  }

  function logout(): void {
    expireAt.value = null
    accessToken.value = null
    refreshToken.value = null
    verificationCode.value = null
    generatedState.value = null
  }

  function setToken(access_token: string, refresh_token: string, expires_in: number) {
    expireAt.value = addSeconds(new Date, expires_in - 100)
    accessToken.value = access_token
    refreshToken.value = refresh_token
  }

  async function issueToken(code: string, state: string): Promise<any> {
    return new Promise((resolve, reject): void => {
      if (((generatedState.value?.length || 0) == 0) || generatedState.value !== state) {
        reject({
          error: 'invalid_state',
          message: 'Invalid state'
        })
      }

      const domain = import.meta.env.VITE_COWMED_AUTH_URL
      const client_id = import.meta.env.VITE_COWMED_OAUTH_CLIENT_ID
      const redirect_uri = `${location.protocol}//${location.host}/callback`

      axios({
        method: 'post',
        url: `https://${domain}/oauth/token`,
        data: {
          grant_type: 'authorization_code',
          client_id: client_id,
          redirect_uri: redirect_uri,
          code_verifier: verificationCode.value,
          code: code,
        }
      }).then((response: AxiosResponse<SuccessAuthResponse>) => {
        setToken(response.data.access_token, response.data.refresh_token, response.data.expires_in)
        resolve(true)
      },(e) => {
        reject(e.response.data)
      })
    })
  }

  return {
    $reset,
    accessToken,
    refreshToken,
    isLoggedIn,
    expireAt,
    verificationCode,
    generatedState,
    needsRefresh,
    // setup,
    logout,
    issueToken,
    refresh,
    setState,
    setVerificationCode
}
})
