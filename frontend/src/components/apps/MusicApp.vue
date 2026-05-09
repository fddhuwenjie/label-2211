<template>
  <div class="music-app">
    <div class="music-main">
      <div class="music-now-playing">
        <div class="album-art">
          <div class="art-placeholder" :style="{ background: currentSong.gradient }">
            <span class="art-icon">{{ currentSong.icon }}</span>
          </div>
        </div>
        <div class="song-info">
          <h2 class="song-title">{{ currentSong.title }}</h2>
          <p class="song-artist">{{ currentSong.artist }}</p>
        </div>
      </div>

      <div class="music-controls">
        <div class="progress-container">
          <div 
            class="progress-bar" 
            ref="progressBarRef"
            @mousedown="startProgressDrag"
          >
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
          </div>
          <div class="time-display">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            <span class="total-time">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="control-buttons">
          <button class="mode-btn" @click="togglePlayMode" :title="playModeLabel">
            <span v-if="playMode === 'sequence'">🔁</span>
            <span v-else-if="playMode === 'repeat'">🔂</span>
            <span v-else-if="playMode === 'shuffle'">🔀</span>
          </button>
          <button class="control-btn prev-btn" @click="playPrevious" title="上一首">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor"/>
            </svg>
          </button>
          <button class="control-btn play-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" width="28" height="28">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="28" height="28">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
            </svg>
          </button>
          <button class="control-btn next-btn" @click="playNext" title="下一首">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/>
            </svg>
          </button>
          <button class="volume-btn" @click="toggleMute" :title="isMuted ? '取消静音' : '静音'">
            <span v-if="isMuted || volume === 0">🔇</span>
            <span v-else-if="volume < 0.5">🔉</span>
            <span v-else>🔊</span>
          </button>
        </div>

        <div class="volume-container">
          <div 
            class="volume-bar" 
            ref="volumeBarRef"
            @mousedown="startVolumeDrag"
          >
            <div class="volume-fill" :style="{ width: volumePercent + '%' }"></div>
            <div class="volume-thumb" :style="{ left: volumePercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="playlist-panel">
      <div class="playlist-header">
        <h3>歌曲列表</h3>
      </div>
      <div class="playlist-items">
        <div 
          v-for="(song, index) in songs" 
          :key="index"
          class="playlist-item"
          :class="{ active: currentIndex === index, playing: currentIndex === index && isPlaying }"
          @click="playSong(index)"
        >
          <div class="item-number">
            <span v-if="currentIndex === index && isPlaying" class="playing-indicator">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="item-info">
            <div class="item-title">{{ song.title }}</div>
            <div class="item-artist">{{ song.artist }}</div>
          </div>
          <div class="item-duration">{{ formatTime(song.duration) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'

const emit = defineEmits(['play-state-change', 'song-change'])

const isPlaying = ref(false)
const currentIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const isMuted = ref(false)
const playMode = ref('sequence')

const progressBarRef = ref(null)
const volumeBarRef = ref(null)
const isDraggingProgress = ref(false)
const isDraggingVolume = ref(false)

let audioContext = null
let masterGain = null
let currentNoteIndex = 0
let nextNoteTime = 0
let schedulerTimer = null
let notesQueue = []
let startTime = 0

const songs = [
  {
    id: 1,
    title: '月光奏鸣曲',
    artist: '合成钢琴',
    duration: 20,
    icon: '🎹',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    type: 'piano'
  },
  {
    id: 2,
    title: '电子节拍',
    artist: '鼓点合成器',
    duration: 18,
    icon: '🥁',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    type: 'drums'
  },
  {
    id: 3,
    title: '星际漫游',
    artist: '合成器音效',
    duration: 22,
    icon: '🚀',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    type: 'synth'
  },
  {
    id: 4,
    title: '森林低语',
    artist: '自然音效',
    duration: 19,
    icon: '🌲',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    type: 'ambient'
  },
  {
    id: 5,
    title: '复古街机',
    artist: '8-bit芯片',
    duration: 17,
    icon: '🎮',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    type: 'chiptune'
  }
]

const currentSong = computed(() => songs[currentIndex.value])

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const volumePercent = computed(() => {
  return isMuted.value ? 0 : volume.value * 100
})

const playModeLabel = computed(() => {
  switch (playMode.value) {
    case 'sequence': return '列表循环'
    case 'repeat': return '单曲循环'
    case 'shuffle': return '随机播放'
    default: return '列表循环'
  }
})

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = audioContext.createGain()
    masterGain.gain.value = isMuted.value ? 0 : volume.value
    masterGain.connect(audioContext.destination)
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}

function generateMelody(songType) {
  const melodies = {
    piano: [
      { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
      { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 1 }, { note: 'A4', duration: 0.5 },
      { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 1 }, { note: 'E4', duration: 0.5 },
      { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 1 }, { note: 'E4', duration: 0.5 },
      { note: 'G4', duration: 0.5 }, { note: 'C5', duration: 1 }, { note: 'B4', duration: 0.5 },
      { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 1 }, { note: 'F4', duration: 0.5 },
      { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 1.5 },
      { note: 'C4', duration: 0.5 }, { note: 'G3', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 1 }, { note: 'F4', duration: 0.5 },
      { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 1 }, { note: 'C4', duration: 2 }
    ],
    drums: [
      { note: 'kick', duration: 0.25 }, { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 },
      { note: 'kick', duration: 0.25 }, { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 },
      { note: 'snare', duration: 0.25 }, { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 },
      { note: 'kick', duration: 0.25 }, { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 },
      { note: 'kick', duration: 0.25 }, { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 },
      { note: 'snare', duration: 0.25 }, { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 },
      { note: 'kick', duration: 0.25 }, { note: 'kick', duration: 0.25 }, { note: 'snare', duration: 0.5 },
      { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 }, { note: 'kick', duration: 0.25 },
      { note: 'hihat', duration: 0.125 }, { note: 'hihat', duration: 0.125 }, { note: 'snare', duration: 0.25 },
      { note: 'kick', duration: 0.5 }, { note: 'hihat', duration: 0.25 }, { note: 'hihat', duration: 0.25 }
    ],
    synth: [
      { note: 'C5', duration: 0.3 }, { note: 'E5', duration: 0.3 }, { note: 'G5', duration: 0.6 },
      { note: 'A5', duration: 0.3 }, { note: 'G5', duration: 0.3 }, { note: 'E5', duration: 0.6 },
      { note: 'C5', duration: 0.3 }, { note: 'D5', duration: 0.3 }, { note: 'F5', duration: 0.6 },
      { note: 'G5', duration: 0.3 }, { note: 'F5', duration: 0.3 }, { note: 'D5', duration: 0.6 },
      { note: 'C5', duration: 0.3 }, { note: 'E5', duration: 0.3 }, { note: 'G5', duration: 0.6 },
      { note: 'B5', duration: 0.3 }, { note: 'A5', duration: 0.3 }, { note: 'G5', duration: 0.6 },
      { note: 'E5', duration: 0.3 }, { note: 'G5', duration: 0.3 }, { note: 'C6', duration: 0.6 },
      { note: 'B5', duration: 0.3 }, { note: 'G5', duration: 0.3 }, { note: 'E5', duration: 0.6 },
      { note: 'C5', duration: 0.3 }, { note: 'D5', duration: 0.3 }, { note: 'G5', duration: 0.6 },
      { note: 'F5', duration: 0.3 }, { note: 'E5', duration: 0.3 }, { note: 'C5', duration: 0.9 }
    ],
    ambient: [
      { note: 'C3', duration: 2 }, { note: 'E3', duration: 2 }, { note: 'G3', duration: 3 },
      { note: 'C4', duration: 2 }, { note: 'G3', duration: 2 }, { note: 'E3', duration: 3 },
      { note: 'D3', duration: 2 }, { note: 'F3', duration: 2 }, { note: 'A3', duration: 3 },
      { note: 'D4', duration: 2 }, { note: 'A3', duration: 2 }, { note: 'F3', duration: 3 },
      { note: 'C3', duration: 2 }, { note: 'E3', duration: 2 }, { note: 'G3', duration: 3 },
      { note: 'B3', duration: 2 }, { note: 'G3', duration: 2 }, { note: 'E3', duration: 3 },
      { note: 'F3', duration: 2 }, { note: 'A3', duration: 2 }, { note: 'C4', duration: 3 },
      { note: 'F4', duration: 2 }, { note: 'C4', duration: 2 }, { note: 'A3', duration: 3 },
      { note: 'G3', duration: 2 }, { note: 'B3', duration: 2 }, { note: 'D4', duration: 3 },
      { note: 'G4', duration: 2 }, { note: 'D4', duration: 2 }, { note: 'B3', duration: 4 }
    ],
    chiptune: [
      { note: 'C4', duration: 0.15 }, { note: 'C4', duration: 0.15 }, { note: 'G4', duration: 0.15 },
      { note: 'G4', duration: 0.15 }, { note: 'A4', duration: 0.15 }, { note: 'A4', duration: 0.15 },
      { note: 'G4', duration: 0.3 }, { note: 'F4', duration: 0.15 }, { note: 'F4', duration: 0.15 },
      { note: 'E4', duration: 0.15 }, { note: 'E4', duration: 0.15 }, { note: 'D4', duration: 0.15 },
      { note: 'D4', duration: 0.15 }, { note: 'C4', duration: 0.3 }, { note: 'G4', duration: 0.15 },
      { note: 'G4', duration: 0.15 }, { note: 'F4', duration: 0.15 }, { note: 'F4', duration: 0.15 },
      { note: 'E4', duration: 0.15 }, { note: 'E4', duration: 0.15 }, { note: 'D4', duration: 0.3 },
      { note: 'G4', duration: 0.15 }, { note: 'G4', duration: 0.15 }, { note: 'F4', duration: 0.15 },
      { note: 'F4', duration: 0.15 }, { note: 'E4', duration: 0.15 }, { note: 'E4', duration: 0.15 },
      { note: 'D4', duration: 0.3 }, { note: 'C4', duration: 0.15 }, { note: 'C4', duration: 0.15 },
      { note: 'G4', duration: 0.15 }, { note: 'G4', duration: 0.15 }, { note: 'A4', duration: 0.15 },
      { note: 'A4', duration: 0.15 }, { note: 'G4', duration: 0.3 }, { note: 'F4', duration: 0.15 },
      { note: 'F4', duration: 0.15 }, { note: 'E4', duration: 0.15 }, { note: 'E4', duration: 0.15 },
      { note: 'D4', duration: 0.15 }, { note: 'D4', duration: 0.15 }, { note: 'C4', duration: 0.45 }
    ]
  }
  return melodies[songType] || melodies.piano
}

function noteToFreq(note) {
  const noteMap = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
    'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
    'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
    'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
    'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50
  }
  return noteMap[note] || 440
}

function playTone(freq, startTime, duration, type = 'sine', volume = 0.3) {
  if (!audioContext || !masterGain) return
  
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  
  osc.connect(gain)
  gain.connect(masterGain)
  
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playDrum(type, startTime) {
  if (!audioContext || !masterGain) return
  
  if (type === 'kick') {
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    
    osc.frequency.setValueAtTime(150, startTime)
    osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5)
    
    gain.gain.setValueAtTime(0.8, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)
    
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(startTime)
    osc.stop(startTime + 0.5)
  } else if (type === 'snare') {
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    const noise = audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    const noiseGain = audioContext.createGain()
    const noiseFilter = audioContext.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000
    
    noiseGain.gain.setValueAtTime(0.5, startTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)
    
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(masterGain)
    noise.start(startTime)
    noise.stop(startTime + 0.2)
    
    const osc = audioContext.createOscillator()
    const oscGain = audioContext.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(250, startTime)
    oscGain.gain.setValueAtTime(0.3, startTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1)
    osc.connect(oscGain)
    oscGain.connect(masterGain)
    osc.start(startTime)
    osc.stop(startTime + 0.1)
  } else if (type === 'hihat') {
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.05, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    const noise = audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    const noiseGain = audioContext.createGain()
    const highpass = audioContext.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 7000
    
    noiseGain.gain.setValueAtTime(0.3, startTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05)
    
    noise.connect(highpass)
    highpass.connect(noiseGain)
    noiseGain.connect(masterGain)
    noise.start(startTime)
    noise.stop(startTime + 0.05)
  }
}

function scheduleNote(note, time, songType) {
  if (songType === 'drums') {
    playDrum(note.note, time)
  } else {
    const freq = noteToFreq(note.note)
    let oscType = 'sine'
    let vol = 0.3
    
    switch (songType) {
      case 'piano':
        oscType = 'triangle'
        vol = 0.35
        break
      case 'synth':
        oscType = 'sawtooth'
        vol = 0.25
        break
      case 'ambient':
        oscType = 'sine'
        vol = 0.2
        break
      case 'chiptune':
        oscType = 'square'
        vol = 0.15
        break
    }
    
    playTone(freq, time, note.duration * 1.5, oscType, vol)
  }
}

function scheduler() {
  if (!isPlaying.value) return
  
  const lookahead = 25.0
  const scheduleAheadTime = 0.1
  
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    if (currentNoteIndex < notesQueue.length) {
      scheduleNote(notesQueue[currentNoteIndex], nextNoteTime, currentSong.value.type)
      nextNoteTime += notesQueue[currentNoteIndex].duration
      currentNoteIndex++
    } else {
      songEnded()
      return
    }
  }
  
  schedulerTimer = setTimeout(scheduler, lookahead)
}

