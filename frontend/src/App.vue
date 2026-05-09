<template>
  <div class="macos" @mousedown="desktopClick" @mousemove="onMouseMove" @mouseup="onMouseUp">
    <!-- Desktop wallpaper -->
    <div class="desktop" :style="{ background: wallpaper }">
      <!-- Desktop Icons -->
      <div class="desktop-icons">
        <div class="desktop-icon" @dblclick="openApp('terminal')">
          <div class="icon-img terminal-icon">⬛</div>
          <span>Terminal</span>
        </div>
        <div class="desktop-icon" @dblclick="openApp('browser')">
          <div class="icon-img browser-icon">🌐</div>
          <span>Browser</span>
        </div>
        <div class="desktop-icon" @dblclick="openApp('finder')">
          <div class="icon-img finder-icon">📁</div>
          <span>Finder</span>
        </div>
        <div class="desktop-icon" @dblclick="openApp('notes')">
          <div class="icon-img notes-icon">📝</div>
          <span>Notes</span>
        </div>
        <div class="desktop-icon" @dblclick="openApp('calculator')">
          <div class="icon-img calc-icon">🧮</div>
          <span>Calculator</span>
        </div>
        <div class="desktop-icon" @dblclick="openApp('settings')">
          <div class="icon-img settings-icon">⚙️</div>
          <span>Settings</span>
        </div>
        <div class="desktop-icon" @dblclick="openApp('music')">
          <div class="icon-img music-icon">🎵</div>
          <span>Music</span>
        </div>
      </div>

      <!-- Windows -->
      <MacWindow
        v-for="win in windows"
        :key="win.id"
        :win="win"
        :isActive="win.id === activeWindowId"
        @activate="activateWindow(win.id)"
        @close="closeWindow(win.id)"
        @minimize="minimizeWindow(win.id)"
        @maximize="maximizeWindow(win.id)"
        @dragstart="startDrag($event, win.id)"
        @resizestart="startResize($event, win.id)"
      >
        <TerminalApp v-if="win.app === 'terminal'" :winId="win.id" />
        <BrowserApp v-if="win.app === 'browser'" />
        <FinderApp v-if="win.app === 'finder'" />
        <NotesApp v-if="win.app === 'notes'" />
        <CalculatorApp v-if="win.app === 'calculator'" />
        <SettingsApp v-if="win.app === 'settings'" @change-wallpaper="changeWallpaper" />
        <MusicApp 
          v-if="win.app === 'music'" 
          @play-state-change="handleMusicPlayState"
          @song-change="handleMusicSongChange"
        />
      </MacWindow>
    </div>

    <!-- Menu Bar -->
    <MenuBar
      :activeApp="activeAppName"
      :openWindows="menuWindows"
      :musicIsPlaying="musicState.isPlaying"
      :musicCurrentSong="musicState.currentSong?.title || ''"
      @open-app="openApp"
      @close-active-window="closeActiveWindow"
      @close-all-windows="closeAllWindows"
      @minimize-active-window="minimizeActiveWindow"
      @maximize-active-window="maximizeActiveWindow"
      @activate-window="activateWindow"
      @tile-left="tileActiveWindow('left')"
      @tile-right="tileActiveWindow('right')"
      @menu-action="handleMenuAction"
      @music-toggle-play="handleMusicTogglePlay"
    />

    <!-- Dock -->
    <Dock :windows="windows" :musicIsPlaying="musicState.isPlaying" @open-app="openApp" @activate="activateWindow" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onErrorCaptured, provide, reactive } from 'vue'
import logger from './utils/logger.js'
import MenuBar from './components/MenuBar.vue'
import Dock from './components/Dock.vue'
import MacWindow from './components/MacWindow.vue'
import TerminalApp from './components/apps/TerminalApp.vue'
import BrowserApp from './components/apps/BrowserApp.vue'
import FinderApp from './components/apps/FinderApp.vue'
import NotesApp from './components/apps/NotesApp.vue'
import CalculatorApp from './components/apps/CalculatorApp.vue'
import SettingsApp from './components/apps/SettingsApp.vue'
import MusicApp from './components/apps/MusicApp.vue'

