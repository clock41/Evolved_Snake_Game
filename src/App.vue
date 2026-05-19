<script setup lang="ts">
import GameBoard from './GameBoard.vue'
</script>

<template>
  <GameBoard />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #f0f0f0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  width: 100%;
}
</style>