function updateCurrentTime() {
  if (!isPlaying.value || !audioContext) return
  
  const elapsed = audioContext.currentTime - startTime
  currentTime.value = Math.min(elapsed, duration.value)
  
  if (currentTime.value >= duration.value) {
    songEnded()
  }
}

function songEnded() {
  if (playMode.value === 'repeat') {
    restartSong()
  } else {
    playNext()
  }
}

function restartSong() {
  stopPlayback()
  currentNoteIndex = 0
  nextNoteTime = 0
  currentTime.value = 0
  startPlayback()
}

function startPlayback() {
  initAudioContext()
  
  notesQueue = generateMelody(currentSong.value.type)
  duration.value = currentSong.value.duration
  
  currentNoteIndex = 0
  nextNoteTime = audioContext.currentTime
  startTime = audioContext.currentTime
  currentTime.value = 0
  isPlaying.value = true
  
  emit('play-state-change', { isPlaying: true, song: currentSong.value })
  emit('song-change', { song: currentSong.value, index: currentIndex.value })
  
  scheduler()
  
  const timeUpdater = setInterval(() => {
    if (isPlaying.value) {
      updateCurrentTime()
    } else {
      clearInterval(timeUpdater)
    }
  }, 50)
}

function stopPlayback() {
  isPlaying.value = false
  if (schedulerTimer) {
    clearTimeout(schedulerTimer)
    schedulerTimer = null
  }
  emit('play-state-change', { isPlaying: false, song: currentSong.value })
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

function playSong(index) {
  stopPlayback()
  currentIndex.value = index
  currentTime.value = 0
  startPlayback()
}

function playNext() {
  stopPlayback()
  
  if (playMode.value === 'shuffle') {
    let newIndex
    do {
      newIndex = Math.floor(Math.random() * songs.length)
    } while (newIndex === currentIndex.value && songs.length > 1)
    currentIndex.value = newIndex
  } else {
    currentIndex.value = (currentIndex.value + 1) % songs.length
  }
  
  currentTime.value = 0
  startPlayback()
}

function playPrevious() {
  stopPlayback()
  
  if (currentTime.value > 3) {
    currentTime.value = 0
    startPlayback()
  } else {
    if (playMode.value === 'shuffle') {
      let newIndex
      do {
        newIndex = Math.floor(Math.random() * songs.length)
      } while (newIndex === currentIndex.value && songs.length > 1)
      currentIndex.value = newIndex
    } else {
      currentIndex.value = (currentIndex.value - 1 + songs.length) % songs.length
    }
    currentTime.value = 0
    startPlayback()
  }
}

function togglePlayMode() {
  const modes = ['sequence', 'repeat', 'shuffle']
  const currentModeIndex = modes.indexOf(playMode.value)
  playMode.value = modes[(currentModeIndex + 1) % modes.length]
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (masterGain) {
    masterGain.gain.value = isMuted.value ? 0 : volume.value
  }
}

function startProgressDrag(e) {
  isDraggingProgress.value = true
  updateProgressFromEvent(e)
  window.addEventListener('mousemove', onProgressDrag)
  window.addEventListener('mouseup', stopProgressDrag)
}

function onProgressDrag(e) {
  if (isDraggingProgress.value) {
    updateProgressFromEvent(e)
  }
}

function updateProgressFromEvent(e) {
  if (!progressBarRef.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  
  if (isPlaying.value) {
    stopPlayback()
  }
  
  currentTime.value = percent * duration.value
  
  const totalNotes = notesQueue.length || generateMelody(currentSong.value.type).length
  currentNoteIndex = Math.floor(percent * totalNotes)
}

function stopProgressDrag() {
  isDraggingProgress.value = false
  window.removeEventListener('mousemove', onProgressDrag)
  window.removeEventListener('mouseup', stopProgressDrag)
}

function startVolumeDrag(e) {
  isDraggingVolume.value = true
  updateVolumeFromEvent(e)
  window.addEventListener('mousemove', onVolumeDrag)
  window.addEventListener('mouseup', stopVolumeDrag)
}

function onVolumeDrag(e) {
  if (isDraggingVolume.value) {
    updateVolumeFromEvent(e)
  }
}

function updateVolumeFromEvent(e) {
  if (!volumeBarRef.value) return
  const rect = volumeBarRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  volume.value = percent
  isMuted.value = percent === 0
  
  if (masterGain) {
    masterGain.gain.value = isMuted.value ? 0 : volume.value
  }
}

function stopVolumeDrag() {
  isDraggingVolume.value = false
  window.removeEventListener('mousemove', onVolumeDrag)
  window.removeEventListener('mouseup', stopVolumeDrag)
}

onMounted(() => {
  duration.value = currentSong.value.duration
})

onUnmounted(() => {
  stopPlayback()
  if (audioContext) {
    audioContext.close()
  }
})

watch(isPlaying, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit('play-state-change', { isPlaying: newVal, song: currentSong.value })
  }
})

