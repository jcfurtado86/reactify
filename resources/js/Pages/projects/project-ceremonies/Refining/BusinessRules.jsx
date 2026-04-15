import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  CornerDownRight,
  Minus,
  Check,
  X,
  ChevronsUp,
  GanttChartSquare,
} from 'lucide-react'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'
import { useTooltipInfo } from '@/lib/projectData'
import { isTemporary, inspectionStatus } from '@/lib/utils'
import InvestCard from '../Inspection/InvestCard'
import GenerateAIButton from '@/Components/GenerateAIButton'
import ReactTextareaAutosize from 'react-textarea-autosize'
import StatusBadge from '@/Components/StatusBadge'
import AiGeneratedBadge from '@/Components/AiGeneratedBadge'
import { usePage } from '@inertiajs/react' 
import { cn } from '@/lib/utils'
/**
 * Componente para renderizar um único card de estória.
 * Gerencia seu próprio estado de hover para exibir o botão de adicionar.
 * @param {{ story: object, addBusinessRule: () => void }} props
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
  const { t } = useTranslation()
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
            {!isModalMinimized && 'Business Rules por IA'}
            {isModalMinimized && 'Business Rules Geradas'}
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
                {t('ai_modal.selected_of', {
                  count: generatedItems.filter((j) => j.selected).length,
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
                {generatedItems.map((story, index) => {
                  const storyType = allStories.find(
                    (s) => s.id === story.story_id,
                  ).type
                  const selectedVariant = storyVariants[storyType] || '#f97316'

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
                          {/* Badge que mostra a Story Pai */}
                          <Badge
                            style={{ backgroundColor: selectedVariant }}
                            variant="outline"
                            className={`border-transparent text-black font-bold w-fit cursor-pointer`}
                          >
                            {`${storyType === 'system' ? 'SS' : 'US'}${story.story_id}`.toUpperCase()}
                          </Badge>

                          {/* Seta para indicar a relação */}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />

                          {/* Badge da Business Rule */}
                          <Badge
                            variant="secondary"
                            className="border-transparent font-bold w-fit"
                          >
                            BR
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

            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
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
                {t('common.confirm_and_add')} (
                {generatedItems.filter((j) => j.selected).length})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const StoryCard = ({ story, addBusinessRule, systemColors }) => {
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'
  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.id}`

  return (
    <div className="relative group text-left">
      {/* O onAdd agora chama a função para adicionar uma regra de negócio */}
      <MotionDivOptions isHovered={true} onAdd={addBusinessRule} />

      <div
        className={`
          flex flex-col h-full w-52 items-center justify-start p-2 gap-1 text-xs font-normal text-foreground
          border border-border bg-card rounded-md shadow-sm transition-opacity duration-300 min-h-16
        `}
      >
        <div className="mr-auto">
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
          >
            {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
          </Badge>
        </div>

        <p className="text-sm w-full">{story.title}</p>
      </div>
    </div>
  )
}

const BusinessRuleCard = ({
  story,
  businessRule,
  lastElement = false,
  setProject,
  onInspect,
  systemColors,
}) => {
  const { errors } = usePage().props
  // ✨ ESTADOS PARA CONTROLE DA EDIÇÃO
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(businessRule.title)
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'
  const status = inspectionStatus(businessRule)
  const TITLE_MAX = 255;
  const titleError = isEditing ? errors?.title : null;

  // ⚡️ FUNÇÕES PARA MANIPULAR A EDIÇÃO
  const handleEdit = () => {
    setEditValue(businessRule.title) // Garante que o input comece com o valor atual
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    if (!editValue.trim() || editValue === businessRule.title) {
      setIsEditing(false)
      return
    }

    setProject((project) => ({
      ...project,
      // Alvo agora é a lista de business_rules
      business_rules: project.business_rules.map((rule) => {
        if (rule.id === businessRule.id) {
          return { ...rule, title: editValue }
        }
        return rule
      }),
    }))

    router.patch(
      // Rota atualizada para o controller de BusinessRule
      route('business-rule.update', businessRule.id),
      { title: editValue },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          toastSuccess('business_rules.toast_updated')
          setIsEditing(false)
        },
        onError: (errors) => toastApiError(errors, 'common.toast.error_save'),
      },
    )
  }

  const handleDelete = () => {
    setProject((project) => ({
      ...project,
      // Filtra a lista de business_rules
      business_rules: project.business_rules.filter(
        (r) => r.id !== businessRule.id,
      ),
    }))

    router.delete(route('business-rule.destroy', businessRule.id), {
      preserveScroll: true,
      preserveState: true,
    })
  }

  return (
    <section className="businessRule flex flex-1 items-center max-w-md md:max-w-4xl gap-1">
      {lastElement ? (
        <CornerDownRight className="text-primary size-5 " />
      ) : (
        <ArrowRight className="text-primary size-5 " />
      )}
      <div
        onMouseEnter={() => !isEditing && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex w-full h-full"
        data-card-id={businessRule.id}
      >
        <MotionDivOptions
          isHovered={isHovered}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onInspect={onInspect}
        />

        <div
          className={cn(
            "flex flex-row flex-1 items-start justify-start p-2 gap-2 text-xs font-normal text-foreground bg-card border border-border rounded-md shadow-sm transition-opacity duration-300 min-h-16",
            titleError ? "border-destructive" : ""
          )}
        >
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-black font-bold w-fit cursor-pointer `}
          >
            {`BR${
              isTemporary(businessRule.id) ? '' : businessRule.id
            }`.toUpperCase()}
          </Badge>
          <StatusBadge status={status} />
          <AiGeneratedBadge
            item={businessRule}
            type="business_rules"
            onDiscard={handleDelete}
          />
          {/* 🎨 RENDERIZAÇÃO CONDICIONAL: MODO DE EDIÇÃO OU VISUALIZAÇÃO */}
          {isEditing ? (
            <div className="w-full flex flex-col items-center gap-2">
              <ReactTextareaAutosize
                id="description"
                maxLength={TITLE_MAX}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className={cn(
                    "bg-transparent border-0 w-full rounded text-sm resize-none focus:outline-none p-0 focus:ring-0",
                    titleError ? "placeholder:text-destructive" : ""
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editValue.trim()) handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                autoFocus
              />
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
            <p className="text-sm w-full min-h-[32px] flex items-center justify-start break-words whitespace-pre-wrap">
              {businessRule.title}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * Componente principal que exibe a coluna de "Business Rules".
 * Ele mapeia as estórias do projeto e renderiza um StoryCard para cada uma.
 * @param {{ project: object, setProject: (project: object) => void }} props
 */
const BusinessRules = ({ project, setProject }) => {
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  //ia states
  const [aiGeneratedBusinessRules, setAiGeneratedBusinessRules] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const hasStories = project?.stories && project.stories.length > 0

  // Stories épicas são aquelas referenciadas por outras via epic_id.
  // Quando um épico é quebrado, apenas as filhas contam como stories reais;
  // o épico vira um placeholder e deve sumir dos listings de Business Rules.
  const epicParentIds = useMemo(() => {
    const set = new Set()
    ;(project?.stories || []).forEach((s) => {
      if (s.epic_id) set.add(s.epic_id)
    })
    return set
  }, [project?.stories])
  const isBrokenEpic = (story) => epicParentIds.has(story.id)

  // Memoriza o estado das business_rules
  const businessRulesByStoryId = useMemo(() => {
    if (!project?.business_rules) return new Map()

    return project.business_rules.reduce((acc, businessRule) => {
      const storyId = businessRule.story_id
      if (!acc.has(storyId)) {
        acc.set(storyId, [])
      }
      acc.get(storyId).push(businessRule)
      return acc
    }, new Map())
  }, [project?.business_rules]) // Dependência atualizada

  // inspection function
  const inspectRule = (ruleId) => {
    if (inspectionId === ruleId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${ruleId}"]`)
      setAnchorEl(element)
      setInspectionId(ruleId)
    }
  }

  const addBusinessRule = (storyId) => {
    router.post(
      route('business-rule.store'),
      {
        // Rota atualizada
        story_id: storyId,
        project_id: project.id,
        title: 'Nova Business Rule', // Texto atualizado
      },
      { preserveScroll: true, preserveState: true },
    )

    setProject((prevProject) => ({
      ...prevProject,
      // Adiciona na lista de business_rules
      business_rules: [
        ...prevProject.business_rules,
        {
          story_id: storyId,
          project_id: project.id,
          title: 'Nova Business Rule', // Texto atualizado
          id: `temp-${new Date().getTime()}`, // Usei getTime() para maior unicidade
        },
      ],
    }))
  }

  const generateBusinessRules = async () => {
    setIsGenerating(true)
    try {
      const response = await axios.post(route('business-rule.generate'), {
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
      console.error('Erro ao gerar Business Rules:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedBusinessRules = () => {
    const selectedBusinessRules = aiGeneratedBusinessRules.filter(
      (business_rule) => business_rule.selected,
    )
    const remainingBusinessRules = aiGeneratedBusinessRules.filter(
      (business_rule) => !business_rule.selected,
    )

    if (selectedBusinessRules.length === 0) {
      toast.warning(t('common.select_at_least_one'))
      return
    }

    const businessRulesToAdd = selectedBusinessRules.map((business_rule) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      project_id: project.id,
      ...business_rule,
    }))

    setProject((prevProject) => ({
      ...prevProject,
      goal_sketches: [
        ...(prevProject.goal_sketches || []),
        ...businessRulesToAdd,
      ],
    }))

    const businessRulesForBackend = selectedBusinessRules.map(
      ({ title, story_id, project_id }) => ({
        title,
        story_id,
        project_id: project.id,
      }),
    )

    router.post(
      route('business-rule.bulk-store'),
      { business_rules: businessRulesForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedBusinessRules.length} Business Rules adicionada com sucesso!`,
          )
          setAiGeneratedBusinessRules(remainingBusinessRules)
          if (remainingBusinessRules.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error(t('common.error'))
          console.error('Erro do backend:', errors)
          setProject((prevProject) => {
            const businessRulesToAddIds = businessRulesToAdd.map((g) => g.id)
            return {
              ...prevProject,
              business_rules: prevProject.business_rules.filter(
                (rule) => !businessRulesToAddIds.includes(rule.id),
              ),
            }
          })
        },
      },
    )
  }

  const cancelGeneratedBusinessRules = () => {
    setShowAiModal(false)
    setAiGeneratedBusinessRules([])
    setIsModalMinimized(false)
  }

  const toggleBusinessRuleSelection = (index) => {
    setAiGeneratedBusinessRules((prev) =>
      prev.map((rule, i) =>
        i === index ? { ...rule, selected: !rule.selected } : rule,
      ),
    )
  }

  const toggleAllBusinessRules = () => {
    const allSelected = aiGeneratedBusinessRules.every((rule) => rule.selected)
    setAiGeneratedBusinessRules((prev) =>
      prev.map((rule) => ({ ...rule, selected: !allSelected })),
    )
  }

  return (
    <section className="p-2 flex flex-col gap-2 ">
      {showAiModal && (
        <GeneratedItemsModal
          allStories={project?.stories}
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedBusinessRules}
          generatedItems={aiGeneratedBusinessRules}
          toggleItemSelection={toggleBusinessRuleSelection}
          confirmGeneratedItems={confirmGeneratedBusinessRules}
          toggleAllItems={toggleAllBusinessRules}
          systemColors={project?.system_colors}
        />
      )}
      {inspectionId && (
        <InvestCard
          itemCategory={'business_rules'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}
      {!hasStories && (
        <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px]">
          <GanttChartSquare size={40} className="mb-4 text-primary" />
          <p className="mb-2 font-medium text-foreground">
            {t('business_rules.empty_title')}
          </p>
          <p className="mb-4 text-sm text-center max-w-xs">
            {t('business_rules.empty_hint')}
          </p>
        </div>
      )}
      {/* user stories*/}
      {project?.stories
        ?.filter((story) => story.type === 'user' && !isBrokenEpic(story))
        .sort((a, b) => a.id - b.id)
        .map((story) => {
          const relatedBusinessRules =
            businessRulesByStoryId.get(story.id) || []
          return (
            <React.Fragment key={story.id}>
              <section className="py-1 flex gap-1 items-stretch" key={story.id}>
                <StoryCard
                  story={story}
                  addBusinessRule={() => addBusinessRule(story.id)}
                  systemColors={project?.system_colors}
                />

                <div className="flex flex-col gap-1 w-full">
                  {[...relatedBusinessRules]
                    .sort((a, b) => a.id - b.id)
                    .map((businessRule, index, array) => (
                      <BusinessRuleCard
                        key={businessRule.id}
                        story={story}
                        businessRule={businessRule}
                        lastElement={
                          index === array.length - 1 && array.length > 1
                        }
                        setProject={setProject}
                        onInspect={() => inspectRule(businessRule.id)}
                        systemColors={project?.system_colors}
                      />
                    ))}
                </div>
              </section>
            </React.Fragment>
          )
        })}
      {/* system stories*/}
      {project?.stories
        ?.filter((story) => story.type === 'system' && !isBrokenEpic(story))
        .sort((a, b) => a.id - b.id)
        .map((story) => {
          const relatedBusinessRules =
            businessRulesByStoryId.get(story.id) || []
          return (
            <React.Fragment key={story.id}>
              <section className="py-1 flex gap-1 items-stretch" key={story.id}>
                <StoryCard
                  story={story}
                  addBusinessRule={() => addBusinessRule(story.id)}
                  systemColors={project?.system_colors}
                />

                <div className="flex flex-col gap-1 w-full">
                  {[...relatedBusinessRules]
                    .sort((a, b) => a.id - b.id)
                    .map((businessRule, index, array) => (
                      <BusinessRuleCard
                        key={businessRule.id}
                        story={story}
                        businessRule={businessRule}
                        lastElement={
                          index === array.length - 1 && array.length > 1
                        }
                        setProject={setProject}
                        onInspect={() => inspectRule(businessRule.id)}
                        systemColors={project?.system_colors}
                      />
                    ))}
                </div>
              </section>
            </React.Fragment>
          )
        })}
      <GenerateAIButton
        type="business_rules"
        isGenerating={isGenerating}
        onClick={generateBusinessRules}
        tooltip={tooltipInfo.aiGeneratedBusinessRule}
        className="w-1/2"
      />
    </section>
  )
}

export default BusinessRules
