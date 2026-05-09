<template>
  <div
    v-show="!win.minimized"
    class="mac-window"
    :class="{ active: isActive }"
    :style="windowStyle"
    @mousedown="$emit('activate')"
  >
    <div class="title-bar" @mousedown.prevent="$emit('dragstart', $event)">
      <div class="traffic-lights">
        <span class="tl close" @mousedown.stop @click="$emit('close')"></span>
        <span class="tl minimize" @mousedown.stop @click="$emit('minimize')"></span>
        <span class="tl maximize" @mousedown.stop @click="$emit('maximize')"></span>
      </div>
      <span class="title-text">{{ win.title }}</span>
    </div>
    <div class="window-body">
      <slot />
    </div>
    <div class="resize-handle" @mousedown.prevent="$emit('resizestart', $event)"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  win: Object,
  isActive: Boolean,
})

defineEmits(['activate', 'close', 'minimize', 'maximize', 'dragstart', 'resizestart'])

const windowStyle = computed(() => ({
  left: props.win.x + 'px',
  top: props.win.y + 'px',
  width: props.win.w + 'px',
  height: props.win.h + 'px',
  zIndex: props.win.z,
}))
</script>

<style scoped>
.mac-window {
  position: absolute;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}
.mac-window.active {
  box-shadow: 0 12px 50px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,0,0,0.3);
}
.title-bar {
  height: 38px;
  background: linear-gradient(180deg, #3a3a3a 0%, #2d2d2d 100%);
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: grab;
  flex-shrink: 0;
  position: relative;
}
.title-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: #ccc;
  pointer-events: none;
}
.traffic-lights {
  display: flex;
  gap: 8px;
  z-index: 1;
}
.tl {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
}
.tl.close { background: #ff5f57; }
.tl.minimize { background: #febc2e; }
.tl.maximize { background: #28c840; }
.tl:hover { filter: brightness(1.2); }
.mac-window:not(.active) .tl {
  background: #555;
}
.window-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}
</style>
