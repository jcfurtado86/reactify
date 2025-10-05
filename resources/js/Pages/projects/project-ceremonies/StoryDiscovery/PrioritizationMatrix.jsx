import { darkenColor } from '@/lib/utils'
import { Minus, X, Check, ChevronsUp } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy, // Estratégia para colunas horizontais
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { router } from '@inertiajs/react'
import { storyVariants } from './Stories'
import { typeColors as goalTypeColors } from '../Inception/Goals'
import { priorityColors as goalPriorityColors } from '../Inception/Goals'
import { toast } from 'sonner'
import GenerateAIButton from '@/Components/GenerateAIButton'
import EditPriorities from './EditPriorities'

const SortablePriorityColumn = ({
  priority,
  children,
  itemCount,
  className,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id, data: { type: 'column' } })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    backgroundColor: darkenColor(priority.color, 0.3),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md flex flex-col items-center h-full"
    >
      {/* Cabeçalho da Coluna (agora é a área de arrastar) */}
      <div
        {...attributes}
        {...listeners}
        className={`flex items-center justify-between w-full p-3  ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none' }}
      >
        <section
          style={{ backgroundColor: darkenColor(priority.color, 0.4) }}
          className="flex items-center justify-between px-3 py-1 gap-2 rounded-md w-full text-slate-100"
        >
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: priority.color }}
          />
          <span className="font-semibold text-sm ">{priority.name}</span>
          <span className="text-sm font-medium ">{itemCount}</span>
        </section>
      </div>

      {/* Área de Conteúdo (Cards) */}
      <div className="p-2 gap-2 flex-1 items-center flex flex-col w-full">
        {children}
      </div>
    </div>
  )
}
const StoryCard = ({
  story,
  priority = null,
  isDragOverlay = false,
  className = '',
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `story-${story.story_id}`,
      data: { story },
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    touchAction: 'none',
    backgroundColor: priority?.color ? darkenColor(priority.color, 0.4) : '',
    visibility: isDragging ? 'hidden' : 'visible',
  }

  const isTemporary = story.story_id ? false : true

  const selectedVariant = storyVariants[story.story_type] || storyVariants.user

  let cursorClass = ''
  if (story.isTemporary) {
    cursorClass = 'opacity-50 !cursor-not-allowed'
  } else if (isDragOverlay || isDragging) {
    cursorClass = 'cursor-grabbing'
  } else {
    cursorClass = 'cursor-grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
         flex flex-col flex-1 w-full min-w-24 max-w-60 items-center justify-start p-1 text-xs font-normal text-foreground ${priority ? 'text-slate-50' : 'border border-border'}  rounded-md shadow-sm  transition-opacity duration-300 ${cursorClass} ${className}`}
    >
      {!story.isTemporary && (
        <div className="mr-auto">
          <Badge
            variant="outline"
            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer ${selectedVariant.bg}`}
          >
            {`${story.story_type === 'system' ? 'SS' : 'US'}${isTemporary ? '' : story.story_id}`.toUpperCase()}
          </Badge>
        </div>
      )}

      <p className="">{story.story_title}</p>
    </div>
  )
}

const GoalCard = ({ goal }) => {
  const selectedType = goalTypeColors[goal.type] || goalTypeColors.bg
  const selectedPriority = goalTypeColors[goal.priority] || goalTypeColors.bg

  return (
    <Card className="bg-card  border border-border transition-all duration-300 ease-in-out p-0 h-40 w-full rounded-md">
      <CardContent className="p-2 h-full text-xs flex flex-col gap-2">
        <div className="gap-2 flex w-full items-center justify-center">
          <Badge
            variant="outline"
            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer ${selectedType.color}`}
          >
            {`${goal.type.toUpperCase()}${goal.id}`}
          </Badge>
          <Badge
            variant="outline"
            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer ${selectedPriority.color}`}
          >
            {`${goal.priority.toUpperCase()}`}
          </Badge>
        </div>

        {/* Área do Título (apenas exibição) */}
        <p className="m-0 font-normal text-foreground break-words w-full min-h-8">
          {goal.title}
        </p>
      </CardContent>
    </Card>
  )
}

const DroppableCell = ({ id, children, className = '' }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })
  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-row justify-center w-full rounded-md transition-all duration-150 gap-2 border border-slate-100/20
        ${isOver ? ' bg-card/60' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

const GeneratedItemsModal = ({
  isModalMinimized,
  changeModalState,
  cancelGeneratedItems,
  generatedItems,
  toggleItemSelection,
  confirmGeneratedItems,
  toggleAllItems,
  orderedPriorities,
  GRID_ROWS,
}) => {
  return (
    <div
      className={`
          transition-all duration-300 z-50
          ${
            isModalMinimized
              ? 'fixed bottom-4 right-4 w-[400px]'
              : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'
          }
        `}
    >
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {!isModalMinimized && 'Matriz gerada por IA'}
            {isModalMinimized && 'Matriz gerada'}
          </h3>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" onClick={changeModalState}>
              {isModalMinimized ? (
                <ChevronsUp size={20} />
              ) : (
                <Minus size={20} />
              )}
            </Button>
            <Button
              onClick={cancelGeneratedItems}
              size="icon"
              variant="secondary"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        {!isModalMinimized && (
          <>
            {/* <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-muted rounded-lg flex-shrink-0">
              <span className="text-foreground font-medium">
                {generatedItems.filter((j) => j.selected).length} de{' '}
                {generatedItems.length} selecionadas
              </span>
              <Button
                onClick={toggleAllItems}
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
              >
                {generatedItems.every((item) => item.selected)
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Button>
            </div>*/}

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              {orderedPriorities.map((priority) => {
                const itemCount = Object.values(generatedItems).filter(
                  (item) => item && item.priority_id == priority.id,
                ).length
                return (
                  <SortablePriorityColumn
                    key={priority.id}
                    priority={priority}
                    itemCount={itemCount}
                  >
                    {Array.from({ length: GRID_ROWS }).map((_, rowIndex) => {
                      const cellId = `cell-${priority.id}-${rowIndex}`
                      const storiesInCell = generatedItems[cellId]

                      return (
                        <DroppableCell
                          key={cellId}
                          id={cellId}
                          className={`h-40 min-w-60`}
                        >
                          {storiesInCell && storiesInCell.length > 0 ? (
                            storiesInCell.map((story) => (
                              <StoryCard
                                key={story.id} // Use the prioritization ID for the key
                                story={story}
                                priority={priority}
                              />
                            ))
                          ) : (
                            // Placeholder for empty cells
                            <div className="h-full w-full flex items-center justify-center"></div>
                          )}
                        </DroppableCell>
                      )
                    })}
                  </SortablePriorityColumn>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-border flex-shrink-0">
              <Button
                onClick={cancelGeneratedItems}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmGeneratedItems}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center"
                disabled={generatedItems.filter((j) => j.selected).length === 0}
              >
                <Check className="mr-2" size={16} />
                Confirmar e Adicionar (
                {generatedItems.filter((j) => j.selected).length})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Function helper to transform the API array into our state object
const transformArrayToMatrixObject = (prioritizations, allProjectStories) => {
  if (!prioritizations || !allProjectStories) return {}

  return prioritizations.reduce((matrix, item) => {
    const cellId = `cell-${item.priority_id}-${item.position}`
    const storyDetails = allProjectStories.find((s) => s.id === item.story_id)

    if (storyDetails) {
      // If this cellId is not yet in our matrix, initialize it with an empty array
      if (!matrix[cellId]) {
        matrix[cellId] = []
      }

      // Push the story into the array for that cell
      matrix[cellId].push({
        id: item.id, // This is the prioritization ID
        story_id: storyDetails.id,
        story_title: storyDetails.title,
        story_type: storyDetails.type,
        project_id: storyDetails.project_id,
        priority_id: item.priority_id,
        position: item.position,
      })
    }

    return matrix
  }, {})
}
const PrioritizationMatrix = ({ project, setProject }) => {
  const GRID_ROWS = project.goal_sketches.length || 4
  const priorityOrder = {
    low: 0,
    medium: 1,
    high: 2,
  }
  const [activeItem, setActiveItem] = useState(null)
  const [prioritizationMatrix, setPrioritizationMatrix] = useState(() =>
    transformArrayToMatrixObject(project?.prioritizations, project?.stories),
  )

  const [orderedPriorities, setOrderedPriorities] = useState(
    // A inicialização ainda é útil para o primeiro render.
    () =>
      [...project.matrix_priorities].sort(
        (a, b) => a.order_column - b.order_column,
      ),
  )
  //ia states
  const [aiGeneratedPrioritizations, setAiGeneratedPrioritizations] = useState([
    {
      'cell-3-1': [
        {
          id: 2,
          story_id: 3,
          story_title:
            'Como administrador, quero gerenciar usuários para manter o controle de acesso ao sistema',
          story_type: 'system',
          project_id: 1,
          priority_id: 3,
          position: 1,
        },
        {
          id: 3,
          story_id: 4,
          story_title: 'Guaxinim fofo',
          story_type: 'system',
          project_id: 1,
          priority_id: 3,
          position: 1,
        },
      ],
    },
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(true)
  const [isModalMinimized, setIsModalMinimized] = useState(false)

  useEffect(() => {
    if (project && project.matrix_priorities) {
      const newSortedPriorities = [...project.matrix_priorities].sort(
        (a, b) => a.order_column - b.order_column,
      )
      setOrderedPriorities(newSortedPriorities)
    }
  }, [project])
  useEffect(() => {
    const newMatrix = transformArrayToMatrixObject(
      project.prioritizations,
      project.stories,
    )
    console.log(project.prioritizations, newMatrix)
    // Atualiza o estado interno para refletir as novas props
    setPrioritizationMatrix(newMatrix)
  }, [project])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  )

  const unassignedStories = useMemo(() => {
    const assignedStoryIds = new Set(
      Object.values(prioritizationMatrix)
        .flat() // Flatten the arrays of stories
        .filter(Boolean)
        .map((story) => story.story_id),
    )
    return project.stories.filter((story) => !assignedStoryIds.has(story.id))
  }, [project.stories, prioritizationMatrix])

  const handleDragStart = (event) => {
    const { active } = event
    setActiveItem(active)
  }

  const handleDragEnd = (event) => {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return
    if (
      active.data.current?.type === 'column' &&
      over.data.current?.type === 'column'
    ) {
      if (active.id !== over.id) {
        setOrderedPriorities((priorities) => {
          //busca as prioridades a serem ordenadas
          const oldPriority = priorities.find((p) => p.id === active.id)
          const newPriority = priorities.find((p) => p.id === over.id)

          if (!oldPriority || !newPriority) {
            console.error(
              'Uma das prioridades não foi encontrada no estado. Abortando.',
            )
            return priorities
          }
          // impede que se ordene prioridades com id temporario
          if (
            String(oldPriority.id).startsWith('temp-') ||
            String(newPriority.id).startsWith('temp-')
          ) {
            console.warn('Prioridade temporária não pode ser ordenada.')
            return priorities
          }

          const oldIndex = priorities.findIndex((p) => p.id === active.id)
          const newIndex = priorities.findIndex((p) => p.id === over.id)
          const newOrder = arrayMove(priorities, oldIndex, newIndex)

          // Envia a nova ordem para o backend
          const payload = newOrder.map((p, index) => ({
            id: p.id,
            order: index, // A nova ordem é o próprio índice do array
          }))

          router.patch(
            route('matrix-priority.reorder'),
            { priorities: payload, project_id: project.id },
            {
              preserveState: true,
              preserveScroll: true,
            },
          )

          return newOrder
        })
      }
      return
    } else if (active.data.current?.story?.story_id) {
      const draggedStoryData = active.data.current.story
      if (!draggedStoryData) return

      setPrioritizationMatrix((prevMatrix) => {
        const newMatrix = { ...prevMatrix }
        // Find the original cell and index of the dragged story
        let oldCellKey = null
        let storyIndexInOldCell = -1
        let draggedPrioritization = null

        for (const cellKey in newMatrix) {
          const index = newMatrix[cellKey].findIndex(
            (s) => s.story_id === draggedStoryData.story_id,
          )

          if (index !== -1) {
            oldCellKey = cellKey
            storyIndexInOldCell = index
            draggedPrioritization = newMatrix[cellKey][index]
            break
          }
        }

        if (draggedPrioritization && draggedPrioritization.isTemporary) {
          console.warn(
            'Ação bloqueada: A story está aguardando confirmação do servidor.',
          )

          return prevMatrix
        }
        // --- MOVING STORY BACK TO UNASSIGNED LIST ---
        if (String(over.id).startsWith('story-list')) {
          if (draggedPrioritization) {
            // Remove from the matrix optimistically
            newMatrix[oldCellKey].splice(storyIndexInOldCell, 1)
            if (newMatrix[oldCellKey].length === 0) {
              delete newMatrix[oldCellKey]
            }

            // Tell backend to delete this prioritization
            router.delete(
              route('prioritization.destroy', {
                prioritization: draggedPrioritization.id,
              }),
              {
                preserveState: true,
                preserveScroll: true,
              },
            )
          }
          return newMatrix
        } else if (String(over.id).startsWith('cell-')) {
          if (!draggedPrioritization) {
            const isAlreadyInMatrix = Object.values(newMatrix)
              .flat() // Achatamos [[story1], [story2, story3]] para [story1, story2, story3]
              .some((story) => story.story_id === draggedStoryData.story_id)

            if (isAlreadyInMatrix) {
              console.warn(
                `A story #${draggedStoryData.story_id} já está na matriz. Ação bloqueada.`,
              )
              // Aborta a atualização, retornando o estado anterior sem modificações
              return prevMatrix
            }
          }
          const targetCellId = over.id
          const [, priority_id, position] = targetCellId.split('-')

          // Remove story from its original cell in the newMatrix state
          if (oldCellKey) {
            newMatrix[oldCellKey].splice(storyIndexInOldCell, 1)
            if (newMatrix[oldCellKey].length === 0) {
              delete newMatrix[oldCellKey]
            }
          }

          // Prepare the story object to be added
          const storyToAdd = {
            id: draggedPrioritization?.id || `temp-${Date.now()}`,
            story_id: draggedStoryData.story_id,
            story_title: draggedStoryData.story_title,
            story_type: draggedStoryData.story_type,
            priority_id: priority_id,
            position: Number(position),
            isTemporary: !draggedPrioritization,
          }

          // Add the story to the target cell's array
          if (!newMatrix[targetCellId]) {
            newMatrix[targetCellId] = []
          }
          newMatrix[targetCellId].push(storyToAdd)

          // --- Backend Communication ---
          if (draggedPrioritization) {
            // It was an existing story, so UPDATE its position
            router.patch(
              route('prioritization.update', {
                prioritization: draggedPrioritization.id,
              }),
              {
                priority_id: priority_id,
                position: Number(position),
              },
              { preserveState: true, preserveScroll: true },
            )
          } else {
            // It's a new story from the unassigned list, so CREATE it
            const storyDetails = project.stories.find(
              (s) => s.id === draggedStoryData.story_id,
            )
            router.post(
              route('prioritization.store'),
              {
                story_id: storyDetails.id,
                project_id: project.id,
                priority_id: priority_id,
                position: Number(position),
              },
              { preserveState: true, preserveScroll: true },
            )
          }

          return newMatrix
        }

        return prevMatrix // Return original state if no valid drop target
      })
    }
  }
  const priorityIds = useMemo(
    () => orderedPriorities.map((p) => p.id),
    [orderedPriorities],
  )

  //rotas relacionadas ao modal de IA
  const generatePrioritizations = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post('/api/prioritizations/generate', {
        project_id: project.id,
      })

      const data = response.data

      const prioritizationsWithSelection = data.prioritizations.map(
        (prioritization) => ({
          ...prioritization,
          selected: true,
        }),
      )

      setAiGeneratedPrioritizations(prioritizationsWithSelection)
      setShowAiModal(true)
      toast.success(
        'Prioritizations geradas com sucesso a partir das entrevistas mais recentes.',
      )
    } catch (error) {
      console.error('Erro ao gerar prioritizations:', error)
      if (error.response && error.response.data) {
        const errorData = error.response.data

        if (errorData.status === 'warning') {
          toast.warning(errorData.message)
        } else {
          toast.error(
            errorData.message || 'Ocorreu um erro desconhecido no servidor.',
          )
        }
      } else {
        toast.error(
          'Não foi possível conectar ao servidor. Verifique sua internet.',
        )
      }
    }
  }
  const confirmGeneratedPrioritizations = () => {
    const selectedPrioritizations = aiGeneratedPrioritizations.filter(
      (prioritization) => prioritization.selected,
    )
    const remainingPrioritizations = aiGeneratedPrioritizations.filter(
      (prioritization) => !prioritization.selected,
    )

    if (selectedPrioritizations.length === 0) {
      toast.warning('Selecione pelo menos uma prioritization para adicionar.')
      return
    }

    const prioritizationsToAdd = selectedPrioritizations.map(
      (prioritization) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        created_at: new Date().toISOString(),
        project_id: project.id,
        ...prioritization,
      }),
    )

    setProject((prevProject) => ({
      ...prevProject,
      prioritizations: [
        ...(prevProject.prioritizations || []),
        ...prioritizationsToAdd,
      ],
    }))

    const prioritizationsForBackend = selectedPrioritizations.map(
      ({ title, type, priority }) => ({
        title,
        type,
        priority,
        project_id: project.id,
      }),
    )

    router.post(
      route('prioritization.bulk-store'),
      { prioritizations: prioritizationsForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedPrioritizations.length} goal(s) adicionada(s) com sucesso!`,
          )
          setAiGeneratedPrioritizations(remainingPrioritizations)
          if (remainingPrioritizations.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error('Ocorreu um erro ao salvar as goals.')
          console.error('Erro do backend:', errors)
          setProject((prevProject) => {
            const prioritizationsToAddIds = prioritizationsToAdd.map(
              (prioritization) => prioritization.id,
            )
            return {
              ...prevProject,
              prioritizations: prevProject.prioritizations.filter(
                (prioritization) =>
                  !prioritizationsToAddIds.includes(prioritization.id),
              ),
            }
          })
        },
      },
    )
  }

  const cancelGeneratedPrioritizations = () => {
    setShowAiModal(false)
    setAiGeneratedPrioritizations([])
    setIsModalMinimized(false)
  }

  const togglePrioritizationSelection = (index) => {
    setAiGeneratedPrioritizations((prev) =>
      prev.map((prioritization, i) =>
        i === index
          ? { ...prioritization, selected: !prioritization.selected }
          : prioritization,
      ),
    )
  }

  const toggleAllPrioritizations = () => {
    const allSelected = aiGeneratedPrioritizations.every(
      (prioritization) => prioritization.selected,
    )
    setAiGeneratedPrioritizations((prev) =>
      prev.map((prioritization) => ({
        ...prioritization,
        selected: !allSelected,
      })),
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {showAiModal && (
        <GeneratedItemsModal
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedPrioritizations}
          generatedItems={aiGeneratedPrioritizations}
          toggleItemSelection={togglePrioritizationSelection}
          confirmGeneratedItems={confirmGeneratedPrioritizations}
          toggleAllItems={toggleAllPrioritizations}
          orderedPriorities={orderedPriorities}
          GRID_ROWS={GRID_ROWS}
        />
      )}
      <main className="flex flex-col gap-2 py-2 bg-background text-foreground min-h-screen">
        {/* botoes de opcoes*/}
        <div className="w-full flex gap-3 justify-start items-center  relative">
          <EditPriorities
            priorities={project.matrix_priorities}
            projectId={project.id}
            project={project}
            setProject={setProject}
          />
        </div>
        {/* conteiner de stories*/}
        <section className=" bg-card text-card-foreground border-0 rounded-xl shadow-sm  w-full ">
          <h2 className="text-lg font-bold my-1 text-muted-foreground">
            Stories
          </h2>
          <DroppableCell
            id="story-list"
            className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 p-1 items-start border-0"
          >
            {unassignedStories.length > 0 ? (
              unassignedStories.map((story) => {
                const unassignedStory = {
                  story_id: story.id,
                  story_title: story.title,
                  story_type: story.type,
                }
                return (
                  <StoryCard
                    key={story.id}
                    story={unassignedStory}
                    className="h-full"
                  />
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground p-2">
                Todas as stories foram priorizadas.
              </p>
            )}
          </DroppableCell>
        </section>

        <section className="flex gap-2 justify-between">
          <aside className="flex flex-col w-64 items-center bg-card p-2 gap-2 rounded">
            <span className="h-11 py-1 ">Goals</span>
            {project.goal_sketches
              .sort((a, b) => {
                const priorityA = priorityOrder[a.priority] // Pega o valor numérico para o tipo de 'a'
                const priorityB = priorityOrder[b.priority] // Pega o valor numérico para o tipo de 'b'

                return priorityB - priorityA // Subtrai para ordenar
              })
              .map((goal) => (
                <GoalCard key={goal.id} goal={goal}>
                  {goal.title}
                </GoalCard>
              ))}
          </aside>
          <div className="flex-1 grid grid-flow-col auto-cols-max gap-2 pr-2">
            <SortableContext
              items={priorityIds}
              strategy={horizontalListSortingStrategy}
            >
              {orderedPriorities.map((priority) => {
                const itemCount = Object.values(prioritizationMatrix).filter(
                  (story) => story && story.priority_id == priority.id,
                ).length
                return (
                  <SortablePriorityColumn
                    key={priority.id}
                    priority={priority}
                    itemCount={itemCount}
                  >
                    {Array.from({ length: GRID_ROWS }).map((_, rowIndex) => {
                      const cellId = `cell-${priority.id}-${rowIndex}`
                      const storiesInCell = prioritizationMatrix[cellId]

                      return (
                        <DroppableCell
                          key={cellId}
                          id={cellId}
                          className={`h-40 min-w-60`}
                        >
                          {storiesInCell && storiesInCell.length > 0 ? (
                            storiesInCell.map((story) => (
                              <StoryCard
                                key={story.id} // Use the prioritization ID for the key
                                story={story}
                                priority={priority}
                              />
                            ))
                          ) : (
                            // Placeholder for empty cells
                            <div className="h-full w-full flex items-center justify-center"></div>
                          )}
                        </DroppableCell>
                      )
                    })}
                  </SortablePriorityColumn>
                )
              })}
            </SortableContext>
          </div>
        </section>
        <GenerateAIButton
          isGenerating={isGenerating}
          onClick={generatePrioritizations}
          // tooltip={tooltipInfo.aiGeneratedStory}
          className="w-1/2"
        />
      </main>
      {/* overlay adicionado para manter estilo do card de story mesmo ao arrastar*/}
      <DragOverlay>
        {activeItem
          ? (() => {
              // Se estiver arrastando uma story
              if (activeItem.data.current?.story) {
                const cellKey = Object.keys(prioritizationMatrix).find(
                  (key) =>
                    prioritizationMatrix[key]?.story_id ===
                    activeItem.data.current.story.story_id,
                )
                const priorityData = cellKey
                  ? orderedPriorities.find(
                      (p) => p.id == prioritizationMatrix[cellKey].priority_id,
                    )
                  : null

                return (
                  <StoryCard
                    story={activeItem.data.current.story}
                    priority={priorityData}
                    isDragOverlay={true}
                  />
                )
              }
              return null
            })()
          : null}
      </DragOverlay>
    </DndContext>
  )
}

export default PrioritizationMatrix
