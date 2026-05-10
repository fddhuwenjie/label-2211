<template>
  <div class="terminal" @click="focusInput">
    <div class="terminal-output" ref="outputEl">
      <div v-for="(line, i) in lines" :key="i" v-html="line"></div>
      <div class="input-line">
        <span class="prompt">{{ prompt }}</span>
        <input
          ref="inputEl"
          v-model="currentInput"
          @keydown.enter="execute"
          @keydown.up.prevent="historyUp"
          @keydown.down.prevent="historyDown"
          @keydown.tab.prevent="tabComplete"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import logger from '../../utils/logger.js'

const props = defineProps({ winId: Number })

const lines = ref([
  '<span style="color:#28c840">Welcome to macOS Terminal</span>',
  'Type <span style="color:#febc2e">help</span> for available commands.',
  '',
])
const currentInput = ref('')
const inputEl = ref(null)
const outputEl = ref(null)
const history = ref([])
const historyIdx = ref(-1)
const currentDir = ref('~')
const user = 'guest'
const hostname = 'macbook'

const prompt = ref('')
updatePrompt()

function updatePrompt() {
  prompt.value = `${user}@${hostname} ${currentDir.value} $ `
}

// Simple virtual filesystem
const fs = ref({
  '~': {
    type: 'dir',
    children: {
      'Documents': {
        type: 'dir',
        children: {
          'readme.txt': { type: 'file', content: 'Welcome to macOS Simulator!\nBuilt with Vue.js' },
          'notes.md': { type: 'file', content: '# My Notes\n- Learn Vue\n- Build cool stuff' },
        }
      },
      'Desktop': { type: 'dir', children: {} },
      'Downloads': {
        type: 'dir',
        children: {
          'example.json': { type: 'file', content: '{\n  "name": "macOS Sim",\n  "version": "1.0"\n}' },
        }
      },
      '.bashrc': { type: 'file', content: 'export PATH=$PATH:/usr/local/bin\nalias ll="ls -la"' },
    }
  }
})

function resolvePath(path) {
  let parts
  if (path.startsWith('~') || path.startsWith('/')) {
    parts = path.replace(/^~?\/?/, '').split('/').filter(Boolean)
  } else {
    const base = currentDir.value.replace(/^~?\/?/, '').split('/').filter(Boolean)
    parts = [...base, ...path.split('/').filter(Boolean)]
  }
  // Handle .. and .
  const resolved = []
  for (const p of parts) {
    if (p === '..') resolved.pop()
    else if (p !== '.') resolved.push(p)
  }
  return resolved
}

function getNode(pathParts) {
  let node = fs.value['~']
  for (const part of pathParts) {
    if (!node || node.type !== 'dir' || !node.children[part]) return null
    node = node.children[part]
  }
  return node
}

function getParentAndName(pathParts) {
  if (pathParts.length === 0) return { parent: null, name: null }
  const parentParts = pathParts.slice(0, -1)
  const name = pathParts[pathParts.length - 1]
  const parent = getNode(parentParts)
  return { parent, name }
}

let pipeInput = null

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '')
}

function runCommand(name, args) {
  const input = pipeInput
  pipeInput = null
  if (!commands[name]) return [`zsh: command not found: ${name}`]
  try {
    const savedPipeInput = input
    pipeInput = savedPipeInput
    const output = commands[name](args)
    return output
  } catch (err) {
    logger.error('Terminal', `Command "${name}" threw an error`, { error: err.message, stack: err.stack })
    return [`<span style="color:#ff5f57">Error: ${escapeHtml(err.message)}</span>`]
  }
}

const pipeAwareCommands = new Set(['grep', 'wc', 'head', 'tail', 'sort'])

