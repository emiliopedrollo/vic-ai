import { createRouter, createWebHistory } from 'vue-router'
import { useOAuthStore } from '@/stores/oauth'
import HomeView from '@/views/HomeView.vue'
import Logout from '@/views/Logout.vue'
import Callback from '@/views/Callback.vue'
import Login from '@/views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/logout',
      name: 'logout',
      component: Logout,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        hideForAuth: true
      }
    },
    {
      path: '/callback',
      name: 'callback',
      component: Callback,
      props: route => ({
        code: route.query.code,
        state: route.query.state,
        error: route.query.error,
        message: route.query.message,
        hint: route.query.hint,
      }),
      meta: {
        hideForAuth: true
      }
    },
    {
      path: '/about',
      name: 'about',
      meta: {
          requiresAuth: true
      },
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const oauth = useOAuthStore()
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!oauth.isLoggedIn) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.hideForAuth)) {
    if (oauth.isLoggedIn) {
      next({ name: 'home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
