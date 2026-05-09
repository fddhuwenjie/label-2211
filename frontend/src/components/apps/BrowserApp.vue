<template>
  <div class="browser">
    <div class="browser-toolbar">
      <div class="nav-buttons">
        <button @click="goBack" :disabled="historyIdx <= 0">◀</button>
        <button @click="goForward" :disabled="historyIdx >= browseHistory.length - 1">▶</button>
        <button @click="reload">⟳</button>
      </div>
      <div class="url-bar">
        <span class="lock-icon">🔒</span>
        <input
          v-model="urlInput"
          @keydown.enter="navigate"
          placeholder="Search or enter URL"
          spellcheck="false"
        />
      </div>
    </div>
    <div class="browser-tabs">
      <div
        v-for="(tab, i) in tabs"
        :key="i"
        class="tab"
        :class="{ active: i === activeTab }"
        @click="switchTab(i)"
      >
        <span>{{ tab.title }}</span>
        <span class="tab-close" @click.stop="closeTab(i)">×</span>
      </div>
      <div class="tab new-tab" @click="newTab">+</div>
    </div>
    <div class="browser-content">
      <!-- Homepage -->
      <div v-if="currentPage === 'home'" class="home-page">
        <h1>Safari</h1>
        <div class="search-box">
          <input v-model="searchQuery" @keydown.enter="search" placeholder="Search the web..." />
        </div>
        <div class="favorites">
          <div class="fav-item" @click="goTo('https://github.com')">
            <div class="fav-icon">🐙</div>
            <span>GitHub</span>
          </div>
          <div class="fav-item" @click="goTo('https://vuejs.org')">
            <div class="fav-icon">💚</div>
            <span>Vue.js</span>
          </div>
          <div class="fav-item" @click="goTo('https://developer.mozilla.org')">
            <div class="fav-icon">📖</div>
            <span>MDN</span>
          </div>
          <div class="fav-item" @click="goTo('https://stackoverflow.com')">
            <div class="fav-icon">📋</div>
            <span>Stack Overflow</span>
          </div>
        </div>
      </div>
      <!-- Simulated page -->
      <div v-else class="web-page">
        <div class="page-header">
          <div class="page-domain">{{ pageDomain }}</div>
        </div>
        <div class="page-body">
          <div v-if="loading" class="loading">Loading...</div>
          <div v-else v-html="pageContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import logger from '../../utils/logger.js'

const tabs = ref([{ title: 'New Tab', url: 'home' }])
const activeTab = ref(0)
const urlInput = ref('')
const searchQuery = ref('')
const browseHistory = ref(['home'])
const historyIdx = ref(0)
const loading = ref(false)

const currentPage = computed(() => tabs.value[activeTab.value]?.url || 'home')
const pageDomain = computed(() => {
  try {
    return new URL(currentPage.value).hostname
  } catch { return currentPage.value }
})

