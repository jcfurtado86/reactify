import {
  ArrowRight,
  CornerDownRight,
  Minus,
  Check,
  X,
  ChevronsUp,
  Layers,
} from 'lucide-react'
import MotionDivOptions from '@/Components/MotionDivOptions'
import React from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { isTemporary, useGroupedStories } from '@/lib/utils'
import GenerateAIButton from '@/Components/GenerateAIButton'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { tooltipInfo } from '@/lib/projectData'
/**
 * Componente para renderizar um único card de estória.
 * Gerencia seu próprio estado de hover para exibir o botão de adicionar.
 * @param {{ story: object, addEpicStory: () => void }} props
 */

const GeneratedItemsModal = ({
  allStories,
  isModalMinimized,
  changeModalState,
  cancelGeneratedItems,
  generatedItems,
  toggleItemSelection,
  confirmGeneratedItems,
  toggleAllItems,
  systemColors,
}) => {
  const storyVariants = systemColors?.stories || {}
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
            {!isModalMinimized && 'Epic Stories por IA'}
            {isModalMinimized && 'Epic Stories Geradas'}
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
            <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-muted rounded-lg flex-shrink-0">
              <span className="text-foreground font-medium">
                {generatedItems.filter((j) => j.selected).length} de{' '}
                {generatedItems.length} selecionadas
              </span>
              <Button
                onClick={toggleAllItems}
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
              >
                {generatedItems.every((story) => story.selected)
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-2 pb-4">
                {generatedItems.map((story, index) => {
                  const storyType = allStories.find(
                    (s) => s.id === story.story_id,
                  ).type
                  const selectedVariant = storyVariants[story.type] || '#f97316'
                  return (
                    <div
                      key={'temp-' + index}
                      className={`rounded-lg p-3 border-2 transition-colors flex items-center gap-4 ${
                        story.selected
                          ? 'bg-muted border-primary'
                          : 'bg-muted/50 border-border hover:border-muted-foreground'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer flex-1 gap-4">
                        <div className="flex items-center gap-2 text-left">
                          <Badge
                            style={{ backgroundColor: selectedVariant }}
                            variant="outline"
                            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
                          >
                            {`${story.type === 'user' ? 'US' : 'SS'}${story.new_epic_identifier}`.toUpperCase()}
                          </Badge>

                          <span className="text-sm text-foreground">
                            {story.title}
                          </span>
                        </div>
                        <Checkbox
                          checked={story.selected}
                          onCheckedChange={() => toggleItemSelection(index)}
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
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
const StoryCard = ({ story, addEpicStory, systemColors }) => {
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'

  return (
    <div className="relative group text-left">
      <MotionDivOptions isHovered={true} onAdd={addEpicStory} />

      {/* Este é o corpo do card, com o estilo que você solicitou. */}
      <div
        className={`
          flex flex-col h-full w-52 items-center justify-start p-2 gap-1 text-sm font-normal text-foreground
          border border-border bg-card rounded-md shadow-sm transition-opacity duration-300 min-h-16
        `}
      >
        <div className="mr-auto">
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
          >
            {`${story.type === 'system' ? 'SS' : 'US'}${isTemporary(story.id) ? 'Temp-Id' : story.id}`.toUpperCase()}
          </Badge>
        </div>

        <p className="text-sm w-full">{story.title}</p>
      </div>
    </div>
  )
}

const EpicStoryCard = ({
  story,
  epicStory,
  lastElement = false,
  setProject,
  systemColors,
}) => {
  // ✨ ESTADOS PARA CONTROLE DA EDIÇÃO
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(epicStory.title)

  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'
  const realStoryId = epicStory.epic_id
    ? `${epicStory.epic_id}.${epicStory.epic_index || 0}`
    : `${story.id}`
  // ⚡️ FUNÇÕES PARA MANIPULAR A EDIÇÃO
  const handleEdit = () => {
    setEditValue(epicStory.title) // Garante que o input comece com o valor atual
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    if (editValue === epicStory.title) {
      setIsEditing(false)
      return
    }

    setProject((project) => ({
      ...project,
      stories: project.stories.map((story) => {
        if (story.id === epicStory.id) {
          return { ...story, title: editValue }
        }
        return story
      }),
    }))

    router.patch(
      route('story.update', epicStory.id),
      { title: editValue },
      {
        preserveScroll: true,
        onSuccess: () => setIsEditing(false),
      },
    )
  }
  const handleDelete = () => {
    setProject((project) => ({
      ...project,
      stories: project.stories.filter((s) => s.id !== epicStory.id),
    }))

    router.delete(route('story.delete', epicStory.id), {
      preserveScroll: true,
    })
  }
  return (
    <section className="epicStory flex flex-1 items-center  max-w-md md:max-w-4xl gap-1">
      {lastElement ? (
        <CornerDownRight className="text-primary size-5 " />
      ) : (
        <ArrowRight className="text-primary size-5 " />
      )}
      <div
        onMouseEnter={() => !isEditing && setIsHovered(true)} // Desativa o hover durante a edição
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex w-full h-full"
      >
        <MotionDivOptions
          isHovered={isHovered}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div
          className={`
            flex flex-1 items-start justify-start p-2 gap-2 text-xs font-normal text-foreground bg-card text-left
            border border-border rounded-md shadow-sm transition-opacity duration-300 min-h-16
          `}
        >
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
          >
            {`${story.type === 'system' ? 'SS' : 'US'}${
              realStoryId
            }`.toUpperCase()}
          </Badge>

          {/* 🎨 RENDERIZAÇÃO CONDICIONAL: MODO DE EDIÇÃO OU VISUALIZAÇÃO */}
          {isEditing ? (
            <div className="w-full flex flex-col items-center gap-2">
              <ReactTextareaAutosize
                id="description"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-transparent border-0  w-full rounded text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
              {/* <div className="flex items-center gap-2 self-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive/80 hover:bg-destructive/10"
                  onClick={handleCancel}
                >
                  <X className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-green-500 hover:bg-green-500/10"
                  onClick={handleSave}
                >
                  <Check className="size-4" />
                </Button>
              </div>*/}
            </div>
          ) : (
            <p className="text-sm w-full min-h-[32px] flex items-center justify-start">
              {epicStory.title}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
/**
 * Componente principal que exibe a coluna de "Epic Stories".
 * Ele mapeia as estórias do projeto e renderiza um StoryCard para cada uma.
 * @param {{ project: object, setProject: (project: object) => void }} props
 */
const EpicStories = ({ project, setProject }) => {
  //ia states
  const [aiGeneratedEpicStories, setAiGeneratedEpicStories] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  // memoriza o estado das stories derivadas
  const childrenByEpicId = useGroupedStories(project?.stories)
  const hasStories = project?.stories && project.stories.length > 0

  const addEpicStory = (story) => {
    router.post(route('story.store'), {
      epic_id: story.id,
      type: story.type,
      project_id: project.id,
      title: 'Nova Story Derivada',
    })
    setProject((prevProject) => ({
      ...prevProject,
      stories: [
        ...prevProject.stories,
        {
          epic_id: story.id,
          type: story.type,
          project_id: project.id,
          title: 'Nova Story Derivada',
          id: `temp-${new Date()}`,
        },
      ],
    }))
  }
  // ai functions
  const generateEpicStories = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('epic-story.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const epicStoriesWithSelection = data.decomposed_epics.flatMap((epic) =>
          epic.new_stories.map((newStory, index) => ({
            ...newStory,
            story_id: epic.original_epic_id,
            selected: true,
            new_epic_identifier: `${epic.original_epic_id}.${index + 1}`,
          })),
        )

        if (epicStoriesWithSelection.length === 0) {
          toast.info(
            'Nenhuma estória foi identificada como um épico para decomposição.',
          )
          return
        }

        setAiGeneratedEpicStories(epicStoriesWithSelection)
        setShowAiModal(true)
        toast.success(
          `${epicStoriesWithSelection.length} estórias menores foram sugeridas.`,
        )
      } else {
        if (data.status === 'warning') {
          toast.warning(data.message)
        } else {
          toast.error(
            data.message || 'Ocorreu uma resposta inesperada do servidor.',
          )
        }
      }
    } catch (error) {
      console.error('Erro ao gerar epic stories:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedEpicStories = () => {
    const selectedEpicStories = aiGeneratedEpicStories.filter(
      (epic_story) => epic_story.selected,
    )
    const remainingEpicStories = aiGeneratedEpicStories.filter(
      (epic_story) => !epic_story.selected,
    )

    if (selectedEpicStories.length === 0) {
      toast.warning('Selecione pelo menos uma estória para adicionar.')
      return
    }

    // O backend espera 'title', 'story_id' (o ID do épico original) e 'project_id'
    const storiesForBackend = selectedEpicStories.map(
      ({ title, story_id, type }) => ({
        title,
        epic_id: story_id, // Renomeie 'story_id' para 'epic_id'
        project_id: project.id,
        type: type,
      }),
    )

    router.post(
      route('story.bulk-store'),
      { stories: storiesForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedEpicStories.length} Stories adicionada com sucesso!`,
          )
          setAiGeneratedEpicStories(remainingEpicStories)
          if (remainingEpicStories.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error('Ocorreu um erro ao salvar as stories.')
          console.error('Erro do backend:', errors)
        },
      },
    )
  }

  const cancelGeneratedEpicStories = () => {
    setShowAiModal(false)
    setAiGeneratedEpicStories([])
    setIsModalMinimized(false)
  }

  const toggleEpicStorySelection = (index) => {
    setAiGeneratedEpicStories((prev) =>
      prev.map((story, i) =>
        i === index ? { ...story, selected: !story.selected } : story,
      ),
    )
  }

  const toggleAllEpicStories = () => {
    const allSelected = aiGeneratedEpicStories.every((story) => story.selected)
    setAiGeneratedEpicStories((prev) =>
      prev.map((story) => ({ ...story, selected: !allSelected })),
    )
  }

  return (
    <section className="p-2 flex flex-col gap-2">
      {showAiModal && (
        <GeneratedItemsModal
          allStories={project?.stories}
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedEpicStories}
          generatedItems={aiGeneratedEpicStories}
          toggleItemSelection={toggleEpicStorySelection}
          confirmGeneratedItems={confirmGeneratedEpicStories}
          toggleAllItems={toggleAllEpicStories}
          systemColors={project?.system_colors}
        />
      )}
      {!hasStories && (
        <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px]">
          <Layers size={40} className="mb-4 text-primary" />
          <p className="mb-2 font-medium text-foreground">Nenhuma Story</p>
          <p className="mb-4 text-sm text-center max-w-xs">
            Não é possível decompor épicos pois nenhuma story foi criada ainda.
          </p>
        </div>
      )}
      {/* user stories*/}
      {project?.stories
        ?.filter((story) => story.type === 'user' && !story.epic_id)
        .map((story, i) => {
          const relatedEpics = childrenByEpicId.get(story.id) || []
          return (
            <section className="py-1 flex items-stretch" key={story.id}>
              <StoryCard
                story={story}
                addEpicStory={() => addEpicStory(story)}
                systemColors={project?.system_colors}
              />

              <div className="flex flex-col gap-1 w-full">
                {[...relatedEpics]
                  .sort((a, b) => a.id - b.id)
                  .map((epicStory, index, array) => (
                    <EpicStoryCard
                      epicStoryId={index + 1}
                      key={epicStory.id}
                      story={story}
                      epicStory={epicStory}
                      lastElement={
                        index === array.length - 1 && array.length > 1
                      }
                      setProject={setProject}
                      systemColors={project?.system_colors}
                    />
                  ))}
              </div>
            </section>
          )
        })}
      {/* system stories*/}
      {project?.stories
        ?.filter((story) => story.type === 'system' && !story.epic_id)
        .map((story, i) => {
          const relatedEpics = childrenByEpicId.get(story.id) || []
          return (
            <section className="py-1 flex gap-1 items-stretch" key={story.id}>
              <StoryCard
                story={story}
                addEpicStory={() => addEpicStory(story)}
                systemColors={project?.system_colors}
              />

              <div className="flex flex-col gap-1 w-full">
                {[...relatedEpics]
                  .sort((a, b) => a.id - b.id)
                  .map((epicStory, index, array) => (
                    <EpicStoryCard
                      key={epicStory.id}
                      story={story}
                      epicStory={epicStory}
                      lastElement={
                        index === array.length - 1 && array.length > 1
                      }
                      setProject={setProject}
                      systemColors={project?.system_colors}
                    />
                  ))}
              </div>
            </section>
          )
        })}

      <GenerateAIButton
        isGenerating={isGenerating}
        onClick={generateEpicStories}
        tooltip={tooltipInfo.aiGeneratedEpic}
        className="w-1/2"
      />
    </section>
  )
}

export default EpicStories
