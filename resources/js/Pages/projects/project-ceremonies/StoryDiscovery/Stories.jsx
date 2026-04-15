import React, { useState, useRef, useMemo } from 'react'
import { usePermissions } from '@/Context/PermissionContext'
import { useTranslation } from 'react-i18next'
import MotionDivOptions from '@/Components/MotionDivOptions'
import {
  Plus,
  X,
  Check,
  LoaderCircle,
  ChevronDown,
  BookText,
} from 'lucide-react'
import rainbowIcon from '/resources/images/rainbow.png'
import { router, usePage } from '@inertiajs/react'
import TextareaAutosize from 'react-textarea-autosize'
import axios from 'axios'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/toastHelpers'
import {
  PREDEFINED_COLORS,
  isTemporary,
  inspectionStatus,
  cn,
} from '@/lib/utils'
import { ColorOptions } from '@/Components/ColorComponents'
import InfoButton from '@/Components/InfoButton'
import { useTooltipInfo } from '@/lib/projectData'
import GenerateAIButton from '@/Components/GenerateAIButton'
import InvestCard from '../Inspection/InvestCard'
import StatusBadge from '@/Components/StatusBadge'
import AiGeneratedBadge from '@/Components/AiGeneratedBadge'

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
  const { t } = useTranslation()
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
    router.post(
      route('system-color.store'),
      {
        stories: { ...systemColors?.stories, [variantTitle]: colorValue },
        project_id: story.project_id,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
      },
    )
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
                                  {t('color_components.title')}
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
              <AiGeneratedBadge
                item={story}
                type="stories"
                onDiscard={() => onDelete(story.id)}
              />
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
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  //
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef(null)
  const [typeSelectId, setTypeSelectId] = useState(null)
  //
  const { can } = usePermissions()
  const { errors } = usePage().props

  // Map epic_id -> [children] para renderizar filhas indentadas abaixo
  // da épica-pai. Permite exibição nested preservando as épicas na listagem.
  const childrenByEpicId = useMemo(() => {
    const map = new Map()
    ;(project?.stories || []).forEach((s) => {
      if (s.epic_id) {
        if (!map.has(s.epic_id)) map.set(s.epic_id, [])
        map.get(s.epic_id).push(s)
      }
    })
    map.forEach((arr) => arr.sort((a, b) => (a.epic_index ?? a.id) - (b.epic_index ?? b.id)))
    return map
  }, [project?.stories])

  const handleInputChange = (e) => {
    setEditValue(e.target.value)
  }

  // Renderiza uma story + (se for épica) suas filhas indentadas abaixo,
  // com uma barra lateral conectando visualmente a hierarquia.
  const renderStoryWithChildren = (story) => {
    const children = childrenByEpicId.get(story.id) || []
    const isEpic = (s) => (childrenByEpicId.get(s.id) || []).length > 0
    const commonProps = (s) => ({
      story: s,
      isEditing: editingId === s.id,
      editValue: editValue,
      onValueChange: handleInputChange,
      // INVEST não se aplica a épicas (falham em Small por definição).
      onInspect: isEpic(s) ? undefined : () => inspectStory(s.id),
      onEdit: () => editStory(s),
      onSave: () => editStory(s),
      onDelete: () => deleteStory(s.id),
      onCancel: () => setEditingId(null),
      textareaRef: editingId === s.id ? textareaRef : null,
      typeSelectId: typeSelectId,
      onToggleTypeSelect: () => toggleTypeSelect(s.id),
      onChangeStoryType: changeStoryType,
      systemColors: project?.system_colors,
      disabled: !can('userStory.manage'),
      errors: errors,
    })
    return (
      <React.Fragment key={story.id}>
        <StoryItem {...commonProps(story)} />
        {children.length > 0 && (
          <div className="ml-6 pl-4 border-l-2 border-primary/30 flex flex-col gap-2 my-1">
            {children.map((child) => (
              <StoryItem key={child.id} {...commonProps(child)} />
            ))}
          </div>
        )}
      </React.Fragment>
    )
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

        router.patch(
          route('story.update', story.id),
          {
            title: editValue,
          },
          {
            preserveScroll: true,
            preserveState: true,
            onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
          },
        )
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

      router.patch(
        route('story.update', storyId),
        {
          type: newType,
        },
        { preserveScroll: true, preserveState: true },
      )
    }

    setTypeSelectId(null)
  }

  const deleteStory = (storyId) => {
    const updatedStories = project?.stories.filter((s) => s.id !== storyId)
    setProject({ ...project, stories: updatedStories })
    router.delete(route('story.delete', storyId), {
      preserveScroll: true,
      preserveState: true,
    })
  }

  //ai functions
  const generateStories = async () => {
    try {
      const response = await axios.post(route('story.generate'), {
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
      console.error('Erro ao gerar stories:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    }
  }

  return (
    <div className="stories rounded grid grid-cols-2 gap-2 w-full p-4 cursor-pointer items-start">
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
            .map((story) => renderStoryWithChildren(story))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[100px]">
            <BookText size={32} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-center font-medium text-foreground">
              {t('stories.empty_user')}
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
            <span>{t('stories.new_user_story')}</span>
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
            .filter((story) => story.type === 'system' && !story.epic_id)
            .sort((a, b) => a.id - b.id)
            .map((story) => renderStoryWithChildren(story))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[100px]">
            <BookText size={32} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-center font-medium text-foreground">
              {t('stories.empty_system')}
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
              <span>{t('stories.new_system_story')}</span>
            </Button>
            <GenerateAIButton
              type="stories"
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
