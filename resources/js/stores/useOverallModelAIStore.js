import { create } from 'zustand'

/**
 * Store de UI para o fluxo de geração de CRC Cards + Classes via IA
 * na cerimônia de Modelagem.
 *
 * Diferente do useJourneysAIStore, aqui temos DUAS listas sincronizadas
 * (cards e classes) — uma classe selecionada pelo usuário pode ser
 * "requerida" por um card já selecionado (via `requiredBy`), o que
 * impede desmarcá-la.
 *
 * `syncClassSelections` replicado aqui como helper puro para que o
 * store seja autocontido.
 */
const syncClassSelections = (cards, classes) => {
  const newClasses = classes.map((c) => ({ ...c, requiredBy: new Set() }))
  cards
    .filter((card) => card.selected)
    .forEach((card) => {
      const requiredClassNames = [card.class, ...card.collaborators]
      newClasses.forEach((classItem) => {
        if (requiredClassNames.includes(classItem.name)) {
          classItem.requiredBy.add(card.tempId)
        }
      })
    })
  newClasses.forEach((classItem) => {
    if (classItem.requiredBy.size > 0) {
      classItem.selected = true
    }
  })
  return newClasses
}

export const useOverallModelAIStore = create((set, get) => ({
  isGenerating: false,
  cards: [],
  classes: [],
  isOpen: false,
  isMinimized: false,

  startGenerating: () => set({ isGenerating: true, isMinimized: false }),
  stopGenerating: () => set({ isGenerating: false }),

  setGenerated: ({ cards, classes }) => {
    const cardsWithSelection = cards.map((card, index) => ({
      ...card,
      tempId: `card-${index}`,
      selected: true,
    }))
    const classesWithSelection = classes.map((c) => ({
      ...c,
      selected: true,
      requiredBy: new Set(),
    }))
    const syncedClasses = syncClassSelections(
      cardsWithSelection,
      classesWithSelection,
    )
    set({
      cards: cardsWithSelection,
      classes: syncedClasses,
      isOpen: true,
    })
  },

  toggleCardSelection: (index) => {
    const state = get()
    const updatedCards = state.cards.map((card, i) =>
      i === index ? { ...card, selected: !card.selected } : card,
    )
    const updatedClasses = syncClassSelections(updatedCards, state.classes)
    set({ cards: updatedCards, classes: updatedClasses })
  },

  toggleClassSelection: (index) => {
    const state = get()
    const target = state.classes[index]
    if (target.requiredBy && target.requiredBy.size > 0) {
      return {
        blocked: true,
        className: target.name,
      }
    }
    set({
      classes: state.classes.map((c, i) =>
        i === index ? { ...c, selected: !c.selected } : c,
      ),
    })
    return { blocked: false }
  },

  toggleAllCards: () =>
    set((state) => {
      const allSelected = state.cards.every((c) => c.selected)
      const updatedCards = state.cards.map((c) => ({
        ...c,
        selected: !allSelected,
      }))
      return {
        cards: updatedCards,
        classes: syncClassSelections(updatedCards, state.classes),
      }
    }),

  toggleAllClasses: () =>
    set((state) => {
      const allSelected = state.classes.every((c) => c.selected)
      return {
        classes: state.classes.map((c) => ({
          ...c,
          selected: !allSelected,
        })),
      }
    }),

  toggleMinimized: () =>
    set((state) => ({ isMinimized: !state.isMinimized })),

  cancel: () =>
    set({
      isOpen: false,
      isMinimized: false,
      cards: [],
      classes: [],
    }),
}))
