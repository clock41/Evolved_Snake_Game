import { ref } from 'vue'
import { defineStore } from 'pinia'

export const GRID_SIZE = 20
const MAX_MONSTERS = 10
const MONSTER_SPEED = 800

export type Direction = 'up' | 'down' | 'left' | 'right'

function randomFood(
  snake: { x: number; y: number }[],
  monsters?: { x: number; y: number }[],
): { x: number; y: number } {
  let pos: { x: number; y: number }
  const occupied = (p: { x: number; y: number }) =>
    snake.some((s) => s.x === p.x && s.y === p.y) ||
    (monsters ?? []).some((m) => m.x === p.x && m.y === p.y)

  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (occupied(pos))
  return pos
}

function shuffleDirections(): Direction[] {
  const dirs: Direction[] = ['up', 'down', 'left', 'right']
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp: Direction = dirs[i]!
    dirs[i] = dirs[j]!
    dirs[j] = tmp
  }
  return dirs
}

function isSurrounded(
  pos: { x: number; y: number },
  snake: { x: number; y: number }[],
): boolean {
  const blocked = new Set<string>()
  for (const s of snake) {
    blocked.add(`${s.x},${s.y}`)
  }

  const queue: { x: number; y: number }[] = [pos]
  const visited = new Set<string>()
  visited.add(`${pos.x},${pos.y}`)

  while (queue.length > 0) {
    const curr = queue.shift()!

    if (
      curr.x === 0 ||
      curr.x === GRID_SIZE - 1 ||
      curr.y === 0 ||
      curr.y === GRID_SIZE - 1
    ) {
      return false
    }

    const dirs: [number, number][] = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]
    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx
      const ny = curr.y + dy
      const key = `${nx},${ny}`
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue
      if (blocked.has(key) || visited.has(key)) continue
      visited.add(key)
      queue.push({ x: nx, y: ny })
    }
  }

  return true
}

function isFreeCell(
  x: number,
  y: number,
  snake: { x: number; y: number }[],
  monsters: { x: number; y: number }[],
  excludeMonsterIndex?: number,
): boolean {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false
  if (snake.some((s) => s.x === x && s.y === y)) return false
  return !monsters.some(
    (m, idx) => idx !== excludeMonsterIndex && m.x === x && m.y === y,
  )
}

export const useGameStore = defineStore('game', () => {
  function initialSnake(): { x: number; y: number }[] {
    return Array.from({ length: 16 }, (_, i) => ({ x: 15 - i, y: 10 }))
  }

  const snake = ref(initialSnake())

  const food = ref(randomFood(snake.value))
  const score = ref(0)
  const direction = ref<Direction>('right')
  const isPlaying = ref(false)
  const isGameOver = ref(false)
  const isPaused = ref(true)
  const hasStarted = ref(false)
  const nextDirection = ref<Direction | null>(null)
  const monsters = ref<{ x: number; y: number }[]>([])

  let snakeIntervalId: ReturnType<typeof setInterval> | null = null
  let monsterIntervalId: ReturnType<typeof setInterval> | null = null

  const opposites: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  }

  function spawnMonster(): { x: number; y: number } | null {
    let pos: { x: number; y: number } | null = null
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
      if (
        !snake.value.some((s) => s.x === candidate.x && s.y === candidate.y) &&
        !monsters.value.some((m) => m.x === candidate.x && m.y === candidate.y) &&
        !(candidate.x === food.value.x && candidate.y === food.value.y)
      ) {
        pos = candidate
        break
      }
    }
    return pos
  }

  function initMonsters() {
    const first = spawnMonster()
    monsters.value = first ? [first] : []
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

    if (monsters.value.some((m) => m.x === newHead.x && m.y === newHead.y)) {
      gameOver()
      return
    }

    const ate = newHead.x === food.value.x && newHead.y === food.value.y

    if (ate) {
      snake.value = [newHead, ...snake.value]
      food.value = randomFood(snake.value, monsters.value)

      if (monsters.value.length < MAX_MONSTERS) {
        const newMonster = spawnMonster()
        if (newMonster) {
          monsters.value = [...monsters.value, newMonster]
        }
      }
    } else {
      snake.value = [newHead, ...snake.value.slice(0, -1)]
    }
  }

  function moveMonsters() {
    const updated = [...monsters.value]
    for (let i = 0; i < updated.length; i++) {
      const m = updated[i]
      if (!m) continue
      const dirs: Direction[] = shuffleDirections()

      for (const dir of dirs) {
        const np = { x: m.x, y: m.y }
        switch (dir) {
          case 'up':
            np.y--
            break
          case 'down':
            np.y++
            break
          case 'left':
            np.x--
            break
          case 'right':
            np.x++
            break
        }

        if (!isFreeCell(np.x, np.y, snake.value, updated, i)) continue
        updated[i] = np
        break
      }
    }
    monsters.value = updated

    for (const monster of monsters.value) {
      if (monster.x === snake.value[0]?.x && monster.y === snake.value[0]?.y) {
        gameOver()
        return
      }
    }

    const surrounded = new Set<number>()
    for (let i = 0; i < monsters.value.length; i++) {
      const m = monsters.value[i]
      if (m && isSurrounded(m, snake.value)) {
        surrounded.add(i)
      }
    }
    if (surrounded.size > 0) {
      monsters.value = monsters.value.filter((_, i) => !surrounded.has(i))
      score.value += surrounded.size
    }

    for (const monster of monsters.value) {
      if (monster.x === food.value.x && monster.y === food.value.y) {
        food.value = randomFood(snake.value, monsters.value)
        break
      }
    }
  }

  function startMoving(snakeSpeed = 200) {
    if (snakeIntervalId) return
    isPlaying.value = true
    snakeIntervalId = setInterval(move, snakeSpeed)
    monsterIntervalId = setInterval(moveMonsters, MONSTER_SPEED)
  }

  function stopMoving() {
    if (snakeIntervalId) {
      clearInterval(snakeIntervalId)
      snakeIntervalId = null
    }
    if (monsterIntervalId) {
      clearInterval(monsterIntervalId)
      monsterIntervalId = null
    }
    isPlaying.value = false
  }

  function togglePause() {
    if (isGameOver.value) return
    isPaused.value = !isPaused.value
    hasStarted.value = true

    if (isPaused.value) {
      stopMoving()
    } else {
      startMoving()
    }
  }

  function resetGame() {
    stopMoving()
    isPaused.value = true
    hasStarted.value = false
    snake.value = initialSnake()
    direction.value = 'right'
    nextDirection.value = null
    food.value = randomFood(snake.value)
    score.value = 0
    isGameOver.value = false
    initMonsters()
  }

  initMonsters()

  return {
    snake,
    food,
    score,
    direction,
    isPlaying,
    isGameOver,
    isPaused,
    hasStarted,
    monsters,
    changeDirection,
    startMoving,
    stopMoving,
    togglePause,
    resetGame,
    GRID_SIZE,
  }
})
