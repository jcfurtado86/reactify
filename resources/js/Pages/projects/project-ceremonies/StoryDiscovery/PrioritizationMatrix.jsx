import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  darkenColor,
  isTemporary as getIsTemporary,
  useGroupedStories,
} from '@/lib/utils'
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
import { router, Link } from '@inertiajs/react'
import {
  BookText,
  Target,
  LayoutGrid,
  ExternalLink,
  AlertOctagonIcon,
} from 'lucide-react'
import EditPriorities from './EditPriorities'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'
import { usePermissionGate } from '@/lib/usePermissionGate'
import { toast } from 'sonner'

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
      className="sortable-column rounded-md flex flex-col items-center h-full"
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
  systemColors,
}) => {
  const isDisabled = story.status !== 'prioritized' && story.status !== 'draft'
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `story-${story.story_id}`,
      data: { story },
      disabled: isDisabled,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    touchAction: 'none',
    backgroundColor: priority?.color ? darkenColor(priority.color, 0.4) : '',
    visibility: isDragging ? 'hidden' : 'visible',
  }
  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.story_id}`

  const isTemporary = getIsTemporary(story.story_id)

  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.story_type] || '#f97316'
  let cursorClass = ''
  if (isTemporary || isDisabled) {
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
         flex flex-col w-fit min-w-40 max-w-56 text-left p-2 items-center justify-start text-xs font-normal text-foreground ${priority ? 'text-slate-50' : 'border border-border'}  rounded-md shadow-sm  transition-opacity duration-300 ${cursorClass} ${className}`}
    >
      {!story.isTemporary && (
        <div className="w-full flex items-center gap-2 justify-between">
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
          >
            {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
          </Badge>
          {isDisabled && (
            <ButtonWithTooltip
              className="size-6 p-2"
              variant="outline"
              tooltipContent={
                'Estórias presentes em sprints não podem ser alteradas'
              }
            >
              <AlertOctagonIcon />
            </ButtonWithTooltip>
          )}
        </div>
      )}

      <p className="">{story.story_title}</p>
    </div>
  )
}

