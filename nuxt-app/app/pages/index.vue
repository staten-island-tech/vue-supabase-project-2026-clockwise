<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white rounded-xl shadow-md p-6">
      <h1 class="text-2xl font-semibold text-center mb-4">Welcome</h1>
      <p class="text-sm text-center text-gray-500 mb-6">
        Sign in or create an account
      </p>

      <div class="flex justify-center mb-4">
        <button
          @click="mode = 'login'"
          :class="
            mode === 'login'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-blue-600'
          "
          class="px-4 py-2 rounded-l border border-blue-600"
        >
          Login
        </button>
        <button
          @click="mode = 'signup'"
          :class="
            mode === 'signup'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-blue-600'
          "
          class="px-4 py-2 rounded-r border border-blue-600"
        >
          Create Account
        </button>
      </div>

      <form @submit.prevent="mode === 'login' ? handleLogin() : handleSignUp()">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Username</label
          >
          <input
            v-model="username"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Password</label
          >
          <input
            type="password"
            v-model="password"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div v-if="mode === 'signup'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Confirm Password</label
          >
          <input
            type="password"
            v-model="confirmPassword"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-red-600">{{ error }}</div>
          <div class="text-sm text-green-600">{{ message }}</div>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {{ mode === "login" ? "Login" : "Create Account" }}
        </button>
      </form>

      <div class="mt-4 text-center text-sm text-gray-500">
        Demo auth stored in localStorage. Replace with a real backend for
        production.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const mode = ref("login");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const message = ref("");

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem("users") || "{}");
  } catch {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function handleSignUp() {
  error.value = "";
  message.value = "";
  if (!username.value || !password.value) {
    error.value = "Username and password are required.";
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }
  const users = loadUsers();
  if (users[username.value]) {
    error.value = "Username already exists.";
    return;
  }
  users[username.value] = { password: password.value };
  saveUsers(users);
  message.value = "Account created. You can now log in.";
  mode.value = "login";
  password.value = "";
  confirmPassword.value = "";
}

function handleLogin() {
  error.value = "";
  message.value = "";
  const users = loadUsers();
  const u = users[username.value];
  if (!u || u.password !== password.value) {
    error.value = "Invalid username or password.";
    return;
  }
  message.value = `Welcome, ${username.value}!`;
  localStorage.setItem("sessionUser", username.value);
}
</script>

<style scoped></style>
