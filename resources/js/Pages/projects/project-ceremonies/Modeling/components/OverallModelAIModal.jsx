import { Check, ChevronsUp, Minus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useOverallModelAIStore } from '@/stores/useOverallModelAIStore'

/**
 * Modal de revisão dos CRC Cards + Classes gerados por IA.
 *
 * Consome o `useOverallModelAIStore` diretamente. O componente pai
 * (`OverallModel.jsx`) só precisa passar `onConfirm`, que é a função
 * que persiste as seleções no backend.
 */
export const OverallModelAIModal = ({ onConfirm }) => {
  const isOpen = useOverallModelAIStore((s) => s.isOpen)
  const isMinimized = useOverallModelAIStore((s) => s.isMinimized)
  const cards = useOverallModelAIStore((s) => s.cards)
  const classes = useOverallModelAIStore((s) => s.classes)
  const toggleMinimized = useOverallModelAIStore((s) => s.toggleMinimized)
  const cancel = useOverallModelAIStore((s) => s.cancel)
  const toggleCardSelection = useOverallModelAIStore((s) => s.toggleCardSelection)
  const toggleClassSelectionRaw = useOverallModelAIStore(
    (s) => s.toggleClassSelection,
  )
  const toggleAllCards = useOverallModelAIStore((s) => s.toggleAllCards)
  const toggleAllClasses = useOverallModelAIStore((s) => s.toggleAllClasses)

  if (!isOpen) return null

  const handleToggleClass = (index) => {
    const result = toggleClassSelectionRaw(index)
    if (result?.blocked) {
      toast.info(
        `A classe "${result.className}" é requerida por um CRC Card selecionado e não pode ser desmarcada.`,
      )
    }
  }

  const selectedCardsCount = cards.filter((j) => j.selected).length
  const selectedClassesCount = classes.filter((j) => j.selected).length

  return (
    <div
      className={`
        transition-all duration-300 z-50
        ${
          isMinimized
            ? 'fixed bottom-4 right-4 w-[400px]'
            : 'fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center'
        }
      `}
    >
      <div className="bg-card rounded-lg max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {!isMinimized && 'CRC Cards gerados por IA'}
            {isMinimized && 'CRC Cards gerados'}
          </h3>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <h3 className="text-xl font-bold text-foreground flex items-center">
                Classes geradas por IA
              </h3>
            )}
            <Button size="icon" variant="secondary" onClick={toggleMinimized}>
              {isMinimized ? <ChevronsUp size={20} /> : <Minus size={20} />}
            </Button>
            <Button onClick={cancel} size="icon" variant="secondary">
              <X size={24} />
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <main className="flex flex-1 min-h-0">
            <section className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-muted rounded-lg flex-shrink-0">
                <span className="text-foreground font-medium">
                  {selectedCardsCount} de {cards.length} selecionados
                </span>
                <Button
                  onClick={toggleAllCards}
                  className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
                >
                  {cards.every((item) => item.selected)
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 min-h-0">
                <div className="space-y-2 pb-4">
                  {cards.map((card, index) => (
                    <div
                      key={card.tempId}
                      className={`rounded-lg p-1 border-2 transition-colors flex items-center gap-4 ${
                        card.selected
                          ? 'bg-muted border-primary'
                          : 'bg-muted/50 border-border hover:border-muted-foreground'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer flex-1 gap-4">
                        <Checkbox
                          checked={card.selected}
                          onCheckedChange={() => toggleCardSelection(index)}
                        />
                        <div className="w-full bg-card rounded-lg shadow-sm">
                          <h3 className="text-lg font-semibold my-2">
                            {card.class}
                          </h3>
                          <Separator />
                          <div className="flex">
                            <div className="w-1/2 px-1 flex flex-col gap-2">
                              <h5 className="font-semibold text-sm text-center text-primary my-2">
                                Responsabilidades
                              </h5>
                              {card.responsabilities.map((res) => (
                                <div
                                  key={`${card.tempId}-res-${res}`}
                                  className="text-sm text-center p-2 border border-border rounded-md shadow-sm"
                                >
                                  {res}
                                </div>
                              ))}
                            </div>
                            <div className="w-1/2 px-1 border-l border-border flex flex-col gap-1">
                              <h5 className="font-semibold text-sm text-center text-primary my-2">
                                Colaboradores
                              </h5>
                              {card.collaborators.map((collaborator) => (
                                <div
                                  key={`${card.tempId}-col-${collaborator}`}
                                  className="text-sm text-center p-2 border border-border rounded-md shadow-sm"
                                >
                                  {collaborator}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-muted rounded-lg flex-shrink-0">
                <span className="text-foreground font-medium">
                  {selectedClassesCount} de {classes.length} selecionados
                </span>
                <Button
                  onClick={toggleAllClasses}
                  className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
                >
                  {classes.every((item) => item.selected)
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 min-h-0">
                <div className="space-y-2 pb-4">
                  {classes.map((classItem, index) => (
                    <div
                      key={`class-${classItem.name}`}
                      className={`rounded-lg p-3 border-2 transition-colors flex items-center gap-4 ${
                        classItem.selected
                          ? 'bg-muted border-primary'
                          : 'bg-muted/50 border-border hover:border-muted-foreground'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer flex-1 gap-4">
                        <Checkbox
                          checked={classItem.selected}
                          onCheckedChange={() => handleToggleClass(index)}
                          disabled={
                            classItem.requiredBy &&
                            classItem.requiredBy.size > 0
                          }
                        />
                        <div className="w-full bg-card rounded-lg p-3 shadow-sm">
                          <h4 className="text-lg font-bold text-foreground mb-3">
                            {classItem.name}
                          </h4>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        )}
        {!isMinimized && (
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
            <Button
              onClick={cancel}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center"
              disabled={selectedCardsCount === 0 && selectedClassesCount === 0}
            >
              <Check className="mr-2" size={16} />
              Confirmar e Adicionar (
              {selectedCardsCount + selectedClassesCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OverallModelAIModal
