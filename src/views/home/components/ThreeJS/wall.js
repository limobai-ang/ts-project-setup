/* Wall.js
 * 依赖：createWallFromTiles(scene, config, wallData)   // 你的函数
 *       Tile 对象为 THREE.Mesh，且 userData 内含
 *         { globalIndex, side, columnIndex, rowIndex, state, ... }
 */
import { calculateWallStart } from './utils.js'

import { createWallFromTiles } from './initTileData.js'
export default class Wall {
    /**
     * @param {THREE.Scene} scene        - Three.js 场景
     * @param {Object}      config       - 全局配置（含 tileSize / regions）
     * @param {Object}      wallData     - generateWalls() 生成的东南西北牌数据
     */
    constructor(scene, config, wallData) {
        // 利用你现有的方法创建模型
        const { grouped, flat } = createWallFromTiles(scene, config, wallData)

        // 四面结构化：wall.east[列][行]
        this.tilesBySide = grouped

        // 一维数组：按 globalIndex 排好方便顺序取牌
        this.tilesFlat = flat.sort(
            (a, b) => a.userData.globalIndex - b.userData.globalIndex
        )

        /** @type {number} 当前发牌游标（0~135） */
        this.currentIndex = 0
    }

    /** 重置游标（一般新开局使用） */
    reset() {
        this.currentIndex = 0
    }

    /** 剩余未发出的张数 */
    getRemainingCount() {
        return this.tilesFlat.length - this.currentIndex
    }

    /**
     * 设置当前发牌起点（骰子决定后调用一次）
     * @param {'east'|'south'|'west'|'north'} side
     * @param {number} columnIndex  - 0~16
     * @param {number} rowIndex     - 0 | 1  (0=底层,1=上层)
     */
    setStartPoint(side, columnIndex, rowIndex = 0) {
        const idx = this.tilesFlat.findIndex(
            t =>
                t.userData.side === side &&
                t.userData.columnIndex === columnIndex &&
                t.userData.rowIndex === rowIndex
        )
        if (idx >= 0) this.currentIndex = idx
        else console.warn('Wall.setStartPoint: 起始牌未找到')
    }

    /**
     * 从当前游标开始顺时针取 N 张牌
     * @param {number} count - 要取的张数，默认 1
     * @returns {THREE.Mesh[]} 取出的牌数组
     */
    nextTiles(count = 1) {
        const total = this.tilesFlat.length
        const taken = []

        for (let i = 0; i < count; i++) {
            const tile = this.tilesFlat[this.currentIndex % total]
            taken.push(tile)
            this.currentIndex++
        }
        return taken
    }

    /**
     * 快捷方法：根据骰子结果直接设置起始牌
     * @param {'east'|'south'|'west'|'north'} dealerSide - 庄家方位
     * @param {number} dice1
     * @param {number} dice2
     */
    applyDice(dealerSide, dice1, dice2) {
        const { side, columnIndex, rowIndex } = calculateWallStartEx(
            dealerSide,
            dice1,
            dice2,
            this.tilesBySide
        )
        this.setStartPoint(side, columnIndex, rowIndex)
    }

    /**
     * 顺时针依次给玩家发牌(批量动画版本)
     * @param {string[]} players            方位顺序数组, 如 ['east','south','west','north']
     * @param {number}   rounds             发几轮(每轮给每家 countPerRound 张)
     * @param {number}   countPerRound      每轮每家发牌张数(如 4)
     * @param {Function} moveTilesBatch     外部提供的批量动画函数 (tiles, side, onDone)=>void
     * @returns {Promise<void>}             所有动画完成后 resolve
     */
    async dealToPlayers(players, rounds, countPerRound, moveTilesBatch) {
        for (let r = 0; r < rounds; r++) {
            for (const side of players) {
                const tiles = this.nextTiles(countPerRound)
                await new Promise(resolve => {
                    moveTilesBatch(tiles, side, resolve)
                })
            }
        }
    }
}

/* 辅助：扩展 calculateWallStart，使其返回 rowIndex（0/1） */
function calculateWallStartEx(dealerSide, d1, d2, tilesBySide) {

    const basic = calculateWallStart(dealerSide, d1, d2) // 你已有的方法

    // 默认 rowIndex = 0（底层）
    let { side, columnIndex } = basic
    let rowIndex = 0

    // 如果底层已经被取走，可补到上层
    if (!tilesBySide[side][columnIndex][0]) rowIndex = 1

    return { side, columnIndex, rowIndex }
}
