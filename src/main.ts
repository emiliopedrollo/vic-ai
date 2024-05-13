import './assets/main.scss'
import 'vuetify/styles'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'

import App from './App.vue'

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import router from './router'
import axios from 'axios'
import { useOAuthStore } from '@/stores/oauth'

const vuetify = createVuetify({
  theme: false,
  components,
  directives,
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
  },
})

const app = createApp(App)

app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')

axios.interceptors.request.use(async (config) => {
  if (config['url']?.includes(import.meta.env.VITE_COWMED_API_URL)) {
    const oauth = useOAuthStore()
    if (oauth.needsRefresh()) {
      await oauth.refresh().catch(() => {
        oauth.logout()
        router.push({ name: 'home' })
      })
    }
    config.headers.Authorization = `Bearer ${oauth.accessToken}`
  }
  return config
})
