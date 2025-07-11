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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createMahjongTile, setMahjongTileColor } from './createMahjongTile.js'
import { generateWalls, createWallFromTiles } from './initTileData.js'
import { calculateWallStart, takeTilesFromWall, updateTileAnimation } from './utils.js'
import Wall from './wall.js'

const canvasRef = ref()

const wallData = generateWalls()   // 生成最初始的牌墙数据 （后面由后端生成返回到前端）

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

function startTileMove(tile, position, rotation = {}, onComplete) {
  if (!tile || !tile.userData) return

  // 设置目标位置信息
  tile.userData.position = {
    x: position.x ?? tile.position.x,
    y: position.y ?? tile.position.y,
    z: position.z ?? tile.position.z,
  }

  // 设置目标旋转信息
  tile.userData.rotation = {
    x: rotation.x ?? tile.rotation.x,
    y: rotation.y ?? tile.rotation.y,
    z: rotation.z ?? tile.rotation.z,
  }

  // 清除完成标志和设置完成回调
  tile.userData.animationDone = false
  tile.userData.onAnimationComplete = onComplete
}

/**
 * 把一批牌动画移动到指定玩家手牌区
 * @param {THREE.Mesh[]} tiles      要移动的牌
 * @param {'east'|'south'|'west'|'north'} side 发给哪家
 * @param {Function} onDone         所有牌完成动画后的回调
 */
function moveTilesBatch(tiles, side, onDone) {
  if (!tiles.length) {
    onDone?.()
    return
  }

  // 计算该玩家手牌基准位置
  const baseZ = getHandZ(side)
  const gap = config.tileSize.width + config.tileSize.gap
  const baseY = config.tileSize.height / 2

  let remaining = tiles.length

  tiles.forEach((tile, idx) => {
    // 让一批牌在目的手牌区从左到右（或对应方位）排好
    const targetX = (idx - (tiles.length - 1) / 2) * gap
    const targetPos = { x: targetX, y: baseY, z: baseZ }

    // 所有牌正面朝向自己 -> rotation 归零
    startTileMove(tile, targetPos, { x: 0, y: 0, z: 0 }, () => {
      // 单张动画完成
      if (--remaining === 0) {
        onDone?.()
      }
    })
  })
}

/* === 辅助: 根据方位给出手牌区 z 或 x === */
function getHandZ(side) {
  switch (side) {
    case 'east': return config.regions.hand.z          // 你坐南北向桌
    case 'west': return -config.regions.hand.z
    case 'south': return 0                               // 如果想把南北放左右可调整
    case 'north': return 0
    default: return config.regions.hand.z
  }
}
const diceEnd = async (values) => {
  diceShow.value = false

  // 根据骰子结果定位起始牌
  wallInstance.applyDice(curSides, values[0], values[1])
  // 发牌，全部动画结束后 resolve
  await wallInstance.dealToPlayers(
    ['east', 'south', 'west', 'north'], // 顺序
    3,                                  // 3 轮
    4,                                  // 每轮 4 张
    moveTilesBatch                      // 你的批量动画实现
  )

  console.log('四家发牌完成，游戏开始!')
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
const playerTiles = { east: [], south: [], west: [], north: [] }
let wallInstance = null
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
  wallInstance = new Wall(scene, config, wallData)
  console.log(wallInstance, 'wallInstance');

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
    const hit = getIntersectedTile(event, wallInstance.tilesFlat)

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
        Math.min(tiles.length, Math.round(point.x / (config.tileSize.width + config.tileSize.gap)) + Math.ceil(tiles.length / 2))
      )

      // 给其他牌设置目标位置，让出空间
      tiles.forEach((tile, i) => {
        if (tile !== selectedTile) {
          let offset = 0
          if (i >= insertIndex) offset = config.tileSize.width + config.tileSize.gap
          const targetX = (i - Math.ceil(tiles.length / 2)) * (config.tileSize.width + config.tileSize.gap) + offset
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
        selectedTile.userData.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
        selectedTile.userData.position = { x: selectedTile.position.x, y: 1, z: selectedTile.position.z }


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
            selectedTile.userData.position = { x: 0, y: config.tileSize.height / 2, z: config.regions.hand.z }
            selectedTile.userData.rotation = { x: 0, y: 0, z: 0 }
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
    const allTiles = wallInstance.tilesFlat
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
