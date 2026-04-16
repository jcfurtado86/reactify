import { usePermissions } from '@/Context/PermissionContext'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Check,
  X,
  LoaderCircle,
  ChevronDown,
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
import { toastApiError } from '@/lib/toastHelpers'
import StatusBadge from '@/Components/StatusBadge'
import { usePage } from '@inertiajs/react'

const GoalItem = ({
  goal,
  project,
  linkedStories = [],
  disabled = false,
  isEditing,
  editValue,
  onValueChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
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
        preserveScroll: true,
        preserveState: true,
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
          {linkedStories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {linkedStories.map((s) => {
                const storyVariants = project?.system_colors?.stories || {}
                const color = storyVariants[s.type] || '#f97316'
                const label = `${s.type === 'system' ? 'SS' : 'US'}${s.id}`
                return (
                  <Badge
                    key={s.id}
                    style={{ backgroundColor: color }}
                    className="text-[10px] text-black font-bold cursor-pointer hover:opacity-80 border-transparent"
                    title={s.title}
                    onClick={() => router.get(route('project.ceremony.show', {
                      project: goal.project_id, ceremony: 'storyDiscovery',
                    }), { artifact: 'stories', scrollTo: s.id })}
                  >
                    {label}
                  </Badge>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MotionDivOptions slot="goal.manage"
        isHovered={isHovered}
        isEditing={isEditing}
        isTemporary={isTemporary(goal.id)}
        disabled={disabled}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
const Goals = ({ project, setProject }) => {
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  //states
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef(null)
  const [typeSelectId, setTypeSelectId] = useState(null)
  const [prioritySelectId, setPrioritySelectId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const { can } = usePermissions()
  const { errors } = usePage().props

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
            preserveScroll: true,
            preserveState: true,
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
          preserveScroll: true,
          preserveState: true,
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
          preserveScroll: true,
          preserveState: true,
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
    router.delete(route('goal.delete', goalId), {
      preserveScroll: true,
      preserveState: true,
    })
  }

  const generateGoals = async () => {
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
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Erro ao gerar goals:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    }
  }

  const storiesForGoal = (goalId) => {
    return (project.prioritizations || [])
      .filter((p) => p.goal_id === goalId)
      .map((p) => project.stories?.find((s) => s.id === p.story_id))
      .filter(Boolean)
  }

  return (
    <div className="goalSketches rounded grid grid-cols-2 gap-2 w-full p-4 items-start">
      {/* --- Column 1: Constraint Goals --- */}
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
                project={project}
                linkedStories={storiesForGoal(goal.id)}
                isTemporary={isTemporary(goal)}
                isEditing={editingId === goal.id}
                editValue={editValue}
                onValueChange={handleInputChange}
                onEdit={() => editGoal(goal)}
                onSave={() => editGoal(goal)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteGoal(goal.id)}
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
                project={project}
                linkedStories={storiesForGoal(goal.id)}
                isTemporary={isTemporary(goal)}
                isEditing={editingId === goal.id}
                editValue={editValue}
                onValueChange={handleInputChange}
                onEdit={() => editGoal(goal)}
                onSave={() => editGoal(goal)}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteGoal(goal.id)}
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
