import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getStatusColor } from '@/lib/utils'
import { usePermissionGate } from '@/lib/usePermissionGate'
import { toast } from 'sonner'
// ============================================================================
// Subcomponente para o Card da Story (Item Arrastável)
// ============================================================================
const KanbanStoryCard = ({
  story,
  sprints,
  columnKey,
  isOverlay,
  systemColors,
}) => {
  // ✅ Hook do dnd-kit para tornar este componente arrastável
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: story.id, // ID único para o item arrastável
      data: {
        // Dados extras que podemos usar no onDragEnd
        story,
        fromColumn: columnKey,
      },
    })

  // ✅ Estilo para o movimento suave do card durante o arraste
  const style = {
    transform: CSS.Transform.toString(transform),
    visibility: isDragging && !isOverlay ? 'hidden' : 'visible',
    // zIndex: isDragging ? 100 : 'auto', // Garante que o card arrastado fique sobre os outros
    // opacity: isDragging ? 0.5 : 1, // Efeito visual para indicar o arraste
  }
  // ✅ Adicionamos classes para o card no overlay ter um visual mais destacado
  const overlayClasses = isOverlay
    ? 'shadow-2xl cursor-grabbing'
    : 'cursor-grab active:cursor-grabbing'
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#fff'
  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.id}`

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className={`p-3 ${overlayClasses}`}>
        <div className="flex flex-col justify-between items-start gap-1">
          <Badge style={{ backgroundColor: selectedVariant }} variant="badge">
            {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`}
          </Badge>
          <Badge variant="outline">
            {`${story?.sprint?.name || 'No Sprint'}`}
          </Badge>
          <p className="text-sm font-medium text-left">{story.title}</p>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// Subcomponente para a Coluna do Kanban (Área de Soltar)
// ============================================================================
const KanbanColumn = ({ id, variant, title, stories, systemColors }) => {
  // ✅ Hook do dnd-kit para tornar este componente uma área de soltar
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })
  return (
    <Card
      ref={setNodeRef}
      className={`min-h-96 transition-colors ${isOver ? 'bg-muted/50' : ''}`} // Feedback visual ao passar por cima
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-sm">
          <span className="capitalize">{title}</span>
          <Badge
            style={{ backgroundColor: getStatusColor(variant) }}
            variant={'badge'}
          >
            {stories.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {stories.map((story) => (
          <KanbanStoryCard
            key={story.id}
            story={story}
            columnKey={id}
            systemColors={systemColors}
          />
        ))}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Componente Principal do Kanban Board
// ============================================================================
const KanbanBoard = ({ sprints, project, updateProject, systemColors }) => {
  const { t } = useTranslation()
  const { allowed: canManageSprint, reason: sprintReason } = usePermissionGate('sprint.manage')
  const [localStories, setLocalStories] = useState([])

  // ✅ Estado para armazenar a story que está sendo arrastada
  const [activeStory, setActiveStory] = useState(null)

  useEffect(() => {
    if (sprints) {
      const sprintStories = sprints
        .filter((s) => s.status === 'active')
        .flatMap((sprint) => {
          const sprintStories = sprint.stories || []
          return sprintStories.map((story) => ({
            ...story,
            sprint: {
              id: sprint.id,
              name: sprint.name,
              start_date: sprint.start_date,
              end_date: sprint.end_date,
            },
          }))
        })
      setLocalStories(sprintStories)
    }
  }, [sprints])
  const storiesByStatus = useMemo(() => {
    const columns = { todo: [], in_progress: [], testing: [], done: [] }
    localStories.forEach((story) => {
      const status = story.pivot?.kanban_status || 'todo'
      if (columns[status]) {
        columns[status].push(story)
      }
    })
    return columns
  }, [localStories])

  const moveStory = (story, storyId, newStatus) => {
    const sprintId = story?.pivot?.sprint_id || null
    const previousStories = localStories
    setLocalStories((prevStories) =>
      prevStories.map((s) =>
        s.id === storyId
          ? {
              ...s,
              pivot: {
                ...s.pivot,
                kanban_status: newStatus,
              },
            }
          : s,
      ),
    )
    if (!sprintId) return
    router.patch(
      route('sprint-stories.update', sprintId),
      {
        story_id: storyId,
        kanban_status: newStatus,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page) => {
          if (page.props.project) {
            updateProject(page.props.project)
            const updatedSprint = page.props.project.sprints?.find(
              (s) => s.id === null, // ajeitar ,
            )
            if (updatedSprint?.stories) {
              setLocalStories(updatedSprint.stories)
            }
          }
        },
        onError: (errors) => {
          console.error('Erro ao mover story:', errors)
          // rollback otimista
          setLocalStories(previousStories)
        },
      },
    )
  }

  const handleDragStart = (event) => {
    if (!canManageSprint) return
    const story = event.active.data.current?.story
    if (story) {
      setActiveStory(story)
    }
  }

  const handleDragEnd = (event) => {
    if (!canManageSprint) {
      toast.error(sprintReason)
      setActiveStory(null)
      return
    }
    const { active, over } = event
    const story = active?.data.current?.story || null
    if (over && active.id !== over.id) {
      const storyId = active.id
      const fromColumn = active.data.current?.fromColumn
      const toColumn = over.id

      if (fromColumn && toColumn && fromColumn !== toColumn) {
        moveStory(story, storyId, toColumn)
      }
    }

    // ✅ Limpa a story ativa, independentemente de onde foi solta
    setActiveStory(null)
  }

  // ✅ Configuração dos sensores para dnd-kit (mouse, toque, teclado)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  )

  const columns = [
    { key: 'todo', title: t('sprint.kanban.todo') },
    { key: 'in_progress', title: t('sprint.kanban.in_progress') },
    { key: 'testing', title: t('sprint.kanban.testing') },
    { key: 'done', title: t('sprint.kanban.done') },
  ]

  if (!sprints) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4"></div>
        </CardHeader>
        <CardContent className="text-left py-8">
          <p className="text-muted-foreground">
            {t('sprint.no_sprint_selected')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalStories = localStories.length

  return (
    <div className="flex flex-col gap-y-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>{'Sprints Ativas'}</CardTitle>

            {/* {sprints
              .filter(
                (sprint) =>
                  isSprintActive(sprint) && sprint.status === 'active',
              )
              .map((sprint) => (
                <Badge variant="outline">{sprint.name}</Badge>
              ))} */}

            <Badge variant="outline">{t('sprint.stories_count', { count: totalStories })}</Badge>
          </div>
        </CardHeader>
      </Card>

      {totalStories === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">
              {t('sprint.no_stories_in_sprints')}
            </p>

            <p className="text-sm text-muted-foreground mt-2">
              {t('sprint.no_stories_hint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        // ✅ DndContext envolve todo o quadro para habilitar o drag-n-drop
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {columns.map((column) => (
              <KanbanColumn
                key={column.key}
                variant={column.key}
                id={column.key}
                title={column.title}
                stories={storiesByStatus[column.key]}
                systemColors={systemColors}
              />
            ))}
          </div>
          {/* ✅ O DragOverlay renderiza o card "flutuante" */}
          <DragOverlay>
            {activeStory ? (
              <KanbanStoryCard
                systemColors={systemColors}
                story={activeStory}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

export default KanbanBoard
