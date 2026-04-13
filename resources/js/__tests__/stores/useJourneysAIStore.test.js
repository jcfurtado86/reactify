import { beforeEach, describe, expect, it } from 'vitest'
import { useJourneysAIStore } from '@/stores/useJourneysAIStore'

/**
 * Caracterização do store de UI da geração de Journeys via IA.
 *
 * Cobre o que o código de Journeys.jsx antes da refatoração fazia
 * inline via `setGeneratedJourneys`, `setShowConfirmModal`,
 * `setIsModalMinimized` e as funções `toggleJourneySelection`,
 * `toggleAllJourneys`, `confirmGeneratedJourneys` (parcial — só o
 * bit de remover os confirmados do scratch pad).
 */

const initialState = useJourneysAIStore.getState()

beforeEach(() => {
  useJourneysAIStore.setState(initialState, true)
})

describe('useJourneysAIStore', () => {
  it('começa fechado e vazio', () => {
    const state = useJourneysAIStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.isMinimized).toBe(false)
    expect(state.isGenerating).toBe(false)
    expect(state.generated).toEqual([])
  })

  it('startGenerating seta flag e reabre maximizado', () => {
    useJourneysAIStore.setState({ isMinimized: true })
    useJourneysAIStore.getState().startGenerating()
    const s = useJourneysAIStore.getState()
    expect(s.isGenerating).toBe(true)
    expect(s.isMinimized).toBe(false)
  })

  it('stopGenerating limpa a flag', () => {
    useJourneysAIStore.getState().startGenerating()
    useJourneysAIStore.getState().stopGenerating()
    expect(useJourneysAIStore.getState().isGenerating).toBe(false)
  })

  it('setGenerated marca todos como selected=true e abre o modal', () => {
    useJourneysAIStore.getState().setGenerated([
      { title: 'J1', steps: [] },
      { title: 'J2', steps: [] },
    ])

    const s = useJourneysAIStore.getState()
    expect(s.isOpen).toBe(true)
    expect(s.generated).toHaveLength(2)
    expect(s.generated.every((j) => j.selected)).toBe(true)
  })

  it('toggleSelection alterna só o item do índice', () => {
    useJourneysAIStore.getState().setGenerated([
      { title: 'J1' },
      { title: 'J2' },
    ])
    useJourneysAIStore.getState().toggleSelection(1)

    const [a, b] = useJourneysAIStore.getState().generated
    expect(a.selected).toBe(true)
    expect(b.selected).toBe(false)
  })

  it('toggleAll desmarca todos se todos selecionados, senão marca todos', () => {
    const store = useJourneysAIStore
    store.getState().setGenerated([{ title: 'A' }, { title: 'B' }])
    // estado inicial: todos selected
    store.getState().toggleAll()
    expect(store.getState().generated.every((j) => !j.selected)).toBe(true)
    store.getState().toggleAll()
    expect(store.getState().generated.every((j) => j.selected)).toBe(true)
  })

  it('toggleMinimized alterna entre min e max', () => {
    const store = useJourneysAIStore
    store.getState().setGenerated([{ title: 'X' }])
    expect(store.getState().isMinimized).toBe(false)
    store.getState().toggleMinimized()
    expect(store.getState().isMinimized).toBe(true)
    store.getState().toggleMinimized()
    expect(store.getState().isMinimized).toBe(false)
  })

  it('markConfirmed remove os selected e mantém os desmarcados', () => {
    const store = useJourneysAIStore
    store.getState().setGenerated([
      { title: 'A' },
      { title: 'B' },
      { title: 'C' },
    ])
    // desmarca o segundo
    store.getState().toggleSelection(1)
    store.getState().markConfirmed()

    const s = store.getState()
    expect(s.generated).toHaveLength(1)
    expect(s.generated[0].title).toBe('B')
    expect(s.isOpen).toBe(true) // ainda tem restante
  })

  it('markConfirmed fecha o modal quando todos os confirmados saem', () => {
    const store = useJourneysAIStore
    store.getState().setGenerated([{ title: 'única' }])
    store.getState().markConfirmed()

    const s = store.getState()
    expect(s.generated).toHaveLength(0)
    expect(s.isOpen).toBe(false)
    expect(s.isMinimized).toBe(false)
  })

  it('cancel limpa tudo', () => {
    const store = useJourneysAIStore
    store.getState().setGenerated([{ title: 'X' }])
    store.getState().minimize()
    store.getState().cancel()

    const s = store.getState()
    expect(s.isOpen).toBe(false)
    expect(s.isMinimized).toBe(false)
    expect(s.generated).toEqual([])
  })
})
