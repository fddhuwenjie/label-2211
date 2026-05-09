/**
 * Centralized logging system for macOS Simulator.
 *
 * Features:
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Structured log entries with timestamp, level, source, message, and optional data
 * - In-memory log buffer (capped at MAX_LOGS) for runtime inspection
 * - Console output with color-coded levels
 * - Configurable minimum level via setLevel()
 * - Export logs as JSON for debugging
 */

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
const LEVEL_STYLES = {
  DEBUG: 'color:#888',
  INFO:  'color:#4facfe',
  WARN:  'color:#febc2e',
  ERROR: 'color:#ff5f57;font-weight:bold',
}

const MAX_LOGS = 500
const logs = []
let minLevel = LEVELS.DEBUG

function now() {
  return new Date().toISOString()
}

function write(level, source, message, data) {
  if (LEVELS[level] < minLevel) return

  const entry = {
    timestamp: now(),
    level,
    source,
    message,
    ...(data !== undefined && { data }),
  }

  // Keep buffer bounded
  logs.push(entry)
  if (logs.length > MAX_LOGS) logs.shift()

  // Console output
  const prefix = `%c[${entry.timestamp}] [${level}] [${source}]`
  const style = LEVEL_STYLES[level]
  if (data !== undefined) {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
      prefix, style, message, data
    )
  } else {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
      prefix, style, message
    )
  }
}

export const logger = {
  debug: (source, message, data) => write('DEBUG', source, message, data),
  info:  (source, message, data) => write('INFO',  source, message, data),
  warn:  (source, message, data) => write('WARN',  source, message, data),
  error: (source, message, data) => write('ERROR', source, message, data),

  /** Change minimum log level at runtime */
  setLevel(level) {
    if (LEVELS[level] !== undefined) minLevel = LEVELS[level]
  },

  /** Get current minimum level name */
  getLevel() {
    return Object.keys(LEVELS).find(k => LEVELS[k] === minLevel)
  },

  /** Get all buffered log entries */
  getLogs() {
    return [...logs]
  },

  /** Get logs filtered by level */
  getLogsByLevel(level) {
    return logs.filter(e => e.level === level)
  },

  /** Get logs filtered by source */
  getLogsBySource(source) {
    return logs.filter(e => e.source === source)
  },

  /** Clear the log buffer */
  clear() {
    logs.length = 0
  },

  /** Export logs as formatted JSON string */
  export() {
    return JSON.stringify(logs, null, 2)
  },

  /** Get recent N logs as formatted strings (for terminal display) */
  tail(n = 20) {
    const slice = logs.slice(-n)
    return slice.map(e => {
      const ts = e.timestamp.slice(11, 23) // HH:mm:ss.SSS
      const base = `[${ts}] [${e.level.padEnd(5)}] [${e.source}] ${e.message}`
      return e.data !== undefined ? `${base} ${JSON.stringify(e.data)}` : base
    })
  },

  /** Available levels for reference */
  LEVELS,
}

// Expose on window for devtools access
if (typeof window !== 'undefined') {
  window.__MACOS_LOGGER__ = logger
}

export default logger
