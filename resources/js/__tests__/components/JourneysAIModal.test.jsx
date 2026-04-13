import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useJourneysAIStore } from '@/stores/useJourneysAIStore'
import JourneysAIModal from '@/Pages/projects/project-ceremonies/Inception/components/JourneysAIModal'

/**
 * Testes de comportamento do modal extraído (Q2).
 *
 * Stubs globais dos components auto-importados (Button, Switch, Badge)
 * ficam em resources/js/__tests__/components/uiStubs.js.
 */

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}))
vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}))
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }) => <span data-slot="badge">{children}</span>,
}))

// JourneysAIModal usa `Button`/`Switch`/`Badge` via auto-import global,
// não via imports literais. Vamos injetar no globalThis pra casar com
// o runtime do componente.
import { Button as MockButton } from '@/components/ui/button'
import { Switch as MockSwitch } from '@/components/ui/switch'
import { Badge as MockBadge } from '@/components/ui/badge'
globalThis.Button = MockButton
globalThis.Switch = MockSwitch
globalThis.Badge = MockBadge

const initial = useJourneysAIStore.getState()

beforeEach(() => {
  useJourneysAIStore.setState(initial, true)
})

afterEach(() => {
  useJourneysAIStore.setState(initial, true)
})

const colors = [
  { text: 't', border: 'b', bg: 'bg-orange-500' },
  { text: 't', border: 'b', bg: 'bg-violet-500' },
]

describe('<JourneysAIModal />', () => {
  it('não renderiza nada quando isOpen=false', () => {
    const { container } = render(
      <JourneysAIModal colors={colors} onConfirm={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza o título e a lista após setGenerated', () => {
    useJourneysAIStore.getState().setGenerated([
      {
        title: 'Jornada A',
        steps: [{ description: 'passo 1', is_touchpoint: false }],
      },
      {
        title: 'Jornada B',
        steps: [{ description: 'passo B1', is_touchpoint: true }],
      },
    ])

    render(<JourneysAIModal colors={colors} onConfirm={() => {}} />)

    expect(screen.getByText(/Journeys geradas com IA/)).toBeInTheDocument()
    expect(screen.getByText('Jornada A')).toBeInTheDocument()
    expect(screen.getByText('Jornada B')).toBeInTheDocument()
    expect(screen.getByText(/2 of 2 selected/)).toBeInTheDocument()
  })

  it('clique em "Selecionar Todas"/"Desmarcar Todas" inverte seleção', async () => {
    const user = userEvent.setup()
    useJourneysAIStore
      .getState()
      .setGenerated([{ title: 'A', steps: [] }, { title: 'B', steps: [] }])

    render(<JourneysAIModal colors={colors} onConfirm={() => {}} />)

    // Todos começam selecionados → botão mostra "Desmarcar"
    const toggleAllBtn = screen.getByRole('button', {
      name: /Desmarcar Todas/i,
    })
    await user.click(toggleAllBtn)

    expect(screen.getByText(/0 of 2 selected/)).toBeInTheDocument()
  })

  it('onConfirm é disparado quando o botão "Confirmar e Adicionar" é clicado', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    useJourneysAIStore
      .getState()
      .setGenerated([{ title: 'X', steps: [] }])

    render(<JourneysAIModal colors={colors} onConfirm={onConfirm} />)

    const btn = screen.getByRole('button', { name: /Confirm and Add/i })
    await user.click(btn)

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('cancel fecha o modal', async () => {
    const user = userEvent.setup()
    useJourneysAIStore
      .getState()
      .setGenerated([{ title: 'X', steps: [] }])

    render(<JourneysAIModal colors={colors} onConfirm={() => {}} />)

    const cancelBtns = screen.getAllByRole('button', { name: /cancel/i })
    await user.click(cancelBtns[0])

    expect(useJourneysAIStore.getState().isOpen).toBe(false)
  })
})
