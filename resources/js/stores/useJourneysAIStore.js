import { create } from 'zustand'

/**
 * Store de UI para o fluxo de geração de Journeys via IA.
 *
 * Foi extraído de Journeys.jsx como piloto do padrão Q4 do plano de
 * auditoria. Mantém toda a máquina de estado do modal de sugestões
 * (carregando → receber lista → selecionar/deselecionar → confirmar
 * batch → remover os confirmados → fechar se vazio).
 *
 * Esse store NÃO toca estado do servidor (o `project` continua vindo
 * via props/Inertia). Ele só guarda o UI scratch pad dessa cerimônia.
 */
export const useJourneysAIStore = create((set, get) => ({
  isGenerating: false,
  generated: [],
  isOpen: false,
  isMinimized: false,

  startGenerating: () =>
    set({ isGenerating: true, isMinimized: false }),

  stopGenerating: () => set({ isGenerating: false }),

  setGenerated: (journeys) =>
    set({
      generated: journeys.map((j) => ({ ...j, selected: true })),
      isOpen: true,
    }),

  toggleSelection: (index) =>
    set((state) => ({
      generated: state.generated.map((j, i) =>
        i === index ? { ...j, selected: !j.selected } : j,
      ),
    })),

  toggleAll: () =>
    set((state) => {
      const allSelected = state.generated.every((j) => j.selected)
      return {
        generated: state.generated.map((j) => ({
          ...j,
          selected: !allSelected,
        })),
      }
    }),

  minimize: () => set({ isMinimized: true }),
  maximize: () => set({ isMinimized: false }),
  toggleMinimized: () =>
    set((state) => ({ isMinimized: !state.isMinimized })),

  /**
   * Remove os items confirmados (selected=true) do scratch pad e fecha
   * o modal se não sobrar nada para revisar.
   */
  markConfirmed: () =>
    set((state) => {
      const remaining = state.generated.filter((j) => !j.selected)
      return {
        generated: remaining,
        isOpen: remaining.length > 0,
        isMinimized: remaining.length > 0 ? state.isMinimized : false,
      }
    }),

  cancel: () =>
    set({ isOpen: false, isMinimized: false, generated: [] }),
}))
