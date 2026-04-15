import { usePermissions } from '@/Context/PermissionContext'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Check,
  Minus,
  X,
  LoaderCircle,
  ChevronDown,
  ChevronsUp,
  EllipsisVertical,
  Goal,
} from 'lucide-react'
import rainbowIcon from '/resources/images/rainbow.png'
import TextareaAutosize from 'react-textarea-autosize'
import { router } from '@inertiajs/react'
import {
  PREDEFINED_COLORS,
  cn,
  inspectionStatus,
  isTemporary,
} from '@/lib/utils'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { useTooltipInfo } from '@/lib/projectData'
import InfoButton from '@/Components/InfoButton'
import GenerateAIButton from '@/Components/GenerateAIButton'
import AiGeneratedBadge from '@/Components/AiGeneratedBadge'
import { ColorOptions } from '@/Components/ColorComponents'
import { toast } from 'sonner'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'
import InvestCard from '../Inspection/InvestCard'
import StatusBadge from '@/Components/StatusBadge'
import { usePage } from '@inertiajs/react'

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
  const { t } = useTranslation()
  const goalVariants = systemColors?.goals || {}

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
            {!isModalMinimized &&
              t('ai_modal.ai_generated_title', {
                artifact: t('goals.plural'),
              })}
            {isModalMinimized &&
              t('ai_modal.ai_generated_title_minimized', {
                artifact: t('goals.plural'),
              })}
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
                {t('common.selected_count', {
                  selected: generatedItems.filter((j) => j.selected).length,
                  total: generatedItems.length,
                })}
              </span>
              <Button
                onClick={toggleAllItems}
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
              >
                {generatedItems.every((story) => story.selected)
                  ? t('common.deselect_all')
                  : t('common.select_all')}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-2 pb-4">
                {generatedItems.map((goal, index) => {
                  const selectedType = goalVariants[goal.type] || '#444'
                  const selectedPriority = goalVariants[goal.priority] || '#444'

                  return (
                    <div
                      key={'temp-' + index}
                      className={`rounded-lg p-3 border-2 transition-colors flex items-center gap-4 ${
                        goal.selected
                          ? 'bg-muted border-primary'
                          : 'bg-muted/50 border-border hover:border-muted-foreground'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer flex-1 gap-4">
                        <div className="flex items-center gap-2 text-left">
                          <Badge
                            style={{ backgroundColor: selectedType }}
                            className={cn(
                              'border-transparent text-background font-bold',
                            )}
                          >
                            {goal.type.toUpperCase()}
                          </Badge>
                          <Badge
                            style={{ backgroundColor: selectedPriority }}
                            className={cn(
                              'border-transparent text-background font-bold',
                            )}
                          >
                            {goal.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-foreground">
                            {goal.title}
                          </span>
                        </div>
                        <Checkbox
                          checked={goal.selected}
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
                {t('common.cancel')}
              </Button>
              <Button
                onClick={confirmGeneratedItems}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center"
                disabled={generatedItems.filter((j) => j.selected).length === 0}
              >
                <Check className="mr-2" size={16} />
                {t('ai_modal.confirm_add_count', {
                  count: generatedItems.filter((j) => j.selected).length,
                })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const GoalItem = ({
  goal,
  disabled = false,
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
  onChangeGoalType,
  prioritySelectId,
  onTogglePrioritySelect,
  onChangeGoalPriority,
  systemColors,
  errors,
}) => {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const status = inspectionStatus(goal)

  const TITLE_MAX = 255
  const titleError = isEditing ? errors?.title : null

  const handleColorSelect = (colorValue, variantTitle) => {
    const selectedColor = PREDEFINED_COLORS.find(
      (color) => color.color === colorValue,
    )
    if (!selectedColor) return
    router.post(
      route('system-color.store'),
      {
        goals: { ...systemColors?.goals, [variantTitle]: colorValue },
        project_id: goal.project_id,
      },
      {
        onError: (error) =>
          toastApiError(error, 'goals.toast_color_save_error'),
      },
    )
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave()
    }
  }

  const goalVariants = systemColors?.goals || {}
  const typeColors = {
    bg: goalVariants?.bg || '#444',
    cg: goalVariants?.cg || '#444',
  }
  const priorityColors = {
    low: goalVariants?.low || '#444',
    medium: goalVariants?.medium || '#444',
    high: goalVariants?.high || '#444',
  }
  const selectedType = goalVariants[goal.type] || '#444'
  const selectedPriority = goalVariants[goal.priority] || '#444'

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
      data-card-id={goal.id}
    >
      <Card
        className={cn(
          'bg-card border transition-all duration-300 ease-in-out rounded',
          titleError ? 'border-destructive' : '', // Borda vermelha no Card se houver erro
        )}
      >
        <CardContent className="p-2 flex flex-col gap-2">
          {/* Badge Row for Type and Priority */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Popover
                open={!disabled && typeSelectId === goal.id}
                onOpenChange={onToggleTypeSelect}
              >
                <PopoverTrigger disabled={isTemporary(goal.id)} className="flex">
                  <Badge
                    style={{ backgroundColor: selectedType }}
                    className={cn(
                      'border-transparent text-black font-bold cursor-pointer',
                    )}
                  >
                    {goal.type.toUpperCase()} {goal.id}
                    <ChevronDown className="ml-1 size-3" />
                  </Badge>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  alignOffset={-8}
                  className="w-auto bg-popover border-border p-1"
                >
                  <div className="flex flex-col gap-1">
                    {Object.entries(typeColors).map(([key, color], i) => (
                      <div key={`temp-${i}`} className="flex items-center ">
                        <Button
                          variant="ghost"
                          className="h-auto p-2 justify-start hover:bg-accent"
                          onClick={() => onChangeGoalType(goal.id, key)}
                        >
                          <Badge
                            style={{ backgroundColor: color }}
                            className={cn('w-full text-black')}
                          >
                            {key.toUpperCase()}
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
              <Popover
                open={!disabled && prioritySelectId === goal.id}
                onOpenChange={onTogglePrioritySelect}
              >
                <PopoverTrigger disabled={isTemporary(goal.id)} className="flex">
                  <Badge
                    style={{ backgroundColor: selectedPriority }}
                    className={cn(
                      'border-transparent text-black font-bold cursor-pointer',
                    )}
                  >
                    {goal.priority.toUpperCase()}
                    <ChevronDown className="ml-1 size-3" />
                  </Badge>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  alignOffset={-8}
                  className="w-auto bg-popover border-border p-1"
                >
                  <div className="flex flex-col gap-1">
                    {Object.entries(priorityColors).map(([key, color], i) => (
                      <div key={`temp-${i}`} className="flex items-center ">
                        <Button
                          variant="ghost"
                          className="h-auto p-2 justify-start hover:bg-accent"
                          onClick={() => onChangeGoalPriority(goal.id, key)}
                        >
                          <Badge
                            style={{ backgroundColor: color }}
                            className={cn('w-full text-black')}
                          >
                            {key.toUpperCase()}
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
                                selectedValue={key}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <StatusBadge status={status} />
              <AiGeneratedBadge item={goal} type="goals" onDiscard={onDelete} />
            </div>{' '}
            <div className="flex items-center gap-1">
              {isTemporary(goal.id) && (
                <LoaderCircle className="text-primary animate-spin size-5" />
              )}
            </div>
          </div>

          {/* Title and Editing Area */}
          {isEditing ? (
            <div className="flex w-full items-center gap-2">
              <TextareaAutosize
                ref={textareaRef}
                maxLength={TITLE_MAX}
                value={editValue}
                onChange={onValueChange}
                onKeyDown={handleKeyDown}
                className="w-full border-0 resize-none appearance-none overflow-hidden bg-transparent p-0 m-0 font-normal text-sm text-foreground focus-visible:outline-none focus-visible:ring-0"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                  onClick={onCancel}
                >
                  <X className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-success/80 hover:bg-success/10 hover:text-success"
                  onClick={onSave}
                >
                  <Check className="size-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-destructive font-medium">
                  {titleError}
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
            <p className="m-0 font-normal text-sm text-foreground break-words whitespace-pre-wrap min-w-0 flex-1 min-h-[24px]">
              {goal.title}
            </p>
          )}
        </CardContent>
      </Card>

      <MotionDivOptions
        isHovered={isHovered}
        isEditing={isEditing}
        isTemporary={isTemporary(goal.id)}
        disabled={disabled}
        onEdit={onEdit}
        onDelete={onDelete}
        onInspect={onInspect}
      />
    </div>
  )
}
const Goals = ({ project, setProject }) => {
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  //states
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef(null)
  const [typeSelectId, setTypeSelectId] = useState(null)
  const [prioritySelectId, setPrioritySelectId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  //ia states
  const [aiGeneratedGoals, setAiGeneratedGoals] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const { can } = usePermissions()
  const { errors } = usePage().props

  // inspection function
  const inspectGoal = (goalId) => {
    if (inspectionId === goalId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${goalId}"]`)
      setAnchorEl(element)
      setInspectionId(goalId)
    }
  }

  const isTemporary = (goal) =>
    typeof goal.id === 'string' && goal.id.startsWith('temp-')

  // Função para lidar com mudanças no input
  const handleInputChange = (e) => {
    setEditValue(e.target.value)
  }

  // Função para alternar a exibição do seletor de tipo
  const toggleTypeSelect = (goalId) => {
    if (typeSelectId === goalId) {
      setTypeSelectId(null)
    } else {
      setTypeSelectId(goalId)
      setPrioritySelectId(null) // Fecha outros seletores
      setDeleteConfirmId(null) // Fecha o diálogo de exclusão caso esteja aberto
    }
  }

  // Função para alternar a exibição do seletor de prioridade
  const togglePrioritySelect = (goalId) => {
    if (prioritySelectId === goalId) {
      setPrioritySelectId(null)
    } else {
      setPrioritySelectId(goalId)
      setTypeSelectId(null) // Fecha outros seletores
      setDeleteConfirmId(null) // Fecha o diálogo de exclusão caso esteja aberto
    }
  }

  // Função para alternar a exibição do diálogo de confirmação de exclusão
  const toggleDeleteConfirm = (goalId) => {
    if (deleteConfirmId === goalId) {
      setDeleteConfirmId(null)
    } else {
      setDeleteConfirmId(goalId)
      setTypeSelectId(null) // Fecha o seletor de tipo caso esteja aberto
      setPrioritySelectId(null) // Fecha o seletor de prioridade caso esteja aberto
      setEditingId(null) // Fecha a edição caso esteja aberta
    }
  }

  // Função para adicionar uma nova goal
  const addNewGoal = (type = 'bg') => {
    setProject({
      ...project,
      goal_sketches: [
        ...(project.goal_sketches || []),
        {
          id: `temp-${Date.now()}`,
          title: 'Nova Goal',
          type: type,
          priority: 'medium',
        },
      ],
    })

    router.post(
      route('goal.store'),
      {
        title: 'Nova Goal',
        type: type,
        priority: 'medium',
        project_id: project.id,
      },
      { preserveState: true, preserveScroll: true },
    )
  }

  // Função para alternar entre modo de edição e visualização
  const editGoal = (goal) => {
    if (editingId === goal.id) {
      if (goal.title !== editValue) {
        // Se já estiver editando esta goal, salve as alterações
        const updatedGoals = (project.goal_sketches || []).map((g) =>
          g.id === goal.id
            ? {
                ...g,
                title: editValue,
                updated_at: new Date().toISOString(),
              }
            : g,
        )
        setProject({ ...project, goal_sketches: updatedGoals })

        router.patch(
          route('goal.update', goal.id),
          {
            title: editValue,
          },
          {
            onSuccess: () => toastSuccess('goals.toast_updated'),
            onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
          },
        )
      }
      setEditingId(null) // Sai do modo de edição
    } else {
      // Entra no modo de edição para esta goal
      setEditingId(goal.id)
      setEditValue(goal.title) // Inicializa o campo com o valor atual
    }
  }

  // Função para alterar o tipo da goal
  const changeGoalType = (goalId, newType) => {
    const goal = project.goal_sketches.find((g) => g.id === goalId)

    if (goal.type !== newType) {
      const updatedGoals = (project.goal_sketches || []).map((g) =>
        g.id === goalId
          ? {
              ...g,
              type: newType,
              updated_at: new Date().toISOString(),
            }
          : g,
      )

      setProject({ ...project, goal_sketches: updatedGoals })

      router.patch(
        route('goal.update', goalId),
        {
          type: newType,
        },
        {
          onSuccess: () => toastSuccess('goals.toast_updated'),
          onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
        },
      )
    }

    setTypeSelectId(null) // Fecha o seletor de tipo
  }

  // Função para alterar a prioridade da goal
  const changeGoalPriority = (goalId, newPriority) => {
    const goal = project.goal_sketches.find((g) => g.id === goalId)
    if (goal.priority !== newPriority) {
      const updatedGoals = (project.goal_sketches || []).map((g) =>
        g.id === goalId
          ? {
              ...g,
              priority: newPriority,
              updated_at: new Date().toISOString(),
            }
          : g,
      )

      setProject({ ...project, goal_sketches: updatedGoals })

      router.patch(
        route('goal.update', goalId),
        {
          priority: newPriority,
        },
        {
          onSuccess: () => toastSuccess('goals.toast_updated'),
          onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
        },
      )
    }
    setPrioritySelectId(null) // Fecha o seletor de prioridade
  }

  // Função para excluir a goal
  const deleteGoal = (goalId) => {
    const updatedGoals = (project.goal_sketches || []).filter(
      (g) => g.id !== goalId,
    )
    setProject({ ...project, goal_sketches: updatedGoals })
    setDeleteConfirmId(null) // Fecha o diálogo de confirmação
    router.delete(route('goal.delete', goalId))
  }

  const generateGoals = async () => {
    setIsGenerating(true)
    try {
      const response = await axios.post(route('goal.generate'), {
        project_id: project.id,
      })
      if (response.status === 202) {
        toast.info(
          t('ai.generation_queued', 'Geração na fila. Vai aparecer na tela quando ficar pronta.'),
        )
        router.reload({ only: ['pending_generations'] })
      } else if (response.data?.status === 'warning') {
        toast.warning(response.data.message)
      }
    } catch (error) {
      console.error('Erro ao gerar goals:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedGoals = () => {
    const selectedGoals = aiGeneratedGoals.filter((goal) => goal.selected)
    const remainingGoals = aiGeneratedGoals.filter((goal) => !goal.selected)

    if (selectedGoals.length === 0) {
      toast.warning(t('common.toast.select_at_least_one'))
      return
    }

    const goalsToAdd = selectedGoals.map((goal) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      project_id: project.id,
      ...goal,
    }))

    setProject((prevProject) => ({
      ...prevProject,
      goal_sketches: [...(prevProject.goal_sketches || []), ...goalsToAdd],
    }))

    const goalsForBackend = selectedGoals.map(({ title, type, priority }) => ({
      title,
      type,
      priority,
      project_id: project.id,
    }))

    router.post(
      route('goal.bulk-store'),
      { goals: goalsForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(t('goals.toast_saved'))
          setAiGeneratedGoals(remainingGoals)
          if (remainingGoals.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error(t('common.error'))
          console.error('Erro do backend:', errors)
          setProject((prevProject) => {
            const goalsToAddIds = goalsToAdd.map((g) => g.id)
            return {
              ...prevProject,
              goals: prevProject.goals.filter(
                (g) => !goalsToAddIds.includes(g.id),
              ),
            }
          })
        },
      },
    )
  }

  const cancelGeneratedGoals = () => {
    setShowAiModal(false)
    setAiGeneratedGoals([])
    setIsModalMinimized(false)
  }

  const toggleGoalSelection = (index) => {
    setAiGeneratedGoals((prev) =>
      prev.map((goal, i) =>
        i === index ? { ...goal, selected: !goal.selected } : goal,
      ),
    )
  }

  const toggleAllGoals = () => {
    const allSelected = aiGeneratedGoals.every((goal) => goal.selected)
    setAiGeneratedGoals((prev) =>
      prev.map((goal) => ({ ...goal, selected: !allSelected })),
    )
  }

  return (
    <div className="goalSketches rounded grid grid-cols-2 gap-2 w-full p-4 items-start">
      {/* --- Column 1: Constraint Goals --- */}
      {showAiModal && (
        <GeneratedItemsModal
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedGoals}
          generatedItems={aiGeneratedGoals}
          toggleItemSelection={toggleGoalSelection}
          confirmGeneratedItems={confirmGeneratedGoals}
          toggleAllItems={toggleAllGoals}
          systemColors={project?.system_colors}
        />
      )}
      {inspectionId && can('goal.manage') && (
        <InvestCard
          itemCategory={'goal_sketches'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}
      <div className="flex flex-col gap-2">
        <InfoButton
          data={tooltipInfo.constraintGoal}
          badgeStyle={{
            backgroundColor: project?.system_colors?.goals.cg,
          }}
          badgeContent={
            project?.goal_sketches?.filter((goal) => goal.type === 'cg')
              .length || 0
          }
        />
        {project.goal_sketches?.filter((goal) => goal.type === 'cg').length >
        0 ? (
          project.goal_sketches
            .filter((goal) => goal.type === 'cg')
            .sort((a, b) => a.id - b.id)
            .map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                isTemporary={isTemporary(goal)}
                isEditing={editingId === goal.id}
                editValue={editValue}
                onValueChange={handleInputChange}
                onEdit={() => editGoal(goal)}
                onSave={() => editGoal(goal)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteGoal(goal.id)}
                onInspect={() => inspectGoal(goal.id)}
                textareaRef={editingId === goal.id ? textareaRef : null}
                typeSelectId={typeSelectId}
                onToggleTypeSelect={() => toggleTypeSelect(goal.id)}
                onChange
                GoalType={changeGoalType}
                onChangeGoalType={changeGoalType}
                prioritySelectId={prioritySelectId}
                onTogglePrioritySelect={() => togglePrioritySelect(goal.id)}
                onChangeGoalPriority={changeGoalPriority}
                systemColors={project?.system_colors}
                disabled={!can('goal.manage')}
                errors={errors}
              />
            ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[100px]">
            <Goal size={32} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-center font-medium text-foreground">
              {t('goals.empty_constraint')}
            </p>
          </div>
        )}
        {can('goal.manage') && (
          <Button variant="secondary" onClick={() => addNewGoal('cg')}>
            <Plus size={18} className="mr-2" />
            <span>{t('goals.new_constraint')}</span>
          </Button>
        )}
      </div>

      {/* --- Column 2: Business Goals --- */}
      <div className="flex flex-col gap-2">
        <InfoButton
          data={tooltipInfo.businessGoal}
          badgeStyle={{
            backgroundColor: project?.system_colors?.goals.bg,
          }}
          badgeContent={
            project?.goal_sketches?.filter((goal) => goal.type === 'bg')
              .length || 0
          }
        />
        {project.goal_sketches?.filter((goal) => goal.type === 'bg').length >
        0 ? (
          project.goal_sketches
            .filter((goal) => goal.type === 'bg')
            .sort((a, b) => a.id - b.id)
            .map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                isTemporary={isTemporary(goal)}
                isEditing={editingId === goal.id}
                editValue={editValue}
                onValueChange={handleInputChange}
                onEdit={() => editGoal(goal)}
                onSave={() => editGoal(goal)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteGoal(goal.id)}
                onInspect={() => inspectGoal(goal.id)}
                textareaRef={editingId === goal.id ? textareaRef : null}
                typeSelectId={typeSelectId}
                onToggleTypeSelect={() => toggleTypeSelect(goal.id)}
                onChangeGoalType={changeGoalType}
                prioritySelectId={prioritySelectId}
                onTogglePrioritySelect={() => togglePrioritySelect(goal.id)}
                onChangeGoalPriority={changeGoalPriority}
                systemColors={project?.system_colors}
                disabled={!can('goal.manage')}
                errors={errors}
              />
            ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[100px]">
            <Goal size={32} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-center font-medium text-foreground">
              {t('goals.empty_business')}
            </p>
          </div>
        )}
        {can('goal.manage') && (
          <>
            <Button variant="secondary" onClick={() => addNewGoal('bg')}>
              <Plus size={18} className="mr-2" />
              <span>{t('goals.new_business')}</span>
            </Button>
            <GenerateAIButton
              type="goals"
              isGenerating={isGenerating}
              onClick={generateGoals}
              tooltip={tooltipInfo.aiGeneratedGoals}
              className="w-1/2"
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Goals
