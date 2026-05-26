<template>
  <div class="page">
    <div class="card">
      <h1>Crash</h1>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Sign In</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">
          Register
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <input
          v-if="mode === 'register'"
          v-model="form.username"
          type="text"
          placeholder="Username"
          required
        />
        <input v-model="form.password" type="password" placeholder="Password" required />
        <input
          v-if="mode === 'register'"
          v-model="form.comfirmPassword"
          type="password"
          placeholder="Comfirm Password"
          required
        />

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" class="submit" :disabled="isLoading">
          {{ isLoading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const mode = ref<'login' | 'register'>('login')
const form = reactive({ username: '', password: '', comfirmPassword: '' })
const errorMsg = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  errorMsg.value = ''
  if (mode.value === 'register' && form.password !== form.comfirmPassword) {
    errorMsg.value = 'Passwords do not match'
    return
  }
  isLoading.value = true
  await new Promise((r) => setTimeout(r, 800)) //replace with real auth
  isLoading.value = false
  router.push('/game')
}
</script>

<style scoped></style>
