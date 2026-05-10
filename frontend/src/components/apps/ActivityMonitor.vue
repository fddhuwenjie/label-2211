<template>
  <div class="activity-monitor">
    <div class="overview">
      <div class="overview-item">
        <div class="overview-label">CPU</div>
        <div class="overview-value">{{ totalCpu.toFixed(1) }}%</div>
      </div>
      <div class="overview-item">
        <div class="overview-label">Memory</div>
        <div class="overview-value">{{ totalMemory }} MB</div>
      </div>
      <div class="overview-item">
        <div class="overview-label">Processes</div>
        <div class="overview-value">{{ processes.length }}</div>
      </div>
    </div>

    <div class="table-container">
      <table class="process-table">
        <thead>
          <tr>
            <th @click="sortBy('name')">
              Process Name
              <span v-if="sortColumn === 'name'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('pid')">
              PID
              <span v-if="sortColumn === 'pid'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('cpu')">
              CPU %
              <span v-if="sortColumn === 'cpu'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('memory')">
              Memory (MB)
              <span v-if="sortColumn === 'memory'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="proc in sortedProcesses"
            :key="proc.pid"
            :class="{ selected: selectedPid === proc.pid }"
            @click="selectedPid = proc.pid"
          >
            <td>{{ proc.name }}</td>
            <td>{{ proc.pid }}</td>
            <td :class="{ high: proc.cpu > 10 }">{{ proc.cpu.toFixed(1) }}</td>
            <td :class="{ high: proc.memory > 150 }">{{ proc.memory.toFixed(0) }}</td>
            <td :class="proc.status === 'Running' ? 'running' : 'unresponsive'">{{ proc.status }}</td>
          </tr>
        </tbody>
      </table>
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
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['force-quit'])

const windows = inject('windows')

const processData = ref({})
const selectedPid = ref(null)
const sortColumn = ref('name')
const sortAsc = ref(true)

let refreshInterval = null

function generateProcessData() {
  if (!windows.value) return
  windows.value.forEach(win => {
    if (!processData.value[win.id]) {
      processData.value[win.id] = {
        cpu: Math.random() * 15,
        memory: 20 + Math.random() * 180,
        status: Math.random() > 0.9 ? 'Not Responding' : 'Running'
      }
    } else {
      const data = processData.value[win.id]
      data.cpu = Math.max(0, Math.min(15, data.cpu + (Math.random() - 0.5) * 3))
      data.memory = Math.max(20, Math.min(200, data.memory + (Math.random() - 0.5) * 20))
      if (Math.random() > 0.98) {
        data.status = data.status === 'Running' ? 'Not Responding' : 'Running'
      }
    }
  })
}

const processes = computed(() => {
  if (!windows.value) return []
  return windows.value.map(win => ({
    pid: win.id,
    name: win.title,
    cpu: processData.value[win.id]?.cpu || 0,
    memory: processData.value[win.id]?.memory || 0,
    status: processData.value[win.id]?.status || 'Running'
  }))
})

const totalCpu = computed(() =>
  processes.value.reduce((sum, p) => sum + p.cpu, 0)
)

const totalMemory = computed(() =>
  Math.round(processes.value.reduce((sum, p) => sum + p.memory, 0))
)

const sortedProcesses = computed(() => {
  const sorted = [...processes.value].sort((a, b) => {
    const aVal = a[sortColumn.value]
    const bVal = b[sortColumn.value]
    if (typeof aVal === 'string') {
      return sortAsc.value ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortAsc.value ? aVal - bVal : bVal - aVal
  })
  return sorted
})

function sortBy(col) {
  if (sortColumn.value === col) {
    sortAsc.value = !sortAsc.value
  } else {
    sortColumn.value = col
    sortAsc.value = true
  }
}

function forceQuit() {
  if (selectedPid.value !== null) {
    emit('force-quit', selectedPid.value)
    delete processData.value[selectedPid.value]
    selectedPid.value = null
  }
}

onMounted(() => {
  generateProcessData()
  refreshInterval = setInterval(generateProcessData, 2000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.activity-monitor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #2a2a2a;
  color: #e0e0e0;
  font-size: 13px;
}

.overview {
  display: flex;
  padding: 16px 20px;
  gap: 40px;
  border-bottom: 1px solid #444;
  background: #333;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}

.overview-value {
  font-size: 20px;
  font-weight: 600;
  color: #4facfe;
}

.table-container {
  flex: 1;
  overflow-y: auto;
}

.process-table {
  width: 100%;
  border-collapse: collapse;
}

.process-table th,
.process-table td {
  padding: 8px 16px;
  text-align: left;
  border-bottom: 1px solid #3a3a3a;
}

.process-table th {
  background: #333;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  position: sticky;
  top: 0;
  font-size: 12px;
  color: #ccc;
}

.process-table th:hover {
  background: #3a3a3a;
}

.process-table tbody tr:hover {
  background: #353535;
}

.process-table tbody tr.selected {
  background: #4facfe;
  color: #fff;
}

.process-table tbody tr.selected .high,
.process-table tbody tr.selected .running,
.process-table tbody tr.selected .unresponsive {
  color: #fff;
}

.high {
  color: #ff5f57;
}

.running {
  color: #28c840;
}

.unresponsive {
  color: #febc2e;
}

.toolbar {
  padding: 12px 20px;
  border-top: 1px solid #444;
  background: #333;
  display: flex;
  justify-content: flex-end;
}

.force-quit-btn {
  padding: 8px 20px;
  background: #ff5f57;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.force-quit-btn:hover:not(:disabled) {
  background: #ff7870;
}

.force-quit-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