const GoalCard = ({ goal, systemColors }) => {
  const goalVariants = systemColors?.goals || {}
  const selectedType = goalVariants[goal.type] || '#f97316'
  const selectedPriority = goalVariants[goal.priority] || '#f97316'
  return (
    <Card className="bg-card  border border-border transition-all duration-300 ease-in-out p-0 h-44 w-full rounded-md">
      <CardContent className="p-2 h-full text-xs flex flex-col gap-2">
        <div className="gap-2 flex w-full items-center justify-start">
          <Badge
            style={{ backgroundColor: selectedType }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
          >
            {`${goal.type.toUpperCase()}${goal.id}`}
          </Badge>
          <Badge
            style={{ backgroundColor: selectedPriority }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
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
        rounded-md transition-all duration-150 border border-slate-100/20
        ${isOver ? ' bg-card/60' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Function helper to transform the API array into our state object
const transformArrayToMatrixObject = (
  prioritizations,
  allProjectStories,
  childrenByEpicId,
) => {
  if (!prioritizations || !allProjectStories) return {}

  // Set de ids que são épicas (têm filhas) — usado pra ignorar rows
  // velhas de priorização ligadas a épicos que depois foram quebrados.
  const epicParentIds = new Set(
    allProjectStories.filter((s) => s.epic_id).map((s) => s.epic_id),
  )

  return prioritizations.reduce((matrix, item) => {
    const cellId = `cell-${item.priority_id}-${item.position}`
    const storyDetails = allProjectStories.find((s) => s.id === item.story_id)

    if (storyDetails && !epicParentIds.has(storyDetails.id)) {
      // If this cellId is not yet in our matrix, initialize it with an empty array
      if (!matrix[cellId]) {
        matrix[cellId] = []
      }
      // --- AQUI ESTÁ A PROTEÇÃO ---
      // Verifica se childrenByEpicId existe E se é um Map de verdade
      const relatedEpics =
        childrenByEpicId instanceof Map && storyDetails.epic_id
          ? childrenByEpicId.get(storyDetails.epic_id) || []
          : []
      // ----------------------------

      // Push the story into the array for that cell
      matrix[cellId].push({
        id: item.id, // This is the prioritization ID
        story_id: storyDetails.id,
        epic_id: storyDetails.epic_id,
        epic_index: storyDetails.epic_index,
        story_title: storyDetails.title,
        story_type: storyDetails.type,
        status: storyDetails.status,
        project_id: storyDetails.project_id,
        priority_id: item.priority_id,
        position: item.position,
      })
    }

    return matrix
  }, {})
}
const PrioritizationMatrix = ({ project, setProject }) => {
  const { t } = useTranslation()
  const gate = usePermissionGate('prioritizationMatrix.manage')
  const canManagePrioritization = gate.allowed
  const prioritizationReason = gate.reason
  const childrenByEpicId = useGroupedStories(project?.stories)
  const [storyTypeTab, setStoryTypeTab] = useState('user')

  const filteredGoals = useMemo(() =>
    (project.goal_sketches || []).filter((g) =>
      storyTypeTab === 'user' ? g.type === 'bg' : g.type === 'cg'
    ), [project.goal_sketches, storyTypeTab])

  const filteredStories = useMemo(() =>
    (project.stories || []).filter((s) => s.type === storyTypeTab),
    [project.stories, storyTypeTab])

  const filteredGoalIds = useMemo(() => new Set(filteredGoals.map((g) => g.id)), [filteredGoals])

  const goalIdToFilteredIndex = useMemo(() => {
    const map = new Map()
    filteredGoals.forEach((g, i) => map.set(g.id, i))
    return map
  }, [filteredGoals])

  const filteredPrioritizations = useMemo(() =>
    (project.prioritizations || [])
      .filter((p) => filteredGoalIds.has(p.goal_id))
      .map((p) => ({ ...p, position: goalIdToFilteredIndex.get(p.goal_id) ?? p.position })),
    [project.prioritizations, filteredGoalIds, goalIdToFilteredIndex])

  const GRID_ROWS = filteredGoals.length || 4
  const priorityOrder = {
    low: 0,
    medium: 1,
    high: 2,
  }
  const [activeItem, setActiveItem] = useState(null)
  const [prioritizationMatrix, setPrioritizationMatrix] = useState(() =>
    transformArrayToMatrixObject(
      filteredPrioritizations,
      filteredStories,
      childrenByEpicId,
    ),
  )

  const [orderedPriorities, setOrderedPriorities] = useState(
    // A inicialização ainda é útil para o primeiro render.
    () =>
      [...project.matrix_priorities].sort(
        (a, b) => a.order_column - b.order_column,
      ),
  )

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
      filteredPrioritizations,
      filteredStories,
      childrenByEpicId,
    )

    setPrioritizationMatrix(newMatrix)
  }, [filteredPrioritizations, filteredStories, childrenByEpicId])

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
    // Também exclui stories já persistidas em project.prioritizations
    // — cobre o caso em que o estado local da matriz não refletiu a
    // row persistida (ex: reload, chegada de broadcast).
    const persistedPrioritizedIds = new Set(
      (project?.prioritizations || []).map((p) => p.story_id),
    )
    // Épicas (stories com filhas) não são priorizadas — só as filhas
    // reais. Épicas são placeholders, não unidades priorizáveis.
    const epicParentIds = new Set(
      project.stories.filter((s) => s.epic_id).map((s) => s.epic_id),
    )
    return filteredStories.filter(
      (story) =>
        !assignedStoryIds.has(story.id) &&
        !persistedPrioritizedIds.has(story.id) &&
        !epicParentIds.has(story.id),
    )
  }, [filteredStories, project?.prioritizations, prioritizationMatrix])

  const handleDragStart = (event) => {
    if (!canManagePrioritization) return
    const { active } = event
    setActiveItem(active)
  }

  const handleDragEnd = (event) => {
    setActiveItem(null)
    if (!canManagePrioritization) {
      toast.error(prioritizationReason)
      return
    }
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
              onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
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
                onSuccess: () => toastSuccess('prioritization_matrix.toast_removed'),
                onError: (errors) => toastApiError(errors, 'common.toast.error_delete'),
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
            epic_id: draggedStoryData.epic_id,
            epic_index: draggedStoryData.epic_index,
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
              {
                preserveState: true,
                preserveScroll: true,
                onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
              },
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
              {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => toastSuccess('prioritization_matrix.toast_added'),
                onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
              },
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
  const hasGoals = filteredGoals.length > 0

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="flex flex-col gap-2 py-2 bg-background text-foreground min-h-screen">
        {/* botoes de opcoes*/}
        <div className="w-full flex gap-3 justify-start items-center  relative">
          <EditPriorities
            priorities={project.matrix_priorities}
            projectId={project.id}
            project={project}
            setProject={setProject}
          />
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={storyTypeTab === 'user' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStoryTypeTab('user')}
            >
              {t('prioritization_matrix.tab_user_stories', 'User Stories')}
            </Button>
            <Button
              variant={storyTypeTab === 'system' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStoryTypeTab('system')}
            >
              {t('prioritization_matrix.tab_system_stories', 'System Stories')}
            </Button>
          </div>
        </div>
        {/* conteiner de stories*/}
        <section className=" bg-card text-card-foreground border-0 rounded-xl shadow-sm  w-full ">
          {/* <span className="h-11 py-1 m-2 t-4">Stories</span>*/}
          <DroppableCell
            id="story-list"
            className="flex flex-wrap gap-1 p-1 border-0  "
          >
            {unassignedStories.length > 0 ? (
              unassignedStories
                .sort((a, b) => a.id - b.id)
                .map((story) => {
                  const unassignedStory = {
                    story_id: story.id,
                    story_title: story.title,
                    story_type: story.type,
                    status: story.status,
                    epic_id: story.epic_id,
                    epic_index: story.epic_index,
                  }

                  return (
                    <StoryCard
                      key={story.id}
                      story={unassignedStory}
                      className=""
                      systemColors={project?.system_colors}
                    />
                  )
                })
            ) : (
              <div className="w-full flex flex-col items-center justify-center p-6 text-muted-foreground min-h-[100px]">
                <BookText
                  size={32}
                  className="mb-3 text-primary flex-shrink-0" // Adicionado flex-shrink-0
                  strokeWidth={1.5}
                />
                <p className="mb-2 text-sm text-center font-medium text-foreground">
                  {t('prioritization_matrix.all_prioritized')}
                </p>
                <p className="text-sm text-center mb-2">
                  {t('prioritization_matrix.drag_to_unprioritize')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.get(
                      route('project.ceremony.show', {
                        project: project.id,
                        ceremony: 'storyDiscovery',
                      }),
                      { artifact: 'stories' },
                    )
                  }
                >
                  {t('prioritization_matrix.go_to_stories')}
                  <ExternalLink className="size-4 ml-2" />
                </Button>
              </div>
            )}
          </DroppableCell>
        </section>

        <section className="flex-1">
          <section className="flex gap-2 justify-between">
            <aside className="flex flex-col w-48 items-center bg-card p-2 gap-2 rounded">
              <span className="h-11 py-1 text-sm font-medium">
                {storyTypeTab === 'user'
                  ? t('goals.business_goals', 'Business Goals')
                  : t('goals.constraint_goals', 'Constraint Goals')}
              </span>
              {hasGoals ? (
                [...filteredGoals]
                  .sort((a, b) => {
                    const priorityA = priorityOrder[a.priority]
                    const priorityB = priorityOrder[b.priority]
                    return priorityB - priorityA
                  })
                  .map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      systemColors={project?.system_colors}
                    >
                      {goal.title}
                    </GoalCard>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-muted-foreground border-2 border-dashed border-border rounded-lg w-full min-h-[150px]">
                  <Target
                    size={32}
                    className="mb-3 text-primary flex-shrink-0" // Adicionado flex-shrink-0
                    strokeWidth={1.5}
                  />
                  <p className="text-sm text-center font-medium text-foreground">
                    {t('prioritization_matrix.no_goals_title')}
                  </p>
                  <p className="text-xs text-center">{t('prioritization_matrix.no_goals_hint')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.get(
                        route('project.ceremony.show', {
                          project: project.id,
                          ceremony: 'inception',
                        }),
                        { artifact: 'goals' },
                      )
                    }
                  >
                    {t('prioritization_matrix.go_to_goals')}
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
              )}
            </aside>
            <div
              className={`${orderedPriorities.length > 0 ? 'grid grid-flow-col auto-cols-max' : 'flex'} flex-1  gap-2 pr-2`}
            >
              {orderedPriorities.length > 0 ? (
                <SortableContext
                  items={priorityIds}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedPriorities.map((priority) => {
                    const itemCount = Object.values(
                      prioritizationMatrix,
                    ).filter(
                      (story) => story && story.priority_id == priority.id,
                    ).length
                    return (
                      <SortablePriorityColumn
                        key={priority.id}
                        priority={priority}
                        itemCount={itemCount}
                      >
                        {Array.from({ length: GRID_ROWS }).map(
                          (_, rowIndex) => {
                            const cellId = `cell-${priority.id}-${rowIndex}`
                            const storiesInCell = prioritizationMatrix[cellId]

                            return (
                              <DroppableCell
                                key={cellId}
                                id={cellId}
                                className={`h-44 min-w-40 flex flex-row justify-center w-full gap-1`}
                              >
                                {storiesInCell && storiesInCell.length > 0 ? (
                                  storiesInCell
                                    .sort((a, b) => a.story_id - b.story_id)
                                    .map((story) => (
                                      <StoryCard
                                        key={story.id} // Use the prioritization ID for the key
                                        story={story}
                                        priority={priority}
                                        systemColors={project?.system_colors}
                                      />
                                    ))
                                ) : (
                                  // Placeholder for empty cells
                                  <div className="h-full w-full flex items-center justify-center"></div>
                                )}
                              </DroppableCell>
                            )
                          },
                        )}
                      </SortablePriorityColumn>
                    )
                  })}
                </SortableContext>
              ) : (
                <div className="flex flex-col  items-center justify-start p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px] h-full w-full">
                  <LayoutGrid
                    size={40}
                    className="mb-4 text-primary flex-shrink-0" // Adicionado flex-shrink-0
                    strokeWidth={1.5}
                  />
                  <p className="mb-2 font-medium text-foreground">
                    {t('prioritization_matrix.no_columns_title')}
                  </p>
                  <p className="text-sm text-center max-w-xs">
                    {t('prioritization_matrix.no_columns_body')}
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
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
                    systemColors={project?.system_colors}
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
