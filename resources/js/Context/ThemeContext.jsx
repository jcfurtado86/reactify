import { createContext, useContext, useEffect, useState } from 'react'
const ThemeContext = createContext()

export function ThemeProvider({
  children,
  defaultTheme = 'zinc',
  storageKey = 'vite-ui-theme',
}) {
  // Estado para a cor do tema (zinc, blue, green...)
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem(storageKey) || defaultTheme
  })

  // Efeito para aplicar a classe no body
  useEffect(() => {
    const root = window.document.documentElement // ou document.documentElement

    if (themeColor !== 'zinc') {
      root.setAttribute('data-theme', themeColor)
    } else {
      root.removeAttribute('data-theme') // Zinc é o padrão (sem atributo)
    }

    localStorage.setItem(storageKey, themeColor)
  }, [themeColor, storageKey])

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
