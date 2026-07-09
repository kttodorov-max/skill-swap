import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        profile: resolve(__dirname, 'profile.html'),
        skillForm: resolve(__dirname, 'skill-form.html'),
        skillDetail: resolve(__dirname, 'skill-detail.html'),
        swapRequests: resolve(__dirname, 'swap-requests.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
