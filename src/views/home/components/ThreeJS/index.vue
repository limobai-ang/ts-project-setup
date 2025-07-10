<template>
  <div class="mahjong-container">
    <canvas ref="canvasRef" class="mahjong-canvas" />
    <DiceResult v-if="diceShow" :values="diceData" @roll-end="diceEnd"></DiceResult>
  </div>

</template>

<script setup>
import { onMounted, ref } from 'vue'
import DiceResult from './components/DiceResult.vue'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createMahjongTile, setMahjongTileColor } from './createMahjongTile.js'
import { generateWalls, createWallFromTiles } from './initTileData.js'
import { calculateWallStart, takeTilesFromWall, updateTileAnimation } from './utils.js'
const canvasRef = ref()

const wallData = generateWalls()   // 生成最初始的牌墙数据 （后面由后端生成返回到前端）
console.log(wallData, 'wallData');
const diceData = ref([2, 3])
const diceShow = ref(false)

// 定义一个自己的方位(暂时模拟东边)
const curSides = 'east'

const diceStart = () => {
  // 生成两个随机骰子点数
  const values = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]
  diceData.value = values
  diceShow.value = true

}

const diceEnd = (values) => {
  diceShow.value = false
  // 根据筛子点数确定起牌位置
  const wallStartData = calculateWallStart(curSides, diceData.value[0], diceData.value[1])

  const handTiles = takeTilesFromWall(wall, wallStartData, 4)

  // 移动到手牌区域
  handTiles.forEach((tile, i) => {
    setMahjongTileColor(tile, '#ffaa00')

    // 设置状态为手牌
    tile.userData.state = 'hand'

    // 计算每张牌在手牌区域的 x/z/y 目标位置
    const x = (i - 1.5) * (config.tileSize.width + config.tileSize.gap)  // 居中排列
    const z = config.regions.hand.z
    const y = config.tileSize.height / 2

    tile.userData.position = { x, y, z,}
    tile.userData.rotation = { x: 0, y: 0, z: 0}

    setMahjongTileColor(tile)
  })

  // 把这些牌也加入到手牌数组中（便于后续操作）
  tiles.push(...handTiles)

}

// 全局配置对象：包含棋盘尺寸、麻将尺寸、各区域位置
const config = {
  boardSize: { width: 200, height: 200 },
  tileSize: { width: 4, height: 6, depth: 2, gap: 0.5 },
  regions: {
    hand: { z: 90 },     // 手牌区域 z 坐标
    wall: { z: 70 },     // 牌墙区域 z 坐标
    discard: { z: 50 },  // 弃牌区域 z 坐标
  },
  colors: {
    front: 0xffffff, // 正面白色
    back: 0x0066cc,  // 背面蓝色
    gradientStartZ: 150,  // 渐变开始 z
    gradientEndZ: 30      // 渐变结束 z（越靠中间越深）
  }
}

let camera;
let renderer;
let controls;
let board;

