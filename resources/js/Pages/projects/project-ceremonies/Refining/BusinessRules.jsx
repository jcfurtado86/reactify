import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  CornerDownRight,
  GanttChartSquare,
} from 'lucide-react'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/toastHelpers'
import { useTooltipInfo } from '@/lib/projectData'
import { isTemporary, inspectionStatus } from '@/lib/utils'
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
const StoryCard = ({ story, addBusinessRule, systemColors }) => {
  const storyVariants = systemColors?.stories || {}
  const selectedVariant = storyVariants[story.type] || '#f97316'
  const realStoryId = story.epic_id
    ? `${story.epic_id}.${story.epic_index || 0}`
    : `${story.id}`

  return (
    <div className="relative group text-left">
      {/* O onAdd agora chama a função para adicionar uma regra de negócio */}
      <MotionDivOptions slot="businessRule.manage" isHovered={true} onAdd={addBusinessRule} />

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
        <MotionDivOptions slot="businessRule.manage"
          isHovered={isHovered}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
  const hasStories = project?.stories && project.stories.length > 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const scrollTo = params.get('scrollTo')
    if (scrollTo) {
      setTimeout(() => {
        const el = document.querySelector(`[data-card-id="${scrollTo}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-primary')
          setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000)
        }
      }, 300)
    }
  }, [])

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
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Erro ao gerar Business Rules:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    }
  }

  return (
    <section className="p-2 flex flex-col gap-2 ">
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
              <section className="py-1 flex gap-1 items-stretch" key={story.id} data-story-id={story.id}>
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
              <section className="py-1 flex gap-1 items-stretch" key={story.id} data-story-id={story.id}>
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
        onClick={generateBusinessRules}
        tooltip={tooltipInfo.aiGeneratedBusinessRule}
        className="w-1/2"
      />
    </section>
  )
}

export default BusinessRules
