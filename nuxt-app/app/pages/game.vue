<template>
  <div class="game-shell">
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="top-bar-label">Recent</span>
        <div class="crash-pills">
          <span
            v-for="round in recentRounds"
            :key="round.id"
            class="pill"
            :class="pillColor(round.crash_point)"
          >
            {{ round.crash_point ? round.crash_point.toFixed(2) + "x" : "—" }}
          </span>
        </div>
      </div>
      <div class="top-bar-right">
        <span class="balance-label">💰 {{ starterMoney.toFixed(2) }}</span>
        <button class="profile-btn" @click="toggleProfile">👤 Profile</button>
        <button class="profile-btn" @click="toggleBets">📋 Bets</button>
        <button class="logout-btn" @click="logout">Logout</button>
      </div>
    </div>

    <!-- Profile panel -->
    <div v-if="showProfile" class="profile-panel">
      <div class="profile-header">
        <h2>{{ currentUser?.email }}</h2>
        <button class="close-btn" @click="showProfile = false">✕</button>
      </div>
      <div class="profile-stats">
        <div class="stat-card">
          <span class="stat-label">Balance</span>
          <span class="stat-value">${{ starterMoney.toFixed(2) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Level</span>
          <span class="stat-value">{{ userMisc.level }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">XP</span>
          <span class="stat-value">{{ userMisc.xp }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Wagered</span>
          <span class="stat-value">${{ Number(totalWagered).toFixed(2) }}</span>
        </div>
      </div>

      <h3 class="history-title">Past Bets</h3>
      <div class="bet-history">
        <div v-if="pastBets.length === 0" class="no-bets">No bets yet.</div>
        <table v-else class="bet-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Bet</th>
              <th>Cashout</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bet in pastBets" :key="bet.id">
              <td>{{ formatTime(bet.bet_time) }}</td>
              <td>${{ Number(bet.amount).toFixed(2) }}</td>
              <td>{{ bet.cashout_result ? "$" + Number(bet.cashout_result).toFixed(2) : "—" }}</td>
              <td>
                <span class="status-badge" :class="bet.status">
                  {{ bet.status === "won" ? "✓ Won" : bet.status === "lost" ? "✗ Lost" : "..." }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bets panel -->
    <div v-if="showBets" class="profile-panel">
      <div class="profile-header">
        <h2>Bet History</h2>
        <button class="close-btn" @click="showBets = false">✕</button>
      </div>
      <div class="bet-history">
        <div v-if="pastBets.length === 0" class="no-bets">No bets yet.</div>
        <table v-else class="bet-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Amount</th>
              <th>Cashout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bet in pastBets" :key="bet.id">
              <td>{{ formatTime(bet.bet_time) }}</td>
              <td>${{ Number(bet.amount).toFixed(2) }}</td>
              <td>{{ bet.cashout_result ? "$" + Number(bet.cashout_result).toFixed(2) : "—" }}</td>
              <td>
                <span class="status-badge" :class="bet.status">
                  {{ bet.status === "won" ? "✓ Won" : bet.status === "lost" ? "✗ Lost" : "..." }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Game area -->
    <div class="game-area">
      <div class="multiplier-display" :class="{ crashed: !gameRunning && !countdownRunning }">
        {{ gameRunning || betActive ? x.toFixed(2) + "x" : countdownRunning ? "Starting in " + counter + "s" : "Crashed" }}
      </div>
      <p class="multiplier-sub" v-if="gameRunning">Current payout</p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label class="control-label">Bet Amount</label>
        <input type="number" v-model.number="betInput" min="0" step="0.01"
          :disabled="gameRunning || !countdownRunning" class="control-input" placeholder="0.00" />
      </div>
      <div class="control-group">
        <label class="control-label">Auto Cashout</label>
        <input type="number" v-model.number="autoCashout" min="1" step="0.01"
          :disabled="gameRunning || !countdownRunning" class="control-input" placeholder="e.g. 2.00" />
      </div>
      <button class="action-btn" :class="betActive ? 'cashout' : 'place'" @click="onPlayButton"
        :disabled="placingBetDisabled || (betActive && !canCashout) || (!countdownRunning && !betActive) || (gameRunning && !betActive)">
        {{ betActive ? "💸 Cashout" : "🎲 Place Bet" }}
      </button>
    </div>

    <div v-if="message" class="message"
      :class="message.includes('crashed') || message.includes('lost') ? 'msg-loss' : 'msg-win'">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { supabase } from "../lib/supabase";
import { useRouter } from "vue-router";

definePageMeta({ middleware: "auth" });

async function ensureUserRecords() {
  if (!currentUser) return;

  // user_data row
  const { data: userRow, error: userRowError } = await supabase
    .from("user_data")
    .select("id")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (userRowError) {
    console.error("user_data lookup error:", userRowError);
  }

  if (!userRow) {
    const { error } = await supabase.from("user_data").insert({
      id: currentUser.id,
      user_email: currentUser.email,
      balance: 100,
      xp: 0,
      total_amount_gambled: 0,
    });

    if (error) {
      console.error("user_data insert error:", error);
    } else {
      console.log("Created user_data row");
    }
  }

  // misc row
  const { data: miscRow, error: miscRowError } = await supabase
    .from("misc")
    .select("user_id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (miscRowError) {
    console.error("misc lookup error:", miscRowError);
  }

  if (!miscRow) {
    const { error } = await supabase.from("misc").insert({
      user_id: currentUser.id,
      xp: 0,
      level: 1,
    });

    if (error) {
      console.error("misc insert error:", error);
    } else {
      console.log("Created misc row");
    }
  }
}
const router = useRouter();
const INITIAL_COUNT = 10;
const counter = ref(INITIAL_COUNT);
const x = ref(1);
let y = 0;
let countdownTimer = null;
let gameTimer = null;

const GAME_TABLE = "THEY CALL IT THE GAME";

const starterMoney = ref(100);
const betInput = ref(null);
const currentBet = ref(0);
const betActive = ref(false);
const canCashout = ref(true);
const message = ref("");
const placingBetDisabled = ref(false);
const countdownRunning = ref(false);
const gameRunning = ref(false);
const autoCashout = ref(null);
const showProfile = ref(false);
const showBets = ref(false);

const userMisc = ref({ level: 1, xp: 0 });
const totalWagered = ref(0);
const pastBets = ref([]);
const recentRounds = ref([]);

let currentUser = null;
let currentGameId = null;
let currentBetId = null;

function pillColor(val) {
  if (!val) return "pill-grey";
  if (val < 1.5) return "pill-red";
  if (val < 3) return "pill-blue";
  return "pill-gold";
}

function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString();
}

async function logout() {
  await supabase.auth.signOut();
  router.push("/");
}

async function toggleProfile() {
  showProfile.value = !showProfile.value;
  if (showProfile.value) {
    showBets.value = false;
    await loadPastBets();
  }
}

async function toggleBets() {
  showBets.value = !showBets.value;
  if (showBets.value) {
    showProfile.value = false;
    await loadPastBets();
  }
}

async function loadUserData() {
  const [{ data: ud }, { data: misc }] = await Promise.all([
    supabase.from("user_data").select("balance, total_amount_gambled").eq("id", currentUser.id).maybeSingle(),
    supabase.from("misc").select("level, xp").eq("user_id", currentUser.id).maybeSingle(),
  ]);
  if (ud) {
    starterMoney.value = Number(ud.balance) || 100;
    totalWagered.value = Number(ud.total_amount_gambled) || 0;
  }
  if (misc) userMisc.value = { level: misc.level || 1, xp: misc.xp || 0 };
}

async function loadPastBets() {
  const { data } = await supabase.from("user_bets").select("*")
    .eq("user_id", currentUser.id).order("bet_time", { ascending: false }).limit(20);
  if (data) pastBets.value = data;
}

async function loadRecentRounds() {
  const { data } = await supabase.from(GAME_TABLE).select("id, crash_point")
    .not("crash_point", "is", null).order("created_at", { ascending: false }).limit(5);
  if (data) recentRounds.value = data;
}

async function saveBalance(newBalance) {
  console.log("Saving balance...");
  console.log("Auth User ID:", currentUser?.id);

  const { data, error } = await supabase
    .from("user_data")
    .update({ balance: newBalance })
    .eq("id", currentUser.id)
    .select();

  console.log("Update result:", data);
  console.log("Update error:", error);
}

async function createGameRound() {
  const { data, error } = await supabase.from(GAME_TABLE)
    .insert({ created_at: new Date().toISOString() }).select().single();
  if (error) { console.error("createGameRound error:", error.message); return; }
  if (data) currentGameId = data.id;
}

async function endGameRound(crashPoint) {
  if (!currentGameId) return;
  const { error } = await supabase.from(GAME_TABLE)
    .update({ crash_point: crashPoint, ended_at: new Date().toISOString() }).eq("id", currentGameId);
  if (error) console.error("endGameRound error:", error.message);
  currentGameId = null;
  await loadRecentRounds();
}

async function saveCrashProperties(crashPoint) {
  const { error } = await supabase.from("crash_properties")
    .insert({ start_time: new Date().toISOString(), crash_id: crashPoint });
  if (error) console.error("saveCrashProperties error:", error.message);
}

async function placeBetDB(amount) {
  if (!currentUser || !currentGameId) return;

  // STEP 1: ALWAYS pull from DB
  const { data: userData } = await supabase
    .from("user_data")
    .select("total_amount_gambled")
    .eq("id", currentUser.id)
    .maybeSingle();

  const currentTotal = Number(userData?.total_amount_gambled || 0);

  // STEP 2: safe calculation
  const newTotal = currentTotal + amount;

  console.log("CURRENT TOTAL:", currentTotal);
  console.log("ADDING AMOUNT:", amount);
  console.log("NEW TOTAL:", newTotal);

  // STEP 3: insert bet
  const { data, error } = await supabase
    .from("user_bets")
    .insert({
      user_id: currentUser.id,
      amount,
      status: "active",
      cashout_result: 0,
      bet_time: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("bet insert error:", error);
    return;
  }

  currentBetId = data.id;

  // STEP 4: update DB
  const { data: updated, error: updateError } = await supabase
    .from("user_data")
    .update({ total_amount_gambled: newTotal })
    .eq("id", currentUser.id)
    .select();

  console.log("UPDATE RESULT:", updated);
  console.log("UPDATE ERROR:", updateError);

  totalWagered.value += newTotal;
}
async function updateXPAndLevel() {
  const { data: misc, error } = await supabase.from("misc")
    .select("xp, level").eq("user_id", currentUser.id).maybeSingle();
  if (error || !misc) { console.error("updateXPAndLevel: no misc row", error?.message); return; }

  const newXP = (misc.xp || 0) + 1;
  const newLevel = Math.floor(newXP / 3) + 1;

  await supabase.from("misc").update({ xp: newXP, level: newLevel }).eq("user_id", currentUser.id);
  userMisc.value = { xp: newXP, level: newLevel };
}

async function resolveBetDB(status, cashoutResult = null) {
  if (!currentBetId) return;
  await supabase.from("user_bets")
    .update({ status, cashout_result: cashoutResult }).eq("id", currentBetId);
  currentBetId = null;
  if (status === "won") await updateXPAndLevel();
  if (showBets.value || showProfile.value) await loadPastBets();
}

async function performCashout() {
  if (!betActive.value || !canCashout.value) return false;
  const reward = currentBet.value * x.value;
  starterMoney.value += reward;
  message.value = `Cashed out: $${reward.toFixed(2)}`;
  await resolveBetDB("won", reward);
  await saveBalance(starterMoney.value);
  currentBet.value = 0;
  betActive.value = false;
  canCashout.value = true;
  return true;
}

async function startGame() {
  if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
  gameRunning.value = true;
  countdownRunning.value = false;
  x.value = 1;
  await createGameRound();

  if (!currentGameId) {
    console.error("startGame: no game ID — aborting");
    gameRunning.value = false;
    startCountdown();
    return;
  }

  gameTimer = setInterval(async () => {
    y = Math.random() * 10;
    if (y <= 9.889) {
      x.value = +(x.value + 0.01).toFixed(2);
      const target = Number(autoCashout.value) || 0;
      if (betActive.value && canCashout.value && target > 0 && x.value >= target) {
        await performCashout();
      }
    } else {
      clearInterval(gameTimer);
      gameTimer = null;
      gameRunning.value = false;
      await endGameRound(x.value);
      await saveCrashProperties(x.value);
      if (betActive.value) {
        canCashout.value = false;
        betActive.value = false;
        message.value = "Game crashed — bet lost.";
        await resolveBetDB("lost", 0);
        await saveBalance(starterMoney.value);
        currentBet.value = 0;
      }
      startCountdown();
    }
  }, 100);
}

function startCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  counter.value = INITIAL_COUNT;
  x.value = 1;
  if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
  countdownRunning.value = true;
  gameRunning.value = false;
  countdownTimer = setInterval(() => {
    if (counter.value > 0) counter.value -= 1;
    if (counter.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      counter.value = 0;
      countdownRunning.value = false;
      startGame();
    }
  }, 1000);
}

async function onPlayButton() {
  message.value = "";
  if (!betActive.value) {
    if (!countdownRunning.value || gameRunning.value) { message.value = "Betting is closed for this round."; return; }
    const amount = Number(betInput.value) || 0;
    if (amount <= 0) { message.value = "Enter a valid bet amount."; return; }
    if (amount > starterMoney.value) { message.value = "Not enough money."; return; }
    starterMoney.value -= amount;
    currentBet.value = amount;
    betActive.value = true;
    canCashout.value = true;
    message.value = "Bet placed. Press Cashout to collect before crash.";
    await saveBalance(starterMoney.value);
    await placeBetDB(amount);
    return;
  }
  if (betActive.value && canCashout.value) { await performCashout(); return; }
  if (!canCashout.value) message.value = "Unable to cash out — the round already crashed.";
}

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  await loadUserData();
  await loadRecentRounds();
  startCountdown();
});

onUnmounted(() => {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
});
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.game-shell {
  min-height: 100vh; background: #0f1123; color: #e0e6ff;
  font-family: "Inter", system-ui, sans-serif; display: flex; flex-direction: column;
}
.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; background: #161929; border-bottom: 1px solid #252a45;
}
.top-bar-left { display: flex; align-items: center; gap: 12px; }
.top-bar-label { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
.crash-pills { display: flex; gap: 6px; }
.pill { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
.pill-red { background: #3b1a1a; color: #f87171; }
.pill-blue { background: #1a2340; color: #60a5fa; }
.pill-gold { background: #2d2410; color: #fbbf24; }
.pill-grey { background: #252a45; color: #6b7280; }
.top-bar-right { display: flex; align-items: center; gap: 12px; }
.balance-label { font-weight: 700; color: #fbbf24; font-size: 0.95rem; }
.profile-btn, .logout-btn {
  padding: 5px 14px; border-radius: 8px; border: none;
  cursor: pointer; font-size: 0.8rem; font-weight: 600;
}
.profile-btn { background: #252a45; color: #e0e6ff; }
.profile-btn:hover { background: #2e3458; }
.logout-btn { background: #3b1a1a; color: #f87171; }
.logout-btn:hover { background: #4c2020; }
.profile-panel {
  position: fixed; top: 0; right: 0; width: 380px; height: 100vh;
  background: #161929; border-left: 1px solid #252a45;
  z-index: 100; overflow-y: auto; padding: 24px;
}
.profile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.profile-header h2 { font-size: 0.95rem; color: #9ca3af; }
.close-btn { background: none; border: none; color: #6b7280; font-size: 1.2rem; cursor: pointer; }
.close-btn:hover { color: #e0e6ff; }
.profile-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
.stat-card { background: #0f1123; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
.stat-value { font-size: 1.3rem; font-weight: 700; color: #fbbf24; }
.history-title { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
.no-bets { color: #4b5563; font-size: 0.9rem; }
.bet-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.bet-table th { color: #6b7280; text-align: left; padding: 6px 8px; border-bottom: 1px solid #252a45; }
.bet-table td { padding: 8px; border-bottom: 1px solid #1a1f35; color: #e0e6ff; }
.status-badge { padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.status-badge.won { background: #14532d; color: #4ade80; }
.status-badge.lost { background: #3b1a1a; color: #f87171; }
.game-area {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px; padding: 40px;
}
.multiplier-display {
  font-size: clamp(3rem, 10vw, 6rem); font-weight: 900;
  color: #e0e6ff; letter-spacing: -0.02em; transition: color 0.3s;
}
.multiplier-display.crashed { color: #f87171; }
.multiplier-sub { color: #6b7280; font-size: 0.9rem; }
.controls {
  display: flex; gap: 12px; align-items: flex-end;
  padding: 20px; background: #161929; border-top: 1px solid #252a45; flex-wrap: wrap;
}
.control-group { display: flex; flex-direction: column; gap: 6px; }
.control-label { font-size: 0.72rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
.control-input {
  background: #0f1123; border: 1px solid #252a45; color: #e0e6ff;
  padding: 10px 14px; border-radius: 8px; font-size: 0.95rem; width: 140px;
}
.control-input:focus { outline: none; border-color: #4f6ef7; }
.control-input:disabled { opacity: 0.4; }
.action-btn {
  padding: 10px 28px; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.15s; height: 42px;
}
.action-btn.place { background: #4f6ef7; color: white; }
.action-btn.place:hover:not(:disabled) { background: #3b5be0; }
.action-btn.cashout { background: #f59e0b; color: #0f1123; }
.action-btn.cashout:hover:not(:disabled) { background: #d97706; }
.action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.message { text-align: center; padding: 10px; font-size: 0.9rem; font-weight: 600; }
.msg-win { color: #4ade80; }
.msg-loss { color: #f87171; }
</style>