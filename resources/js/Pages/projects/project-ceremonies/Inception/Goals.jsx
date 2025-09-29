import {
  Plus,
  Minus,
  Check,
  X,
  LoaderCircle,
  ChevronDown,
  ChevronsUp,
} from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { router } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { tooltipInfo } from '@/lib/projectData'
import InfoButton from '@/Components/InfoButton'
import GenerateAIButton from '@/Components/GenerateAIButton'
import { toast } from 'sonner'
export const typeColors = {
  bg: { color: '!bg-orange-600', title: 'bg' },
  cg: { color: '!bg-purple-600', title: 'cg' },
}
export const priorityColors = {
  high: { color: '!bg-red-600', title: 'high' },
  medium: { color: '!bg-yellow-600', title: 'medium' },
  low: { color: '!bg-green-600', title: 'low' },
}

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
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {!isModalMinimized && 'Goals Geradas por IA'}
            {isModalMinimized && 'Goals Geradas'}
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
                {generatedItems.map((story, index) => (
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
                          className={`border-none text-primary-foreground font-bold ${
                            story.type === 'system'
                              ? 'bg-secondary'
                              : 'bg-primary'
                          }`}
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
                ))}
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

const GoalItem = ({
  goal,
  isTemporary,
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
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave()
    }
  }
  const selectedType = typeColors[goal.type] || typeColors.bg
  const selectedPriority = priorityColors[goal.priority] || priorityColors.med

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <Card className="bg-card border-0 transition-all duration-300 ease-in-out rounded">
        <CardContent className="p-2 flex flex-col gap-2">
          {/* Badge Row for Type and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Popover
                open={typeSelectId === goal.id}
                onOpenChange={onToggleTypeSelect}
              >
                <PopoverTrigger disabled={isTemporary}>
                  <Badge
                    className={cn(
                      'border-transparent text-background font-bold cursor-pointer',
                      selectedType.color,
                    )}
                  >
                    {goal.type.toUpperCase()}
                    <ChevronDown className="ml-1 size-3" />
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-popover border-border p-1">
                  <div className="flex flex-col gap-1">
                    {Object.values(typeColors).map((type, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="h-auto p-2 justify-start hover:bg-accent"
                        onClick={() => onChangeGoalType(goal.id, type.title)}
                      >
                        <Badge
                          className={cn('w-full text-background', type.color)}
                        >
                          {type.title.toUpperCase()}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover
                open={prioritySelectId === goal.id}
                onOpenChange={onTogglePrioritySelect}
              >
                <PopoverTrigger disabled={isTemporary}>
                  <Badge
                    className={cn(
                      'border-transparent text-background font-bold cursor-pointer',
                      selectedPriority.color,
                    )}
                  >
                    {goal.priority.toUpperCase()}
                    <ChevronDown className="ml-1 size-3" />
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-popover border-border p-1">
                  <div className="flex flex-col gap-1">
                    {Object.values(priorityColors).map((variant, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="h-auto p-2 justify-start hover:bg-accent"
                        onClick={() =>
                          onChangeGoalPriority(goal.id, variant.title)
                        }
                      >
                        <Badge
                          className={cn(
                            'w-full text-background',
                            variant.color,
                          )}
                        >
                          {variant.title.toUpperCase()}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {isTemporary && (
              <LoaderCircle className="text-primary animate-spin size-4" />
            )}
          </div>

          {/* Title and Editing Area */}
          {isEditing ? (
            <div className="flex w-full items-center gap-2">
              <TextareaAutosize
                ref={textareaRef}
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
            </div>
          ) : (
            <p className="m-0 font-normal text-sm text-foreground break-words w-full min-h-[24px]">
              {goal.title}
            </p>
          )}
        </CardContent>
      </Card>

      <MotionDivOptions
        isHovered={isHovered}
        isEditing={isEditing}
        isTemporary={isTemporary}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
