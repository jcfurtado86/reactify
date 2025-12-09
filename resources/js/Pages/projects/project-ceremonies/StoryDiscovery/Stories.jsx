import React, { useState, useRef } from 'react'
import { usePermissions } from '@/Context/PermissionContext'
import MotionDivOptions from '@/Components/MotionDivOptions'
import {
  Plus,
  X,
  Check,
  LoaderCircle,
  ChevronsUp,
  Minus,
  ChevronDown,
  BookText,
} from 'lucide-react'
import rainbowIcon from '/resources/images/rainbow.png'
import { router, usePage } from '@inertiajs/react'
import TextareaAutosize from 'react-textarea-autosize'
import axios from 'axios'
import { toast } from 'sonner'
import {
  PREDEFINED_COLORS,
  isTemporary,
  inspectionStatus,
  cn,
} from '@/lib/utils'
import { ColorOptions } from '@/Components/ColorComponents'
import InfoButton from '@/Components/InfoButton'
import { tooltipInfo } from '@/lib/projectData'
import GenerateAIButton from '@/Components/GenerateAIButton'
import InvestCard from '../Inspection/InvestCard'
import StatusBadge from '@/Components/StatusBadge'
const GeneratedItemsModal = ({
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
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-foreground text-sm rounded transition-colors"
              >
                {generatedItems.every((story) => story.selected)
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-2 pb-4">
                {generatedItems.map((story, index) => {
                  const selectedVariant = storyVariants[story.type] || '#444'
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
                            style={{
                              backgroundColor: selectedVariant,
                            }}
                            variant="outline"
                            className={`border-transparent text-foreground font-bold w-fit cursor-pointer`}
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
  systemColors,
  isEditing,
  editValue,
  onValueChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onInspect,
  textareaRef,
  typeSelectId,
  onToggleTypeSelect,
  onChangeStoryType,
  disabled = false,
  errors,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const status = inspectionStatus(story)

  const TITLE_MAX = 255
  // Verifica erro (assumindo edição única por vez)
  const titleError = isEditing ? errors?.title : null

  const handleColorSelect = (colorValue, variantTitle) => {
    const selectedColor = PREDEFINED_COLORS.find(
      (color) => color.color === colorValue,
    )
    if (!selectedColor) return
    router.post(route('system-color.store'), {
      stories: { ...systemColors?.stories, [variantTitle]: colorValue },
      project_id: story.project_id,
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave()
    }
  }
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'

  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.id}`
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
      data-card-id={story.id}
    >
      <Card
        className={cn(
          'bg-card border transition-all duration-300 ease-in-out rounded',
          titleError ? 'border-destructive' : '', // Borda vermelha no Card se erro
        )}
      >
        <CardContent
          className={cn('p-2 flex items-center justify-between gap-2')}
        >
          <div className="flex flex-col items-start justify-between gap-2 flex-1 min-w-0">
            <div className="flex gap-2 items-center">
              {/* exibe o popover apenas se a story nao for filha*/}
              {story.epic_id === null ? (
                <Popover
                  open={!disabled && typeSelectId === story.id}
                  onOpenChange={onToggleTypeSelect}
                >
                  <PopoverTrigger className="flex">
                    <Badge
                      style={{ backgroundColor: selectedVariant }}
                      variant="outline"
                      className={`border-transparent text-black font-bold w-fit cursor-pointer`}
                    >
                      {`${story.type === 'system' ? 'SS ' : 'US '}${isTemporary(story.id) ? '' : realStoryId}`}
                      <ChevronDown className="ml-1 size-3" />
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    alignOffset={-8}
                    className="w-auto bg-popover p-1 border border-border"
                  >
                    <div className="flex flex-col gap-1 w-24 ">
                      {Object.entries(storyVariants).map(([key, color], i) => (
                        <div key={`temp-${i}`} className="flex items-center ">
                          <Button
                            variant="ghost"
                            className="h-auto w-20 p-1 justify-start "
                            onClick={() => onChangeStoryType(story.id, key)}
                          >
                            <Badge
                              style={{ backgroundColor: color }}
                              variant="outline"
                              className={`border-transparent text-black font-bold w-full cursor-pointer`}
                            >
                              {`${key === 'system' ? 'ss' : 'us'}`.toUpperCase()}
                            </Badge>
                          </Button>
                          {/* editar cores*/}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" className="h-full w-6">
                                <img
                                  src={rainbowIcon}
                                  alt="color-picker-icon"
                                  className="object-contain z-20 max-w-5 h-full"
                                />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-52 p-2" align="start">
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm px-2 py-1.5">
                                  Cores
                                </h4>
                                <ColorOptions
                                  handleColorSelect={(e) =>
                                    handleColorSelect(e, key)
                                  }
                                  selectedValue={color}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Badge
                  style={{ backgroundColor: selectedVariant }}
                  variant="outline"
                  className={`border-transparent text-black font-bold w-fit cursor-pointer `}
                >
                  {`${story.type === 'system' ? 'SS ' : 'US '}${isTemporary(story.id) ? '' : realStoryId}`}
                </Badge>
              )}
              <StatusBadge status={status} />
              <div className="flex items-center gap-1">
                {isTemporary(story.id) && (
                  <LoaderCircle className="text-primary animate-spin size-5" />
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="flex flex-col w-full gap-1">
                <div className="flex w-full items-center gap-2">
                  <TextareaAutosize
                    ref={textareaRef}
                    maxLength={TITLE_MAX}
                    value={editValue}
                    onChange={onValueChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'w-full text-sm border-0 resize-none appearance-none overflow-hidden bg-transparent p-0 m-0 font-normal focus-visible:outline-none focus-visible:ring-0',
                      titleError || !editValue.trim()
                        ? 'text-foreground placeholder:text-destructive border-b border-destructive'
                        : 'text-foreground',
                    )}
                    autoFocus
                  />
                  <div className="flex items-center gap-1 shrink-0">
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
                      disabled={!editValue.trim()}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                </div>
                {/* Contador e Erro */}
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-destructive font-bold">
                    {titleError ||
                      (!editValue.trim() ? 'O título é obrigatório' : '')}
                  </span>
                  <span
                    className={cn(
                      'text-[10px]',
                      (editValue?.length || 0) >= TITLE_MAX
                        ? 'text-destructive font-bold'
                        : 'text-muted-foreground',
                    )}
                  >
                    {editValue?.length || 0}/{TITLE_MAX}
                  </span>
                </div>
              </div>
            ) : (
              <p className="m-0 text-sm text-foreground break-words whitespace-pre-wrap w-full min-w-0">
                {story.title}
              </p>
            )}
          </div>

          <MotionDivOptions
            isHovered={isHovered}
            isEditing={isEditing}
            isTemporary={isTemporary(story.id)}
            disabled={disabled}
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
  //
  const { can } = usePermissions()
  const { errors } = usePage().props
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
  const inspectStory = (storyId) => {
    if (inspectionId === storyId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${storyId}"]`)
      setAnchorEl(element)
      setInspectionId(storyId)
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
          systemColors={project?.system_colors}
        />
      )}
      {inspectionId && can('userStory.manage') && (
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
          badgeStyle={{
            backgroundColor: project?.system_colors?.stories.user,
          }}
          badgeContent={
            project?.stories?.filter((story) => story.type === 'user').length ||
            0
          }
        />

        {project?.stories?.filter((story) => story.type === 'user').length >
        0 ? (
          project?.stories
            .filter((story) => story.type === 'user' && !story.epic_id)
            .sort((a, b) => a.id - b.id)
            .map((story, i) => {
              return (
                <React.Fragment key={story.id}>
                  <StoryItem
                    story={story}
                    isEditing={editingId === story.id}
                    editValue={editValue}
                    onValueChange={handleInputChange}
                    onInspect={() => inspectStory(story.id)}
                    onEdit={() => editStory(story)}
                    onSave={() => editStory(story)}
                    onDelete={() => deleteStory(story.id)}
                    onCancel={() => setEditingId(null)}
                    textareaRef={editingId === story.id ? textareaRef : null}
                    typeSelectId={typeSelectId}
                    onToggleTypeSelect={() => toggleTypeSelect(story.id)}
                    onChangeStoryType={changeStoryType}
                    systemColors={project?.system_colors}
                    disabled={!can('userStory.manage')}
                    errors={errors}
                  />
                </React.Fragment>
              )
            })
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[100px]">
            <BookText size={32} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-center font-medium text-foreground">
              Nenhuma User Story
            </p>
          </div>
        )}

        {can('userStory.manage') && (
          <Button
            variant="secondary"
            onClick={() => addNewStory('user')}
            disabled={!can('userStory.manage')}
          >
            <Plus size={18} className="mr-2" />
            <span>Nova User Story</span>
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2 ">
        <InfoButton
          data={tooltipInfo.systemStory}
          badgeContent={
            project?.stories?.filter((story) => story.type === 'system')
              .length || 0
          }
        />
        {project?.stories?.filter((story) => story.type === 'system').length >
        0 ? (
          project?.stories
            .filter((story) => story.type === 'system')
            .sort((a, b) => a.id - b.id)
            .map((story, i) => {
              return (
                <React.Fragment key={story.id}>
                  <StoryItem
                    story={story}
                    isEditing={editingId === story.id}
                    editValue={editValue}
                    onValueChange={handleInputChange}
                    onInspect={() => inspectStory(story.id)}
                    onEdit={() => editStory(story)}
                    onSave={() => editStory(story)}
                    onDelete={() => deleteStory(story.id)}
                    onCancel={() => setEditingId(null)}
                    textareaRef={editingId === story.id ? textareaRef : null}
                    typeSelectId={typeSelectId}
                    onToggleTypeSelect={() => toggleTypeSelect(story.id)}
                    onChangeStoryType={changeStoryType}
                    systemColors={project?.system_colors}
                    disabled={!can('userStory.manage')}
                    errors={errors}
                  />
                </React.Fragment>
              )
            })
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[100px]">
            <BookText size={32} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-center font-medium text-foreground">
              Nenhuma System Story
            </p>
          </div>
        )}
        {can('userStory.manage') && (
          <>
            <Button
              variant="secondary"
              disabled={!can('userStory.manage')}
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
          </>
        )}
      </div>
    </div>
  )
}

export default Stories
