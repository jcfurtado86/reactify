import { beforeEach, describe, expect, it } from 'vitest'
import { useOverallModelAIStore } from '@/stores/useOverallModelAIStore'

/**
 * Caracteriza o store de UI de geração de CRC Cards + Classes.
 * Cobre a lógica de `syncClassSelections` (herdada do código pre-refactor
 * que ficava inline em OverallModel.jsx).
 */

const initialState = useOverallModelAIStore.getState()

beforeEach(() => {
  useOverallModelAIStore.setState(initialState, true)
})

const sampleCards = [
  { class: 'Filme', collaborators: ['Avaliacao'], responsabilities: [] },
  { class: 'Usuario', collaborators: ['Playlist'], responsabilities: [] },
]
const sampleClasses = [
  { name: 'Filme' },
  { name: 'Avaliacao' },
  { name: 'Usuario' },
  { name: 'Playlist' },
]

describe('useOverallModelAIStore', () => {
  it('inicial: fechado, vazio, não minimizado', () => {
    const s = useOverallModelAIStore.getState()
    expect(s.isOpen).toBe(false)
    expect(s.cards).toEqual([])
    expect(s.classes).toEqual([])
  })

  it('setGenerated marca cards com tempId e selected=true', () => {
    useOverallModelAIStore
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    const s = useOverallModelAIStore.getState()
    expect(s.isOpen).toBe(true)
    expect(s.cards).toHaveLength(2)
    expect(s.cards[0].tempId).toBe('card-0')
    expect(s.cards[1].tempId).toBe('card-1')
    expect(s.cards.every((c) => c.selected)).toBe(true)
  })

  it('setGenerated sincroniza requiredBy dos classes', () => {
    useOverallModelAIStore
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    const { classes } = useOverallModelAIStore.getState()
    // Todas as 4 classes estão referenciadas por algum card selecionado
    // (Filme+Usuario como classe do card, Avaliacao+Playlist como collaborator)
    for (const c of classes) {
      expect(c.requiredBy).toBeInstanceOf(Set)
      expect(c.requiredBy.size).toBeGreaterThan(0)
      expect(c.selected).toBe(true)
    }
  })

  it('toggleCardSelection recalcula requiredBy das classes', () => {
    useOverallModelAIStore
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    // desmarca o card "Filme" (índice 0)
    useOverallModelAIStore.getState().toggleCardSelection(0)

    const { cards, classes } = useOverallModelAIStore.getState()
    expect(cards[0].selected).toBe(false)

    // "Avaliacao" só era requerida pelo card Filme → agora não tem mais
    const avaliacao = classes.find((c) => c.name === 'Avaliacao')
    expect(avaliacao.requiredBy.size).toBe(0)
  })

  it('toggleClassSelection bloqueia classe que ainda é required', () => {
    const store = useOverallModelAIStore
    store.getState().setGenerated({
      cards: sampleCards,
      classes: sampleClasses,
    })

    // Playlist é colaboradora de Usuario (ainda selecionado)
    const playlistIndex = store
      .getState()
      .classes.findIndex((c) => c.name === 'Playlist')

    const result = store.getState().toggleClassSelection(playlistIndex)

    expect(result.blocked).toBe(true)
    expect(result.className).toBe('Playlist')
    // Estado não mudou
    expect(store.getState().classes[playlistIndex].selected).toBe(true)
  })

  it('toggleClassSelection permite quando a classe não é required', () => {
    const store = useOverallModelAIStore
    store.getState().setGenerated({
      cards: sampleCards,
      classes: [...sampleClasses, { name: 'Livre' }],
    })

    const livreIndex = store
      .getState()
      .classes.findIndex((c) => c.name === 'Livre')

    const result = store.getState().toggleClassSelection(livreIndex)

    expect(result?.blocked).toBeFalsy()
    expect(store.getState().classes[livreIndex].selected).toBe(false)
  })

  it('toggleAllCards inverte a seleção em lote e ressincroniza classes', () => {
    const store = useOverallModelAIStore
    store
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })

    store.getState().toggleAllCards()
    expect(store.getState().cards.every((c) => !c.selected)).toBe(true)
    // Nenhuma classe tem requiredBy populado agora
    for (const c of store.getState().classes) {
      expect(c.requiredBy.size).toBe(0)
    }
  })

  it('cancel limpa tudo', () => {
    const store = useOverallModelAIStore
    store
      .getState()
      .setGenerated({ cards: sampleCards, classes: sampleClasses })
    store.getState().cancel()

    const s = store.getState()
    expect(s.isOpen).toBe(false)
    expect(s.cards).toEqual([])
    expect(s.classes).toEqual([])
  })
})
