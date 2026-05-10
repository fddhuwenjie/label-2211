<template>
  <div class="activity-monitor">
    <div class="system-overview">
      <div class="overview-item">
        <span class="overview-label">CPU</span>
        <div class="overview-bar">
          <div class="overview-bar-fill cpu" :style="{ width: totalCpu + '%' }"></div>
        </div>
        <span class="overview-value">{{ totalCpu.toFixed(1) }}%</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">Memory</span>
        <div class="overview-bar">
          <div class="overview-bar-fill mem" :style="{ width: memPercent + '%' }"></div>
        </div>
        <span class="overview-value">{{ totalMem.toFixed(0) }} MB / 8192 MB</span>
      </div>
      <div class="overview-item">
        <span class="overview-label">Processes</span>
        <span class="overview-value processes-count">{{ processes.length }}</span>
      </div>
    </div>

    <div class="toolbar">
      <button
        class="force-quit-btn"
        :disabled="selectedPid === null"
        @click="forceQuit"
      >
        Force Quit
      </button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              @click="sortBy(col.key)"
              :class="{ sorted: sortKey === col.key }"
            >
              {{ col.label }}
              <span v-if="sortKey === col.key" class="sort-arrow">
                {{ sortOrder === 1 ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="proc in sortedProcesses"
            :key="proc.pid"
            :class="{ selected: proc.pid === selectedPid }"
            @click="selectedPid = proc.pid"
          >
            <td>{{ proc.name }}</td>
            <td>{{ proc.pid }}</td>
            <td>{{ proc.cpu.toFixed(1) }}%</td>
            <td>{{ proc.mem.toFixed(0) }} MB</td>
            <td :class="proc.status === '运行中' ? 'status-running' : 'status-not-responding'">
              {{ proc.status }}
            </td>
          </tr>
          <tr v-if="sortedProcesses.length === 0">
            <td colspan="5" class="empty-msg">No processes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['force-quit'])

const windows = inject('windows')
const appNames = inject('appNames')

const selectedPid = ref(null)
const sortKey = ref('pid')
const sortOrder = ref(1)

const processes = ref([])

const columns = [
  { key: 'name', label: 'Process Name' },
  { key: 'pid', label: 'PID' },
  { key: 'cpu', label: 'CPU %' },
  { key: 'mem', label: 'Memory' },
  { key: 'status', label: 'Status' },
]

const totalCpu = computed(() => {
  return processes.value.reduce((sum, p) => sum + p.cpu, 0)
})

const totalMem = computed(() => {
  return processes.value.reduce((sum, p) => sum + p.mem, 0)
})

const memPercent = computed(() => {
  return (totalMem.value / 8192) * 100
})

const sortedProcesses = computed(() => {
  const list = [...processes.value]
  const key = sortKey.value
  const order = sortOrder.value
  return list.sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * order
    }
    return String(va).localeCompare(String(vb)) * order
  })
})

function sortBy(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

const processDataMap = new Map()

function refreshProcesses() {
  const wins = windows?.value || []
  processes.value = wins.map(win => {
    const existing = processDataMap.get(win.id)
    const baseCpu = existing ? existing.cpu : Math.random() * 15
    const baseMem = existing ? existing.mem : 20 + Math.random() * 180
    const cpu = Math.max(0, Math.min(15, baseCpu + (Math.random() - 0.5) * 3))
    const mem = Math.max(20, Math.min(200, baseMem + (Math.random() - 0.5) * 10))
    const status = Math.random() > 0.9 ? '未响应' : '运行中'
    const name = (appNames && appNames[win.app]) || win.app
    const proc = { name, pid: win.id, cpu, mem, status }
    processDataMap.set(win.id, { cpu, mem })
    return proc
  })
  if (selectedPid.value !== null && !wins.find(w => w.id === selectedPid.value)) {
    selectedPid.value = null
  }
}

let refreshTimer = null

onMounted(() => {
  refreshProcesses()
  refreshTimer = setInterval(refreshProcesses, 2000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

function forceQuit() {
  if (selectedPid.value !== null) {
    emit('force-quit', selectedPid.value)
    selectedPid.value = null
  }
}
</script>

<style scoped>
.activity-monitor {
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  font-size: 12px;
  display: flex;
  flex-direction: column;
}

.system-overview {
  display: flex;
  gap: 16px;
  padding: 10px 14px;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  flex-shrink: 0;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.overview-label {
  color: #aaa;
  font-size: 11px;
  min-width: 60px;
}

.overview-bar {
  flex: 1;
  height: 8px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
}

.overview-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.overview-bar-fill.cpu {
  background: linear-gradient(90deg, #28c840, #febc2e);
}

.overview-bar-fill.mem {
  background: linear-gradient(90deg, #4facfe, #667eea);
}

.overview-value {
  font-size: 11px;
  color: #ccc;
  min-width: 80px;
  text-align: right;
}

.processes-count {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  min-width: 30px;
}

.toolbar {
  padding: 6px 14px;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  flex-shrink: 0;
}

.force-quit-btn {
  background: #ff5f57;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.force-quit-btn:hover:not(:disabled) {
  background: #e04e42;
}

.force-quit-btn:disabled {
  background: #555;
  cursor: default;
}

.table-container {
  flex: 1;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  background: #333;
  color: #bbb;
  font-weight: 500;
  text-align: left;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #444;
  white-space: nowrap;
}

th:hover {
  background: #3a3a3a;
}

th.sorted {
  color: #4facfe;
}

.sort-arrow {
  font-size: 10px;
  margin-left: 2px;
}

td {
  padding: 5px 10px;
  border-bottom: 1px solid #2a2a2a;
}

tr.selected {
  background: #0066ff33;
}

tr:hover:not(.selected) {
  background: #ffffff0a;
}

.status-running {
  color: #28c840;
}

.status-not-responding {
  color: #ff5f57;
}

.empty-msg {
  text-align: center;
  color: #666;
  padding: 20px;
}
</style>
