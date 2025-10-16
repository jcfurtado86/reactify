import React, { useState, useEffect, useRef } from 'react'
import MotionDivOptions from '@/Components/MotionDivOptions'
import {
  Plus,
  X,
  Check,
  LoaderCircle,
  ChevronsUp,
  Minus,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { router } from '@inertiajs/react'
import TextareaAutosize from 'react-textarea-autosize'
import axios from 'axios'
import { toast } from 'sonner'
import { isTemporary } from '@/lib/utils'
import InfoButton from '@/Components/InfoButton'
import { tooltipInfo } from '@/lib/projectData'
import GenerateAIButton from '@/Components/GenerateAIButton'
export const storyVariants = {
  user: { bg: 'bg-purple-600', title: 'user' },
  system: { bg: 'bg-orange-600', title: 'system' },
}
import InvestCard from '../Inspection/InvestCard'

const GeneratedItemsModal = ({
  isModalMinimized,
  changeModalState,
  cancelGeneratedItems,
  generatedItems,
  toggleItemSelection,
  confirmGeneratedItems,
  toggleAllItems,
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
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {!isModalMinimized && 'Stories Geradas por IA'}
            {isModalMinimized && 'Stories Geradas'}
          </h3>
          <div className="flex items-center gap-2">
            <Button onClick={changeModalState} size="icon" variant="secondary">
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
                  const selectedVariant =
                    storyVariants[story.type] || storyVariants.user
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
                            variant="outline"
                            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer ${selectedVariant.bg}`}
                          >
                            {story.type === 'system' ? 'SS' : 'US'}
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

const StoryItem = ({
  story,
  isEditing,
  editValue,
  onValueChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onInspect,
  isTemporary,
  textareaRef,
  typeSelectId,
  onToggleTypeSelect,
  onChangeStoryType,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave()
    }
  }

  const selectedVariant = storyVariants[story.type] || storyVariants.user

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
      data-card-id={story.id}
    >
      <Card className="bg-card border-0 transition-all duration-300 ease-in-out rounded">
        <CardContent className="p-2 flex items-center justify-between gap-2">
          <div className="flex flex-col items-start justify-between gap-2 flex-1 min-w-0">
            <Popover
              open={typeSelectId === story.id}
              onOpenChange={onToggleTypeSelect}
            >
              <PopoverTrigger className="flex">
                <Badge
                  variant="outline"
                  className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer ${selectedVariant.bg}`}
                >
                  {`${story.type === 'system' ? 'SS' : 'US'}${isTemporary ? '' : story.id}`.toUpperCase()}
                  <ChevronDown className="ml-1 size-3" />
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-auto bg-popover border-border p-1">
                <div className="flex flex-col gap-1">
                  {Object.values(storyVariants).map((variant, i) => (
                    <Button
                      key={`temp-${i}`}
                      variant="ghost"
                      className="h-auto p-2 justify-start "
                      onClick={() => onChangeStoryType(story.id, variant.title)}
                    >
                      <Badge
                        variant="outline"
                        className={`border-transparent text-primary-foreground font-bold w-full cursor-pointer ${variant.bg}`}
                      >
                        {`${variant.title === 'system' ? 'ss' : 'us'}`.toUpperCase()}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {isEditing ? (
              <div className="flex w-full items-center gap-2">
                <TextareaAutosize
                  ref={textareaRef}
                  value={editValue}
                  onChange={onValueChange}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm border-0 resize-none appearance-none overflow-hidden bg-transparent p-0 m-0 font-normal text-foreground focus-visible:outline-none focus-visible:ring-0"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive/80 hover:bg-destructive/10"
                  onClick={onCancel}
                >
                  <X className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-green-500 hover:bg-green-500/10"
                  onClick={onSave}
                >
                  <Check className="size-4" />
                </Button>
              </div>
            ) : (
              <p className="m-0 text-sm text-foreground break-words w-full">
                {story.title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isTemporary && (
              <LoaderCircle className="text-primary animate-spin" />
            )}
          </div>
          <MotionDivOptions
            isHovered={isHovered}
            isEditing={isEditing}
            isTemporary={isTemporary}
            onEdit={onEdit}
            onDelete={onDelete}
            onInspect={onInspect}
          />
        </CardContent>
      </Card>
    </div>
  )
}

const Stories = ({ project, setProject }) => {
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  //
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef(null)
  const [typeSelectId, setTypeSelectId] = useState(null)
  // ai states
  const [aiGeneratedStories, setAiGeneratedStories] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)

  const isTemporary = (story) =>
    typeof story.id === 'string' && story.id.startsWith('temp-')

  const handleInputChange = (e) => {
    setEditValue(e.target.value)
  }

  const toggleTypeSelect = (storyId) => {
    if (typeSelectId === storyId) {
      setTypeSelectId(null)
    } else {
      setTypeSelectId(storyId)
    }
  }

  const addNewStory = (type = 'user') => {
    setProject({
      ...project,
      stories: [
        ...project.stories,
        {
          id: `temp-${Date.now()}`,
          title: 'Nova Story',
          type: type,
        },
      ],
    })

    router.post(
      route('story.store'),
      {
        title: 'Nova Story',
        type: type,
        project_id: project.id,
      },
      { preserveState: true, preserveScroll: true },
    )
  }
  // inspection function
  const inspectStory = (story) => {
    if (inspectionId === story.id) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${story.id}"]`)
      setAnchorEl(element)
      setInspectionId(story.id)
    }
  }
  const editStory = (story) => {
    if (editingId === story.id) {
      if (story.title !== editValue) {
        const updatedStories = project.stories.map((s) =>
          s.id === story.id
            ? {
                ...s,
                title: editValue,
                updated_at: new Date().toISOString(),
              }
            : s,
        )

        setProject({ ...project, stories: updatedStories })

        router.patch(route('story.update', story.id), {
          title: editValue,
        })
      }
      setEditingId(null)
    } else {
      setEditingId(story.id)
      setEditValue(story.title)
    }
  }

  const changeStoryType = (storyId, newType) => {
    const story = project.stories.find((s) => s.id === storyId)

    if (story.type !== newType) {
      const updatedStories = project.stories.map((s) =>
        s.id === storyId
          ? {
              ...s,
              type: newType,
              updated_at: new Date().toISOString(),
            }
          : s,
      )

      setProject({ ...project, stories: updatedStories })

      router.patch(route('story.update', storyId), {
        type: newType,
      })
    }

    setTypeSelectId(null)
  }

  const deleteStory = (storyId) => {
    const updatedStories = project?.stories.filter((s) => s.id !== storyId)
    setProject({ ...project, stories: updatedStories })
    router.delete(route('story.delete', storyId))
  }

  //ai functions
  const generateStories = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('story.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const storiesWithSelection = data.message.stories.map((story) => ({
          ...story,
          selected: true,
        }))

        if (storiesWithSelection.length === 0) {
          toast.info(
            'A IA não gerou novas estórias com base no contexto atual.',
          )
          setIsGenerating(false)
          return
        }

        setAiGeneratedStories(storiesWithSelection)
        setShowAiModal(true)
        toast.success('Histórias geradas com sucesso.')
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
      console.error('Erro ao gerar stories:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleStorySelection = (index) => {
    setAiGeneratedStories((prev) =>
      prev.map((story, i) =>
        i === index ? { ...story, selected: !story.selected } : story,
      ),
    )
  }

  const toggleAllStories = () => {
    const allSelected = aiGeneratedStories.every((story) => story.selected)
    setAiGeneratedStories((prev) =>
      prev.map((story) => ({ ...story, selected: !allSelected })),
    )
  }

  const confirmGeneratedStories = () => {
    const selectedStories = aiGeneratedStories.filter((story) => story.selected)
    const remainingStories = aiGeneratedStories.filter(
      (story) => !story.selected,
    )

    if (selectedStories.length === 0) {
      toast.warning('Selecione pelo menos uma story para adicionar.')
      return
    }

    const storiesToAdd = selectedStories.map((story) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      project_id: project.id,
      ...story,
    }))

    setProject((prevProject) => ({
      ...prevProject,
      stories: [...(prevProject.stories || []), ...storiesToAdd],
    }))

    const storiesForBackend = selectedStories.map(({ title, type }) => ({
      title,
      type,
      project_id: project.id,
    }))

    router.post(
      route('story.bulk-store'),
      { stories: storiesForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedStories.length} storie(s) adicionada(s) com sucesso!`,
          )
          setAiGeneratedStories(remainingStories)
          if (remainingStories.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error('Ocorreu um erro ao salvar as stories.')
          console.error('Erro do backend:', errors)
          setProject((prevProject) => {
            const storiesToAddIds = storiesToAdd.map((s) => s.id)
            return {
              ...prevProject,
              stories: prevProject.stories.filter(
                (s) => !storiesToAddIds.includes(s.id),
              ),
            }
          })
        },
      },
    )
  }

  const cancelGeneratedStories = () => {
    setShowAiModal(false)
    setAiGeneratedStories([])
    setIsModalMinimized(false)
  }

  return (
    <div className="stories rounded grid grid-cols-2 gap-2 w-full p-4 cursor-pointer items-start">
      {showAiModal && (
        <GeneratedItemsModal
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedStories}
          generatedItems={aiGeneratedStories}
          toggleItemSelection={toggleStorySelection}
          confirmGeneratedItems={confirmGeneratedStories}
          toggleAllItems={toggleAllStories}
        />
      )}
      {inspectionId && (
        <InvestCard
          itemCategory={'stories'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}

      <div className="flex flex-col gap-2 ">
        <InfoButton
          data={tooltipInfo.userStory}
          badgeContent={
            project?.stories?.filter((story) => story.type === 'user').length ||
            0
          }
        />

        {project?.stories?.length > 0 ? (
          project?.stories
            .filter((story) => story.type === 'user')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map((story, i) => {
              return (
                <StoryItem
                  key={story.id}
                  story={story}
                  isEditing={editingId === story.id}
                  editValue={editValue}
                  onValueChange={handleInputChange}
                  onInspect={(e) => inspectStory(story)}
                  onEdit={() => editStory(story)}
                  onSave={() => editStory(story)}
                  onDelete={() => deleteStory(story.id)}
                  onCancel={() => setEditingId(null)}
                  isTemporary={isTemporary(story)}
                  textareaRef={editingId === story.id ? textareaRef : null}
                  typeSelectId={typeSelectId}
                  onToggleTypeSelect={() => toggleTypeSelect(story.id)}
                  onChangeStoryType={changeStoryType}
                />
              )
            })
        ) : (
          <div className="bg-card rounded-lg p-4 shadow-md">
            <div className="flex items-center mb-2">
              <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full">
                Em andamento
              </div>
            </div>
            <div className="text-foreground text-base font-medium mb-4">
              criar get da tela de edição update e delete dos psr
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-foreground">
                E
              </div>
              <span className="ml-2 text-muted-foreground text-sm">
                Eduardo Rodrigues
              </span>
            </div>
          </div>
        )}
        <Button
          className="flex items-center justify-center py-1 bg-card hover:bg-muted text-primary rounded-lg transition-colors shadow-md"
          onClick={() => addNewStory('user')}
        >
          <Plus size={18} className="mr-2" />
          <span>Nova User Story</span>
        </Button>
      </div>
      <div className="flex flex-col gap-2 ">
        <InfoButton
          data={tooltipInfo.systemStory}
          badgeContent={
            project?.stories?.filter((story) => story.type === 'system')
              .length || 0
          }
        />
        {project?.stories?.length > 0 &&
          project?.stories
            .filter((story) => story.type === 'system')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map((story, i) => {
              return (
                <StoryItem
                  key={story.id}
                  story={story}
                  isEditing={editingId === story.id}
                  editValue={editValue}
                  onValueChange={handleInputChange}
                  onInspect={() => inspectStory(story)}
                  onEdit={() => editStory(story)}
                  onSave={() => editStory(story)}
                  onDelete={() => deleteStory(story.id)}
                  onCancel={() => setEditingId(null)}
                  isTemporary={isTemporary(story)}
                  textareaRef={editingId === story.id ? textareaRef : null}
                  typeSelectId={typeSelectId}
                  onToggleTypeSelect={() => toggleTypeSelect(story.id)}
                  onChangeStoryType={changeStoryType}
                />
              )
            })}
        <Button
          className="flex items-center justify-center py-1 bg-card hover:bg-muted text-primary rounded-lg transition-colors shadow-md"
          onClick={() => addNewStory('system')}
        >
          <Plus size={18} className="mr-2" />
          <span>Nova System Story</span>
        </Button>
        <GenerateAIButton
          isGenerating={isGenerating}
          onClick={generateStories}
          tooltip={tooltipInfo.aiGeneratedStory}
          className="w-1/2"
        />
      </div>
    </div>
  )
}

export default Stories
