<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGameStore, GRID_SIZE, type Direction } from './stores/game'

const game = useGameStore()

function onKeydown(e: KeyboardEvent) {
  const keyMap: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right',
  }

  if (e.key === ' ' && game.isGameOver) {
    e.preventDefault()
    game.resetGame()
    return
  }

  const dir = keyMap[e.key]
  if (dir) {
    e.preventDefault()
    game.changeDirection(dir)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  game.startMoving()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  game.stopMoving()
})
</script>

<template>
  <div class="game-container">
    <div class="game-header">
      <h1 class="game-title">🐍 貪吃蛇遊戲</h1>
      <span class="game-score">分數：{{ game.score }}</span>
    </div>

    <div class="board-wrapper">
      <div class="board">
        <div
          v-for="cellIndex in GRID_SIZE * GRID_SIZE"
          :key="cellIndex"
          class="cell"
        />
        <div
          v-for="(segment, index) in game.snake"
          :key="`snake-${index}`"
          class="snake"
          :class="{ 'snake-head': index === 0 }"
          :style="{
            gridRow: segment.y + 1,
            gridColumn: segment.x + 1,
          }"
        />
        <div
          class="food"
          :style="{
            gridRow: game.food.y + 1,
            gridColumn: game.food.x + 1,
          }"
        />
      </div>

      <div v-if="game.isGameOver" class="game-over-overlay">
        <div class="game-over-box">
          <h2>遊戲結束</h2>
          <p class="final-score">分數：{{ game.score }}</p>
          <p class="restart-hint">按空白鍵重新開始</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
}

.game-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}

.game-title {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.game-score {
  font-size: 18px;
  color: #555;
}

.board-wrapper {
  position: relative;
}

.board {
  display: grid;
  grid-template-columns: repeat(v-bind(GRID_SIZE), 1fr);
  grid-template-rows: repeat(v-bind(GRID_SIZE), 1fr);
  gap: 1px;
  width: 400px;
  height: 400px;
  background-color: #1a1a2e;
  border: 2px solid #333;
  position: relative;
}

.cell {
  background-color: #16213e;
}

.snake {
  background-color: #00cc00;
  border-radius: 2px;
  z-index: 1;
}

.snake-head {
  background-color: #004d00;
}

.food {
  background-color: #ff3333;
  border-radius: 50%;
  z-index: 1;
}

.game-over-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.game-over-box {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px 48px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.game-over-box h2 {
  margin: 0 0 12px;
  font-size: 28px;
  color: #c0392b;
}

.final-score {
  margin: 0 0 8px;
  font-size: 20px;
  color: #333;
}

.restart-hint {
  margin: 0;
  font-size: 14px;
  color: #888;
}
</style>