const simulatedPages = {
  'github.com': {
    title: 'GitHub',
    content: `
      <h1 style="margin-bottom:16px">GitHub</h1>
      <p style="color:#8b949e;margin-bottom:24px">Where the world builds software</p>
      <div style="background:#161b22;padding:20px;border-radius:8px;margin-bottom:16px">
        <h3 style="color:#58a6ff">Trending Repositories</h3>
        <div style="border-bottom:1px solid #30363d;padding:12px 0">
          <span style="color:#58a6ff">vuejs/vue</span>
          <span style="color:#8b949e;margin-left:12px">⭐ 207k</span>
          <p style="color:#8b949e;font-size:13px;margin-top:4px">The Progressive JavaScript Framework</p>
        </div>
        <div style="border-bottom:1px solid #30363d;padding:12px 0">
          <span style="color:#58a6ff">facebook/react</span>
          <span style="color:#8b949e;margin-left:12px">⭐ 220k</span>
          <p style="color:#8b949e;font-size:13px;margin-top:4px">A declarative, efficient, and flexible JavaScript library</p>
        </div>
        <div style="padding:12px 0">
          <span style="color:#58a6ff">microsoft/vscode</span>
          <span style="color:#8b949e;margin-left:12px">⭐ 160k</span>
          <p style="color:#8b949e;font-size:13px;margin-top:4px">Visual Studio Code</p>
        </div>
      </div>
    `
  },
  'vuejs.org': {
    title: 'Vue.js',
    content: `
      <div style="text-align:center;padding:40px 20px">
        <h1 style="font-size:36px;color:#42b883">Vue.js</h1>
        <p style="font-size:18px;color:#aaa;margin:16px 0">The Progressive JavaScript Framework</p>
        <div style="display:flex;gap:16px;justify-content:center;margin-top:24px">
          <div style="background:#1a1a2e;padding:20px;border-radius:8px;width:200px">
            <h3 style="color:#42b883">Approachable</h3>
            <p style="color:#888;font-size:13px;margin-top:8px">Builds on standard HTML, CSS and JavaScript</p>
          </div>
          <div style="background:#1a1a2e;padding:20px;border-radius:8px;width:200px">
            <h3 style="color:#42b883">Performant</h3>
            <p style="color:#888;font-size:13px;margin-top:8px">Truly reactive, compiler-optimized rendering</p>
          </div>
          <div style="background:#1a1a2e;padding:20px;border-radius:8px;width:200px">
            <h3 style="color:#42b883">Versatile</h3>
            <p style="color:#888;font-size:13px;margin-top:8px">Rich, incrementally adoptable ecosystem</p>
          </div>
        </div>
      </div>
    `
  },
  'developer.mozilla.org': {
    title: 'MDN Web Docs',
    content: `
      <h1 style="margin-bottom:16px">MDN Web Docs</h1>
      <p style="color:#aaa;margin-bottom:24px">Resources for developers, by developers.</p>
      <div style="background:#1a1a2e;padding:16px;border-radius:8px;margin-bottom:12px">
        <h3 style="color:#4fc3f7">HTML</h3>
        <p style="color:#888;font-size:13px">The foundation of the web</p>
      </div>
      <div style="background:#1a1a2e;padding:16px;border-radius:8px;margin-bottom:12px">
        <h3 style="color:#4fc3f7">CSS</h3>
        <p style="color:#888;font-size:13px">Styling the web</p>
      </div>
      <div style="background:#1a1a2e;padding:16px;border-radius:8px">
        <h3 style="color:#4fc3f7">JavaScript</h3>
        <p style="color:#888;font-size:13px">Dynamic client-side scripting</p>
      </div>
    `
  },
  'stackoverflow.com': {
    title: 'Stack Overflow',
    content: `
      <h1 style="margin-bottom:16px">Stack Overflow</h1>
      <p style="color:#aaa;margin-bottom:24px">Where developers learn, share, & build careers</p>
      <div style="background:#1a1a2e;padding:12px;border-radius:8px;margin-bottom:8px">
        <span style="color:#f48024">▲ 42</span>
        <span style="color:#4fc3f7;margin-left:12px">How to center a div in CSS?</span>
        <span style="color:#666;margin-left:8px">[css] [html]</span>
      </div>
      <div style="background:#1a1a2e;padding:12px;border-radius:8px;margin-bottom:8px">
        <span style="color:#f48024">▲ 38</span>
        <span style="color:#4fc3f7;margin-left:12px">Vue 3 Composition API vs Options API</span>
        <span style="color:#666;margin-left:8px">[vue.js]</span>
      </div>
      <div style="background:#1a1a2e;padding:12px;border-radius:8px">
        <span style="color:#f48024">▲ 25</span>
        <span style="color:#4fc3f7;margin-left:12px">What is the difference between let and const?</span>
        <span style="color:#666;margin-left:8px">[javascript]</span>
      </div>
    `
  },
}

function goTo(url) {
  if (!url.startsWith('http')) url = 'https://' + url
  urlInput.value = url
  navigate()
}

function navigate() {
  let url = urlInput.value.trim()
  if (!url) return
  if (!url.startsWith('http')) {
    if (url.includes('.')) url = 'https://' + url
    else { search(); return }
  }
  logger.info('Browser', `Navigate to: ${url}`)
  loading.value = true
  const tab = tabs.value[activeTab.value]
  tab.url = url
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const page = simulatedPages[domain]
    tab.title = page ? page.title : domain
  } catch {
    tab.title = url
  }
  browseHistory.value = browseHistory.value.slice(0, historyIdx.value + 1)
  browseHistory.value.push(url)
  historyIdx.value = browseHistory.value.length - 1
  setTimeout(() => { loading.value = false }, 300 + Math.random() * 500)
}

function search() {
  const q = searchQuery.value || urlInput.value
  if (!q) return
  goTo(`https://search.simulated.com/search?q=${encodeURIComponent(q)}`)
  const tab = tabs.value[activeTab.value]
  tab.title = `Search: ${q}`
}