// 各区域内的模型集合
let tiles = []  // 手牌区域的模型
let wall = []   // 牌墙区域的模型
let wallTiles = [] // 牌墙区域的模型（扁平化一维数组，供射线检测使用）
let discard = []  // 弃牌区域的模型
onMounted(() => {
  const scene = new THREE.Scene()
  camera = createCamera()
  renderer = createRenderer(canvasRef.value)
  controls = createControls(camera, renderer)

  addLights(scene)
  addHelpers(scene)
  board = createBoard()
  scene.add(board)

  // tiles = createHandTiles(scene) // 创建手牌
  const { grouped, flat } = createWallFromTiles(scene, config, wallData)
  wall = grouped
  wallTiles = flat

  // 摇筛子
  diceStart()

  // 鼠标交互变量
  let selectedTile = null
  let dragging = false

  let insertIndex = -1

  // 绑定鼠标事件
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)

  // 鼠标按下：选中牌并准备拖拽
  function onMouseDown(event) {
    // 使用射线（Raycaster）判断鼠标点击的是否是一个麻将牌（tile）。如果是，就会返回被点击的对象。
    const hit = getIntersectedTile(event, wallTiles)

    if (!hit) return
    // 如果点击到了麻将牌，取消之前选中牌的高亮与浮起状态，还原它的材质颜色、Y 位置（高度）。
    if (selectedTile && selectedTile !== hit.object) {
      setMahjongTileColor(selectedTile)
      selectedTile.position.y = selectedTile.userData.baseY
    }

    // 设置当前选中的牌
    selectedTile = hit.object

    // 'wall' | 'hand' | 'discard' | 'melded' | 'drawn'
    switch (selectedTile.userData.state) {
      case 'wall':
        selectedTile.position.y = config.tileSize.depth * 3
        break
      case 'hand':
        selectedTile.position.y = config.tileSize.height / 2 + 1
        break
    }
    // 高亮颜色
    dragging = true
    controls.enabled = false

    setMahjongTileColor(selectedTile, '#ffaa00')
  }

  // 鼠标移动：实时拖动选中牌
  function onMouseMove(event) {
    if (dragging && selectedTile) {
      const point = getPoint(event)
      if (!point) return

      // 只更新 x/z 坐标（保留拖动状态下的 y）
      selectedTile.position.x = point.x
      selectedTile.position.z = point.z


      switch (selectedTile.userData.state) {
        case 'wall':
          selectedTile.rotation.set(0, 0, 0)
          break
        case 'hand':

          break
      }

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
          tile.userData.position.x = targetX
        }
      })

    }
  }

  // 鼠标松开：插入新位置、归位
  function onMouseUp(event) {

    if (selectedTile) {
      const point = getPoint(event)
      if (!point) return

      // 判定用户操作 根据z轴的位置判断
      if (Math.abs(point.z) <= config.regions.discard.z) {
        selectedTile.rotation.set(-Math.PI / 2, 0, 0)
        selectedTile.position.y = 1

        switch (selectedTile.userData.state) {
          case 'wall':
            // 从牌墙中移除

            break
          case 'hand':
            tiles.splice(tiles.indexOf(selectedTile), 1)
            break
        }
        selectedTile.userData.state = 'discard' // 更新状态为弃牌
        discard.push(selectedTile)
      } else if (Math.abs(point.z) >= config.regions.wall.z) {
        // 取牌放入手牌
        switch (selectedTile.userData.state) {
          case 'wall':
            // 插入数组排序位置
            tiles.splice(insertIndex, 0, selectedTile)
            selectedTile.userData.state = 'hand' // 更新状态为手牌
            break
          case 'hand':
            // 插入数组排序位置
            if (insertIndex && insertIndex >= 0) {
              tiles.splice(tiles.indexOf(selectedTile), 1)
              tiles.splice(insertIndex, 0, selectedTile)
            }
            console.log('移动整理手牌');
            break
        }

        selectedTile.position.y = config.tileSize.height / 2
        selectedTile.position.z = config.regions.hand.z // 归位 z
      }
      // 更新所有牌目标位置（用于动画）
      tiles.forEach((tile, i) => {
        const targetX = (i - Math.floor(tiles.length / 2)) * (config.tileSize.width + config.tileSize.gap)
        tile.userData.index = i
        tile.userData.position.x = targetX
        tile.userData.position.z = config.regions.hand.z
      })
      setMahjongTileColor(selectedTile)
      dragging = false
      controls.enabled = true
      selectedTile = null
      insertIndex = null
    }

  }

  // 动画渲染
  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()

    // 动画更新所有牌
    const allTiles = wallTiles
    allTiles.forEach(tile => {
      if (!dragging || tile !== selectedTile) {
        updateTileAnimation(tile)
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

// 获取鼠标指针在棋盘上的位置
function getPoint(event) {
  const mouse = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()
  let dragOffset = new THREE.Vector3()
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(board)
  if (!intersects.length) return null
  const point = intersects[0].point.clone().sub(dragOffset)

  return point
}



</script>

<style scoped>
.mahjong-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.mahjong-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: pointer;
}
</style>