const commands = {
  help: () => [
    'Available commands:',
    '  ls [path]        - List directory contents',
    '  cd <path>        - Change directory',
    '  pwd              - Print working directory',
    '  cat <file>       - Display file contents',
    '  echo <text>      - Print text',
    '  mkdir <name>     - Create directory',
    '  touch <name>     - Create empty file',
    '  rm <name>        - Remove file or directory',
    '  clear            - Clear terminal',
    '  date             - Show current date',
    '  whoami           - Show current user',
    '  hostname         - Show hostname',
    '  uname            - System information',
    '  uptime           - System uptime',
    '  history          - Command history',
    '  neofetch         - System info display',
    '  logs [options]   - View system logs (--help for options)',
    '  grep <pattern> [-i]  - Filter lines matching pattern (-i: ignore case)',
    '  wc               - Count lines/words/chars',
    '  head [-n <N>]    - Show first N lines (default 10)',
    '  tail [-n <N>]    - Show last N lines (default 10)',
    '  sort [-r]        - Sort lines (-r: reverse)',
    '  help             - Show this help',
    '',
    'Pipeline: cmd1 | cmd2 | cmd3',
    'Redirect: cmd > file (overwrite), cmd >> file (append)',
  ],
  ls: (args) => {
    const target = args[0] || currentDir.value
    const parts = resolvePath(target)
    const node = parts.length === 0 ? fs.value['~'] : getNode(parts)
    if (!node) return [`ls: ${target}: No such file or directory`]
    if (node.type === 'file') return [target]
    return Object.entries(node.children).map(([name, n]) =>
      n.type === 'dir'
        ? `<span style="color:#4facfe">${name}/</span>`
        : name
    )
  },
  cd: (args) => {
    const target = args[0] || '~'
    if (target === '~') { currentDir.value = '~'; updatePrompt(); return [] }
    const parts = resolvePath(target)
    const node = parts.length === 0 ? fs.value['~'] : getNode(parts)
    if (!node || node.type !== 'dir') return [`cd: ${target}: Not a directory`]
    currentDir.value = '~' + (parts.length ? '/' + parts.join('/') : '')
    updatePrompt()
    return []
  },
  pwd: () => [currentDir.value.replace('~', '/Users/' + user)],
  cat: (args) => {
    if (!args[0]) return ['cat: missing operand']
    const parts = resolvePath(args[0])
    const node = getNode(parts)
    if (!node) return [`cat: ${args[0]}: No such file or directory`]
    if (node.type === 'dir') return [`cat: ${args[0]}: Is a directory`]
    return node.content.split('\n')
  },
  echo: (args) => [args.join(' ')],
  mkdir: (args) => {
    if (!args[0]) return ['mkdir: missing operand']
    const parts = resolvePath(args[0])
    const { parent, name } = getParentAndName(parts)
    const p = parts.length <= 1 ? (resolvePath(currentDir.value).length === 0 ? fs.value['~'] : getNode(resolvePath(currentDir.value))) : parent
    if (!p || p.type !== 'dir') return [`mkdir: cannot create directory '${args[0]}'`]
    if (p.children[name]) return [`mkdir: ${args[0]}: File exists`]
    p.children[name] = { type: 'dir', children: {} }
    return []
  },
  touch: (args) => {
    if (!args[0]) return ['touch: missing operand']
    const parts = resolvePath(args[0])
    const { parent, name } = getParentAndName(parts)
    const p = parts.length <= 1 ? (resolvePath(currentDir.value).length === 0 ? fs.value['~'] : getNode(resolvePath(currentDir.value))) : parent
    if (!p || p.type !== 'dir') return [`touch: cannot create '${args[0]}'`]
    if (!p.children[name]) p.children[name] = { type: 'file', content: '' }
    return []
  },
  rm: (args) => {
    if (!args[0]) return ['rm: missing operand']
    const target = args.filter(a => !a.startsWith('-'))[0]
    if (!target) return ['rm: missing operand']
    const parts = resolvePath(target)
    const { parent, name } = getParentAndName(parts)
    const p = parts.length <= 1 ? (resolvePath(currentDir.value).length === 0 ? fs.value['~'] : getNode(resolvePath(currentDir.value))) : parent
    if (!p || !p.children || !p.children[name]) return [`rm: ${target}: No such file or directory`]
    delete p.children[name]
    return []
  },
  clear: () => { lines.value = []; return [] },
  date: () => [new Date().toString()],
  whoami: () => [user],
  hostname: () => [hostname],
  uname: () => ['Darwin macbook 23.0.0 macOS Simulator x86_64'],
  uptime: () => {
    const h = Math.floor(Math.random() * 24)
    const m = Math.floor(Math.random() * 60)
    return [`up ${h}:${String(m).padStart(2, '0')}, 1 user, load averages: 1.23 1.45 1.67`]
  },
  history: () => history.value.map((cmd, i) => `  ${i + 1}  ${cmd}`),
  logs: (args) => {
    const flag = args[0]
    if (flag === '--clear') { logger.clear(); return ['Logs cleared.'] }
    if (flag === '--level') {
      const lvl = (args[1] || '').toUpperCase()
      if (logger.LEVELS[lvl] !== undefined) { logger.setLevel(lvl); return [`Log level set to ${lvl}`] }
      return [`Current level: ${logger.getLevel()}`, 'Usage: logs --level <DEBUG|INFO|WARN|ERROR>']
    }
    if (flag === '--export') {
      const json = logger.export()
      return json.split('\n')
    }
    if (flag === '--error') return logger.getLogsByLevel('ERROR').length
      ? logger.tail(50).filter(l => l.includes('[ERROR]'))
      : ['No errors recorded.']
    if (flag === '--warn') return logger.getLogsByLevel('WARN').length
      ? logger.tail(50).filter(l => l.includes('[WARN ]'))
      : ['No warnings recorded.']
    if (flag === '--help') return [
      'Usage: logs [options]',
      '  (no args)     Show recent 20 log entries',
      '  -n <count>    Show recent N entries',
      '  --error       Show only errors',
      '  --warn        Show only warnings',
      '  --level [LVL] Get/set log level (DEBUG|INFO|WARN|ERROR)',
      '  --clear       Clear log buffer',
      '  --export      Export all logs as JSON',
      '  --help        Show this help',
    ]
    const n = flag === '-n' ? parseInt(args[1]) || 20 : 20
    const entries = logger.tail(n)
    if (entries.length === 0) return ['No log entries.']
    return entries.map(line => {
      if (line.includes('[ERROR]')) return `<span style="color:#ff5f57">${escapeHtml(line)}</span>`
      if (line.includes('[WARN ]')) return `<span style="color:#febc2e">${escapeHtml(line)}</span>`
      if (line.includes('[INFO ]')) return `<span style="color:#4facfe">${escapeHtml(line)}</span>`
      return `<span style="color:#888">${escapeHtml(line)}</span>`
    })
  },
  neofetch: () => [
    '<span style="color:#28c840">                  \'c.          </span>  <span style="color:#4facfe">guest@macbook</span>',
    '<span style="color:#28c840">                 ,xNMM.        </span>  -----------',
    '<span style="color:#28c840">               .OMMMMo         </span>  OS: macOS Simulator',
    '<span style="color:#28c840">               OMMM0,          </span>  Host: Vue.js Browser',
    '<span style="color:#28c840">     .;loddo:\' loolloddol;.   </span>  Kernel: Vite 6.x',
    '<span style="color:#28c840">   cKMMMMMMMMMMNWMMMMMMMMMM0:  </span>  Shell: web-terminal',
    '<span style="color:#28c840"> .KMMMMMMMMMMMMMMMMMMMMMMMWd.  </span>  Resolution: ' + window.innerWidth + 'x' + window.innerHeight,
    '<span style="color:#28c840"> XMMMMMMMMMMMMMMMMMMMMMMMX.   </span>  Terminal: TerminalApp.vue',
    '<span style="color:#28c840">  ;MMMMMMMMMMMMMMMMMMMMMMMM.  </span>  CPU: JavaScript V8',
    '<span style="color:#28c840">    :MMMMMMMMMMMMMMMMMMMMMMMM: </span>  Memory: ∞ MB',
  ],
  grep: (args) => {
    let ignoreCase = false
    const filteredArgs = []
    for (const a of args) {
      if (a === '-i') ignoreCase = true
      else filteredArgs.push(a)
    }
    const pattern = filteredArgs[0]
    if (!pattern) return ['grep: missing pattern']
    const inputLines = pipeInput
    pipeInput = null
    if (inputLines === null) return ['grep: no input (use with pipe or provide file)']
    const plainLines = inputLines.map(stripHtml)
    const flags = ignoreCase ? 'i' : ''
    try {
      const regex = new RegExp(pattern, flags)
      const result = []
      for (let i = 0; i < plainLines.length; i++) {
        if (regex.test(plainLines[i])) {
          result.push(inputLines[i])
        }
      }
      return result.length > 0 ? result : []
    } catch (e) {
      return [`grep: invalid pattern: ${pattern}`]
    }
  },
  wc: (args) => {
    const inputLines = pipeInput
    pipeInput = null
    if (inputLines === null) return ['wc: no input (use with pipe)']
    const text = inputLines.map(stripHtml).join('\n')
    const lineCount = inputLines.length
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const charCount = text.length
    return [`  ${lineCount}\t${wordCount}\t${charCount}`]
  },
  head: (args) => {
    let n = 10
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) {
        n = parseInt(args[i + 1]) || 10
        i++
      }
    }
    const inputLines = pipeInput
    pipeInput = null
    if (inputLines === null) return ['head: no input (use with pipe)']
    return inputLines.slice(0, n)
  },
  tail: (args) => {
    let n = 10
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) {
        n = parseInt(args[i + 1]) || 10
        i++
      }
    }
    const inputLines = pipeInput
    pipeInput = null
    if (inputLines === null) return ['tail: no input (use with pipe)']
    return inputLines.slice(-n)
  },
  sort: (args) => {
    const reverse = args.includes('-r')
    const inputLines = pipeInput
    pipeInput = null
    if (inputLines === null) return ['sort: no input (use with pipe)']
    const sorted = [...inputLines].sort((a, b) => {
      const sa = stripHtml(a)
      const sb = stripHtml(b)
      return sa.localeCompare(sb)
    })
    if (reverse) sorted.reverse()
    return sorted
  },
}

