import { createContext } from 'react'
// 1. Cria o contexto
const PermissionContext = createContext(null)

// 2. Cria o Provider, um componente que vai "segurar" os dados
export function PermissionProvider({ children, permissions }) {
  // A função 'can' será a nossa principal ferramenta
  const can = (permissionName) => {
    if (!permissions || permissions.length === 0) {
      return false
    }
    // Verifica se a permissão existe no array
    return permissions.includes(permissionName)
  }

  return (
    <PermissionContext.Provider value={{ permissions, can }}>
      {children}
    </PermissionContext.Provider>
  )
}

// 3. Cria o hook customizado para facilitar o uso
export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}
