<template>
  <div class="menu-bar" @mouseleave="closeAll">
    <div class="menu-left">
      <!-- Apple Menu -->
      <div class="menu-trigger" ref="trigger_apple" @click="toggle('apple')" @mouseenter="hoverOpen('apple')">
        <span class="apple-logo">&#63743;</span>
      </div>
      <div v-if="openMenu === 'apple'" class="dropdown" style="left:4px">
        <div class="menu-item" @click="act('open-app', 'settings')">System Preferences...</div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="act('open-app', 'finder')">Finder</div>
        <div class="menu-item" @click="act('open-app', 'terminal')">Terminal</div>
        <div class="menu-item" @click="act('open-app', 'browser')">Safari</div>
        <div class="menu-item" @click="act('open-app', 'music')">Music</div>
        <div class="menu-item" @click="act('open-app', 'activity')">Activity Monitor</div>
        <div class="menu-divider"></div>
        <div class="menu-item disabled">Sleep</div>
        <div class="menu-item disabled">Restart...</div>
        <div class="menu-item disabled">Shut Down...</div>
      </div>

      <!-- App Name (no dropdown) -->
      <div class="menu-trigger app-name">
        <span>{{ activeApp }}</span>
      </div>

      <!-- File Menu -->
      <div class="menu-trigger" ref="trigger_file" @click="toggle('file')" @mouseenter="hoverOpen('file')">
        <span>File</span>
      </div>
      <div v-if="openMenu === 'file'" class="dropdown" :style="dropdownPos('file')">
        <div class="menu-item" @click="act('open-app', 'finder')">
          New Finder Window <span class="shortcut">⌘N</span>
        </div>
        <div class="menu-item" @click="act('open-app', 'terminal')">
          New Terminal <span class="shortcut">⌘T</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="act('close-active-window')">
          Close Window <span class="shortcut">⌘W</span>
        </div>
        <div class="menu-item" @click="act('close-all-windows')">
          Close All <span class="shortcut">⌥⌘W</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item disabled">
          Save <span class="shortcut">⌘S</span>
        </div>
        <div class="menu-item disabled">
          Print... <span class="shortcut">⌘P</span>
        </div>
      </div>

      <!-- Edit Menu -->
      <div class="menu-trigger" ref="trigger_edit" @click="toggle('edit')" @mouseenter="hoverOpen('edit')">
        <span>Edit</span>
      </div>
      <div v-if="openMenu === 'edit'" class="dropdown" :style="dropdownPos('edit')">
        <div class="menu-item" @click="execCommand('undo')">
          Undo <span class="shortcut">⌘Z</span>
        </div>
        <div class="menu-item" @click="execCommand('redo')">
          Redo <span class="shortcut">⇧⌘Z</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="execCommand('cut')">
          Cut <span class="shortcut">⌘X</span>
        </div>
        <div class="menu-item" @click="execCommand('copy')">
          Copy <span class="shortcut">⌘C</span>
        </div>
        <div class="menu-item" @click="execCommand('paste')">
          Paste <span class="shortcut">⌘V</span>
        </div>
        <div class="menu-item" @click="execCommand('selectAll')">
          Select All <span class="shortcut">⌘A</span>
        </div>
      </div>

      <!-- View Menu -->
      <div class="menu-trigger" ref="trigger_view" @click="toggle('view')" @mouseenter="hoverOpen('view')">
        <span>View</span>
      </div>
      <div v-if="openMenu === 'view'" class="dropdown" :style="dropdownPos('view')">
        <div class="menu-item" @click="act('maximize-active-window')">
          Enter Full Screen <span class="shortcut">⌃⌘F</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="act('minimize-active-window')">
          Minimize <span class="shortcut">⌘M</span>
        </div>
        <div class="menu-item" @click="act('zoom-in')">
          Zoom In <span class="shortcut">⌘+</span>
        </div>
        <div class="menu-item" @click="act('zoom-out')">
          Zoom Out <span class="shortcut">⌘−</span>
        </div>
        <div class="menu-item" @click="act('zoom-reset')">
          Actual Size <span class="shortcut">⌘0</span>
        </div>
      </div>

      <!-- Window Menu -->
      <div class="menu-trigger" ref="trigger_window" @click="toggle('window')" @mouseenter="hoverOpen('window')">
        <span>Window</span>
      </div>
      <div v-if="openMenu === 'window'" class="dropdown" :style="dropdownPos('window')">
        <div class="menu-item" @click="act('minimize-active-window')">
          Minimize <span class="shortcut">⌘M</span>
        </div>
        <div class="menu-item" @click="act('maximize-active-window')">
          Zoom
        </div>
        <div class="menu-item" @click="act('tile-left')">
          Tile Window to Left
        </div>
        <div class="menu-item" @click="act('tile-right')">
          Tile Window to Right
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="act('close-all-windows')">
          Close All Windows
        </div>
        <div class="menu-divider"></div>
        <template v-if="openWindows.length">
          <div
            v-for="w in openWindows"
            :key="w.id"
            class="menu-item"
            @click="act('activate-window', w.id)"
          >
            {{ w.title }} <span v-if="w.active" class="check">✓</span>
          </div>
        </template>
        <div v-else class="menu-item disabled">No open windows</div>
      </div>

      <!-- Help Menu -->
      <div class="menu-trigger" ref="trigger_help" @click="toggle('help')" @mouseenter="hoverOpen('help')">
        <span>Help</span>
      </div>
      <div v-if="openMenu === 'help'" class="dropdown" :style="dropdownPos('help')">
        <div class="menu-item" @click="act('show-about')">
          About macOS Simulator
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="act('open-app', 'browser')">
          Open Documentation
        </div>
        <div class="menu-item disabled">
          Search
        </div>
      </div>
    </div>

    <div class="menu-right">
      <div v-if="musicCurrentSong" class="music-status" @click="act('open-app', 'music')">
        <span class="music-icon" :class="{ 'music-playing': musicIsPlaying }">🎵</span>
        <span class="music-title">{{ musicCurrentSong }}</span>
        <button 
          v-if="musicIsPlaying" 
          class="music-play-btn"
          @click.stop="act('music-toggle-play')"
        >
          <svg v-if="musicIsPlaying" viewBox="0 0 24 24" width="14" height="14">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="14" height="14">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <span class="menu-icon">🔋</span>
      <span class="menu-icon">📶</span>
      <span class="menu-time">{{ time }}</span>
    </div>

    <!-- About dialog -->
    <Teleport to="body">
      <div v-if="showAbout" class="about-overlay" @click.self="showAbout = false">
        <div class="about-dialog">
          <div class="about-icon">🍎</div>
          <h2>macOS Simulator</h2>
          <p>Version 1.0</p>
          <p class="about-sub">Built with Vue.js 3 + Vite</p>
          <p class="about-sub">A web-based macOS desktop experience</p>
          <button @click="showAbout = false">OK</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import logger from '../utils/logger.js'

