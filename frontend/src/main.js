import { createApp } from 'vue'
import App from './App.vue'
import logger from './utils/logger.js'
import './style.css'

logger.info('System', 'Initializing macOS Simulator...')

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  logger.error('Vue', `Unhandled error: ${err.message}`, {
    info,
    component: instance?.$options?.name || 'anonymous',
    stack: err.stack,
  })
}

app.config.warnHandler = (msg, instance, trace) => {
  logger.warn('Vue', msg, {
    component: instance?.$options?.name || 'anonymous',
    trace,
  })
}

app.mount('#app')
logger.info('System', 'App mounted successfully')
