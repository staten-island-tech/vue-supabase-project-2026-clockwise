 <template>
  <h1>hi</h1>
  <div>Money: {{ starterMoney.toFixed(2) }}</div>

  <div>Timer: {{ counter }} Multiplier: {{ x.toFixed(2) }}</div>

  <div>
    <label>
      Bet:
      <input
        type="number"
        v-model.number="betInput"
        min="0"
        step="0.01"
        :disabled="gameRunning || !countdownRunning"
      />
    </label>

    <label style="margin-left: 12px">
      Auto Cashout:
      <input
        type="number"
        v-model.number="autoCashout"
        min="1"
        step="0.01"
        :disabled="gameRunning || !countdownRunning"
        placeholder="e.g. 2.00"
      />
    </label>

    <button
      @click="onPlayButton"
      :disabled="
        placingBetDisabled ||
        (betActive && !canCashout) ||
        (!countdownRunning && !betActive) ||
        (gameRunning && !betActive)
      "
    >
      {{ betActive ? "Cashout" : "Place Bet" }}
    </button>
  </div>

  <div v-if="message">{{ message }}</div>
</template>

<script setup>
import { ref } from "vue";
// ...existing code...
const INITIAL_COUNT = 10;
const counter = ref(INITIAL_COUNT);
const x = ref(1);
let y = 0;
let countdownTimer = null;
let gameTimer = null;

// new state
const starterMoney = ref(100);
const betInput = ref(null);
const currentBet = ref(0);
const betActive = ref(false); // true after placing a bet, awaiting cashout
const canCashout = ref(true); // becomes false if game crashes before cashout
const message = ref("");

// helper flags for UI
const placingBetDisabled = ref(false);

// new flags to prevent mid-game betting & track click timing
const countdownRunning = ref(false); // true while countdown is active
const gameRunning = ref(false); // true while multiplier game is running
const clickedBeforeTimer = ref(false); // true if button clicked before countdown started

// new: autocashout target
const autoCashout = ref(null);

// reusable cashout logic (used for manual and auto cashout)
function performCashout() {
  if (!betActive.value || !canCashout.value) return false;
  const reward = currentBet.value * x.value;
  starterMoney.value += reward;
  message.value = `Cashed out: ${reward.toFixed(2)}`;
  currentBet.value = 0;
  betActive.value = false;
  canCashout.value = true;
  return true;
}

function startGame() {
  // ensure previous game timer cleared
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
  // game is now running
  gameRunning.value = true;
  countdownRunning.value = false;

  // reset multiplier at game start
  x.value = 1;
  gameTimer = setInterval(() => {
    y = Math.random() * 10;
    if (y <= 9.889) {
      x.value = +(x.value + 0.01).toFixed(2);

      // auto cashout check: if player set a target and x reaches/exceeds it
      const target = Number(autoCashout.value) || 0;
      if (
        betActive.value &&
        canCashout.value &&
        target > 0 &&
        x.value >= target
      ) {
        performCashout();
        // after auto cashout the round continues until crash; do not restart countdown here
      }
    } else {
      // crash: stop game and restart countdown
      console.log("no — game crashed");
      clearInterval(gameTimer);
      gameTimer = null;
      gameRunning.value = false;

      // mark bet lost if active
      if (betActive.value) {
        canCashout.value = false;
        betActive.value = false;
        currentBet.value = 0;
        message.value = "Game crashed — bet lost.";
      }

      // restart countdown for next round
      startCountdown();
    }
  }, 100);
}

function startCountdown() {
  // clear any existing timers
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  // reset counter and multiplier for new round
  counter.value = INITIAL_COUNT;
  x.value = 1;
  // ensure gameTimer also cleared
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  // mark countdown as running
  countdownRunning.value = true;
  gameRunning.value = false;

  countdownTimer = setInterval(() => {
    if (counter.value > 0) {
      counter.value -= 1;
      console.log("countdown", counter.value);
    }
    if (counter.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      counter.value = 0;
      countdownRunning.value = false;
      startGame();
    }
  }, 1000);
}

// Play / Cashout button handler
function onPlayButton() {
  // record whether the click happened before the countdown was running
  clickedBeforeTimer.value = !countdownRunning.value && !gameRunning.value;
  console.log(
    "clickedBeforeTimer",
    clickedBeforeTimer.value,
    "countdownRunning",
    countdownRunning.value,
    "gameRunning",
    gameRunning.value,
  );

  message.value = "";
  // If no active bet, attempt to place one
  if (!betActive.value) {
    // only allow placing a bet while countdown is running (i.e., betting window)
    if (!countdownRunning.value || gameRunning.value) {
      message.value = "Betting is closed for this round.";
      return;
    }

    const amount = Number(betInput.value) || 0;
    if (amount <= 0) {
      message.value = "Enter a valid bet amount.";
      return;
    }
    if (amount > starterMoney.value) {
      message.value = "Not enough money to place that bet.";
      return;
    }
    // place bet: remove stake from starter money and mark active
    starterMoney.value -= amount;
    currentBet.value = amount;
    betActive.value = true;
    canCashout.value = true;
    message.value = "Bet placed. Press Cashout to collect before crash.";
    return;
  }

  // If a bet is active, this is a cashout attempt
  if (betActive.value && canCashout.value) {
    performCashout();
    return;
  }

  // If betActive was false but canCashout false, bet already lost
  if (!canCashout.value) {
    message.value = "Unable to cash out — the round already crashed.";
  }
}

// start the first countdown when component mounts
startCountdown();
</script>
