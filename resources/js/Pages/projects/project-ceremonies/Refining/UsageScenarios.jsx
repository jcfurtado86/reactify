import React from 'react'
import { router } from '@inertiajs/react'
import {
  ArrowRight,
  CornerDownRight,
  Minus,
  Check,
  X,
  ChevronsUp,
  FileText,
} from 'lucide-react'
import { isTemporary, useGroupedStories } from '@/lib/utils'
import MotionDivOptions from '@/Components/MotionDivOptions'
import GenerateAIButton from '@/Components/GenerateAIButton'
import InvestCard from '../Inspection/InvestCard'
import { toast } from 'sonner'

/**
 * Renders the parent Story card on the left.
 * Its primary purpose is to display story info and provide an "add scenario" action.
 * @param {{ story: object, addScenario: () => void }} props
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
            {!isModalMinimized && 'Usage Scenarios gerados por IA'}
            {isModalMinimized && 'Usage Scenarios gerados'}
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
                {generatedItems.map((scenario, index) => {
                  const story = allStories.find(
                    (s) => s.id === scenario.story_id,
                  )
                  const selectedVariant = storyVariants[story.type] || '#f97316'
                  return (
                    <div
                      key={'temp-' + index}
                      className={`rounded-lg p-3 border-2 transition-colors flex items-center gap-4 ${
                        scenario.selected
                          ? 'bg-muted border-primary'
                          : 'bg-muted/50 border-border hover:border-muted-foreground'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer flex-1 gap-4">
                        <Checkbox
                          checked={scenario.selected}
                          onCheckedChange={() => toggleItemSelection(index)}
                        />
                        <div className="w-full bg-card rounded-lg p-2 shadow-sm">
                          {/* 1. Cabeçalho (O que antes era o AccordionTrigger) */}
                          <div className="flex items-center gap-2">
                            <Badge
                              style={{ backgroundColor: selectedVariant }}
                              variant="outline"
                              className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer `}
                            >
                              {`${story.type === 'user' ? 'US' : 'SS'}${story.id}`.toUpperCase()}
                            </Badge>
                          </div>
                          <ul className="space-y-2 text-sm font-normal text-left mt-3 pl-1">
                            <li>
                              <span className="font-bold text-primary">AS</span>{' '}
                              {scenario.description.as}
                            </li>
                            <li>
                              <span className="font-bold text-primary">
                                GIVEN
                              </span>{' '}
                              {scenario.description.given}
                            </li>
                            <li>
                              <span className="font-bold text-primary">
                                WHEN
                              </span>{' '}
                              {scenario.description.when}
                            </li>
                            <li>
                              <span className="font-bold text-primary">
                                THEN
                              </span>{' '}
                              {scenario.description.then_1}
                            </li>

                            {/* ✨ Melhoria: Só renderiza o 'AND' se ele existir */}
                            {scenario.description.and && (
                              <li>
                                <span className="font-bold text-primary">
                                  AND
                                </span>{' '}
                                {scenario.description.and}
                              </li>
                            )}

                            {/* ✨ Melhoria: Só renderiza o segundo 'THEN' se ele existir */}
                            {scenario.description.then_2 && (
                              <li>
                                <span className="font-bold text-primary">
                                  THEN
                                </span>{' '}
                                {scenario.description.then_2}
                              </li>
                            )}
                          </ul>
                        </div>
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

const StoryCard = ({ story, addScenario, systemColors }) => {
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'
  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.id}`

  return (
    <div className="relative group w-52 flex-shrink-0 text-left">
      <MotionDivOptions isHovered={true} onAdd={addScenario} />

      <div className="flex flex-col h-full items-center justify-start p-2 gap-1 text-xs font-normal text-foreground border border-border bg-card rounded-md shadow-sm ">
        <div className="mr-auto">
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer `}
          >
            {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm ">{story.title}</p>
      </div>
    </div>
  )
}

/**
 * An interactive card for a single Usage Scenario, with editing and deleting capabilities.
 * The internal logic of this component remains unchanged as it's already robust.
 * @param {{ scenario: object, story: object, lastElement: boolean, setProject: Function }} props
 */
const ScenarioCard = ({
  scenario,
  story,
  lastElement = false,
  setProject,
  onInspect,
  systemColors,
}) => {
  //
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(
    scenario.description.and ? true : false,
  )
  const [editValues, setEditValues] = useState({
    as: scenario.description.as || '',
    given: scenario.description.given || '',
    when: scenario.description.when || '',
    then_1: scenario.description.then_1 || '',
    and: scenario.description.and || '',
    then_2: scenario.description.then_2 || '',
  })

  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'

  const handleEdit = () => {
    setEditValues({
      as: scenario.description.as || '',
      given: scenario.description.given || '',
      when: scenario.description.when || '',
      then_1: scenario.description.then_1 || '',
      and: scenario.description.and || '',
      then_2: scenario.description.then_2 || '',
    })
    setIsEditing(true)
  }

  const handleCancel = () => setIsEditing(false)

  const handleSave = () => {
    // 1. Optimistic UI Update
    setProject((project) => ({
      ...project,
      usage_scenarios: project.usage_scenarios.map((s) =>
        s.id === scenario.id ? { ...s, description: editValues } : s,
      ),
    }))

    // 2. Backend Request
    router.patch(
      route('usage-scenario.update', scenario.id),
      { description: editValues },
      {
        preserveScroll: true,
        onSuccess: () => setIsEditing(false),
      },
    )
  }

  const handleDelete = () => {
    // 1. Optimistic UI Update
    setProject((project) => ({
      ...project,
      usage_scenarios: project.usage_scenarios.filter(
        (s) => s.id !== scenario.id,
      ),
    }))

    // 2. Backend Request
    router.delete(route('usage-scenario.destroy', scenario.id), {
      preserveScroll: true,
    })
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setIsEditing(false)
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditValues((prev) => ({ ...prev, [name]: value }))
  }
  const expandScenario = () => {
    setIsExpanded(!isExpanded)
  }
  return (
    <section
      data-card-id={scenario.id}
      className="flex flex-1 items-center max-w-md md:max-w-4xl gap-2 h-full"
    >
      {lastElement ? (
        <CornerDownRight className="text-primary size-5" />
      ) : (
        <ArrowRight className="text-primary size-5" />
      )}
      <div
        onMouseEnter={() => !isEditing && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex w-full h-full"
      >
        {!isTemporary(scenario.id) && (
          <MotionDivOptions
            isHovered={isHovered}
            isEditing={isEditing}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInspect={onInspect}
          />
        )}
        <div className="flex-1  border border-border bg-card rounded-md shadow-sm p-3">
          {isEditing ? (
            <div className="w-full flex flex-col text-left font-normal items-center gap-1">
              {/* botoes de salvar e sair*/}
              <div className="flex items-center gap-1 self-end">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch
                          variant="default"
                          checked={isExpanded}
                          onCheckedChange={expandScenario}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExpanded ? 'Mostrar menos' : 'Mostrar mais'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
              </div>
              {/* Edit form remains the same */}
              <div className="flex text-xs items-center gap-2 text-primary w-full">
                <span className="w-10 font-bold">AS</span>
                <Input
                  name="as"
                  value={editValues.as}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm h-8 font-semibold"
                  autoFocus
                />
              </div>
              <div className="flex text-xs items-center gap-2 text-primary w-full">
                <span className="w-10 font-bold">GIVEN</span>
                <Input
                  name="given"
                  value={editValues.given}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm "
                />
              </div>
              <div className="flex text-xs items-center gap-2 text-primary w-full">
                <span className="w-10 font-bold">WHEN</span>
                <Input
                  name="when"
                  value={editValues.when}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm "
                />
              </div>
              <div className="flex text-xs items-center gap-2 text-primary w-full">
                <span className="w-10 font-bold">THEN</span>
                <Input
                  name="then_1"
                  value={editValues.then_1}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm "
                />
              </div>
              {isExpanded ? (
                <>
                  <div className="flex text-xs items-center gap-2 text-primary w-full">
                    <span className="w-10 font-bold">AND</span>
                    <Input
                      name="and"
                      value={editValues.and}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full text-sm "
                    />
                  </div>
                  <div className="flex text-xs items-center gap-2 text-primary w-full">
                    <span className="w-10 font-bold">THEN</span>
                    <Input
                      name="then_2"
                      value={editValues.then_2}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full text-sm "
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="w-full bg-card rounded-lg p-2 shadow-sm">
              {/* 1. Cabeçalho (O que antes era o AccordionTrigger) */}
              <div className="flex items-center gap-2">
                <Badge
                  style={{ backgroundColor: selectedVariant }}
                  variant="outline"
                  className="border-transparent text-primary-foreground font-bold w-fit cursor-pointer"
                >
                  {`US${scenario.id}`.toUpperCase()}
                </Badge>
                <span className="font-bold text-sm">{scenario.title}</span>
              </div>
              <ul className="space-y-2 text-sm font-normal text-left mt-3 pl-1">
                <li>
                  <span className="font-bold text-primary">AS</span>{' '}
                  {scenario.description.as}
                </li>
                <li>
                  <span className="font-bold text-primary">GIVEN</span>{' '}
                  {scenario.description.given}
                </li>
                <li>
                  <span className="font-bold text-primary">WHEN</span>{' '}
                  {scenario.description.when}
                </li>
                <li>
                  <span className="font-bold text-primary">THEN</span>{' '}
                  {scenario.description.then_1}
                </li>

                {/* ✨ Melhoria: Só renderiza o 'AND' se ele existir */}
                {scenario.description.and && (
                  <li>
                    <span className="font-bold text-primary">AND</span>{' '}
                    {scenario.description.and}
                  </li>
                )}

                {/* ✨ Melhoria: Só renderiza o segundo 'THEN' se ele existir */}
                {scenario.description.then_2 && (
                  <li>
                    <span className="font-bold text-primary">THEN</span>{' '}
                    {scenario.description.then_2}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * Main component to display and manage Usage Scenarios, grouped by their parent Story.
 * @param {{ project: object, setProject: (project: object) => void }} props
 */
const UsageScenarios = ({ project, setProject }) => {
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  //ia states
  const [aiGeneratedUsageScenarios, setAiGeneratedUsageScenarios] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const hasStories = project?.stories && project.stories.length > 0
  const childrenByEpicId = useGroupedStories(project?.stories)

  // Memoize scenarios grouped by their parent `story_id`.
  const scenariosByStoryId = useMemo(() => {
    if (!project?.usage_scenarios) return new Map()

    return project.usage_scenarios.reduce((acc, scenario) => {
      const storyId = scenario.story_id // The key change is here!
      if (!acc.has(storyId)) {
        acc.set(storyId, [])
      }
      acc.get(storyId).push(scenario)
      return acc
    }, new Map())
  }, [project?.usage_scenarios])

  // inspection function
  const inspectScenario = (scenarioId) => {
    if (inspectionId === scenarioId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${scenarioId}"]`)
      setAnchorEl(element)
      setInspectionId(scenarioId)
    }
  }

  const addScenario = (storyId) => {
    const newScenarioData = {
      story_id: storyId, // Linking to the Story
      project_id: project.id,
      description: {
        as: '...',
        given: '...',
        when: '...',
        then_1: '...',
      },
    }

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`
    setProject((prev) => ({
      ...prev,
      usage_scenarios: [
        ...prev.usage_scenarios,
        { ...newScenarioData, id: tempId },
      ],
    }))

    // Backend request
    router.post(route('usage-scenario.store'), newScenarioData, {
      preserveScroll: true,
    })
  }

  const generateUsageScenarios = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('usage-scenario.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const usageScenariosWithSelection = data.usage_scenarios.map(
          (scenario) => ({ ...scenario, selected: true }),
        )

        if (usageScenariosWithSelection.length === 0) {
          toast.info(
            'Nenhum cenário de uso foi gerado para as estórias existentes.',
          )
          return
        }

        setAiGeneratedUsageScenarios(usageScenariosWithSelection)
        setShowAiModal(true)
        toast.success(
          `${usageScenariosWithSelection.length} cenários de uso foram sugeridos.`,
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
      console.error('Erro ao gerar cenários de uso:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedUsageScenarios = () => {
    const selectedUsageScenarios = aiGeneratedUsageScenarios.filter(
      (usage_scenario) => usage_scenario.selected,
    )
    const remainingUsageScenarios = aiGeneratedUsageScenarios.filter(
      (usage_scenario) => !usage_scenario.selected,
    )

    if (selectedUsageScenarios.length === 0) {
      toast.warning('Selecione pelo menos um cenário de uso para adicionar.')
      return
    }

    const usageScenariosForBackend = selectedUsageScenarios.map(
      ({ description, story_id }) => ({
        description,
        story_id,
        project_id: project.id,
      }),
    )

    setProject((prevProject) => {
      const updatedProject = { ...prevProject }
      updatedProject.usage_scenarios = [
        ...updatedProject.usage_scenarios,
        ...selectedUsageScenarios,
      ]
      setIsModalMinimized(true)
      return updatedProject
    })

    router.post(
      route('usage-scenario.bulk-store'),
      { usage_scenarios: usageScenariosForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedUsageScenarios.length} cenários de uso adicionados com sucesso!`,
          )
          setAiGeneratedUsageScenarios(remainingUsageScenarios)
          if (remainingUsageScenarios.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error('Ocorreu um erro ao salvar os cenários de uso.')
          console.error('Erro do backend:', errors)
        },
      },
    )
  }

  const cancelGeneratedUsageScenarios = () => {
    setShowAiModal(false)
    setAiGeneratedUsageScenarios([])
    setIsModalMinimized(false)
  }

  const toggleUsageScenarioSelection = (index) => {
    setAiGeneratedUsageScenarios((prev) =>
      prev.map((scenario, i) =>
        i === index ? { ...scenario, selected: !scenario.selected } : scenario,
      ),
    )
  }

  const toggleAllUsageScenarios = () => {
    const allSelected = aiGeneratedUsageScenarios.every(
      (scenario) => scenario.selected,
    )
    setAiGeneratedUsageScenarios((prev) =>
      prev.map((scenario) => ({ ...scenario, selected: !allSelected })),
    )
  }
  return (
    <section className="p-2 flex flex-col">
      {showAiModal && (
        <GeneratedItemsModal
          allStories={project?.stories}
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedUsageScenarios}
          generatedItems={aiGeneratedUsageScenarios}
          toggleItemSelection={toggleUsageScenarioSelection}
          confirmGeneratedItems={confirmGeneratedUsageScenarios}
          toggleAllItems={toggleAllUsageScenarios}
          systemColors={project?.system_colors}
        />
      )}
      {inspectionId && (
        <InvestCard
          itemCategory={'usage_scenarios'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}
      {!hasStories && (
        <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px]">
          <FileText size={40} className="mb-4 text-primary" />
          <p className="mb-2 font-medium text-foreground">
            Nenhum Cenário de Uso
          </p>
          <p className="mb-4 text-sm text-center max-w-xs">
            Crie uma User Story ou System Story primeiro para poder adicionar
            cenários de uso.
          </p>
        </div>
      )}
      {project?.stories
        ?.filter((story) => story.type === 'user' && !story.epic_id)
        .map((story) => {
          const relatedEpics = childrenByEpicId.get(story.id) || []
          const relatedScenarios = scenariosByStoryId.get(story.id) || []
          return (
            <React.Fragment key={story.id}>
              <section className="py-1 flex gap-2 min-h-48" key={story.id}>
                <StoryCard
                  story={story}
                  addScenario={() => addScenario(story.id)}
                  systemColors={project?.system_colors}
                />

                <div className="flex flex-col gap-2 w-full">
                  {relatedScenarios
                    .sort((a, b) => a.id - b.id)
                    .map((scenario, index, array) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        story={story}
                        setProject={setProject}
                        lastElement={
                          index === array.length - 1 && array.length > 1
                        }
                        onInspect={() => inspectScenario(scenario.id)}
                        systemColors={project?.system_colors}
                      />
                    ))}
                </div>
              </section>
              {[...relatedEpics]
                ?.sort((a, b) => a.id - b.id)
                .map((currentStory, index) => {
                  const epicScenarios =
                    scenariosByStoryId.get(currentStory.id) || []
                  return (
                    <section
                      className="py-1 flex gap-2 min-h-48"
                      key={currentStory.id}
                    >
                      <StoryCard
                        story={currentStory}
                        epicStoryId={index + 1}
                        addScenario={() => addScenario(currentStory.id)}
                        systemColors={project?.system_colors}
                      />

                      <div className="flex flex-col gap-2 w-full">
                        {epicScenarios
                          .sort((a, b) => a.id - b.id)
                          .map((scenario, index, array) => (
                            <ScenarioCard
                              key={scenario.id}
                              scenario={scenario}
                              story={story}
                              setProject={setProject}
                              lastElement={
                                index === array.length - 1 && array.length > 1
                              }
                              onInspect={() => inspectScenario(scenario.id)}
                              systemColors={project?.system_colors}
                            />
                          ))}
                      </div>
                    </section>
                  )
                })}
            </React.Fragment>
          )
        })}
      {/* system  */}
      {project?.stories
        ?.filter((story) => story.type === 'system')
        .map((story) => {
          const relatedEpics = childrenByEpicId.get(story.id) || []
          const relatedScenarios = scenariosByStoryId.get(story.id) || []
          return (
            <React.Fragment key={story.id}>
              <section className="py-1 flex gap-2 min-h-48" key={story.id}>
                <StoryCard
                  story={story}
                  addScenario={() => addScenario(story.id)}
                  systemColors={project?.system_colors}
                />

                <div className="flex flex-col gap-2 w-full">
                  {relatedScenarios
                    .sort((a, b) => a.id - b.id)
                    .map((scenario, index, array) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        story={story}
                        setProject={setProject}
                        lastElement={
                          index === array.length - 1 && array.length > 1
                        }
                        onInspect={() => inspectScenario(scenario.id)}
                        systemColors={project?.system_colors}
                      />
                    ))}
                </div>
              </section>
            </React.Fragment>
          )
        })}
      <GenerateAIButton
        isGenerating={isGenerating}
        onClick={generateUsageScenarios}
        // tooltip={tooltipInfo.aiGeneratedStory}
        className="w-1/2"
      />
    </section>
  )
}

export default UsageScenarios
