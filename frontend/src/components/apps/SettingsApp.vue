<template>
  <div class="settings">
    <div class="settings-sidebar">
      <div class="settings-title">System Preferences</div>
      <div
        v-for="(section, i) in sections"
        :key="i"
        class="settings-item"
        :class="{ active: activeSection === i }"
        @click="activeSection = i"
      >
        <span>{{ section.icon }}</span>
        <span>{{ section.name }}</span>
      </div>
    </div>
    <div class="settings-main">
      <!-- Wallpaper -->
      <div v-if="activeSection === 0" class="settings-panel">
        <h2>Desktop & Screen Saver</h2>
        <p class="desc">Choose your desktop wallpaper</p>
        <div class="wallpaper-grid">
          <div
            v-for="(wp, i) in wallpapers"
            :key="i"
            class="wallpaper-item"
            :style="{ background: wp }"
            :class="{ selected: selectedWp === i }"
            @click="selectWallpaper(i)"
          ></div>
        </div>
      </div>
      <!-- About -->
      <div v-if="activeSection === 1" class="settings-panel">
        <h2>About This Mac</h2>
        <div class="about-info">
          <div class="about-row"><span>macOS</span><span>Simulator 1.0</span></div>
          <div class="about-row"><span>Processor</span><span>JavaScript V8 Engine</span></div>
          <div class="about-row"><span>Memory</span><span>∞ GB</span></div>
          <div class="about-row"><span>Graphics</span><span>CSS3 / WebGL</span></div>
          <div class="about-row"><span>Framework</span><span>Vue.js 3</span></div>
          <div class="about-row"><span>Build Tool</span><span>Vite</span></div>
        </div>
      </div>
      <!-- Display -->
      <div v-if="activeSection === 2" class="settings-panel">
        <h2>Display</h2>
        <div class="about-info">
          <div class="about-row"><span>Resolution</span><span>{{ screenW }} × {{ screenH }}</span></div>
          <div class="about-row"><span>Pixel Ratio</span><span>{{ pixelRatio }}x</span></div>
          <div class="about-row"><span>Color Depth</span><span>{{ colorDepth }}-bit</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['change-wallpaper'])

const sections = [
  { icon: '🖼️', name: 'Desktop & Screen Saver' },
  { icon: 'ℹ️', name: 'About This Mac' },
  { icon: '🖥️', name: 'Display' },
]
const activeSection = ref(0)
const selectedWp = ref(0)

const wallpapers = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
]

const screenW = window.innerWidth
const screenH = window.innerHeight
const pixelRatio = window.devicePixelRatio
const colorDepth = screen.colorDepth

function selectWallpaper(i) {
  selectedWp.value = i
  emit('change-wallpaper', i)
}
</script>

<style scoped>
.settings {
  width: 100%;
  height: 100%;
  display: flex;
  background: #1e1e1e;
  color: #e0e0e0;
}
.settings-sidebar {
  width: 200px;
  background: #252525;
  border-right: 1px solid #333;
  padding: 8px 0;
}
.settings-title {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px 12px;
  color: #fff;
}
.settings-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  margin: 1px 8px;
}
.settings-item:hover { background: rgba(255,255,255,0.05); }
.settings-item.active { background: rgba(0,102,255,0.3); }
.settings-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
.settings-panel h2 {
  font-size: 20px;
  margin-bottom: 8px;
}
.desc {
  color: #888;
  font-size: 13px;
  margin-bottom: 20px;
}
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.wallpaper-item {
  height: 80px;
  border-radius: 8px;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.2s;
}
.wallpaper-item:hover { border-color: rgba(255,255,255,0.3); }
.wallpaper-item.selected { border-color: #4facfe; }
.about-info {
  margin-top: 16px;
}
.about-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #333;
  font-size: 13px;
}
.about-row span:first-child { color: #888; }
</style>