const Goals = ({ project, setProject }) => {
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

        router.patch(route('goal.update', goal.id), {
          title: editValue,
        })
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

      router.patch(route('goal.update', goalId), {
        type: newType,
      })
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

      router.patch(route('goal.update', goalId), {
        priority: newPriority,
      })
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

  //rotas relacionadas ao modal de IA
  const generateGoals = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post('/api/stories/generate', {
        project_id: project.id,
      })

      const data = response.data

      const goalsWithSelection = data.message.goal_sketches.map((goal) => ({
        ...goal,
        selected: true,
      }))

      setAiGeneratedGoals(goalsWithSelection)
      setShowAiModal(true)
      toast.success('Histórias geradas com sucesso.')
    } catch (error) {
      console.error('Erro ao gerar goals:', error)
      if (error.response && error.response.data) {
        const errorData = error.response.data

        if (errorData.status === 'warning') {
          toast.warning(errorData.message)
        } else {
          toast.error(
            errorData.message || 'Ocorreu um erro desconhecido no servidor.',
          )
        }
      } else {
        toast.error(
          'Não foi possível conectar ao servidor. Verifique sua internet.',
        )
      }
    } finally {
      setIsGenerating(false)
    }
  }
  const confirmGeneratedGoals = () => {
    const selectedGoals = aiGeneratedGoals.filter((goal) => goal.selected)
    const remainingGoals = aiGeneratedGoals.filter((goal) => !goal.selected)

    if (selectedGoals.length === 0) {
      toast.warning('Selecione pelo menos uma goal para adicionar.')
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

    const goalsForBackend = selectedGoals.map(({ title, type }) => ({
      title,
      type,
      project_id: project.id,
    }))

    // router.post(
    //   route('goal.bulk-store'),
    //   { goals: goalsForBackend },
    //   {
    //     preserveState: true,
    //     preserveScroll: true,
    //     onSuccess: () => {
    //       toast.success(
    //         `${selectedGoals.length} goal(s) adicionada(s) com sucesso!`,
    //       )
    //       setAiGeneratedGoals(remainingGoals)
    //       if (remainingGoals.length === 0) {
    //         setShowAiModal(false)
    //         setIsModalMinimized(false)
    //       }
    //     },
    //     onError: (errors) => {
    //       toast.error('Ocorreu um erro ao salvar as goals.')
    //       console.error('Erro do backend:', errors)
    //       setProject((prevProject) => {
    //         const goalsToAddIds = goalsToAdd.map((g) => g.id)
    //         return {
    //           ...prevProject,
    //           goals: prevProject.goals.filter(
    //             (g) => !goalsToAddIds.includes(g.id),
    //           ),
    //         }
    //       })
    //     },
    //   },
    // )
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
    <div className="goalSketches rounded grid grid-cols-2 gap-2 w-full p-4 cursor-pointer items-start">
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
        />
      )}

      <div className="flex flex-col gap-2">
        <InfoButton
          data={tooltipInfo.constraintGoal}
          badgeContent={
            project?.goal_sketches?.filter((goal) => goal.type === 'cg')
              .length || 0
          }
        />
        {project.goal_sketches?.filter((goal) => goal.type === 'cg').length >
        0 ? (
          project.goal_sketches
            .filter((goal) => goal.type === 'cg')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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
                textareaRef={editingId === goal.id ? textareaRef : null}
                typeSelectId={typeSelectId}
                onToggleTypeSelect={() => toggleTypeSelect(goal.id)}
                onChange
                GoalType={changeGoalType}
                onChangeGoalType={changeGoalType}
                prioritySelectId={prioritySelectId}
                onTogglePrioritySelect={() => togglePrioritySelect(goal.id)}
                onChangeGoalPriority={changeGoalPriority}
              />
            ))
        ) : (
          <Card className="bg-card p-4 shadow-md">
            <div className="flex items-center mb-2 gap-2">
              <Badge
                className={cn(
                  'text-background',
                  typeColors.find((c) => c.title === 'cg')?.color,
                )}
              >
                CG
              </Badge>
              <Badge
                className={cn(
                  'text-background',
                  priorityColors.find((c) => c.title === 'med')?.color,
                )}
              >
                MED
              </Badge>
            </div>
            <p className="text-foreground text-sm font-medium">
              Example of a constraint goal...
            </p>
          </Card>
        )}
        <Button
          className="col-span-2 flex items-center justify-center w-full py-1 bg-card hover:bg-accent text-primary rounded-lg transition-colors shadow-md"
          onClick={() => addNewGoal('cg')}
        >
          <Plus size={18} className="mr-2" />
          <span>Nova Constraint Goal</span>
        </Button>
      </div>

      {/* --- Column 2: Business Goals --- */}
      <div className="flex flex-col gap-2">
        <InfoButton
          data={tooltipInfo.businessGoal}
          badgeContent={
            project?.goal_sketches?.filter((goal) => goal.type === 'bg')
              .length || 0
          }
        />
        {project.goal_sketches
          ?.filter((goal) => goal.type === 'bg')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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
              textareaRef={editingId === goal.id ? textareaRef : null}
              typeSelectId={typeSelectId}
              onToggleTypeSelect={() => toggleTypeSelect(goal.id)}
              onChangeGoalType={changeGoalType}
              prioritySelectId={prioritySelectId}
              onTogglePrioritySelect={() => togglePrioritySelect(goal.id)}
              onChangeGoalPriority={changeGoalPriority}
            />
          ))}
        <Button
          className="col-span-2 flex items-center justify-center w-full py-1 bg-card hover:bg-accent text-primary rounded-lg transition-colors shadow-md"
          onClick={() => addNewGoal('bg')}
        >
          <Plus size={18} className="mr-2" />
          <span>Nova Business Goal</span>
        </Button>
        <GenerateAIButton
          isGenerating={isGenerating}
          onClick={generateGoals}
          // tooltip={tooltipInfo.aiGeneratedStory}
          className="w-1/2"
        />
      </div>
    </div>
  )
}

export default Goals
