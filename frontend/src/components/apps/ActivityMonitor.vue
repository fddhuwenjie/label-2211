<template>
  <div class="activity-monitor">
    <div class="overview">
      <div class="stat-card">
        <div class="stat-label">CPU</div>
        <div class="stat-value">{{ totalCpu.toFixed(1) }}%</div>
        <div class="stat-bar">
          <div class="stat-bar-fill cpu-fill" :style="{ width: Math.min(totalCpu, 100) + '%' }"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Memory</div>
        <div class="stat-value">{{ totalMemory.toFixed(0) }} MB</div>
        <div class="stat-bar">
          <div class="stat-bar-fill memory-fill" :style="{ width: Math.min(totalMemory / 20, 100) + '%' }"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Processes</div>
        <div class="stat-value">{{ processCount }}</div>
        <div class="stat-bar">
          <div class="stat-bar-fill process-fill" :style="{ width: Math.min(processCount * 5, 100) + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <button class="force-quit-btn" :disabled="!selectedPid" @click="forceQuit">
        ⛔ Force Quit
      </button>
    </div>

    <div class="table-container">
      <table class="process-table">
        <thead>
          <tr>
            <th @click="sortBy('name')" class="sortable">
              Process Name {{ sortIndicator('name') }}
            </th>
            <th @click="sortBy('pid')" class="sortable">
              PID {{ sortIndicator('pid') }}
            </th>
            <th @click="sortBy('cpu')" class="sortable">
              CPU % {{ sortIndicator('cpu') }}
            </th>
            <th @click="sortBy('memory')" class="sortable">
              Memory {{ sortIndicator('memory') }}
            </th>
            <th @click="sortBy('status')" class="sortable">
              Status {{ sortIndicator('status') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="proc in sortedProcesses"
            :key="proc.pid"
            :class="{ selected: selectedPid === proc.pid }"
            @click="selectedPid = proc.pid"
          >
            <td class="proc-name">
              <span class="app-icon">{{ getAppIcon(proc.app) }}</span>
              {{ proc.name }}
            </td>
            <td class="proc-pid">{{ proc.pid }}</td>
            <td class="proc-cpu" :class="getCpuClass(proc.cpu)">
              {{ proc.cpu.toFixed(1) }}%
            </td>
            <td class="proc-memory">{{ proc.memory.toFixed(0) }} MB</td>
            <td class="proc-status" :class="proc.status === 'Running' ? 'running' : 'not-responding'">
              {{ proc.status }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'

const windows = inject('windowsList')
const appNames = inject('appNames')
const emit = defineEmits(['force-quit'])

const selectedPid = ref(null)
const sortField = ref('cpu')
const sortDesc = ref(true)
const processStats = ref({})

let refreshInterval = null

const processes = computed(() => {
  return windows.value.map(win => {
    const stats = processStats.value[win.id] || generateStats()
    processStats.value[win.id] = stats
    return {
      pid: win.id,
      app: win.app,
      name: appNames[win.app] || win.app,
      cpu: stats.cpu,
      memory: stats.memory,
      status: stats.status
    }
  })
})

const sortedProcesses = computed(() => {
  const sorted = [...processes.value].sort((a, b) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDesc.value ? 1 : -1
    if (aVal > bVal) return sortDesc.value ? -1 : 1
    return 0
  })
  return sorted
})

const totalCpu = computed(() => {
  return processes.value.reduce((sum, p) => sum + p.cpu, 0)
})

const totalMemory = computed(() => {
  return processes.value.reduce((sum, p) => sum + p.memory, 0)
})

const processCount = computed(() => processes.value.length)

function generateStats() {
  return {
    cpu: Math.random() * 15,
    memory: 20 + Math.random() * 180,
    status: Math.random() > 0.05 ? 'Running' : 'Not Responding'
  }
}

function refreshStats() {
  Object.keys(processStats.value).forEach(pid => {
    const stats = processStats.value[pid]
    stats.cpu = Math.max(0, Math.min(15, stats.cpu + (Math.random() - 0.5) * 5))
    stats.memory = Math.max(20, Math.min(200, stats.memory + (Math.random() - 0.5) * 20))
    if (Math.random() > 0.95) {
      stats.status = stats.status === 'Running' ? 'Not Responding' : 'Running'
    }
  })
}

function sortBy(field) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value
  } else {
    sortField.value = field
    sortDesc.value = true
  }
}

function sortIndicator(field) {
  if (sortField.value !== field) return ''
  return sortDesc.value ? '↓' : '↑'
}

function getCpuClass(cpu) {
  if (cpu > 10) return 'high'
  if (cpu > 5) return 'medium'
  return 'low'
}

function getAppIcon(app) {
  const icons = {
    terminal: '⬛',
    browser: '🌐',
    finder: '📁',
    notes: '📝',
    calculator: '🧮',
    settings: '⚙️',
    music: '🎵',
    activity: '📊'
  }
  return icons[app] || '📦'
}

function forceQuit() {
  if (selectedPid.value) {
    emit('force-quit', selectedPid.value)
    delete processStats.value[selectedPid.value]
    selectedPid.value = null
  }
}

onMounted(() => {
  refreshInterval = setInterval(refreshStats, 2000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.activity-monitor {
  width: 100%;
  height: 100%;
  background: #f5f5f7;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
}

.overview {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(180deg, #e8e8ed 0%, #f5f5f7 100%);
  border-bottom: 1px solid #d2d2d7;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.stat-label {
  font-size: 11px;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 6px;
}

.stat-bar {
  height: 4px;
  background: #e5e5ea;
  border-radius: 2px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.cpu-fill { background: linear-gradient(90deg, #34c759, #30b350); }
.memory-fill { background: linear-gradient(90deg, #5ac8fa, #007aff); }
.process-fill { background: linear-gradient(90deg, #ff9500, #ff6b00); }

.toolbar {
  padding: 8px 12px;
  background: #f5f5f7;
  border-bottom: 1px solid #d2d2d7;
  display: flex;
  align-items: center;
}

.force-quit-btn {
  background: linear-gradient(180deg, #ff3b30 0%, #d70015 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.force-quit-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #ff453a 0%, #e00016 100%);
}

.force-quit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-container {
  flex: 1;
  overflow: auto;
  background: #fff;
}

.process-table {
  width: 100%;
  border-collapse: collapse;
}

.process-table thead {
  position: sticky;
  top: 0;
  background: #f5f5f7;
  z-index: 10;
}

.process-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  color: #86868b;
  border-bottom: 1px solid #d2d2d7;
  cursor: pointer;
  user-select: none;
}

.process-table th:hover {
  background: #e8e8ed;
}

.process-table th.sortable::after {
  content: '↕';
  margin-left: 4px;
  opacity: 0.4;
}

.process-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.process-table tbody tr:hover {
  background: #f0f0f5;
}

.process-table tbody tr.selected {
  background: #007aff;
  color: #fff;
}

.process-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f5;
}

.proc-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.app-icon {
  font-size: 16px;
}

.proc-pid {
  color: #86868b;
  font-family: 'Menlo', monospace;
}

.proc-cpu.low { color: #34c759; }
.proc-cpu.medium { color: #ff9500; }
.proc-cpu.high { color: #ff3b30; }

.selected .proc-cpu.low,
.selected .proc-cpu.medium,
.selected .proc-cpu.high {
  color: #fff;
}

.proc-memory {
  font-family: 'Menlo', monospace;
}

.proc-status.running {
  color: #34c759;
}

.proc-status.not-responding {
  color: #ff9500;
}

.selected .proc-status.running,
.selected .proc-status.not-responding {
  color: #fff;
}
</style>
