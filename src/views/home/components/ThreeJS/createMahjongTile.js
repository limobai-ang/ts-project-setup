import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function createGradientTexture(colorStart, colorEnd, direction = 'vertical', reverse = false) {
  const canvas = document.createElement('canvas')
  if (direction === 'vertical') {
    canvas.width = 1
    canvas.height = 256
  } else {
    canvas.width = 256
    canvas.height = 1
  }

  const ctx = canvas.getContext('2d')
  const gradient = direction === 'vertical'
    ? ctx.createLinearGradient(0, 0, 0, canvas.height)
    : ctx.createLinearGradient(0, 0, canvas.width, 0)

  if (reverse) {
    gradient.addColorStop(0, colorEnd)
    gradient.addColorStop(1, colorStart)
  } else {
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(1, colorEnd)
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  return texture
}


export function createMahjongTile(size = { width: 4, height: 6, depth: 2 }) {
  const geometry = new RoundedBoxGeometry(size.width, size.height, size.depth, 5, 0.3)

  const colorStart = '#409eff' // 蓝色背面
  const colorEnd = '#ffffff'   // 白色正面

  // 为每个面创建贴图（注意方向）
  const texXPos = createGradientTexture(colorEnd, colorStart, 'horizontal', false) // +X（右侧）背→正
  const texXNeg = createGradientTexture(colorEnd, colorStart, 'horizontal', true)  // -X（左侧）正→背

  const texYPos = createGradientTexture(colorStart, colorEnd, 'vertical', false)   // +Y（上）背→正
  const texYNeg = createGradientTexture(colorStart, colorEnd, 'vertical', true)    // -Y（下）正→背

  // 材质
  const matXPos = new THREE.MeshStandardMaterial({ map: texXPos, roughness: 0.4, metalness: 0.2 })
  const matXNeg = new THREE.MeshStandardMaterial({ map: texXNeg, roughness: 0.4, metalness: 0.2 })
  const matYPos = new THREE.MeshStandardMaterial({ map: texYPos, roughness: 0.4, metalness: 0.2 })
  const matYNeg = new THREE.MeshStandardMaterial({ map: texYNeg, roughness: 0.4, metalness: 0.2 })

  const frontMat = new THREE.MeshStandardMaterial({ color: colorEnd, roughness: 0.4, metalness: 0.2 }) // +Z 正面白
  const backMat  = new THREE.MeshStandardMaterial({ color: colorStart, roughness: 0.4, metalness: 0.2 }) // -Z 背面蓝

  const materials = [
    matXPos,  // +X
    matXNeg,  // -X
    matYPos,  // +Y
    matYNeg,  // -Y
    frontMat, // +Z
    backMat   // -Z
  ]

  const tile = new THREE.Mesh(geometry, materials)
  tile.userData.originalColor = new THREE.Color(colorEnd)
  tile.userData.baseY = size.height / 2
  return tile
}
