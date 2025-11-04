// resources/js/Pages/Project/project-ceremonies/Sprint/KanbanBoard.jsx
import { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'

// ============================================================================
// Subcomponente para o Card da Story (Item Arrastável)
// ============================================================================
const KanbanStoryCard = ({ story, columnKey, isOverlay, systemColors }) => {
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
  const storyVariants = systemColors?.stories

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className={`p-3 ${overlayClasses}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <Badge
              style={{ backgroundColor: storyVariants[story.type] }}
              variant="outline"
              className="border-transparent text-primary-foreground font-bold cursor-pointer"
            >
              US{story.id}
            </Badge>
          </div>
          <p className="text-sm font-medium text-left">{story.title}</p>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// Subcomponente para a Coluna do Kanban (Área de Soltar)
// ============================================================================
const KanbanColumn = ({ id, title, variant, stories, systemColors }) => {
  // ✅ Hook do dnd-kit para tornar este componente uma área de soltar
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <Card
      ref={setNodeRef}
      className={`min-h-96 transition-colors ${isOver ? 'bg-muted/50' : ''}`} // Feedback visual ao passar por cima
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-center text-sm">
          <span className="capitalize">{title}</span>
          <Badge variant={variant}>{stories.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
const KanbanBoard = ({ sprint, project, setView, updateProject }) => {
  const [localStories, setLocalStories] = useState([])
  // ✅ Estado para armazenar a story que está sendo arrastada
  const [activeStory, setActiveStory] = useState(null)

  useEffect(() => {
    if (sprint?.stories) {
      setLocalStories(sprint.stories)
    }
  }, [sprint])
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

  const moveStory = (storyId, newStatus) => {
    // A lógica de UI otimista permanece a mesma - isso é ótimo!
    setLocalStories((prevStories) =>
      prevStories.map((story) =>
        story.id === storyId
          ? {
              ...story,
              pivot: {
                ...story.pivot,
                kanban_status: newStatus,
              },
            }
          : story,
      ),
    )

    router.patch(
      route('sprint-stories.update', sprint.id),
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
              (s) => s.id === sprint.id,
            )
            if (updatedSprint?.stories) {
              setLocalStories(updatedSprint.stories)
            }
          }
        },
        onError: (errors) => {
          console.error('Erro ao mover story:', errors)
          if (sprint?.stories) {
            setLocalStories(sprint.stories)
          }
        },
      },
    )
  }

  // ✅ Novo handler: chamado quando o arraste COMEÇA
  const handleDragStart = (event) => {
    const story = event.active.data.current?.story
    if (story) {
      setActiveStory(story)
    }
  }

  // ✅ Handler atualizado: chamado quando o arraste TERMINA
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const storyId = active.id
      const fromColumn = active.data.current?.fromColumn
      const toColumn = over.id

      if (fromColumn && toColumn && fromColumn !== toColumn) {
        moveStory(storyId, toColumn)
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
    { key: 'todo', title: 'To Do', variant: 'secondary' },
    { key: 'in_progress', title: 'In Progress', variant: 'secondary' },
    { key: 'testing', title: 'Testing', variant: 'secondary' },
    { key: 'done', title: 'Done', variant: 'secondary' },
  ]

  // A lógica de renderização para o estado de 'nenhuma sprint' permanece a mesma
  if (!sprint) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setView('list')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-left py-8">
          <p className="text-muted-foreground">Nenhuma sprint selecionada</p>
        </CardContent>
      </Card>
    )
  }

  const totalStories = localStories.length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setView('list')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
            <CardTitle>{sprint.name}</CardTitle>
            <Badge variant="outline">{totalStories} stories total</Badge>
          </div>
        </CardHeader>
      </Card>

      {totalStories === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Esta sprint não possui stories ainda.
            </p>
            <Button variant="outline" onClick={() => setView('list')}>
              Voltar para a lista de sprints
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              e adicione stories do Product Backlog.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.key}
                id={column.key}
                title={column.title}
                variant={column.variant}
                stories={storiesByStatus[column.key]}
                systemColors={project?.system_colors}
              />
            ))}
          </div>
          {/* ✅ O DragOverlay renderiza o card "flutuante" */}
          <DragOverlay>
            {activeStory ? (
              <KanbanStoryCard
                systemColors={project?.system_colors}
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
