<template>
  <div class="calculator">
    <div class="calc-display">
      <div class="calc-expression">{{ expression || '&nbsp;' }}</div>
      <div class="calc-result">{{ display }}</div>
    </div>
    <div class="calc-buttons">
      <button class="fn" @click="clear">AC</button>
      <button class="fn" @click="toggleSign">±</button>
      <button class="fn" @click="percent">%</button>
      <button class="op" @click="setOp('/')">÷</button>
      <button @click="appendDigit('7')">7</button>
      <button @click="appendDigit('8')">8</button>
      <button @click="appendDigit('9')">9</button>
      <button class="op" @click="setOp('*')">×</button>
      <button @click="appendDigit('4')">4</button>
      <button @click="appendDigit('5')">5</button>
      <button @click="appendDigit('6')">6</button>
      <button class="op" @click="setOp('-')">−</button>
      <button @click="appendDigit('1')">1</button>
      <button @click="appendDigit('2')">2</button>
      <button @click="appendDigit('3')">3</button>
      <button class="op" @click="setOp('+')">+</button>
      <button class="zero" @click="appendDigit('0')">0</button>
      <button @click="appendDot">.</button>
      <button class="op" @click="calculate">=</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const display = ref('0')
const expression = ref('')
const firstOperand = ref(null)
const operator = ref(null)
const waitingForSecond = ref(false)

function appendDigit(d) {
  if (waitingForSecond.value) {
    display.value = d
    waitingForSecond.value = false
  } else {
    display.value = display.value === '0' ? d : display.value + d
  }
}

function appendDot() {
  if (!display.value.includes('.')) display.value += '.'
}

function clear() {
  display.value = '0'
  expression.value = ''
  firstOperand.value = null
  operator.value = null
  waitingForSecond.value = false
}

function toggleSign() {
  display.value = String(-parseFloat(display.value))
}

function percent() {
  display.value = String(parseFloat(display.value) / 100)
}

function setOp(op) {
  const val = parseFloat(display.value)
  if (firstOperand.value !== null && !waitingForSecond.value) {
    calculate()
  }
  firstOperand.value = parseFloat(display.value)
  operator.value = op
  waitingForSecond.value = true
  const opSymbol = { '/': '÷', '*': '×', '-': '−', '+': '+' }[op]
  expression.value = `${val} ${opSymbol}`
}

function calculate() {
  if (operator.value === null || firstOperand.value === null) return
  const second = parseFloat(display.value)
  let result
  switch (operator.value) {
    case '+': result = firstOperand.value + second; break
    case '-': result = firstOperand.value - second; break
    case '*': result = firstOperand.value * second; break
    case '/': result = second !== 0 ? firstOperand.value / second : 'Error'; break
  }
  display.value = String(result)
  expression.value = ''
  firstOperand.value = null
  operator.value = null
  waitingForSecond.value = false
}
</script>

<style scoped>
.calculator {
  width: 100%;
  height: 100%;
  background: #1c1c1c;
  display: flex;
  flex-direction: column;
}
.calc-display {
  padding: 16px 20px 8px;
  text-align: right;
}
.calc-expression {
  font-size: 14px;
  color: #888;
  min-height: 20px;
}
.calc-result {
  font-size: 40px;
  color: #fff;
  font-weight: 300;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calc-buttons {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  padding: 1px;
}
.calc-buttons button {
  background: #333;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}
.calc-buttons button:hover { background: #444; }
.calc-buttons button:active { background: #555; }
.calc-buttons button.fn { background: #a5a5a5; color: #000; }
.calc-buttons button.fn:hover { background: #b5b5b5; }
.calc-buttons button.op { background: #ff9f0a; }
.calc-buttons button.op:hover { background: #ffb340; }
.calc-buttons button.zero { grid-column: span 2; }
</style>