const wallpapers = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
]
const wallpaper = ref(wallpapers[0])

const windows = ref([])
let nextId = 1
let nextZ = 10
const activeWindowId = ref(null)
const dragState = ref(null)
const resizeState = ref(null)

const musicState = ref({
  isPlaying: false,
  currentSong: null,
  currentIndex: 0
})

const appNames = {
  terminal: 'Terminal',
  browser: 'Safari',
  finder: 'Finder',
  notes: 'Notes',
  calculator: 'Calculator',
  settings: 'System Preferences',
  music: 'Music',
}

const appDefaults = {
  terminal: { w: 680, h: 420 },
  browser: { w: 900, h: 600 },
  finder: { w: 750, h: 480 },
  notes: { w: 500, h: 400 },
  calculator: { w: 260, h: 400 },
  settings: { w: 540, h: 400 },
  music: { w: 420, h: 650 },
}

const activeAppName = computed(() => {
  const win = windows.value.find(w => w.id === activeWindowId.value)
  return win ? appNames[win.app] : 'Finder'
})

function openApp(app) {
  const defaults = appDefaults[app] || { w: 600, h: 400 }
  const offset = (windows.value.length % 8) * 26
  const win = {
    id: nextId++,
    app,
    title: appNames[app] || app,
    x: 120 + offset,
    y: 60 + offset,
    w: defaults.w,
    h: defaults.h,
    z: nextZ++,
    minimized: false,
    maximized: false,
    prevBounds: null,
  }
  windows.value.push(win)
  activeWindowId.value = win.id
  logger.info('App', `Opened app: ${app}`, { windowId: win.id, title: win.title })
}

function activateWindow(id) {
  const win = windows.value.find(w => w.id === id)
  if (win) {
    win.z = nextZ++
    win.minimized = false
    activeWindowId.value = id
    logger.debug('App', `Activated window: ${win.title}`, { windowId: id })
  }
}

function closeWindow(id) {
  const win = windows.value.find(w => w.id === id)
  logger.info('App', `Closed window: ${win?.title || id}`, { windowId: id })
  windows.value = windows.value.filter(w => w.id !== id)
  if (activeWindowId.value === id) {
    const top = windows.value.reduce((a, b) => (a && a.z > b.z ? a : b), null)
    activeWindowId.value = top ? top.id : null
  }
}

function minimizeWindow(id) {
  const win = windows.value.find(w => w.id === id)
  if (win) {
    win.minimized = true
    logger.debug('App', `Minimized window: ${win.title}`, { windowId: id })
  }
}

function maximizeWindow(id) {
  const win = windows.value.find(w => w.id === id)
  if (!win) return
  if (win.maximized) {
    if (win.prevBounds) {
      Object.assign(win, win.prevBounds)
      win.prevBounds = null
    }
    win.maximized = false
    logger.debug('App', `Restored window: ${win.title}`, { windowId: id })
  } else {
    win.prevBounds = { x: win.x, y: win.y, w: win.w, h: win.h }
    win.x = 0
    win.y = 28
    win.w = window.innerWidth
    win.h = window.innerHeight - 28 - 72
    win.maximized = true
    logger.debug('App', `Maximized window: ${win.title}`, { windowId: id })
  }
}

function startDrag(e, id) {
  const win = windows.value.find(w => w.id === id)
  if (!win) return
  activateWindow(id)
  dragState.value = { id, startX: e.clientX - win.x, startY: e.clientY - win.y }
}

function startResize(e, id) {
  const win = windows.value.find(w => w.id === id)
  if (!win) return
  activateWindow(id)
  resizeState.value = { id, startX: e.clientX, startY: e.clientY, startW: win.w, startH: win.h }
}

