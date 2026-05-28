<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGameStore, GRID_SIZE, type Direction } from './stores/game'

const game = useGameStore()

let lastTapTime = 0

function onBoardClick() {
  if (game.isGameOver) {
    game.resetGame()
    return
  }

  if (game.isPaused) {
    game.togglePause()
    return
  }

  const now = Date.now()
  if (now - lastTapTime < 300) {
    game.togglePause()
    lastTapTime = 0
  } else {
    lastTapTime = now
  }
}

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

  if (e.key === ' ') {
    e.preventDefault()
    if (game.isGameOver) {
      game.resetGame()
    } else {
      game.togglePause()
    }
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

    <div class="board-wrapper" @click="onBoardClick">
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
          v-for="(monster, index) in game.monsters"
          :key="`monster-${index}`"
          class="monster"
          :style="{
            gridRow: monster.y + 1,
            gridColumn: monster.x + 1,
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

      <div v-if="game.isPaused" class="overlay">
        <div class="overlay-box">
          <h2 :class="game.hasStarted ? 'pause-title' : 'start-title'">
            {{ game.hasStarted ? '暫停' : '🐍 貪吃蛇' }}
          </h2>
          <p class="overlay-hint">
            <span class="desktop-hint">{{ game.hasStarted ? '按空白鍵繼續' : '按空白鍵開始' }}</span>
            <span class="touch-hint">{{ game.hasStarted ? '點擊繼續' : '點擊開始' }}</span>
          </p>
        </div>
      </div>

      <div v-if="game.isGameOver" class="overlay">
        <div class="overlay-box">
          <h2 class="gameover-title">遊戲結束</h2>
          <p class="final-score">分數：{{ game.score }}</p>
          <p class="overlay-hint">
            <span class="desktop-hint">按空白鍵重新開始</span>
            <span class="touch-hint">點擊重新開始</span>
          </p>
        </div>
      </div>
    </div>

    <div class="dpad">
      <button class="dpad-btn up" @click="game.changeDirection('up')">▲</button>
      <button class="dpad-btn left" @click="game.changeDirection('left')">◀</button>
      <button class="dpad-btn right" @click="game.changeDirection('right')">▶</button>
      <button class="dpad-btn down" @click="game.changeDirection('down')">▼</button>
    </div>

    <aside class="rules-panel">
      <h2>遊戲規則</h2>

      <h3>🎮 操作</h3>
      <ul>
        <li>方向鍵 / WASD 控制方向</li>
        <li><span class="desktop-hint">空白鍵 開始／暫停</span><span class="touch-hint">點擊開始 / 雙擊畫面暫停</span></li>
      </ul>

      <h3>🐍 蛇</h3>
      <ul>
        <li>自動前進，可穿越自己身體</li>
        <li>吃食物變長但不加分</li>
      </ul>

      <h3>👾 怪物（紫色）</h3>
      <ul>
        <li>隨機移動</li>
        <li>蛇頭碰到怪物 → 死亡</li>
        <li>怪物碰到食物 → 食物重生</li>
        <li>吃食物增加怪物（最多 10 隻）</li>
        <li><strong>怪物被蛇圍困消失 → 得分</strong></li>
      </ul>

      <h3>💀 結束條件</h3>
      <ul>
        <li>撞牆 → 死亡</li>
        <li>蛇頭碰到怪物 → 死亡</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  font-family: 'Segoe UI', sans-serif;
}

.rules-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 25%;
  height: 95%;
  overflow-y: auto;
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-size: 0.938rem;
  line-height: 2;
  color: #333;
}

.rules-panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  color: #1a1a2e;
}

.rules-panel h3 {
  margin: 0.75rem 0 0.25rem;
  font-size: 1rem;
  color: #555;
}

.rules-panel ul {
  margin: 0;
  padding-left: 1rem;
}

.rules-panel li {
  margin-bottom: 0.125rem;
}

@media (min-width: 1001px) {
  .rules-panel {
    position: fixed;
    left: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
  }
}

@media (max-width: 1000px) {
  .rules-panel {
    margin-top: 1rem;
    width: 100%;
    max-width: 25rem;
  }
}

.game-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.game-title {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.game-score {
  font-size: 1.125rem;
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
  width: 25rem;
  height: 25rem;
  background-color: #1a1a2e;
  border: 0.125rem solid #333;
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
  z-index: 2;
}

.monster {
  background-color: #9b59b6;
  border-radius: 2px;
  z-index: 1;
}

.food {
  background-color: #ff3333;
  border-radius: 50%;
  z-index: 1;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.overlay-box {
  background-color: #fff;
  border-radius: 0.75rem;
  padding: 2rem 3rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.pause-title {
  margin: 0 0 0.75rem;
  font-size: 1.75rem;
  color: #333;
}

.start-title {
  margin: 0 0 0.75rem;
  font-size: 1.75rem;
  color: #1a1a2e;
}

.gameover-title {
  margin: 0 0 0.75rem;
  font-size: 1.75rem;
  color: #c0392b;
}

.final-score {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #333;
}

.overlay-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #888;
}

.dpad {
  display: none;
  grid-template-areas:
    ".    up    ."
    "left  down  right"
    ".    .     .";
  grid-template-columns: repeat(3, 4rem);
  grid-template-rows: repeat(3, 4rem);
  gap: 0.25rem;
  margin-top: 1rem;
  touch-action: manipulation;
}

.dpad-btn {
  width: 4rem;
  height: 4rem;
  border: none;
  border-radius: 0.75rem;
  background: #1a1a2e;
  color: #fff;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.dpad-btn:active {
  background: #16213e;
}

.dpad-btn.up    { grid-area: up; }
.dpad-btn.left  { grid-area: left; }
.dpad-btn.right { grid-area: right; }
.dpad-btn.down  { grid-area: down; }

.desktop-hint {
  display: inline;
}

.touch-hint {
  display: none;
}

@media (hover: none) {
  .desktop-hint {
    display: none;
  }

  .touch-hint {
    display: inline;
  }

  .dpad {
    display: grid;
  }
}
</style>
