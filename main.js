import App from './App'
import { createSSRApp } from 'vue'
export function createApp() { return { app: createSSRApp(App) } }
