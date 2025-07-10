// initTileData.js
import { createMahjongTile } from './createMahjongTile.js'
import * as THREE from 'three'

const basePath = '/image/'

let globalId = 1

const createSuit = (type, count = 9, copies = 4) => {
  const tiles = []
  for (let i = 1; i <= count; i++) {
    for (let j = 0; j < copies; j++) {
      tiles.push({
        id: globalId++,
        type,
        value: i,
        image: `${basePath}${type}-${i}.png`,
        history: [],
      })
    }
  }
  return tiles
}

const createWind = () => {
  const values = ['east', 'south', 'west', 'north']
  return values.flatMap((value) =>
    Array.from({ length: 4 }, () => ({
      id: globalId++,
      type: 'wind',
      value,
      image: `${basePath}wind-${value}.png`,
      history: [],
    }))
  )
}

const createDragon = () => {
  const values = ['red', 'green', 'white']
  return values.flatMap((value) =>
    Array.from({ length: 4 }, () => ({
      id: globalId++,
      type: 'dragon',
      value,
      image: `${basePath}dragon-${value}.png`,
      history: [],
    }))
  )
}

const shuffleTiles = (tiles) => {
  const copy = [...tiles]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const splitToWalls = (tiles) => {
  const walls = {
    east: tiles.slice(0, 34),
    south: tiles.slice(34, 68),
    west: tiles.slice(68, 102),
    north: tiles.slice(102, 136),
  }
  return walls
}

export function createAllTiles() {
  globalId = 1 // 重置 ID 计数器
  const all = [
    ...createSuit('dot'),
    ...createSuit('bamboo'),
    ...createSuit('character'),
    ...createWind(),
    ...createDragon(),
  ]
  return all
}

export function generateWalls() {
  const tiles = shuffleTiles(createAllTiles())
  return splitToWalls(tiles)
}

export function createWallFromTiles(scene, configOption, wallTilesBySide) {
  const { tileSize, regions } = configOption
  const columns = 17
  const gapY = tileSize.depth

  const wallMeshes = {
    east: Array.from({ length: 17 }, () => []),  // 每列一个数组
    south: Array.from({ length: 17 }, () => []),
    west: Array.from({ length: 17 }, () => []),
    north: Array.from({ length: 17 }, () => []),
  }

  const directions = [
    { side: 'south', angle: -Math.PI, x: 0, z: regions.wall.z, horizontal: 'x', rotateX: -Math.PI / 2, rotateZ: 0 },
    { side: 'west', angle: -Math.PI, x: regions.wall.z, z: 0, horizontal: 'z', rotateX: -Math.PI / 2, rotateZ: Math.PI / 2 },
    { side: 'north', angle: -Math.PI, x: 0, z: -regions.wall.z, horizontal: 'x', rotateX: -Math.PI / 2, rotateZ: 0 },
    { side: 'east', angle: -Math.PI, x: -regions.wall.z, z: 0, horizontal: 'z', rotateX: -Math.PI / 2, rotateZ: Math.PI / 2 },
  ]

  directions.forEach(dir => {
    const start = -(columns / 2 - 0.5) * (tileSize.width + 0.2)
    const tiles = wallTilesBySide[dir.side]
    let tileIndex = 0

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < 2; j++) {
        const tileData = tiles[tileIndex++]
        const wallTile = createMahjongTile(tileSize, { frontImage: tileData.image })

        const offset = start + i * (tileSize.width + 0.2)
        const yOffset = tileSize.height / 2 + j * gapY

        let x = dir.x, y = yOffset, z = dir.z
        if (dir.horizontal === 'x') {
          x += offset
        } else {
          z += offset
        }

        wallTile.position.set(x, y, z)
        wallTile.rotation.set(dir.rotateX, dir.angle, dir.rotateZ)

        wallTile.userData = {
          id: tileData.id,                  // 全局唯一编号
          type: tileData.type,              // 牌类型（dot/bamboo/character/wind/dragon）
          value: tileData.value,            // 点数或文字
          image: tileData.image,            // 正面图标
          owner: null,                      // 当前拥有者（发牌前为空） 'east' | 'south' | 'west' | 'north' | null
          state: 'wall',                    // 初始状态为墙中  'wall' | 'hand' | 'discard' | 'melded' | 'drawn'

          columnIndex: i,
          rowIndex: j,

          position: {                       // 初始位置（与 mesh.position 同步）
            x: wallTile.position.x,
            y: wallTile.position.y,
            z: wallTile.position.z
          },

          rotation: {
            x: wallTile.rotation.x,          // 初始旋转（与 mesh.rotation 同步）
            y: wallTile.rotation.y,
            z: wallTile.rotation.z
          },

          originalColor: wallTile.userData.originalColor, // 正面默认颜色
          history: []                       // 操作记录数组
        }

        scene.add(wallTile)
        wallMeshes[dir.side][i][j] = wallTile // 明确记录 row 层
      }
    }
  })

  return {
    grouped: wallMeshes, // { east: [], south: [], west: [], north: [] }
    flat: Object.values(wallMeshes).flat(Infinity) // 一维数组，供射线检测使用
  }
}

export {
  createSuit,
  createWind,
  createDragon,
  shuffleTiles,
  splitToWalls,
}
