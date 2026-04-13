import { cn } from '@/lib/utils'
import { Check, ChevronsUp, Minus, X } from 'lucide-react'
import { useJourneysAIStore } from '@/stores/useJourneysAIStore'

/**
 * Modal de revisão das Journeys geradas por IA.
 *
 * Consome o `useJourneysAIStore` diretamente — sem prop drilling de
 * estados efêmeros. O componente pai (`Journeys.jsx`) só precisa
 * passar `colors` (paleta visual compartilhada) e `onConfirm`, que é
 * a função que faz o POST e atualiza o estado do projeto.
 */
export const JourneysAIModal = ({ colors, onConfirm }) => {
  const isOpen = useJourneysAIStore((s) => s.isOpen)
  const isMinimized = useJourneysAIStore((s) => s.isMinimized)
  const generated = useJourneysAIStore((s) => s.generated)
  const toggleMinimized = useJourneysAIStore((s) => s.toggleMinimized)
  const toggleSelection = useJourneysAIStore((s) => s.toggleSelection)
  const toggleAll = useJourneysAIStore((s) => s.toggleAll)
  const cancel = useJourneysAIStore((s) => s.cancel)

  if (!isOpen) return null

  const selectedCount = generated.filter((j) => j.selected).length
  const allSelected = generated.length > 0 && generated.every((j) => j.selected)

  return (
    <div
      className={cn(
        'transition-all duration-300 z-50',
        isMinimized
          ? 'fixed bottom-4 right-4 w-[400px]'
          : 'fixed inset-0 bg-background/80 flex items-center justify-center',
      )}
    >
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {!isMinimized && 'Journeys geradas com IA'}
            {isMinimized && 'Journeys geradas'}
          </h3>
          <div className="flex items-center gap-2">
            <Button onClick={toggleMinimized} size="icon" variant="ghost">
              {isMinimized ? <ChevronsUp size={20} /> : <Minus size={20} />}
            </Button>
            <Button onClick={cancel} size="icon" variant="ghost">
              <X size={24} />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-accent rounded-lg flex-shrink-0">
              <span className="text-accent-foreground font-medium">
                {selectedCount} of {generated.length} selected
              </span>
              <Button onClick={toggleAll} size="sm">
                {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-4 pb-4">
                {generated.map((journey, index) => (
                  <div
                    key={`gen-${journey.title}`}
                    className={cn(
                      'rounded-lg p-4 border-2 transition-colors',
                      journey.selected
                        ? 'bg-muted border-primary'
                        : 'bg-muted/50 border-border',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-foreground font-medium">
                        {journey.title}
                      </h4>
                      <Switch
                        id={`journey-select-${index}`}
                        checked={journey.selected}
                        onCheckedChange={() => toggleSelection(index)}
                      />
                    </div>
                    <div className="space-y-2">
                      {journey.steps.map((step, stepIndex) => (
                        <div
                          key={`${journey.title}-step-${stepIndex}`}
                          className="flex items-center text-sm text-foreground"
                        >
                          <span
                            className={cn(
                              'text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2',
                              colors[index % colors.length].bg,
                            )}
                          >
                            {stepIndex + 1}
                          </span>
                          <span className="flex-1">{step.description}</span>
                          {step.is_touchpoint && (
                            <Badge variant="success" className="ml-2">
                              Touchpoint
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-border flex-shrink-0">
              <Button variant="outline" onClick={cancel}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={onConfirm}
                disabled={selectedCount === 0}
              >
                <Check className="mr-2" size={16} />
                Confirm and Add ({selectedCount})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default JourneysAIModal
