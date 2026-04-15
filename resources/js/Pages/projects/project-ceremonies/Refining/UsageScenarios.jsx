import React from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  CornerDownRight,
  Check,
  X,
  FileText,
} from 'lucide-react'
import { isTemporary, inspectionStatus } from '@/lib/utils'
import MotionDivOptions from '@/Components/MotionDivOptions'
import GenerateAIButton from '@/Components/GenerateAIButton'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/toastHelpers'
import { useTooltipInfo } from '@/lib/projectData'
import StatusBadge from '@/Components/StatusBadge'
import AiGeneratedBadge from '@/Components/AiGeneratedBadge'
import { usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'
/**
 * Renders the parent Story card on the left.
 * Its primary purpose is to display story info and provide an "add scenario" action.
 * @param {{ story: object, addScenario: () => void }} props
 */

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
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
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
  systemColors,
}) => {
  const { errors } = usePage().props
  const FIELD_MAX = 100
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(
    scenario.description.and ? true : false,
  )
  const status = inspectionStatus(scenario)
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
    if (
      !editValues.as.trim() ||
      !editValues.given.trim() ||
      !editValues.when.trim() ||
      !editValues.then_1.trim()
    ) {
      toast.error(
        'Preencha todos os campos obrigatórios (AS, GIVEN, WHEN, THEN).',
      )
      return
    }
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
        preserveState: true,
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
      preserveState: true,
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
          />
        )}
        <div className="flex-1  border border-border bg-card rounded-md shadow-sm p-3">
          {isEditing ? (
            <div className="w-full flex flex-col text-left font-normal items-center gap-1">
              {/* botoes de salvar e sair*/}
              <div className="flex items-center gap-1 self-end">
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
              {/* CAMPO: AS */}
              <div className="flex flex-col w-full gap-1">
                <div className="flex text-xs items-center gap-2 text-primary w-full">
                  <span className="w-10 font-bold shrink-0">AS</span>
                  <Input
                    name="as"
                    maxLength={FIELD_MAX} // [NOVO] LIMITE
                    value={editValues.as}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'w-full text-sm h-8 font-semibold',
                      !editValues.as.trim()
                        ? 'border-destructive focus-visible:ring-destructive'
                        : '',
                    )}
                    autoFocus
                  />
                </div>
                <span className="text-[10px] text-muted-foreground self-end pr-1">
                  {editValues.as.length}/{FIELD_MAX}
                </span>
              </div>

              {/* CAMPO: GIVEN */}
              <div className="flex flex-col w-full gap-1">
                <div className="flex text-xs items-center gap-2 text-primary w-full">
                  <span className="w-10 font-bold shrink-0">GIVEN</span>
                  <Input
                    name="given"
                    maxLength={FIELD_MAX}
                    value={editValues.given}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'w-full text-sm',
                      !editValues.given.trim()
                        ? 'border-destructive focus-visible:ring-destructive'
                        : '',
                    )}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground self-end pr-1">
                  {editValues.given.length}/{FIELD_MAX}
                </span>
              </div>

              {/* CAMPO: WHEN */}
              <div className="flex flex-col w-full gap-1">
                <div className="flex text-xs items-center gap-2 text-primary w-full">
                  <span className="w-10 font-bold shrink-0">WHEN</span>
                  <Input
                    name="when"
                    maxLength={FIELD_MAX}
                    value={editValues.when}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'w-full text-sm',
                      !editValues.when.trim()
                        ? 'border-destructive focus-visible:ring-destructive'
                        : '',
                    )}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground self-end pr-1">
                  {editValues.when.length}/{FIELD_MAX}
                </span>
              </div>

              {/* CAMPO: THEN 1 */}
              <div className="flex flex-col w-full gap-1">
                <div className="flex text-xs items-center gap-2 text-primary w-full">
                  <span className="w-10 font-bold shrink-0">THEN</span>
                  <Input
                    name="then_1"
                    maxLength={FIELD_MAX}
                    value={editValues.then_1}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'w-full text-sm',
                      !editValues.then_1.trim()
                        ? 'border-destructive focus-visible:ring-destructive'
                        : '',
                    )}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground self-end pr-1">
                  {editValues.then_1.length}/{FIELD_MAX}
                </span>
              </div>

              {isExpanded ? (
                <>
                  {/* CAMPO: AND (Opcional) */}
                  <div className="flex flex-col w-full gap-1">
                    <div className="flex text-xs items-center gap-2 text-primary w-full">
                      <span className="w-10 font-bold shrink-0">AND</span>
                      <Input
                        name="and"
                        maxLength={FIELD_MAX}
                        value={editValues.and}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="w-full text-sm"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground self-end pr-1">
                      {editValues.and.length}/{FIELD_MAX}
                    </span>
                  </div>

                  {/* CAMPO: THEN 2 (Opcional) */}
                  <div className="flex flex-col w-full gap-1">
                    <div className="flex text-xs items-center gap-2 text-primary w-full">
                      <span className="w-10 font-bold shrink-0">THEN</span>
                      <Input
                        name="then_2"
                        maxLength={FIELD_MAX}
                        value={editValues.then_2}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="w-full text-sm"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground self-end pr-1">
                      {editValues.then_2.length}/{FIELD_MAX}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="w-full bg-card rounded-lg p-2 shadow-sm break-words">
              {/* 1. Cabeçalho (O que antes era o AccordionTrigger) */}
              <div className="flex items-center gap-2">
                <Badge
                  style={{ backgroundColor: selectedVariant }}
                  variant="outline"
                  className="border-transparent text-black font-bold w-fit cursor-pointer"
                >
                  {`US${isTemporary(scenario.id) ? '' : scenario.id}`.toUpperCase()}
                </Badge>
                <StatusBadge status={status} />
                <AiGeneratedBadge
                  item={scenario}
                  type="usage_scenarios"
                  onDiscard={handleDelete}
                />
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
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  const hasStories = project?.stories && project.stories.length > 0

  // Stories épicas são aquelas referenciadas por outras via epic_id.
  // Quando um épico é quebrado, apenas as filhas contam; o épico vira
  // placeholder e deve sumir do listing de Usage Scenarios.
  const epicParentIds = useMemo(() => {
    const set = new Set()
    ;(project?.stories || []).forEach((s) => {
      if (s.epic_id) set.add(s.epic_id)
    })
    return set
  }, [project?.stories])
  const isBrokenEpic = (story) => epicParentIds.has(story.id)

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
      preserveState: true,
      onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
    })
  }

  const generateUsageScenarios = async () => {
    try {
      const response = await axios.post(route('usage-scenario.generate'), {
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
      console.error('Erro ao gerar cenários de uso:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    }
  }

  return (
    <section className="p-2 flex flex-col">
      {!hasStories && (
        <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px]">
          <FileText size={40} className="mb-4 text-primary" />
          <p className="mb-2 font-medium text-foreground">
            {t('usage_scenarios.empty_title')}
          </p>
          <p className="mb-4 text-sm text-center max-w-xs">
            {t('usage_scenarios.empty_hint')}
          </p>
        </div>
      )}
      {project?.stories
        ?.filter((story) => story.type === 'user' && !isBrokenEpic(story))
        .sort((a, b) => a.id - b.id)
        .map((story) => {
          const relatedScenarios = scenariosByStoryId.get(story.id) || []
          return (
            <section key={story.id} className="py-1 flex gap-2 min-h-48">
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
                      systemColors={project?.system_colors}
                    />
                  ))}
              </div>
            </section>
          )
        })}
      {/* system  */}
      {project?.stories
        ?.filter((story) => story.type === 'system' && !isBrokenEpic(story))
        .sort((a, b) => a.id - b.id)
        .map((story) => {
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
                        systemColors={project?.system_colors}
                      />
                    ))}
                </div>
              </section>
            </React.Fragment>
          )
        })}
      <GenerateAIButton
        type="usage_scenarios"
        onClick={generateUsageScenarios}
        tooltip={tooltipInfo.aiGeneratedUsageScenario}
        className="w-1/2"
      />
    </section>
  )
}

export default UsageScenarios
