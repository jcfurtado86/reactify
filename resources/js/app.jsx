// import '@excalidraw/excalidraw/index.css'
import '../css/app.css'
import React from 'react'
import './bootstrap'
import './i18n' // inicializa i18next antes de qualquer render
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { configureEcho } from '@laravel/echo-react'
import { Toaster } from '@/components/ui/sonner'
configureEcho({
  broadcaster: 'reverb',
})

createInertiaApp({
  title: (title) => `${title}`,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.jsx`,
      import.meta.glob('./Pages/**/*.jsx'),
    ),
  eager: true,
  setup({ el, App, props }) {
    const root = createRoot(el)
    // 1. Create a function that renders our app with a given theme
    const renderAppWithTheme = (currentTheme) => {
      root.render(
        <>
          <Toaster
            theme={currentTheme} // <-- The theme is now a dynamic variable
            expand
            className="toaster"
            richColors={true}
            position="bottom-center"
            duration={3000}
          />
          <App {...props} />
        </>,
      )
    }

    // 2. Determine the initial theme from the <html> tag and render for the first time
    const initialTheme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
    renderAppWithTheme(initialTheme)

    // 3. Set up an observer to watch for class changes on the <html> element
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light'
      // 4. When the class changes, re-render the app with the new theme
      renderAppWithTheme(newTheme)
    })

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  },
  progress: {
    color: '#755ce4',
  },
})
