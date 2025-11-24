import React from 'react'
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
import { isTemporary, useGroupedStories } from '@/lib/utils'
import InvestCard from '../Inspection/InvestCard'
import GenerateAIButton from '@/Components/GenerateAIButton'
import ReactTextareaAutosize from 'react-textarea-autosize'
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
                            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer`}
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
            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer `}
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
  // ✨ ESTADOS PARA CONTROLE DA EDIÇÃO
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(businessRule.title)

  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'

  // ⚡️ FUNÇÕES PARA MANIPULAR A EDIÇÃO
  const handleEdit = () => {
    setEditValue(businessRule.title) // Garante que o input comece com o valor atual
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    if (editValue === businessRule.title) {
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
        onSuccess: () => setIsEditing(false),
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
          className={`
            flex flex-row flex-1 items-start justify-start p-2 gap-2 text-xs font-normal text-foreground bg-card
            border border-border rounded-md shadow-sm transition-opacity duration-300 min-h-16
          `}
        >
          <Badge
            style={{ backgroundColor: selectedVariant }}
            variant="outline"
            className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer `}
          >
            {`BR${
              isTemporary(businessRule.id) ? '' : businessRule.id
            }`.toUpperCase()}
          </Badge>

          {/* 🎨 RENDERIZAÇÃO CONDICIONAL: MODO DE EDIÇÃO OU VISUALIZAÇÃO */}
          {isEditing ? (
            <div className="w-full flex flex-col items-center gap-2">
              <ReactTextareaAutosize
                id="description"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-transparent border-0 w-full rounded text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
            </div>
          ) : (
            <p className="text-sm w-full min-h-[32px] flex items-center justify-start">
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
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  //ia states
  const [aiGeneratedBusinessRules, setAiGeneratedBusinessRules] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const hasStories = project?.stories && project.stories.length > 0
  const childrenByEpicId = useGroupedStories(project?.stories)

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
    router.post(route('business-rule.store'), {
      // Rota atualizada
      story_id: storyId,
      project_id: project.id,
      title: 'Nova Business Rule', // Texto atualizado
    })

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
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('business-rule.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const businessRulesWithSelection = data.business_rules.map(
          (business_rule) => ({
            ...business_rule,
            selected: true,
          }),
        )

        if (businessRulesWithSelection.length === 0) {
          toast.info(
            'A IA não gerou novas Regras de Negócio com base nas estórias.',
          )
          return
        }

        setAiGeneratedBusinessRules(businessRulesWithSelection)
        setShowAiModal(true)
        toast.success('Regras de Negócio geradas com sucesso.')
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
      console.error('Erro ao gerar Business Rules:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
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
      toast.warning('Selecione pelo menos uma business rule para adicionar.')
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
          toast.error('Ocorreu um erro ao salvar as Business Rules.')
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
            Nenhuma Regra de Negócio
          </p>
          <p className="mb-4 text-sm text-center max-w-xs">
            Crie uma User Story ou System Story primeiro para poder adicionar
            regras de negócio.
          </p>
        </div>
      )}
      {/* user stories*/}
      {project?.stories
        ?.filter((story) => story.type === 'user')
        .map((story) => {
          const relatedEpics = childrenByEpicId.get(story.id) || []
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
        ?.filter((story) => story.type === 'system')
        .map((story) => {
          const relatedEpics = childrenByEpicId.get(story.id) || []
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
        isGenerating={isGenerating}
        onClick={generateBusinessRules}
        // tooltip={tooltipInfo.aiGeneratedStory}
        className="w-1/2"
      />
    </section>
  )
}

export default BusinessRules
