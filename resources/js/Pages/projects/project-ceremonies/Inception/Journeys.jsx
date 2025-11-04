import { usePermissions } from '@/Context/PermissionContext'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  useSortable,
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MotionDivOptions from '@/Components/MotionDivOptions'
import {
  X,
  Circle,
  Plus,
  Check,
  Edit,
  Trash,
  Map,
  CornerUpRight,
  ChevronRight,
  Minus,
  ChevronsUp,
  ChartArea,
} from 'lucide-react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import TextareaAutosize from 'react-textarea-autosize'
import { cn } from '@/lib/utils'
import { tooltipInfo } from '@/lib/projectData'
import GenerateAIButton from '@/Components/GenerateAIButton'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'
import InvestCard from '../Inspection/InvestCard'

const SortableJourneyStepItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    boxShadow: isDragging ? '0px 10px 20px rgba(0,0,0,0.2)' : 'none',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JourneyStepItem {...props} />
    </div>
  )
}

const JourneyStepItem = ({
  step,
  stepIndex,
  isLastStep,
  color,
  isEditing,
  editValue,
  onValueChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  disabled = false,
  textareaRef,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showDeletePopover, setShowDeletePopover] = useState(false)
  const [touchpointChecked, setTouchpointChecked] = useState(step.is_touchpoint)

  useEffect(() => {
    setTouchpointChecked(step.is_touchpoint)
  }, [step.is_touchpoint])

  const handleSave = () => onSave(editValue, touchpointChecked)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group flex items-center"
    >
      <Badge variant="numberIcon" className={cn(color.bg, 'z-40')}>
        <p className="m-0 text-primary-foreground">{stepIndex + 1}</p>
      </Badge>

      <Card className="w-full bg-card border-2 border-accent transition-shadow hover:shadow-lg z-20 font-normal">
        <CardContent className="flex flex-row items-start justify-between gap-2 p-2 min-h-[60px]">
          <section className="flex items-center flex-1">
            {isEditing ? (
              <>
                <TextareaAutosize
                  ref={textareaRef}
                  value={editValue}
                  onChange={onValueChange}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm border-0 resize-none appearance-none overflow-hidden bg-transparent p-0 m-0 font-normal text-foreground focus-visible:outline-none focus-visible:ring-0"
                  autoFocus
                />
                <Switch
                  id={`touchpoint-switch-${stepIndex}`}
                  checked={touchpointChecked}
                  onCheckedChange={setTouchpointChecked}
                />
                {/* <Button
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
                    onClick={handleSave}
                  >
                    <Check />
                  </Button>*/}
              </>
            ) : (
              <p className="m-0 text-sm text-foreground break-words w-full">
                {step.description || 'Description...'}
              </p>
            )}
          </section>
          {step.is_touchpoint && !isEditing && (
            <Circle size={16} className="fill-primary stroke-primary mt-1" />
          )}
        </CardContent>
      </Card>

      <MotionDivOptions
        disabled={disabled}
        isHovered={isHovered}
        isEditing={isEditing}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {!isLastStep && (
        <div className="absolute top-1/2 -right-3 translate-x-1 -translate-y-1/2 text-muted-foreground z-0">
          <CornerUpRight size={20} strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}

const Journeys = ({ project, setProject }) => {
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [expandedJourney, setExpandedJourney] = useState(null)
  const [editingStep, setEditingStep] = useState({
    journeyId: null,
    stepIndex: null,
  })
  const [editValue, setEditValue] = useState('')
  const [editingJourney, setEditingJourney] = useState(null)
  const [editJourneyName, setEditJourneyTitle] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [generatedJourneys, setGeneratedJourneys] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const textareaRef = useRef(null)
  const { can } = usePermissions()
  const colors = [
    {
      text: 'text-orange-500',
      border: 'border-orange-500',
      bg: 'bg-orange-500',
    },
    {
      text: 'text-violet-500',
      border: 'border-violet-500',
      bg: 'bg-violet-500',
    },
    { text: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-500' },
    {
      text: 'text-emerald-500',
      border: 'border-emerald-500',
      bg: 'bg-emerald-500',
    },
    { text: 'text-rose-500', border: 'border-rose-500', bg: 'bg-rose-500' },
    { text: 'text-cyan-500', border: 'border-cyan-500', bg: 'bg-cyan-500' },
    { text: 'text-teal-500', border: 'border-teal-500', bg: 'bg-teal-500' },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Requer um pequeno movimento antes de iniciar o arrasto
      activationConstraint: {
        distance: 14,
      },
    }),
  )
  // inspection function
  const inspectJourney = (e, journeyId) => {
    e.stopPropagation()
    if (inspectionId === journeyId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${journeyId}"]`)
      console.log(element)
      setAnchorEl(element)
      setInspectionId(journeyId)
    }
  }
  // Função que será chamada quando o arrasto terminar
  const handleDragEnd = (event, journeyId) => {
    const { active, over } = event
    console.log(active, over)
    if (over && active.id !== over.id) {
      const journey = project.journeys.find((j) => j.id === journeyId)
      const steps = journey.steps
      const oldIndex = steps.findIndex((step) => step.id === active.id)
      const newIndex = steps.findIndex((step) => step.id === over.id)

      // Usa a função `arrayMove` do dnd-kit para reordenar o array
      const reorderedSteps = arrayMove(steps, oldIndex, newIndex)

      // Chama a sua função existente para atualizar o estado e a API
      handleReorderSteps(journeyId, reorderedSteps)
    }
  }
  // Função para gerar journeys com IA
  const generateJourneys = async () => {
    setIsGeneratingAI(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('journey.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const journeysWithSelection = data.journeys.map((journey) => ({
          ...journey,
          selected: true,
        }))
        setGeneratedJourneys(journeysWithSelection)
        setShowConfirmModal(true)
        toast.success('Journeys geradas com sucesso.')
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
      toast.error('Erro ao comunicar com o servidor')
      console.error('Erro ao gerar stories:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Função para alternar seleção de uma journey
  const toggleJourneySelection = (index) => {
    setGeneratedJourneys((prev) =>
      prev.map((journey, i) =>
        i === index ? { ...journey, selected: !journey.selected } : journey,
      ),
    )
  }

  // Função para selecionar/deselecionar todas as journeys
  const toggleAllJourneys = () => {
    const allSelected = generatedJourneys.every((journey) => journey.selected)
    setGeneratedJourneys((prev) =>
      prev.map((journey) => ({ ...journey, selected: !allSelected })),
    )
  }

  // Função para confirmar e adicionar as journeys selecionadas
  const confirmGeneratedJourneys = () => {
    const selectedJourneys = generatedJourneys.filter(
      (journey) => journey.selected,
    )
    const remainingJourneys = generatedJourneys.filter(
      (journey) => !journey.selected,
    )

    if (selectedJourneys.length === 0) {
      toast.warning('Selecione pelo menos uma journey para adicionar.')
      return
    }

    // Mapeia as jornadas selecionadas para o formato esperado pelo estado local
    const journeysToAdd = selectedJourneys.map((journey) => {
      const { selected, ...rest } = journey
      return {
        id: Date.now() + Math.random(),
        created_at: new Date().toISOString(),
        project_id: project.id,
        ...rest,
      }
    })

    // Adiciona as novas jornadas ao estado do projeto
    const updatedProjectJourneys = project.journeys
      ? [...project.journeys, ...journeysToAdd]
      : [...journeysToAdd]
    setProject({ ...project, journeys: updatedProjectJourneys })

    // Prepara os dados para o backend (sem os campos gerados localmente)
    const journeysForBackend = selectedJourneys.map(
      ({ id, created_at, project_id, selected, ...rest }) => ({
        ...rest,
        steps: rest.steps.map((step) => ({
          description: step.description,
          is_touchpoint: step.is_touchpoint || false,
        })),
      }),
    )

    // Persiste no backend
    router.post(
      route('journey.bulk-store'),
      {
        project_id: project.id,
        journeys: journeysForBackend,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedJourneys.length} journey(s) adicionada(s) com sucesso!`,
          )
          // Atualiza o estado do modal com as jornadas restantes
          setGeneratedJourneys(remainingJourneys)

          // Se não houver mais jornadas restantes, fecha o modal
          if (remainingJourneys.length === 0) {
            setShowConfirmModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: () => {
          toast.error('Ocorreu um erro ao adicionar as jornadas.')
        },
      },
    )
  }

  // Função para cancelar e limpar as journeys geradas
  const cancelGeneratedJourneys = () => {
    setShowConfirmModal(false)
    setGeneratedJourneys([])
    setIsModalMinimized(false)
  }

  // Todas as funções existentes permanecem inalteradas
  const toggleJourney = (JourneyId) => {
    if (expandedJourney === JourneyId) {
      setExpandedJourney(null)
    } else {
      setExpandedJourney(JourneyId)
    }
  }

  // Função para iniciar a edição de um step
  const startEditStep = (journeyId, stepIndex) => {
    const step =
      project.journeys.find((j) => j.id === journeyId)?.steps?.[stepIndex] ??
      null
    setEditingStep({ journeyId, stepIndex })
    setEditValue(step.description)
  }

  // Função para iniciar a edição de uma journey
  const startEditJourney = (JourneyId) => {
    const journey = project.journeys.find((j) => j.id === JourneyId)
    setEditingJourney(JourneyId)
    setEditJourneyTitle(journey.title)
  }

  // Função para adicionar uma nova journey
  const addNewJourney = () => {
    const newJourney = {
      title: 'Nova Journey',
      steps: [],
    }

    const updatedJourneys = project.journeys
      ? [...project.journeys, newJourney]
      : [newJourney]
    setProject({ ...project, journeys: updatedJourneys })

    router.post(
      route('journey.store'),
      {
        title: newJourney.title,
        steps: [],
        project_id: project.id,
      },
      { preserveState: true, preserveScroll: true },
    )

    // Expandir a journey recém-criada (último índice)
    setExpandedJourney(updatedJourneys.length - 1)
  }

  // Função para adicionar um novo step a uma journey
  const addNewStep = (JourneyId) => {
    console.log(project.journeys)
    if (!project.journeys) return
    const currentSteps =
      project.journeys.find((journey) => journey.id === JourneyId)?.steps || []
    const newStep = {
      id: `step_${Date.now()}`,
      step: currentSteps.length + 1,
      description: 'Novo passo',
      is_touchpoint: false,
    }

    const updatedJourneys = project.journeys.map((journey) => {
      if (journey.id === JourneyId) {
        return {
          ...journey,
          steps: [...journey.steps, newStep],
        }
      }
      return journey
    })

    setProject({ ...project, journeys: updatedJourneys })
    router.patch(route('journey.update', JourneyId), {
      steps: [...currentSteps, newStep],
    })
  }
  // Função para salvar a edição de uma journey
  const saveEditJourney = () => {
    const journeyId = editingJourney
    if (journeyId === null || !project.journeys) return

    const updatedJourneys = project.journeys.map((journey) =>
      journey.id === journeyId
        ? { ...journey, title: editJourneyName }
        : journey,
    )

    setProject({ ...project, journeys: updatedJourneys })
    setEditingJourney(null)

    router.patch(route('journey.update', journeyId), {
      title: editJourneyName,
    })
  }

  // Função para salvar a edição de um step
  const saveEditStep = (description, isTouchpoint) => {
    const { journeyId, stepIndex } = editingStep
    if (!journeyId || stepIndex === null) return
    const journey = project.journeys.find((j) => j.id === journeyId)
    if (!journey) return
    const updatedSteps = journey.steps.map((s, i) =>
      i === stepIndex
        ? { ...s, description: description, is_touchpoint: isTouchpoint }
        : s,
    )
    const updatedJourneys = project.journeys.map((j) =>
      j.id === journeyId ? { ...j, steps: updatedSteps } : j,
    )
    setProject({ ...project, journeys: updatedJourneys })
    cancelEditStep()
    router.patch(route('journey.update', journeyId), { steps: updatedSteps })
  }

  // Crie uma função para cancelar a edição
  const cancelEditStep = () => {
    setEditingStep({ journeyId: null, stepIndex: null })
  }

  // Função para excluir um step
  const deleteStep = (journeyId, stepIndex) => {
    if (journeyId === null || stepIndex === null) return

    const journey = project.journeys.find((j) => j.id === journeyId)
    if (!journey || !journey.steps || stepIndex >= journey.steps.length) return

    const updatedSteps = [...journey.steps]
    updatedSteps.splice(stepIndex, 1)

    const reorderedSteps = updatedSteps.map((s, idx) => ({
      ...s,
      step: idx + 1,
    }))

    const updatedJourneys = project.journeys.map((j) =>
      j.id === journeyId ? { ...j, steps: reorderedSteps } : j,
    )

    setProject({ ...project, journeys: updatedJourneys })

    router.patch(route('journey.update', journeyId), {
      steps: reorderedSteps,
    })
  }

  // Função para excluir uma journey inteira
  const deleteJourney = (journeyIdToDelete) => {
    if (journeyIdToDelete === null) return

    const updatedJourneys = project.journeys.filter(
      (journey) => journey.id !== journeyIdToDelete,
    )

    if (expandedJourney === journeyIdToDelete) {
      setExpandedJourney(null)
    }

    setProject((prevProject) => ({
      ...prevProject,
      journeys: updatedJourneys,
    }))

    router.delete(route('journey.delete', journeyIdToDelete), {
      preserveScroll: true,
    })
  }
  // reordena os steps
  const handleReorderSteps = (journeyId, reorderedSteps) => {
    const newStepsWithCorrectOrder = reorderedSteps.map((step, index) => ({
      ...step,
      step: index + 1,
    }))

    const updatedJourneys = project.journeys.map((j) =>
      j.id === journeyId ? { ...j, steps: newStepsWithCorrectOrder } : j,
    )
    setProject({ ...project, journeys: updatedJourneys })

    router.patch(
      route('journey.update', journeyId),
      {
        steps: newStepsWithCorrectOrder,
      },
      {
        preserveState: true,
        preserveScroll: true,
      },
    )
  }

  // useEffect(() => {
  //   console.log(expandedJourney)
  // }, [expandedJourney])

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      {inspectionId && can('journey.manage') && (
        <InvestCard
          itemCategory={'journeys'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}
      {/* AI Generated Journeys Modal */}
      {showConfirmModal && (
        <div
          className={cn(
            'transition-all duration-300 z-50',
            isModalMinimized
              ? 'fixed bottom-4 right-4 w-[400px]'
              : 'fixed inset-0 bg-background/80 flex items-center justify-center',
          )}
        >
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border">
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-foreground flex items-center">
                {!isModalMinimized && 'Journeys geradas com IA'}
                {isModalMinimized && 'Journeys geradas'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsModalMinimized(!isModalMinimized)}
                  size="icon"
                  variant="ghost"
                >
                  {isModalMinimized ? (
                    <ChevronsUp size={20} />
                  ) : (
                    <Minus size={20} />
                  )}
                </Button>
                <Button
                  onClick={cancelGeneratedJourneys}
                  size="icon"
                  variant="ghost"
                >
                  <X size={24} />
                </Button>
              </div>
            </div>

            {!isModalMinimized && (
              <>
                <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-accent rounded-lg flex-shrink-0">
                  <span className="text-accent-foreground font-medium">
                    {generatedJourneys.filter((j) => j.selected).length} of{' '}
                    {generatedJourneys.length} selected
                  </span>
                  <Button onClick={toggleAllJourneys} size="sm">
                    {generatedJourneys.every((j) => j.selected)
                      ? 'Desmarcar Todas'
                      : 'Selecionar Todas'}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 min-h-0">
                  <div className="space-y-4 pb-4">
                    {generatedJourneys.map((journey, index) => (
                      <div
                        key={index}
                        className={cn(
                          'rounded-lg p-4 border-2 transition-colors',
                          journey.selected
                            ? 'bg-accent border-primary'
                            : 'bg-muted/50 border-border',
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-foreground font-medium">
                            {journey.title}
                          </h4>
                          <Switch
                            id={`journey-select-${index}`}
                            checked={journey.selected}
                            onCheckedChange={() =>
                              toggleJourneySelection(index)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          {journey.steps.map((step, stepIndex) => (
                            <div
                              key={stepIndex}
                              className="flex items-center text-sm text-muted-foreground"
                            >
                              <span
                                className={cn(
                                  'text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2',
                                  colors[index % colors.length].bg,
                                )}
                              >
                                {stepIndex + 1}
                              </span>
                              <span className="flex-1">{step.description}</span>
                              {step.is_touchpoint && (
                                <Badge variant="success" className="ml-2">
                                  Touchpoint
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-border flex-shrink-0">
                  <Button variant="outline" onClick={cancelGeneratedJourneys}>
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={confirmGeneratedJourneys}
                    disabled={
                      generatedJourneys.filter((j) => j.selected).length === 0
                    }
                  >
                    <Check className="mr-2" size={16} />
                    Confirm and Add (
                    {generatedJourneys.filter((j) => j.selected).length})
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Journeys List */}
      {project.journeys && project.journeys.length > 0 ? (
        project.journeys
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((journey, i) => (
            <div
              key={i}
              className={` bg-card rounded shadow-md overflow-hidden border border-border`}
            >
              <div
                className="flex items-center justify-between py-2 px-3 cursor-pointer bg-card hover:bg-accent/50 transition-colors"
                data-card-id={journey.id}
                onClick={() => toggleJourney(journey.id)}
              >
                <div className="flex items-center text-2xl">
                  <Map className="text-primary mr-2" size={20} />
                  {editingJourney === journey.id ? (
                    <input
                      type="text"
                      value={editJourneyName}
                      onChange={(e) => setEditJourneyTitle(e.target.value)}
                      onKeyUp={(e) => {
                        if (e.key === 'Enter') saveEditJourney()
                      }}
                      className="text-foreground p-0 bg-transparent border-none focus:ring-0 font-medium text-2xl rounded h-full focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <h4 className="text-foreground font-medium m-0">
                      {journey.title}
                    </h4>
                  )}
                </div>

                <div className="flex items-center">
                  {can('journey.manage') && (
                    <>
                      <ButtonWithTooltip
                        tooltipContent="Inspecionar (INVEST Card)"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => inspectJourney(e, journey.id)}
                      >
                        <ChartArea size={20} />
                      </ButtonWithTooltip>
                      {editingJourney === journey.id ? (
                        <ButtonWithTooltip
                          tooltipContent={'Salvar titulo'}
                          variant="success"
                          size="icon"
                          className=""
                          onClick={(e) => {
                            e.stopPropagation()
                            saveEditJourney()
                          }}
                        >
                          <Check size={20} />
                        </ButtonWithTooltip>
                      ) : (
                        <ButtonWithTooltip
                          tooltipContent={'Editar titulo'}
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditJourney(journey.id)
                          }}
                        >
                          <Edit size={20} />
                        </ButtonWithTooltip>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <ButtonWithTooltip
                            tooltipContent={'Deletar journey'}
                            variant="ghost"
                            size="icon"
                            className="text-destructive/80 hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash size={20} />
                          </ButtonWithTooltip>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-60 bg-popover border-border text-popover-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <h4 className="font-medium">Delete Journey</h4>
                            <p className="text-sm text-muted-foreground">
                              Are you sure? All steps will be lost.
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteJourney(journey.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                  <ChevronRight
                    className={cn(
                      'text-foreground transition-transform',
                      expandedJourney === journey.id && 'rotate-90',
                    )}
                    size={20}
                  />
                </div>
              </div>

              {/* {expandedJourney === journey.id && (*/}
              <>
                {journey.steps && journey.steps.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, journey.id)}
                  >
                    <SortableContext
                      items={journey.steps.map((s) => s.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div
                        className={`${expandedJourney === journey.id ? 'max-h-screen opacity-1 p-4' : 'max-h-0 opacity-0'} transition-all duration-300 grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start justify-center  `}
                      >
                        {journey.steps.map((step, stepIndex) => {
                          const isCurrentlyEditing =
                            editingStep.journeyId === journey.id &&
                            editingStep.stepIndex === stepIndex
                          return (
                            <SortableJourneyStepItem
                              key={step.id}
                              step={step}
                              stepIndex={stepIndex}
                              isLastStep={
                                stepIndex === journey.steps.length - 1
                              }
                              disabled={!can('journey.manage')}
                              color={colors[stepIndex % colors.length]}
                              isEditing={isCurrentlyEditing}
                              editValue={
                                isCurrentlyEditing
                                  ? editValue
                                  : step.description
                              }
                              onValueChange={(e) =>
                                setEditValue(e.target.value)
                              }
                              onEdit={() =>
                                startEditStep(journey.id, stepIndex)
                              }
                              onSave={saveEditStep}
                              onCancel={cancelEditStep}
                              onDelete={() => deleteStep(journey.id, stepIndex)}
                              textareaRef={
                                isCurrentlyEditing ? textareaRef : null
                              }
                            />
                          )
                        })}
                        <div className="flex justify-start items-center h-full">
                          {can('journey.manage') && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-primary"
                              onClick={() => addNewStep(journey.id)}
                            >
                              <Plus size={18} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
                    <p className="mb-2">This journey has no steps yet.</p>
                    {can('journey.manage') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary"
                        onClick={() => addNewStep(journey.id)}
                      >
                        <Plus size={16} className="mr-1" /> Add first step
                      </Button>
                    )}
                  </div>
                )}
              </>
            </div>
          ))
      ) : (
        <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border">
          <Map size={40} className="mb-4 text-primary" />
          <p className="mb-2">No journeys defined yet.</p>
          <p className="mb-4 text-sm">
            Create a new journey to map the user flow.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 w-full items-center">
        {/* generate with ai button*/}
        {can('journey.manage') && (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={addNewJourney}
            >
              <Plus size={18} className="mr-2" /> New Journey
            </Button>
            <GenerateAIButton
              isGenerating={isGeneratingAI}
              onClick={generateJourneys}
              tooltip={tooltipInfo.aiGeneratedJourney}
              className="w-1/2"
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Journeys