function onMouseMove(e) {
  if (dragState.value) {
    const win = windows.value.find(w => w.id === dragState.value.id)
    if (win) {
      win.x = e.clientX - dragState.value.startX
      win.y = Math.max(28, e.clientY - dragState.value.startY)
    }
  }
  if (resizeState.value) {
    const win = windows.value.find(w => w.id === resizeState.value.id)
    if (win) {
      win.w = Math.max(300, resizeState.value.startW + e.clientX - resizeState.value.startX)
      win.h = Math.max(200, resizeState.value.startH + e.clientY - resizeState.value.startY)
    }
  }
}

function onMouseUp() {
  dragState.value = null
  resizeState.value = null
}

function desktopClick(e) {
  if (e.target.closest('.mac-window') || e.target.closest('.dock') || e.target.closest('.menu-bar')) return
  activeWindowId.value = null
}

function changeWallpaper(idx) {
  wallpaper.value = wallpapers[idx] || wallpapers[0]
  logger.info('App', `Changed wallpaper to index ${idx}`)
}

// Computed list for Window menu
const menuWindows = computed(() =>
  windows.value
    .filter(w => !w.minimized)
    .map(w => ({ id: w.id, title: w.title, active: w.id === activeWindowId.value }))
)

function closeActiveWindow() {
  if (activeWindowId.value !== null) closeWindow(activeWindowId.value)
}

function closeAllWindows() {
  logger.info('App', `Closed all windows (${windows.value.length} total)`)
  windows.value = []
  activeWindowId.value = null
}

function minimizeActiveWindow() {
  if (activeWindowId.value !== null) minimizeWindow(activeWindowId.value)
}

function maximizeActiveWindow() {
  if (activeWindowId.value !== null) maximizeWindow(activeWindowId.value)
}

function tileActiveWindow(side) {
  const win = windows.value.find(w => w.id === activeWindowId.value)
  if (!win) return
  const screenW = window.innerWidth
  const screenH = window.innerHeight
  win.y = 28
  win.h = screenH - 28 - 72
  win.w = Math.floor(screenW / 2)
  win.x = side === 'left' ? 0 : Math.floor(screenW / 2)
  win.maximized = false
  win.prevBounds = null
  logger.debug('App', `Tiled window ${win.title} to ${side}`)
}

function handleMenuAction(action) {
  logger.info('App', `Menu action: ${action}`)
}

function handleMusicPlayState(payload) {
  musicState.value.isPlaying = payload.isPlaying
  musicState.value.currentSong = payload.song
  logger.info('Music', `Play state changed: ${payload.isPlaying ? 'Playing' : 'Paused'}`, { song: payload.song?.title })
}

function handleMusicSongChange(payload) {
  musicState.value.currentSong = payload.song
  musicState.value.currentIndex = payload.index
  logger.info('Music', `Song changed: ${payload.song?.title}`)
}

function handleMusicTogglePlay() {
  const musicWindow = windows.value.find(w => w.app === 'music')
  if (musicWindow) {
    musicState.value.isPlaying = !musicState.value.isPlaying
    logger.info('Music', `Toggle play from MenuBar: ${musicState.value.isPlaying ? 'Playing' : 'Paused'}`)
  }
}

const musicControl = reactive({
  togglePlay: () => {
    musicState.value.isPlaying = !musicState.value.isPlaying
  }
})

provide('musicControl', musicControl)

// Global error boundary
onErrorCaptured((err, instance, info) => {
  logger.error('App', `Component error: ${err.message}`, { info, stack: err.stack })
  return false // don't propagate
})

// Log app startup
onMounted(() => {
  logger.info('App', 'macOS Simulator started', {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent,
  })
})

// Catch unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    logger.error('Global', `Unhandled promise rejection: ${e.reason}`, { reason: String(e.reason) })
  })
  window.addEventListener('error', (e) => {
    logger.error('Global', `Uncaught error: ${e.message}`, { filename: e.filename, lineno: e.lineno })
  })
}
</script>

<style scoped>
.macos {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
.desktop {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.desktop-icons {
  position: absolute;
  top: 40px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
}
.desktop-icon:hover {
  background: rgba(255,255,255,0.15);
}
.desktop-icon span {
  font-size: 11px;
  margin-top: 4px;
  text-align: center;
}
.icon-img {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  border-radius: 12px;
}
</style>
