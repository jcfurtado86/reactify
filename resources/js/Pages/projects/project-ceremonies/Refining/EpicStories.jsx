import {
  ArrowRight,
  CornerDownRight,
  Layers,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MotionDivOptions from '@/Components/MotionDivOptions'
import React from 'react'
import { toast } from 'sonner'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'
import { router } from '@inertiajs/react'
import { isTemporary, useGroupedStories } from '@/lib/utils'
import GenerateAIButton from '@/Components/GenerateAIButton'
import AiGeneratedBadge from '@/Components/AiGeneratedBadge'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { usePage } from '@inertiajs/react' 
import { cn } from '@/lib/utils' 
import { useTooltipInfo } from '@/lib/projectData'
/**
 * Componente para renderizar um único card de estória.
 * Gerencia seu próprio estado de hover para exibir o botão de adicionar.
 * @param {{ story: object, addEpicStory: () => void }} props
 */

const StoryCard = ({ story, addEpicStory, systemColors }) => {
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'

  return (
    <div className="relative group text-left">
      <MotionDivOptions slot="userStory.manage" isHovered={true} onAdd={addEpicStory} />

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
  const { errors } = usePage().props
  const TITLE_MAX = 255; 
  // ✨ ESTADOS PARA CONTROLE DA EDIÇÃO
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(epicStory.title)
  const titleError = isEditing ? errors?.title : null;
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
    if (!editValue.trim() || editValue === epicStory.title) {
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
        preserveState: true,
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
      preserveState: true,
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
        <MotionDivOptions slot="userStory.manage"
          isHovered={isHovered}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div
          className={cn(
            "flex flex-1 items-start justify-start p-2 gap-2 text-xs font-normal text-foreground bg-card text-left border border-border rounded-md shadow-sm transition-opacity duration-300 min-h-16",
            titleError ? "border-destructive" : ""
          )}
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
                maxLength={TITLE_MAX}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className={cn(
                    "bg-transparent w-full rounded text-sm resize-none focus:outline-none p-0 border-0 focus:ring-0",
                    titleError ? "placeholder:text-destructive" : ""
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editValue.trim()) handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                autoFocus
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
              <div className="flex justify-between items-center w-full px-1 mt-1">
                 <span className="text-[10px] text-destructive font-bold h-3 block">
                    {titleError || (!editValue.trim() ? "Obrigatório" : "")}
                 </span>
                 <span className={cn(
                     "text-[10px]",
                     (editValue?.length || 0) >= TITLE_MAX ? "text-destructive font-bold" : "text-muted-foreground"
                 )}>
                    {(editValue?.length || 0)}/{TITLE_MAX}
                 </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 w-full min-h-[32px]">
              <p className="text-sm flex-1 flex items-center justify-start break-words whitespace-pre-wrap m-0">
                {epicStory.title}
              </p>
              <AiGeneratedBadge
                item={epicStory}
                type="stories"
                onDiscard={handleDelete}
              />
            </div>
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
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  // memoriza o estado das stories derivadas
  const childrenByEpicId = useGroupedStories(project?.stories)
  const hasStories = project?.stories && project.stories.length > 0

  const addEpicStory = (story) => {
    router.post(
      route('story.store'),
      {
        epic_id: story.id,
        type: story.type,
        project_id: project.id,
        title: 'Nova Story Derivada',
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toastSuccess('epic_stories.toast_added'),
        onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
      },
    )
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
    try {
      const response = await axios.post(route('epic-story.generate'), {
        project_id: project.id,
      })
      if (response.status === 202) {
        toast.info(
          t('ai.generation_queued', 'Geração na fila. Vai aparecer na tela quando ficar pronta.'),
        )
        router.reload({ only: ['pending_generations'] })
      } else if (response.data?.status === 'warning') {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Erro ao gerar epic stories:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    }
  }

  return (
    <section className="p-2 flex flex-col gap-2">
      {!hasStories && (
        <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px]">
          <Layers size={40} className="mb-4 text-primary" />
          <p className="mb-2 font-medium text-foreground">{t('epic_stories.no_story_title')}</p>
          <p className="mb-4 text-sm text-center max-w-xs">
            {t('epic_stories.no_story_body')}
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
        type="epic_stories"
        onClick={generateEpicStories}
        tooltip={tooltipInfo.aiGeneratedEpic}
        className="w-1/2"
      />
    </section>
  )
}

export default EpicStories
