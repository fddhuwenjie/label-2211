<template>
  <div class="finder">
    <div class="finder-sidebar">
      <div class="sidebar-section">Favorites</div>
      <div class="sidebar-item" :class="{ active: currentPath === '~' }" @click="navigateTo('~')">🏠 Home</div>
      <div class="sidebar-item" :class="{ active: currentPath === '~/Desktop' }" @click="navigateTo('~/Desktop')">🖥️ Desktop</div>
      <div class="sidebar-item" :class="{ active: currentPath === '~/Documents' }" @click="navigateTo('~/Documents')">📄 Documents</div>
      <div class="sidebar-item" :class="{ active: currentPath === '~/Downloads' }" @click="navigateTo('~/Downloads')">⬇️ Downloads</div>
    </div>
    <div class="finder-main">
      <div class="finder-toolbar">
        <button @click="goBack" :disabled="historyIdx <= 0">◀</button>
        <button @click="goForward" :disabled="historyIdx >= pathHistory.length - 1">▶</button>
        <span class="path-display">{{ currentPath }}</span>
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">⊞</button>
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">☰</button>
        </div>
      </div>
      <div class="finder-content" :class="viewMode">
        <div
          v-for="item in items"
          :key="item.name"
          class="finder-item"
          @dblclick="openItem(item)"
        >
          <span class="item-icon">{{ item.type === 'dir' ? '📁' : getFileIcon(item.name) }}</span>
          <span class="item-name">{{ item.name }}</span>
          <span v-if="viewMode === 'list'" class="item-meta">
            {{ item.type === 'dir' ? '--' : formatSize(item.size) }}
          </span>
        </div>
        <div v-if="items.length === 0" class="empty-folder">This folder is empty</div>
      </div>
      <!-- File preview -->
      <div v-if="previewContent !== null" class="file-preview">
        <div class="preview-header">
          <span>{{ previewName }}</span>
          <button @click="previewContent = null">✕</button>
        </div>
        <pre class="preview-body">{{ previewContent }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import logger from '../../utils/logger.js'

const currentPath = ref('~')
const viewMode = ref('grid')
const pathHistory = ref(['~'])
const historyIdx = ref(0)
const previewContent = ref(null)
const previewName = ref('')

const fileSystem = {
  '~': {
    'Documents': { _type: 'dir', 'readme.txt': 'Welcome to macOS Simulator!\nBuilt with Vue.js', 'notes.md': '# My Notes\n- Learn Vue\n- Build cool stuff' },
    'Desktop': { _type: 'dir' },
    'Downloads': { _type: 'dir', 'example.json': '{\n  "name": "macOS Sim",\n  "version": "1.0"\n}' },
    '.bashrc': 'export PATH=$PATH:/usr/local/bin',
  }
}

function getDir(path) {
  const parts = path.replace(/^~\/?/, '').split('/').filter(Boolean)
  let node = fileSystem['~']
  for (const p of parts) {
    if (node && typeof node === 'object' && node[p] !== undefined) node = node[p]
    else return null
  }
  return node
}

const items = computed(() => {
  const dir = getDir(currentPath.value)
  if (!dir || typeof dir !== 'object') return []
  return Object.entries(dir)
    .filter(([k]) => k !== '_type')
    .map(([name, val]) => ({
      name,
      type: typeof val === 'object' ? 'dir' : 'file',
      size: typeof val === 'string' ? val.length : 0,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
})

function navigateTo(path) {
  logger.debug('Finder', `Navigate to: ${path}`)
  currentPath.value = path
  pathHistory.value = pathHistory.value.slice(0, historyIdx.value + 1)
  pathHistory.value.push(path)
  historyIdx.value = pathHistory.value.length - 1
  previewContent.value = null
}

function openItem(item) {
  logger.debug('Finder', `Open item: ${item.name}`, { type: item.type })
  if (item.type === 'dir') {
    navigateTo(currentPath.value + '/' + item.name)
  } else {
    const dir = getDir(currentPath.value)
    if (dir && dir[item.name] && typeof dir[item.name] === 'string') {
      previewContent.value = dir[item.name]
      previewName.value = item.name
    }
  }
}

function goBack() {
  if (historyIdx.value > 0) {
    historyIdx.value--
    currentPath.value = pathHistory.value[historyIdx.value]
  }
}

function goForward() {
  if (historyIdx.value < pathHistory.value.length - 1) {
    historyIdx.value++
    currentPath.value = pathHistory.value[historyIdx.value]
  }
}

function getFileIcon(name) {
  if (name.endsWith('.txt') || name.endsWith('.md')) return '📄'
  if (name.endsWith('.json')) return '📋'
  if (name.endsWith('.js') || name.endsWith('.ts')) return '📜'
  if (name.startsWith('.')) return '⚙️'
  return '📄'
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  return (bytes / 1024).toFixed(1) + ' KB'
}
</script>

<style scoped>
.finder {
  width: 100%;
  height: 100%;
  display: flex;
  background: #1e1e1e;
  color: #e0e0e0;
}
.finder-sidebar {
  width: 180px;
  background: rgba(30, 30, 30, 0.95);
  border-right: 1px solid #333;
  padding: 8px 0;
  flex-shrink: 0;
}
.sidebar-section {
  font-size: 11px;
  color: #888;
  padding: 8px 16px 4px;
  text-transform: uppercase;
  font-weight: 600;
}
.sidebar-item {
  padding: 4px 16px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  margin: 1px 8px;
}
.sidebar-item:hover { background: rgba(255,255,255,0.05); }
.sidebar-item.active { background: rgba(0,102,255,0.3); }
.finder-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}
.finder-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #333;
}
.finder-toolbar button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}
.finder-toolbar button:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.finder-toolbar button:disabled { opacity: 0.3; }
.path-display {
  flex: 1;
  font-size: 12px;
  color: #888;
}
.view-toggle {
  display: flex;
  gap: 2px;
}
.view-toggle button.active { color: #4facfe; }
.finder-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.finder-content.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}
.grid .finder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
}
.grid .finder-item:hover { background: rgba(255,255,255,0.05); }
.grid .item-icon { font-size: 36px; }
.grid .item-name { font-size: 11px; text-align: center; margin-top: 4px; word-break: break-all; }
.grid .item-meta { display: none; }
.list .finder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.list .finder-item:hover { background: rgba(255,255,255,0.05); }
.list .item-icon { font-size: 18px; }
.list .item-name { flex: 1; font-size: 13px; }
.list .item-meta { font-size: 12px; color: #666; }
.empty-folder {
  text-align: center;
  color: #666;
  padding: 40px;
}
.file-preview {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: #252525;
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  font-size: 13px;
}
.preview-header button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
}
.preview-body {
  flex: 1;
  padding: 12px;
  font-size: 12px;
  font-family: 'Menlo', monospace;
  overflow-y: auto;
  white-space: pre-wrap;
  color: #ccc;
}
</style>
