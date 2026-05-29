<template>
    <div>
      {{ counter }}
      {{ x }}
    </div>
</template>

<script setup>
let counter = ref(10)
let y = 0;
let x = ref(1);
setInterval (() => {
    counter -= 1
    console.log(counter)
}, 1000)
function theGame() {
const timer = setInterval(() => {
  y = Math.random() * 10;
  console.log(x);
  if (y <= 9.889) {
    console.log("yesss");
    x += 0.01;
  } else {
    console.log("no");
    clearInterval(timer);
    x = 1
  }
}, 100);}

</script>

<style>

</style>