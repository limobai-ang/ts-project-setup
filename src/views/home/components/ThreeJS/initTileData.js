// initTileData.js
import { createMahjongTile } from './createMahjongTile.js'

const basePath = '/images/'

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
  const {tileSize, regions} = configOption
  const columns = 17
  const gapY = tileSize.depth
  const wallMeshes = {
    east: [],
    south: [],
    west: [],
    north: [],
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
        const wallTile = createMahjongTile(tileSize, tileData.image)

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
        wallTile.userData.baseY = wallTile.position.y

        scene.add(wallTile)
        wallMeshes[dir.side].push(wallTile)
      }
    }
  })

  return wallMeshes
}

export {
  createSuit,
  createWind,
  createDragon,
  shuffleTiles,
  splitToWalls,
}