watch(currentIndex, (newVal) => {
  emit('song-change', { song: currentSong.value, index: newVal })
})
</script>

<style scoped>
.music-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1c1c1e;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
}

.music-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 100%);
}

.music-now-playing {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.album-art {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.art-icon {
  font-size: 80px;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.3));
}

.song-info {
  text-align: center;
}

.song-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #fff;
}

.song-artist {
  font-size: 16px;
  margin: 0;
  color: #a0a0a5;
}

.music-controls {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #3a3a3c;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #fc3c44;
  border-radius: 3px;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.progress-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8e8e93;
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.mode-btn,
.volume-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #8e8e93;
  font-size: 18px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.mode-btn:hover,
.volume-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.control-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.play-btn {
  width: 56px;
  height: 56px;
  background: #fc3c44;
}

.play-btn:hover {
  background: #ff4d55;
}

.volume-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.volume-bar {
  width: 120px;
  height: 4px;
  background: #3a3a3c;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.volume-fill {
  height: 100%;
  background: #8e8e93;
  border-radius: 2px;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.volume-thumb {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.volume-bar:hover .volume-thumb {
  opacity: 1;
}

.playlist-panel {
  height: 200px;
  background: #1c1c1e;
  border-top: 1px solid #2c2c2e;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  padding: 12px 16px;
  border-bottom: 1px solid #2c2c2e;
}

.playlist-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.playlist-items {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.playlist-item.active {
  background: rgba(252, 60, 68, 0.15);
}

.item-number {
  width: 24px;
  text-align: center;
  font-size: 13px;
  color: #8e8e93;
  margin-right: 12px;
}

.playlist-item.active .item-number {
  color: #fc3c44;
}

.playing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}

.playing-indicator .bar {
  width: 3px;
  background: #fc3c44;
  animation: musicBar 0.5s ease-in-out infinite alternate;
}

.playing-indicator .bar:nth-child(1) {
  height: 6px;
  animation-delay: 0s;
}

.playing-indicator .bar:nth-child(2) {
  height: 10px;
  animation-delay: 0.1s;
}

.playing-indicator .bar:nth-child(3) {
  height: 8px;
  animation-delay: 0.2s;
}

@keyframes musicBar {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1); }
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-item.active .item-title {
  color: #fc3c44;
}

.item-artist {
  font-size: 12px;
  color: #8e8e93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-duration {
  font-size: 13px;
  color: #8e8e93;
  margin-left: 16px;
}

.playlist-items::-webkit-scrollbar {
  width: 6px;
}

.playlist-items::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: #4a4a4c;
  border-radius: 3px;
}

.playlist-items::-webkit-scrollbar-thumb:hover {
  background: #5a5a5c;
}
</style>
