/**
 * @param {'east' | 'south' | 'west' | 'north'} dealerSide - 庄家方位
 * @param {number} dice1 - 骰子 1
 * @param {number} dice2 - 骰子 2
 * @returns {{ startSide: string, columnFromRight: number }}
 */
export function calculateWallStart(dealerSide, dice1, dice2) {
  const sides = ['east', 'south', 'west', 'north'] // 顺时针
  const dealerIndex = sides.indexOf(dealerSide)
  if (dealerIndex === -1) throw new Error('Invalid dealer side')

  const total = dice1 + dice2

  const steps = (total - 1) % 4
  const startIndex = (dealerIndex + 1 + steps) % 4
  const startSide = sides[startIndex]


  const columnFromRight = Math.max(dice1, dice2) // 从右往左第几列

  return {
    side: startSide,
    columnIndex: columnFromRight,
  }
}

export function takeTilesFromWall(wallMeshes, startInfo, count = 1) {
  const order = ['east', 'south', 'west', 'north'] // 顺时针顺序
  const result = []

  // 找起始位置
  const { startSide, columnFromRight: startCol } = startInfo
  let currentSide = startSide
  let col = startCol
  let row = 0  // 默认从下层开始

  for (let i = 0; i < count; i++) {
    // 取牌
    const tile = wallMeshes[currentSide]?.[col]?.[row]

    if (!tile) {
      console.warn(`取牌失败：${currentSide} 第 ${col} 列 第 ${row} 层无牌`)
      break
    }
    result.push(tile)

    // 下一个位置：
    if (row === 0) {
      row = 1
    } else {
      row = 0
      col++
      if (col >= 17) {
        col = 0
        // 顺时针切换到下一个方位
        const idx = (order.indexOf(currentSide) + 1) % 4
        currentSide = order[idx]
      }
    }
  }

  return result
}


// 用于处理角度差值（考虑 wrap-around，如 -PI 和 PI 是同一个方向）
export function normalizeAngle(angle) {
  angle = (angle + Math.PI) % (Math.PI * 2) - Math.PI
  return angle
}


function isClose(a, b, threshold = 0.01) {
  return Math.abs(a - b) < threshold
}

export function updateTileAnimation(tile) {
  if (!tile || !tile.userData) return

  const { position, rotation } = tile.userData
  let moved = true
  let rotated = true

  // --- 平滑移动 ---
  if (position?.x !== undefined) {
    const dx = position.x - tile.position.x
    tile.position.x += dx * 0.15
    if (!isClose(tile.position.x, position.x)) moved = false
  }
  if (position?.y !== undefined) {
    const dy = position.y - tile.position.y
    tile.position.y += dy * 0.15
    if (!isClose(tile.position.y, position.y)) moved = false
  }
  if (position?.z !== undefined) {
    const dz = position.z - tile.position.z
    tile.position.z += dz * 0.15
    if (!isClose(tile.position.z, position.z)) moved = false
  }

  // --- 平滑旋转 ---
  if (rotation?.x !== undefined) {
    const rx = normalizeAngle(rotation.x - tile.rotation.x)
    tile.rotation.x += rx * 0.15
    if (!isClose(rx, 0)) rotated = false
  }
  if (rotation?.y !== undefined) {
    const ry = normalizeAngle(rotation.y - tile.rotation.y)
    tile.rotation.y += ry * 0.15
    if (!isClose(ry, 0)) rotated = false
  }
  if (rotation?.z !== undefined) {
    const rz = normalizeAngle(rotation.z - tile.rotation.z)
    tile.rotation.z += rz * 0.15
    if (!isClose(rz, 0)) rotated = false
  }

  // --- 动画完成 ---
  if (moved && rotated && !tile.userData.animationDone) {
    tile.userData.animationDone = true
    if (typeof tile.userData.onAnimationComplete === 'function') {
      tile.userData.onAnimationComplete(tile)
    }
  }
}