const props = defineProps({
  activeApp: String,
  openWindows: { type: Array, default: () => [] },
  musicIsPlaying: { type: Boolean, default: false },
  musicCurrentSong: { type: String, default: '' },
})

const emit = defineEmits([
  'open-app',
  'close-active-window',
  'close-all-windows',
  'minimize-active-window',
  'maximize-active-window',
  'activate-window',
  'tile-left',
  'tile-right',
  'menu-action',
  'music-toggle-play',
])

const time = ref('')
const openMenu = ref(null)
const showAbout = ref(false)
let timer

// Template refs for trigger elements
const trigger_apple = ref(null)
const trigger_file = ref(null)
const trigger_edit = ref(null)
const trigger_view = ref(null)
const trigger_window = ref(null)
const trigger_help = ref(null)

const triggerRefs = { apple: trigger_apple, file: trigger_file, edit: trigger_edit, view: trigger_view, window: trigger_window, help: trigger_help }

// Track which trigger element maps to which menu for positioning
const menuOrder = ['apple', 'file', 'edit', 'view', 'window', 'help']

function updateTime() {
  const d = new Date()
  const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  time.value = d.toLocaleDateString('en-US', opts)
}

function toggle(menu) {
  openMenu.value = openMenu.value === menu ? null : menu
}

function hoverOpen(menu) {
  // Only switch on hover if a menu is already open
  if (openMenu.value !== null) openMenu.value = menu
}

function closeAll() {
  openMenu.value = null
}

