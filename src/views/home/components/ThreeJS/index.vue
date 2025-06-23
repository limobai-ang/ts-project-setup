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

const canvasRef = ref()

onMounted(() => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(-100, 200, 400)
  camera.lookAt(0, 0, 30)

  const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x35654d)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 100
  controls.maxDistance = 800
  controls.maxPolarAngle = Math.PI / 2.2
  controls.target.set(0, 0, 30)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(0, 100, 100)
  scene.add(directionalLight)

  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)

  const boardGeometry = new THREE.PlaneGeometry(200, 200)
  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 })
  const board = new THREE.Mesh(boardGeometry, boardMaterial)
  board.rotation.x = -Math.PI / 2
  scene.add(board)

  const tileWidth = 4
  const tileHeight = 6
  const tileDepth = 2
  const tileGap = 0.5
  const tileGeometry = new RoundedBoxGeometry(tileWidth, tileHeight, tileDepth, 5, 0.3)
  const tileMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.2 })
  const tiles = []

  for (let i = 0; i < 13; i++) {
    const tile = new THREE.Mesh(tileGeometry, tileMaterial.clone())
    tile.position.set((i - 6) * (tileWidth + tileGap), tileHeight / 2, 0)
    tile.userData.originalColor = tile.material.color.clone()
    tile.userData.baseY = tile.position.y
    tile.userData.index = i
    scene.add(tile)
    tiles.push(tile)
  }

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let selectedTile = null
  let dragging = false
  let dragOffset = new THREE.Vector3()
  let insertIndex = -1

  function getIntersectedTile(event) {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(tiles)
    return intersects.length > 0 ? intersects[0] : null
  }

  function onMouseDown(event) {
    const hit = getIntersectedTile(event)
    if (hit) {
      if (selectedTile && selectedTile !== hit.object) {
        selectedTile.material.color.copy(selectedTile.userData.originalColor)
        selectedTile.position.y = selectedTile.userData.baseY
      }
      selectedTile = hit.object
      selectedTile.material.color.set(0xffaa00)
      selectedTile.position.y = tileHeight / 2 + 1
      dragging = true
      controls.enabled = false

      dragOffset.copy(hit.point).sub(selectedTile.position)
    }
  }

  function onMouseMove(event) {
    if (dragging && selectedTile) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObject(board)
      if (intersects.length > 0) {
        const point = intersects[0].point.clone().sub(dragOffset)
        selectedTile.position.set(point.x, tileHeight / 2 + 1, point.z)

        insertIndex = Math.max(0, Math.min(tiles.length, Math.round(point.x / (tileWidth + tileGap)) + 6))

        tiles.forEach((tile, i) => {
          if (tile !== selectedTile) {
            let offset = 0
            if (i >= insertIndex) offset = tileWidth + tileGap
            const targetX = (i - 6) * (tileWidth + tileGap) + offset
            tile.userData.targetX = targetX
          }
        })
      }
    }
  }

  function onMouseUp() {
    if (selectedTile) {
      selectedTile.position.y = tileHeight / 2
      selectedTile.material.color.copy(selectedTile.userData.originalColor)
      dragging = false
      controls.enabled = true

      tiles.splice(tiles.indexOf(selectedTile), 1)
      tiles.splice(insertIndex, 0, selectedTile)

      tiles.forEach((tile, i) => {
        const targetX = (i - 6) * (tileWidth + tileGap)
        tile.userData.index = i
        tile.userData.targetX = targetX
      })
    }
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)

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

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
})
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
