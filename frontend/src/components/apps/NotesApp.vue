<template>
  <div class="notes">
    <div class="notes-sidebar">
      <div class="notes-header">
        <span>Notes</span>
        <button @click="addNote">+</button>
      </div>
      <div
        v-for="(note, i) in notes"
        :key="i"
        class="note-item"
        :class="{ active: i === activeNote }"
        @click="activeNote = i"
      >
        <div class="note-title">{{ note.title || 'Untitled' }}</div>
        <div class="note-preview">{{ note.content.slice(0, 40) || 'No content' }}</div>
      </div>
    </div>
    <div class="notes-editor">
      <input
        v-if="notes[activeNote]"
        v-model="notes[activeNote].title"
        class="note-title-input"
        placeholder="Title"
      />
      <textarea
        v-if="notes[activeNote]"
        v-model="notes[activeNote].content"
        class="note-content-input"
        placeholder="Start writing..."
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const notes = ref([
  { title: 'Welcome', content: 'Welcome to Notes!\nThis is a simple note-taking app in macOS Simulator.' },
  { title: 'Todo List', content: '- Learn Vue 3\n- Build macOS Simulator\n- Deploy with Docker' },
])
const activeNote = ref(0)

function addNote() {
  notes.value.unshift({ title: '', content: '' })
  activeNote.value = 0
}
</script>

<style scoped>
.notes {
  width: 100%;
  height: 100%;
  display: flex;
  background: #1e1e1e;
  color: #e0e0e0;
}
.notes-sidebar {
  width: 200px;
  background: #252525;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
}
.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #333;
}
.notes-header button {
  background: none;
  border: none;
  color: #4facfe;
  font-size: 20px;
  cursor: pointer;
}
.note-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #2a2a2a;
}
.note-item:hover { background: rgba(255,255,255,0.03); }
.note-item.active { background: rgba(0,102,255,0.2); }
.note-title { font-size: 13px; font-weight: 500; }
.note-preview { font-size: 11px; color: #888; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notes-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}
.note-title-input {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
}
.note-content-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
}
</style>
