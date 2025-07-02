<template>
  <div class="mahjong-container">
    <canvas ref="canvasRef" class="mahjong-canvas" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createMahjongTile, setMahjongTileColor } from './createMahjongTile.js'
const canvasRef = ref()

// 全局配置对象：包含棋盘尺寸、麻将尺寸、各区域位置
const config = {
  boardSize: { width: 200, height: 200 },
  tileSize: { width: 4, height: 6, depth: 2, gap: 0.5 },
  regions: {
    hand: { z: 90 },     // 手牌区域 z 坐标
    wall: { z: 70 },     // 牌墙区域 z 坐标
    discard: { z: 30 },  // 弃牌区域 z 坐标
  },
  colors: {
    front: 0xffffff, // 正面白色
    back: 0x0066cc,  // 背面蓝色
    gradientStartZ: 150,  // 渐变开始 z
    gradientEndZ: 30      // 渐变结束 z（越靠中间越深）
  }
}

let camera;

onMounted(() => {
  const scene = new THREE.Scene()
  camera = createCamera()
  const renderer = createRenderer(canvasRef.value)
  const controls = createControls(camera, renderer)

  addLights(scene)
  addHelpers(scene)
  const board = createBoard()
  scene.add(board)

  const tiles = createHandTiles(scene) // 创建手牌
  const wall = createWall(scene, config.tileSize)   // 创建四面牌墙

  // 鼠标交互变量
  let selectedTile = null
  let dragging = false
  let behavior = null  // 行为动作
  let dragOffset = new THREE.Vector3()
  let insertIndex = -1
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  // 绑定鼠标事件
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)

  // 鼠标按下：选中牌并准备拖拽
  function onMouseDown(event) {
    // 使用射线（Raycaster）判断鼠标点击的是否是一个麻将牌（tile）。如果是，就会返回被点击的对象。
    const hit = getIntersectedTile(event, tiles)  // 这是移动手牌操作 从手牌中找
    const hiw = getIntersectedTile(event, wall)  // 这是从牌墙中取牌的操作 从牌墙中找

    if(!hit && !hiw) return
    
    // 如果点击到了麻将牌，取消之前选中牌的高亮与浮起状态，还原它的材质颜色、Y 位置（高度）。
    // 取牌
    if (hiw) {
      behavior = 'obtain'
      if (selectedTile && selectedTile !== hiw.object) {
        setMahjongTileColor(selectedTile)
        selectedTile.position.y = selectedTile.userData.baseY
      }
      selectedTile = hiw.object
      // 高亮颜色
      selectedTile.position.y = config.tileSize.depth * 3
    }

    if (hit) {

      // 移动手牌调整位置
      behavior = 'move'  // 移动
      if (selectedTile && selectedTile !== hit.object) {
        setMahjongTileColor(selectedTile)
        selectedTile.position.y = selectedTile.userData.baseY
      }
      selectedTile = hit.object
      selectedTile.position.y = config.tileSize.height / 2 + 1
    }

    dragging = true
    controls.enabled = false

    setMahjongTileColor(selectedTile, '#ffaa00')

    // 计算拖动偏移 映射到 -1 到 1 的范围，适配 WebGL 坐标系。
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(board)
    if (intersects.length > 0) {
      dragOffset.copy(intersects[0].point).sub(selectedTile.position)
    }
  }

  // 鼠标移动：实时拖动选中牌
  function onMouseMove(event) {
    if (dragging && selectedTile) {

      // 取牌的逻辑
      if (behavior == 'obtain') {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObject(board)
        if (intersects.length > 0) {
          const point = intersects[0].point.clone().sub(dragOffset)

          // 只更新 x/z 坐标（保留拖动状态下的 y）
          selectedTile.position.x = point.x
          selectedTile.position.z = point.z

          selectedTile.rotation.set(0, 0, 0)

          // 计算插入索引，保持动态排序
          insertIndex = Math.max(
            0,
            Math.min(tiles.length, Math.round(point.x / (config.tileSize.width + config.tileSize.gap)) + 6)
          )

          // 给其他牌设置目标位置，让出空间
          tiles.forEach((tile, i) => {
            if (tile !== selectedTile) {
              let offset = 0
              if (i >= insertIndex) offset = config.tileSize.width + config.tileSize.gap
              const targetX = (i - 6) * (config.tileSize.width + config.tileSize.gap) + offset
              tile.userData.targetX = targetX
            }
          })
        }

      } else if (behavior == 'move') {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)

        const intersects = raycaster.intersectObject(board)
        if (intersects.length > 0) {
          const point = intersects[0].point.clone().sub(dragOffset)

          // 只更新 x/z 坐标（保留拖动状态下的 y）
          selectedTile.position.x = point.x
          selectedTile.position.z = point.z

          // 计算插入索引，保持动态排序
          insertIndex = Math.max(
            0,
            Math.min(tiles.length, Math.round(point.x / (config.tileSize.width + config.tileSize.gap)) + 6)
          )

          // 给其他牌设置目标位置，让出空间
          tiles.forEach((tile, i) => {
            if (tile !== selectedTile) {
              let offset = 0
              if (i >= insertIndex) offset = config.tileSize.width + config.tileSize.gap
              const targetX = (i - 6) * (config.tileSize.width + config.tileSize.gap) + offset
              tile.userData.targetX = targetX
            }
          })
        }
      }
    }
  }

  // 鼠标松开：插入新位置、归位
  function onMouseUp() {

    if (selectedTile) {
      selectedTile.position.y = config.tileSize.height / 2
      selectedTile.position.z = config.regions.hand.z // 归位 z
      dragging = false
      controls.enabled = true
      setMahjongTileColor(selectedTile)
      // 取牌操作
      if (behavior === 'obtain') {
        // 插入数组排序位置
        tiles.push(selectedTile)
        tiles.splice(insertIndex, 0, selectedTile)
      }

      // 移动操作
      if (behavior === 'move') {
        // 插入数组排序位置
        tiles.splice(tiles.indexOf(selectedTile), 1)
        tiles.splice(insertIndex, 0, selectedTile)
      }

      // 更新所有牌目标位置（用于动画）
      tiles.forEach((tile, i) => {
        const targetX = (i - 6) * (config.tileSize.width + config.tileSize.gap)
        tile.userData.index = i
        tile.userData.targetX = targetX
        tile.userData.targetZ = config.regions.hand.z
      })
      behavior = null
      selectedTile = null
    }
  }

  // 动画渲染
  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    tiles.forEach(tile => {
      if (tile.userData.targetX !== undefined && (!dragging || tile !== selectedTile)) {
        tile.position.x += (tile.userData.targetX - tile.position.x) * 0.15
      }
    })
    renderer.render(scene, camera)
  }
  animate()

  // 响应窗口尺寸
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
})

