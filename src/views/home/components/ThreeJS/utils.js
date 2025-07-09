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
  const startIndex = (dealerIndex + steps) % 4
  const startSide = sides[startIndex]

  
  const columnFromRight = Math.max(dice1, dice2) // 从右往左第几列

  return {
    startSide,
    columnFromRight,
  }
}