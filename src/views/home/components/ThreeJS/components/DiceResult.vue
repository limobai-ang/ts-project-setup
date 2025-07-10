<template>
  <div class="dice-wrapper">
    <div
      v-for="(value, index) in finalValues"
      :key="index"
      class="dice"
    >
      <span v-if="!isRolling[index]">{{ value }}</span>
      <span v-else>{{ rollingValues[index] }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  values: {
    type: Array,
    required: true,
    validator: (arr) => arr.length === 2 && arr.every(v => v >= 1 && v <= 6),
  },
  duration: {
    type: Number,
    default: 1000, // 动画持续时间（ms）
  },
})

const emit = defineEmits(['roll-end'])

const isRolling = ref([true, true])
const rollingValues = ref([1, 1])
const finalValues = ref([1, 1])

function rollDice(index, target) {
  const interval = setInterval(() => {
    rollingValues.value[index] = Math.ceil(Math.random() * 6)
  }, 50)

  setTimeout(() => {
    clearInterval(interval)
    isRolling.value[index] = false
    finalValues.value[index] = target
    checkEnd()
  }, props.duration + index * 200) // 第二个骰子稍晚一点结束
}

function checkEnd() {
  if (!isRolling.value[0] && !isRolling.value[1]) {
    // 滚动结束后 过两秒在触发事件
    setTimeout(() => {
      emit('roll-end', finalValues.value)
    }, 1000)
  }
}

onMounted(() => {
  finalValues.value = props.values
  isRolling.value = [true, true]
  rollDice(0, props.values[0])
  rollDice(1, props.values[1])
})
</script>

<style scoped>
.dice-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin: 20px;
}

.dice {
  width: 60px;
  height: 60px;
  background: #fff;
  border: 2px solid #ccc;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  font-size: 32px;
  font-weight: bold;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
}
</style>