// 创建透视相机
function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 100, 200)
  camera.lookAt(0, 0, 0)
  return camera
}

// 创建渲染器
function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x35654d)
  return renderer
}

// 创建相机控制器
function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 100
  controls.maxDistance = 800
  controls.maxPolarAngle = Math.PI / 2.2
  controls.target.set(0, 0, 30)
  return controls
}

// 添加环境光与方向光
function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(0, 100, 100)
  scene.add(directionalLight)
}

// 添加坐标轴辅助线
function addHelpers(scene) {
  scene.add(new THREE.AxesHelper(100))
}

// 创建棋盘面（绿色地板）
function createBoard() {
  const geometry = new THREE.PlaneGeometry(config.boardSize.width, config.boardSize.height)
  const material = new THREE.MeshStandardMaterial({ color: 0x228b22 })
  const board = new THREE.Mesh(geometry, material)
  board.rotation.x = -Math.PI / 2
  return board
}

function createHandTiles(scene) {
  const tiles = []
  const { width, height, depth, gap } = config.tileSize

  for (let i = 0; i < 13; i++) {
    const tile = createMahjongTile({ width, height, depth })
    tile.position.set((i - 6) * (width + gap), height / 2, config.regions.hand.z)
    tile.userData.baseY = tile.position.y
    tile.userData.index = i
    scene.add(tile)
    tiles.push(tile)
  }

  return tiles
}

// 创建 4 面麻将墙
function createWall(scene, size) {

  const columns = 17
  const gapY = size.depth

  const wall = []

  const directions = [
    { angle: -Math.PI, x: 0, z: config.regions.wall.z, horizontal: 'x', rotateX: -Math.PI / 2, rotateZ: 0 },       // 南
    { angle: -Math.PI, x: config.regions.wall.z, z: 0, horizontal: 'z', rotateX: -Math.PI / 2, rotateZ: Math.PI / 2 }, // 西
    { angle: -Math.PI, x: 0, z: -config.regions.wall.z, horizontal: 'x', rotateX: -Math.PI / 2, rotateZ: 0 },      // 北
    { angle: -Math.PI, x: -config.regions.wall.z, z: 0, horizontal: 'z', rotateX: -Math.PI / 2, rotateZ: Math.PI / 2 }  // 东
  ]

  directions.forEach(dir => {
    const start = -(columns / 2 - 0.5) * (size.width + 0.2)

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < 2; j++) {
        const wallTile = createMahjongTile(size)
        const offset = start + i * (size.width + 0.2)
        const yOffset = size.height / 2 + j * gapY

        let x = dir.x, y = yOffset, z = dir.z
        if (dir.horizontal === 'x') {
          x += offset
        } else {
          z += offset
        }

        wallTile.position.set(x, y, z)
        wallTile.rotation.set(dir.rotateX, dir.angle, dir.rotateZ)
        // wallTile.userData.originalColor = wallTile.material.color.clone()
        wallTile.userData.baseY = wallTile.position.y
        wall.push(wallTile)
        scene.add(wallTile)
      }
    }
  })

  return wall
}

// 获取当前鼠标点击下命中的牌
function getIntersectedTile(event, tiles) {
  const rect = event.target.getBoundingClientRect()
  const mouse = new THREE.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(tiles)
  return intersects.length > 0 ? intersects[0] : null
}
</script>

<style scoped>
.mahjong-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.mahjong-canvas {
  display: block;
  cursor: pointer;
}
</style>
