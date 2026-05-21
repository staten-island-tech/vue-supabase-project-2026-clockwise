<template>
    <div>

    </div>
</template>

<script setup>
let counter = 10 
let y = 0;
let x = 1;
setInterval (() => {
    counter -= 1
    console.log(counter)
}, 1000)
function theGame() {
const timer = setInterval(() => {
  y = Math.random() * 10;
  console.log(x);
  if (y <= 9.495) {
    console.log("yesss");
    x += 0.05;
  } else {
    console.log("no");
    clearInterval(timer);
  }
}, 100);}

</script>

<style>

</style>