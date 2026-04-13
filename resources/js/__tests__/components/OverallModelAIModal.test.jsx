import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useOverallModelAIStore } from '@/stores/useOverallModelAIStore'
import OverallModelAIModal from '@/Pages/projects/project-ceremonies/Modeling/components/OverallModelAIModal'

// Stubs para os componentes auto-importados que o modal usa via globals
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}))
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, disabled }) => (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}))
vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}))

import { Button as MockButton } from '@/components/ui/button'
import { Checkbox as MockCheckbox } from '@/components/ui/checkbox'
import { Separator as MockSeparator } from '@/components/ui/separator'
globalThis.Button = MockButton
globalThis.Checkbox = MockCheckbox
globalThis.Separator = MockSeparator

const initial = useOverallModelAIStore.getState()

beforeEach(() => {
  useOverallModelAIStore.setState(initial, true)
})

const sampleCards = [
  {
    class: 'Filme',
    responsabilities: ['Armazenar dados'],
    collaborators: ['Avaliacao'],
  },
]
const sampleClasses = [{ name: 'Filme' }, { name: 'Avaliacao' }]

describe('<OverallModelAIModal />', () => {
  it('não renderiza quando isOpen=false', () => {
    const { container } = render(<OverallModelAIModal onConfirm={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza listas de cards e classes após setGenerated', () => {
    useOverallModelAIStore
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    render(<OverallModelAIModal onConfirm={() => {}} />)

    expect(screen.getByText(/CRC Cards gerados por IA/)).toBeInTheDocument()
    // "Filme" aparece como título do card e como item de classe
    expect(screen.getAllByText('Filme').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Avaliacao').length).toBeGreaterThan(0)
    expect(screen.getByText('Armazenar dados')).toBeInTheDocument()
  })

  it('onConfirm dispara ao clicar no botão de confirmação', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    useOverallModelAIStore
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    render(<OverallModelAIModal onConfirm={onConfirm} />)

    const btn = screen.getByRole('button', { name: /Confirmar e Adicionar/i })
    await user.click(btn)

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('clicar em cancelar fecha o modal via store', async () => {
    const user = userEvent.setup()

    useOverallModelAIStore
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    render(<OverallModelAIModal onConfirm={() => {}} />)

    const cancelBtn = screen.getAllByRole('button', { name: /Cancelar/i })[0]
    await user.click(cancelBtn)

    expect(useOverallModelAIStore.getState().isOpen).toBe(false)
  })
})
