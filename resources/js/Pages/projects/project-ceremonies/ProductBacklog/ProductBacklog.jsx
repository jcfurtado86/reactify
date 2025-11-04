import React, { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'

const ProductBacklog = ({ project, setProject }) => {
  const [localProject, setLocalProject] = useState(project)
  const [selectedStories, setSelectedStories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleNavigateToMatrix = () => {
    localStorage.setItem('activeStoryDiscoveryMenu', 'Matriz de Priorização')

    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'storyDiscovery',
      }),
    )
  }

  // ✅ Sincronizar estado local quando project muda
  useEffect(() => {
    setLocalProject(project)
  }, [project])

  const { productBacklogStories, sprintBacklogStories, deliveredStories } =
    useMemo(() => {
      const stories = localProject?.stories || []
      const sprints = localProject?.sprints || []

      const productBacklog = stories
        .filter((story) => {
          const isInActiveSprint = sprints.some(
            (sprint) =>
              (sprint.status === 'planning' || sprint.status === 'active') &&
              sprint.stories?.some(
                (sprintStory) => sprintStory.id === story.id,
              ),
          )

          return (
            (story.status === 'prioritized' || story.value !== null) &&
            !isInActiveSprint
          )
        })
        .sort((a, b) => {
          if (a.status === 'prioritized' && b.status !== 'prioritized')
            return -1
          if (b.status === 'prioritized' && a.status !== 'prioritized') return 1
          return (b.value ?? -1) - (a.value ?? -1)
        })

      const sprintBacklog = []
      const delivered = []

      sprints.forEach((sprint) => {
        if (sprint.status === 'planning' || sprint.status === 'active') {
          sprint.stories?.forEach((story) => {
            if (story.pivot?.kanban_status === 'done') {
              delivered.push({ ...story, sprint_name: sprint.name })
            } else {
              sprintBacklog.push({ ...story, sprint_name: sprint.name })
            }
          })
        }
      })

      return {
        productBacklogStories: productBacklog,
        sprintBacklogStories: sprintBacklog,
        deliveredStories: delivered,
      }
    }, [localProject])

  const handleStorySelection = (storyId) => {
    setSelectedStories((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId],
    )
  }

  const moveToSprint = async (sprintId) => {
    if (selectedStories.length === 0) return

    setIsLoading(true)

    setLocalProject((prevProject) => {
      const updatedProject = { ...prevProject }
      const targetSprint = updatedProject.sprints.find((s) => s.id === sprintId)

      if (targetSprint) {
        // Adicionar stories selecionadas ao sprint
        const storiesToMove = updatedProject.stories.filter((s) =>
          selectedStories.includes(s.id),
        )
        targetSprint.stories = [
          ...(targetSprint.stories || []),
          ...storiesToMove,
        ]
      }

      return updatedProject
    })

    router.post(
      route('sprint-stories.store', sprintId),
      {
        story_ids: selectedStories,
      },
      {
        onSuccess: (page) => {
          setSelectedStories([])
          setIsLoading(false)
          toast.success('Stories moved to sprint successfully!')

          if (page.props.project) {
            setProject(page.props.project)
            setLocalProject(page.props.project)
          }
        },
        onError: (errors) => {
          setIsLoading(false)
          setError('Failed to move stories to sprint')
          toast.error('Failed to move stories to sprint')
          console.error('Error:', errors)

          setLocalProject(project)
        },
      },
    )
  }

  const board = {
    productBacklog: productBacklogStories,
    sprintBacklog: sprintBacklogStories,
    delivered: deliveredStories,
  }

  const columnTitles = {
    productBacklog: 'Product Backlog',
    sprintBacklog: 'Sprint Backlog',
    delivered: 'Delivered',
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  const storyVariants = project?.system_colors?.stories || {}

  return (
    <div className="flex space-x-4 p-4 min-h-[500px]">
      {Object.keys(board).map((columnId) => (
        <Card key={columnId} className="w-1/3 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">{columnTitles[columnId]}</CardTitle>

            {columnId === 'productBacklog' && (
              <div className="pt-1 flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Exibe stories priorizadas na Matriz de Priorização. Ainda não
                  estão em uma Sprint.
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit" // 'w-fit' para o botão não ocupar a largura toda
                  onClick={handleNavigateToMatrix}
                >
                  Ir para Matriz de Priorização
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-sm text-muted-foreground">
                  Selecione as Stories para Sprint
                </p>
              </div>
            )}

            {columnId === 'sprintBacklog' && (
              <p className="text-sm text-muted-foreground pt-1">
                Stories em Sprints atuais (ativas ou em planejamento) aparecerâo
                aqui.
              </p>
            )}

            {columnId === 'delivered' && (
              <p className="text-sm text-muted-foreground pt-1">
                Stories concluídas (status 'Done') dentro das Sprints atuais
                (ativas ou em planejamento).
              </p>
            )}

            {/* Action buttons for Product Backlog */}
            {columnId === 'productBacklog' && selectedStories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {selectedStories.length} stories selected
                </p>
                {localProject.sprints
                  ?.filter((s) => s.status === 'planning')
                  .map((sprint) => (
                    <Button
                      key={sprint.id}
                      onClick={() => moveToSprint(sprint.id)}
                      variant="default"
                      size="sm"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Moving...
                        </>
                      ) : (
                        `Move to ${sprint.name}`
                      )}
                    </Button>
                  ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1">
            <div className="space-y-3">
              {board[columnId].length > 0 ? (
                board[columnId].map((card) => (
                  <Card
                    key={card.id}
                    className={`
                      cursor-pointer transition-all duration-200

                      ${columnId === 'productBacklog' && selectedStories.includes(card.id) ? 'ring-2 ring-primary' : ''}
                      hover:shadow-md
                    `}
                    onClick={() =>
                      columnId === 'productBacklog' &&
                      handleStorySelection(card.id)
                    }
                  >
                    <CardContent className="p-3">
                      <Badge
                        style={{ backgroundColor: storyVariants[card.type] }}
                        variant="outline"
                        className="border-transparent text-primary-foreground font-bold cursor-pointer"
                      >{`US${card.id}`}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.title}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {card.sprint_name && (
                          <Badge variant="secondary" className="text-xs">
                            {card.sprint_name}
                          </Badge>
                        )}
                        {/* {card.status === 'prioritized' && (
                          <Badge variant="default" className="text-xs">
                            Prioritized
                          </Badge>
                        )}*/}
                      </div>

                      {card.value && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Value: {card.value}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-8">
                  Sem stories nessa coluna.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ProductBacklog
