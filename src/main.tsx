import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import './index.css'
import { App } from './App'

i18n
  .use(initReactI18next)
  .init({
    lng: 'zh-TW',
    fallbackLng: 'zh-TW',
    resources: {},
    interpolation: { escapeValue: false },
  })

async function loadLocales() {
  const [zhTW, ja] = await Promise.all([
    fetch('./locales/zh-TW.json').then((r) => r.json()),
    fetch('./locales/ja.json').then((r) => r.json()),
  ])
  i18n.addResourceBundle('zh-TW', 'translation', zhTW, true, true)
  i18n.addResourceBundle('ja', 'translation', ja, true, true)
}

// Render the app even if the locale fetch fails (e.g. flaky network) —
// a UI with raw keys beats a permanently blank screen.
loadLocales()
  .catch((err) => console.warn('Failed to load locale bundles:', err))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
