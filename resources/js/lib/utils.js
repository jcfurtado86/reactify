import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
export const PREDEFINED_COLORS = [
  {
    name: 'Padrão',
    color: '#78716c',
    muted_color: darkenColor('#78716c', 0.8), // #605a56
    dimmed_color: darkenColor('#78716c', 0.6), // #484440
  },
  {
    name: 'Cinza',
    color: '#a3a3a3',
    muted_color: darkenColor('#a3a3a3', 0.8), // #828282
    dimmed_color: darkenColor('#a3a3a3', 0.6), // #626262
  },
  {
    name: 'Marrom',
    color: '#5B4533',
    muted_color: darkenColor('#78716c', 0.8), // #605a56
    dimmed_color: darkenColor('#78716c', 0.6), // #484440
  },
  {
    name: 'Laranja',
    color: '#f97316',
    muted_color: darkenColor('#f97316', 0.8), // #c75c12
    dimmed_color: darkenColor('#f97316', 0.6), // #95450d
  },
  {
    name: 'Amarelo',
    color: '#eab308',
    muted_color: darkenColor('#eab308', 0.8), // #bb8f06
    dimmed_color: darkenColor('#eab308', 0.6), // #8d6b05
  },
  {
    name: 'Verde',
    color: '#22c55e',
    muted_color: darkenColor('#22c55e', 0.8), // #1b9e4b
    dimmed_color: darkenColor('#22c55e', 0.6), // #147638
  },
  {
    name: 'Azul',
    color: '#3b82f6',
    muted_color: darkenColor('#3b82f6', 0.8), // #2f68c5
    dimmed_color: darkenColor('#3b82f6', 0.6), // #234e94
  },
  {
    name: 'Roxo',
    color: '#8b5cf6',
    muted_color: darkenColor('#8b5cf6', 0.8), // #6f49c5
    dimmed_color: darkenColor('#8b5cf6', 0.6), // #533794
  },
  {
    name: 'Rosa',
    color: '#ec4899',
    muted_color: darkenColor('#ec4899', 0.8), // #bd3a7a
    dimmed_color: darkenColor('#ec4899', 0.6), // #8d2b5b
  },
  {
    name: 'Vermelho',
    color: '#ef4444',
    muted_color: darkenColor('#ef4444', 0.8), // #bf3636
    dimmed_color: darkenColor('#ef4444', 0.6), // #8f2929
  },
]
export function darkenColor(hexColor, factor) {
  // Remove o '#' se presente
  let hex = hexColor.replace('#', '')

  // Converte R, G, B para valores decimais
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Aplica o fator de escurecimento e arredonda
  const newR = Math.round(r * factor)
  const newG = Math.round(g * factor)
  const newB = Math.round(b * factor)

  // Converte de volta para hexadecimal e garante 2 dígitos
  const toHex = (c) => ('0' + c.toString(16)).slice(-2)

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

export function isTemporary(id) {
  return String(id).startsWith('temp-')
}
