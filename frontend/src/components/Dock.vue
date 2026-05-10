<template>
  <div class="dock">
    <div class="dock-container">
      <div
        v-for="item in dockItems"
        :key="item.app"
        class="dock-item"
        :class="{ active: isOpen(item.app), 'music-playing': item.app === 'music' && musicIsPlaying }"
        @click="handleClick(item.app)"
        :title="item.label"
      >
        <span class="dock-icon" :class="{ 'music-icon-anim': item.app === 'music' && musicIsPlaying }">
          {{ item.icon }}
        </span>
        <div v-if="isOpen(item.app)" class="dock-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ 
  windows: Array,
  musicIsPlaying: { type: Boolean, default: false }
})
const emit = defineEmits(['open-app', 'activate'])

const dockItems = [
  { app: 'finder', icon: '📁', label: 'Finder' },
  { app: 'browser', icon: '🌐', label: 'Safari' },
  { app: 'terminal', icon: '⬛', label: 'Terminal' },
  { app: 'notes', icon: '📝', label: 'Notes' },
  { app: 'calculator', icon: '🧮', label: 'Calculator' },
  { app: 'music', icon: '🎵', label: 'Music' },
  { app: 'settings', icon: '⚙️', label: 'System Preferences' },
  { app: 'activity', icon: '📊', label: 'Activity Monitor' },
]

function isOpen(app) {
  return props.windows.some(w => w.app === app)
}

function handleClick(app) {
  const existing = props.windows.find(w => w.app === app)
  if (existing) {
    emit('activate', existing.id)
  } else {
    emit('open-app', app)
  }
}
</script>

<style scoped>
.dock {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99998;
}
.dock-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(40, 40, 40, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.15);
}
.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.15s;
}
.dock-item:hover {
  transform: scale(1.3) translateY(-8px);
}
.dock-icon {
  font-size: 40px;
  line-height: 1;
}
.dock-icon.music-icon-anim {
  animation: musicBounce 0.6s ease-in-out infinite;
}
@keyframes musicBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.dock-dot {
  width: 4px;
  height: 4px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  margin-top: 2px;
}
.dock-item.music-playing .dock-dot {
  background: #fc3c44;
  animation: dotPulse 1s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.8);
  }
}
</style>
