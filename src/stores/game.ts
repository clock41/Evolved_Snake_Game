import { ref } from 'vue'
import { defineStore } from 'pinia'

export const GRID_SIZE = 20

export type Direction = 'up' | 'down' | 'left' | 'right'

function randomFood(snake: { x: number; y: number }[]): { x: number; y: number } {
  let pos: { x: number; y: number }
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y))
  return pos
}

export const useGameStore = defineStore('game', () => {
  const snake = ref<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ])

  const food = ref(randomFood(snake.value))
  const score = ref(0)
  const direction = ref<Direction>('right')
  const isPlaying = ref(false)
  const isGameOver = ref(false)
  const nextDirection = ref<Direction | null>(null)

  let intervalId: ReturnType<typeof setInterval> | null = null

  const opposites: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  }

  function changeDirection(newDir: Direction) {
    if (newDir !== opposites[direction.value]) {
      nextDirection.value = newDir
    }
  }

  function gameOver() {
    stopMoving()
    isGameOver.value = true
  }

  function move() {
    if (nextDirection.value) {
      direction.value = nextDirection.value
      nextDirection.value = null
    }

    const head = snake.value[0]
    if (!head) return
    const newHead = { x: head.x, y: head.y }

    switch (direction.value) {
      case 'up':
        newHead.y--
        break
      case 'down':
        newHead.y++
        break
      case 'left':
        newHead.x--
        break
      case 'right':
        newHead.x++
        break
    }

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      gameOver()
      return
    }

    if (snake.value.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      gameOver()
      return
    }

    const ate = newHead.x === food.value.x && newHead.y === food.value.y

    if (ate) {
      snake.value = [newHead, ...snake.value]
      score.value++
      food.value = randomFood(snake.value)
    } else {
      snake.value = [newHead, ...snake.value.slice(0, -1)]
    }
  }

  function startMoving(speed = 200) {
    if (intervalId) return
    isPlaying.value = true
    intervalId = setInterval(move, speed)
  }

  function stopMoving() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isPlaying.value = false
  }

  function resetGame() {
    stopMoving()
    snake.value = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]
    direction.value = 'right'
    nextDirection.value = null
    food.value = randomFood(snake.value)
    score.value = 0
    isGameOver.value = false
    startMoving()
  }

  return {
    snake,
    food,
    score,
    direction,
    isPlaying,
    isGameOver,
    changeDirection,
    startMoving,
    stopMoving,
    resetGame,
    GRID_SIZE,
  }
})