function execute() {
  const cmd = currentInput.value.trim()
  lines.value.push(`<span class="prompt-display">${prompt.value}</span>${escapeHtml(cmd)}`)
  if (!cmd) {
    currentInput.value = ''
    nextTick(() => {
      if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
    })
    return
  }
  history.value.push(cmd)
  historyIdx.value = history.value.length
  logger.debug('Terminal', `Execute: ${cmd}`)

  let redirectFile = null
  let redirectAppend = false
  let processedCmd = cmd

  const redirectMatch = processedCmd.match(/^(.+?)\s*(>>|>)\s*(\S+)\s*$/)
  if (redirectMatch) {
    processedCmd = redirectMatch[1].trim()
    redirectAppend = redirectMatch[2] === '>>'
    redirectFile = redirectMatch[3]
  }

  const pipeSegments = []
  let current = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  for (let i = 0; i < processedCmd.length; i++) {
    const ch = processedCmd[i]
    if (ch === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += ch; continue }
    if (ch === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += ch; continue }
    if (ch === '|' && !inSingleQuote && !inDoubleQuote) {
      pipeSegments.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) pipeSegments.push(current.trim())

  if (pipeSegments.length === 0) {
    currentInput.value = ''
    nextTick(() => {
      if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
    })
    return
  }

  let output = []
  pipeInput = null

  for (let si = 0; si < pipeSegments.length; si++) {
    const segment = pipeSegments[si]
    const tokens = segment.split(/\s+/)
    const name = tokens[0]
    const args = tokens.slice(1)

    if (si > 0) {
      pipeInput = output
    }

    if (pipeAwareCommands.has(name)) {
      const result = runCommand(name, args)
      output = result
    } else if (commands[name]) {
      if (pipeInput !== null) {
        output = []
      }
      const result = runCommand(name, args)
      output = result
    } else {
      logger.warn('Terminal', `Unknown command: ${name}`)
      output = [`zsh: command not found: ${name}`]
    }
  }

  if (redirectFile) {
    const parts = resolvePath(redirectFile)
    const { parent, name: fileName } = getParentAndName(parts)
    const dirNode = parts.length <= 1
      ? (resolvePath(currentDir.value).length === 0 ? fs.value['~'] : getNode(resolvePath(currentDir.value)))
      : parent
    if (!dirNode || dirNode.type !== 'dir') {
      lines.value.push(`<span style="color:#ff5f57">${redirectFile}: No such directory</span>`)
    } else {
      const content = output.map(stripHtml).join('\n')
      if (redirectAppend && dirNode.children[fileName] && dirNode.children[fileName].type === 'file') {
        dirNode.children[fileName].content += '\n' + content
      } else {
        dirNode.children[fileName] = { type: 'file', content }
      }
      output = []
    }
  }

  lines.value.push(...output)
  currentInput.value = ''
  nextTick(() => {
    if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
  })
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function historyUp() {
  if (historyIdx.value > 0) {
    historyIdx.value--
    currentInput.value = history.value[historyIdx.value]
  }
}

function historyDown() {
  if (historyIdx.value < history.value.length - 1) {
    historyIdx.value++
    currentInput.value = history.value[historyIdx.value]
  } else {
    historyIdx.value = history.value.length
    currentInput.value = ''
  }
}

function tabComplete() {
  const input = currentInput.value
  const parts = input.split(/\s+/)
  if (parts.length <= 1) {
    const prefix = parts[0]
    const matches = Object.keys(commands).filter(c => c.startsWith(prefix))
    if (matches.length === 1) currentInput.value = matches[0] + ' '
  }
}

function focusInput() {
  nextTick(() => inputEl.value?.focus())
}

onMounted(focusInput)
</script>

<style scoped>
.terminal {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  color: #f0f0f0;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  padding: 8px;
  overflow: hidden;
  cursor: text;
}
.terminal-output {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.prompt {
  color: #28c840;
  white-space: pre;
}
:deep(.prompt-display) {
  color: #28c840;
  white-space: pre;
}
.input-line {
  display: flex;
  align-items: center;
}
.input-line input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f0f0f0;
  font-family: inherit;
  font-size: inherit;
  caret-color: #28c840;
}
</style>