function dropdownPos(menu) {
  const triggerRef = triggerRefs[menu]
  if (triggerRef && triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    return { left: rect.left + 'px' }
  }
  return { left: '100px' }
}

function act(action, payload) {
  openMenu.value = null
  logger.info('MenuBar', `Action: ${action}`, payload !== undefined ? { payload } : undefined)
  switch (action) {
    case 'open-app':
      emit('open-app', payload)
      break
    case 'close-active-window':
      emit('close-active-window')
      break
    case 'close-all-windows':
      emit('close-all-windows')
      break
    case 'minimize-active-window':
      emit('minimize-active-window')
      break
    case 'maximize-active-window':
      emit('maximize-active-window')
      break
    case 'activate-window':
      emit('activate-window', payload)
      break
    case 'tile-left':
      emit('tile-left')
      break
    case 'tile-right':
      emit('tile-right')
      break
    case 'show-about':
      showAbout.value = true
      break
    case 'zoom-in':
    case 'zoom-out':
    case 'zoom-reset':
      emit('menu-action', action)
      break
    case 'music-toggle-play':
      emit('music-toggle-play')
      break
  }
}

function execCommand(cmd) {
  openMenu.value = null
  logger.debug('MenuBar', `execCommand: ${cmd}`)
  try { document.execCommand(cmd) } catch (err) {
    logger.warn('MenuBar', `execCommand failed: ${cmd}`, { error: err.message })
  }
}

// Keyboard shortcuts
function onKeyDown(e) {
  const meta = e.metaKey || e.ctrlKey
  if (!meta) return
  switch (e.key) {
    case 'w':
      e.preventDefault()
      if (e.altKey) emit('close-all-windows')
      else emit('close-active-window')
      break
    case 'm':
      e.preventDefault()
      emit('minimize-active-window')
      break
    case 'n':
      e.preventDefault()
      emit('open-app', 'finder')
      break
    case 't':
      e.preventDefault()
      emit('open-app', 'terminal')
      break
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 10000)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.menu-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 99999;
  color: #fff;
  font-size: 13px;
}
.menu-left {
  display: flex;
  align-items: center;
  position: relative;
}
.menu-right {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.music-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.music-status:hover {
  background: rgba(255, 255, 255, 0.1);
}
.music-icon {
  font-size: 14px;
  opacity: 0.8;
}
.music-icon.music-playing {
  animation: menuMusicPulse 0.8s ease-in-out infinite;
}
@keyframes menuMusicPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
.music-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.music-play-btn {
  background: transparent;
  border: none;
  color: #fff;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.music-play-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.menu-trigger {
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}
.menu-trigger:hover {
  background: rgba(255,255,255,0.1);
}
.menu-trigger.app-name {
  font-weight: 600;
  cursor: default;
}
.menu-trigger.app-name:hover {
  background: transparent;
}
.apple-logo {
  font-size: 16px;
}
.menu-icon {
  font-size: 14px;
}
.dropdown {
  position: fixed;
  top: 28px;
  background: rgba(40, 40, 40, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 6px;
  padding: 4px 0;
  min-width: 220px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  z-index: 100000;
}
.menu-item {
  padding: 4px 16px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.menu-item:hover:not(.disabled) {
  background: #0066ff;
  border-radius: 4px;
  margin: 0 4px;
  padding: 4px 12px;
}
.menu-item.disabled {
  color: #666;
  cursor: default;
}
.shortcut {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
}
.menu-item:hover:not(.disabled) .shortcut {
  color: rgba(255,255,255,0.7);
}
.check {
  color: #4facfe;
  font-size: 12px;
}
.menu-divider {
  height: 1px;
  background: rgba(255,255,255,0.12);
  margin: 4px 0;
}
/* About dialog */
.about-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200000;
}
.about-dialog {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 32px 40px;
  text-align: center;
  color: #e0e0e0;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  min-width: 300px;
}
.about-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.about-dialog h2 {
  font-size: 18px;
  margin-bottom: 4px;
}
.about-dialog p {
  font-size: 13px;
  color: #aaa;
}
.about-sub {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}
.about-dialog button {
  margin-top: 16px;
  padding: 6px 24px;
  background: #0066ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.about-dialog button:hover {
  background: #0055dd;
}
</style>
