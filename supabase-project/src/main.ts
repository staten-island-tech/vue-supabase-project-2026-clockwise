import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '../src/views/App.vue'
import router from './pages/Index.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
