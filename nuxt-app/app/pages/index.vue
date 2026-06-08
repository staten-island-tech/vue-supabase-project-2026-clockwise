<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Welcome</h1>
        <p class="auth-subtitle">Sign in or create a new account</p>
      </div>

      <!-- Tab Toggle -->
      <div class="tab-group">
        <button
          @click="mode = 'login'"
          :class="{ 'tab-active': mode === 'login' }"
          class="tab-button"
        >
          Login
        </button>
        <button
          @click="mode = 'signup'"
          :class="{ 'tab-active': mode === 'signup' }"
          class="tab-button"
        >
          Sign Up
        </button>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="mode === 'login' ? handleLogin() : handleSignUp()"
        class="auth-form"
      >
        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            v-model="username"
            type="text"
            placeholder="Enter your username"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            class="form-input"
          />
        </div>

        <div v-if="mode === 'signup'" class="form-group animate-fadeIn">
          <label class="form-label">Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            class="form-input"
          />
        </div>

        <div class="message-container">
          <div v-if="error" class="message message-error">
            <span>⚠</span> {{ error }}
          </div>
          <div v-if="message" class="message message-success">
            <span>✓</span> {{ message }}
          </div>
        </div>

        <button type="submit" class="submit-button">
          {{ mode === "login" ? "Sign In" : "Create Account" }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Demo auth stored in Supabase.</p>
        <p>Replace with your production Supabase setup as needed.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const supabase = useSupabaseClient();

const mode = ref("login");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const message = ref("");

function usernameToEmail(u) {
  return u.includes("@") ? u : `${u}@example.com`;
}

async function handleSignUp() {
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

  const email = usernameToEmail(username.value);
  const { data, error: supError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (supError) {
    error.value = supError.message || JSON.stringify(supError);
    return;
  }

  message.value = "Account created. Check your email to confirm (if required).";
  mode.value = "login";
  password.value = "";
  confirmPassword.value = "";
}

async function handleLogin() {
  error.value = "";
  message.value = "";
  if (!username.value || !password.value) {
    error.value = "Username and password are required.";
    return;
  }

  const email = usernameToEmail(username.value);
  const { data, error: supError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (supError) {
    error.value = supError.message || JSON.stringify(supError);
    return;
  }

  message.value = `Welcome, ${username.value}!`;
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Container */
.auth-container {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #f0f9ff, #e0e7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* Card */
.auth-card {
  width: 100%;
  max-width: 28rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  border: 1px solid #e5e7eb;
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #6b7280;
}

/* Tabs */
.tab-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background-color: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.tab-button {
  flex: 1;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  color: #4b5563;
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.tab-button:hover {
  color: #111827;
}

.tab-button.tab-active {
  background-color: white;
  color: #2563eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* Messages */
.message-container {
  min-height: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message {
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.message-error {
  color: #dc2626;
}

.message-success {
  color: #16a34a;
}

/* Button */
.submit-button {
  width: 100%;
  padding: 0.625rem;
  background: linear-gradient(to right, #2563eb, #4f46e5);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.submit-button:hover {
  background: linear-gradient(to right, #1d4ed8, #4338ca);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.submit-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Footer */
.auth-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
}

.auth-footer p {
  margin: 0;
}

.auth-footer p + p {
  margin-top: 0.25rem;
}

/* Animations */
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>