const pageContent = computed(() => {
  const url = currentPage.value
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const page = simulatedPages[domain]
    if (page) return page.content
    if (url.includes('search.simulated.com')) {
      return `
        <h2 style="margin-bottom:16px">Search Results</h2>
        <p style="color:#888;margin-bottom:20px">Showing simulated results</p>
        <div style="margin-bottom:16px">
          <a style="color:#4fc3f7;font-size:16px;cursor:pointer">Result 1 - Simulated Page</a>
          <p style="color:#888;font-size:13px">This is a simulated search result in the macOS browser simulator.</p>
        </div>
        <div style="margin-bottom:16px">
          <a style="color:#4fc3f7;font-size:16px;cursor:pointer">Result 2 - Another Page</a>
          <p style="color:#888;font-size:13px">More simulated content for demonstration purposes.</p>
        </div>
      `
    }
    return `<div style="text-align:center;padding:40px"><h2>${domain}</h2><p style="color:#888;margin-top:12px">Simulated page for ${domain}</p></div>`
  } catch {
    return '<p style="color:#888;padding:20px">Unable to load page</p>'
  }
})

function goBack() {
  if (historyIdx.value > 0) {
    historyIdx.value--
    const url = browseHistory.value[historyIdx.value]
    tabs.value[activeTab.value].url = url
    urlInput.value = url === 'home' ? '' : url
  }
}

function goForward() {
  if (historyIdx.value < browseHistory.value.length - 1) {
    historyIdx.value++
    const url = browseHistory.value[historyIdx.value]
    tabs.value[activeTab.value].url = url
    urlInput.value = url === 'home' ? '' : url
  }
}

function reload() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 500)
}

function newTab() {
  tabs.value.push({ title: 'New Tab', url: 'home' })
  activeTab.value = tabs.value.length - 1
  urlInput.value = ''
  logger.debug('Browser', `New tab opened (total: ${tabs.value.length})`)
}

function switchTab(i) {
  activeTab.value = i
  const url = tabs.value[i].url
  urlInput.value = url === 'home' ? '' : url
  logger.debug('Browser', `Switched to tab ${i}: ${tabs.value[i].title}`)
}

function closeTab(i) {
  if (tabs.value.length <= 1) return
  const title = tabs.value[i].title
  tabs.value.splice(i, 1)
  if (activeTab.value >= tabs.value.length) activeTab.value = tabs.value.length - 1
  logger.debug('Browser', `Closed tab: ${title}`)
}
</script>

<style scoped>
.browser {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #e0e0e0;
}
.browser-tabs {
  display: flex;
  background: #2a2a2a;
  padding: 4px 4px 0;
  gap: 2px;
  overflow-x: auto;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #333;
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  cursor: pointer;
  max-width: 180px;
  min-width: 80px;
  color: #999;
}
.tab.active {
  background: #1e1e1e;
  color: #e0e0e0;
}
.tab-close {
  font-size: 14px;
  opacity: 0.5;
  cursor: pointer;
}
.tab-close:hover { opacity: 1; }
.new-tab {
  min-width: 32px;
  max-width: 32px;
  justify-content: center;
  font-size: 16px;
}
.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #2a2a2a;
}
.nav-buttons {
  display: flex;
  gap: 4px;
}
.nav-buttons button {
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.nav-buttons button:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
.nav-buttons button:disabled { opacity: 0.3; cursor: default; }
.url-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: #1a1a1a;
  border-radius: 6px;
  padding: 4px 10px;
}
.lock-icon { font-size: 12px; margin-right: 6px; }
.url-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 13px;
}
.browser-content {
  flex: 1;
  overflow-y: auto;
}
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}
.home-page h1 {
  font-size: 32px;
  color: #fff;
  margin-bottom: 24px;
}
.search-box {
  width: 100%;
  max-width: 500px;
  margin-bottom: 40px;
}
.search-box input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: #e0e0e0;
  font-size: 15px;
  outline: none;
}
.search-box input:focus { border-color: #4facfe; }
.favorites {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}
.fav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  width: 90px;
}
.fav-item:hover { background: rgba(255,255,255,0.05); }
.fav-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: #2a2a2a;
  border-radius: 12px;
  margin-bottom: 6px;
}
.fav-item span { font-size: 11px; color: #999; }
.web-page {
  padding: 0;
}
.page-header {
  padding: 8px 16px;
  border-bottom: 1px solid #333;
}
.page-domain { font-size: 12px; color: #666; }
.page-body {
  padding: 20px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>
