import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { applyAppearance, loadAppearance } from './lib/appearance'

// Applied before the first render so a chosen theme never flashes the system one.
applyAppearance(loadAppearance())

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
