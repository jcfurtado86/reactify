import React from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import Interview from '@/Components/Interview'
import { useTooltipInfo } from '@/lib/projectData'
import { ProjectPermissions } from '@/Components/ProjectPermissions'
import { ProjectSettings } from '@/Components/ProjectSettings'
import {
  Clock,
  ArrowRight,
  CircleCheckBig,
  CircleAlert,
  ChevronDown,
  AlertTriangle,
  FileWarning,
  ClipboardCheck,
  GitPullRequest,
  Rocket,
} from 'lucide-react'
import SpanButton from '@/Components/SpanButton'
import MainLayout from '@/Layouts/MainLayout'
import { cn, currentIntlLocale } from '@/lib/utils'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'

const roleBadgeVariant = {
  administrator: 'destructive',
  domain_expert: 'secondary',
  team: 'default',
  customer: 'outline',
}

const sumStoryValue = (stories) =>
  stories.reduce((acc, s) => acc + (s.value ?? 0), 0)

const investStatus = (invest) => {
  if (!invest) return 'missing'
  const values = Object.values(invest)
  if (values.length === 0) return 'missing'
  if (values.some((v) => v === 'no')) return 'rejected'
  if (values.every((v) => v === 'yes' || v === 'na')) return 'validated'
  return 'pending'
}

const KanbanColumn = ({ titleKey, stories, color, onClick }) => {
  const { t } = useTranslation()
  const count = stories.length
  const value = sumStoryValue(stories)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col justify-between rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-muted',
        'min-h-[5.5rem] flex-1',
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <span className={cn('h-2 w-2 rounded-full', color)} />
        {t(titleKey)}
      </span>
      <span className="flex items-end justify-between gap-2 mt-2">
        <span className="text-2xl font-bold text-foreground leading-none">
          {count}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {t('dashboard.value_total', { value })}
        </span>
      </span>
    </button>
  )
}

const SprintTimeline = ({ sprints, onSelect }) => {
  const { t, i18n } = useTranslation()
  const sorted = useMemo(
    () =>
      [...(sprints || [])].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date),
      ),
    [sprints],
  )

  if (sorted.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center">
        {t('dashboard.timeline_empty')}
      </div>
    )
  }

  const fmt = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString(currentIntlLocale(), {
      day: '2-digit',
      month: '2-digit',
    })
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {sorted.map((sprint) => {
        const total = sprint.stories?.length || 0
        const done =
          sprint.stories?.filter((s) => s.pivot?.kanban_status === 'done')
            .length || 0
        const pct = total > 0 ? (done / total) * 100 : 0
        const isActive = sprint.status === 'active'
        const isCompleted = sprint.status === 'completed'
        const borderTone = isActive
          ? 'border-primary'
          : isCompleted
            ? 'border-emerald-500'
            : 'border-border'
        return (
          <button
            key={sprint.id}
            type="button"
            onClick={() => onSelect(sprint)}
            className={cn(
              'shrink-0 min-w-[11rem] flex flex-col gap-1 rounded-md border-t-4 bg-background p-3 text-left transition-colors hover:bg-muted',
              borderTone,
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground truncate">
                {sprint.name}
              </span>
              {isActive && (
                <Badge variant="default" className="text-[10px]">
                  {t('sprint.active')}
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {fmt(sprint.start_date)} — {fmt(sprint.end_date)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={pct} className="flex-1 h-1.5" />
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {done}/{total}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const ReactMCycle = ({ project, currentPhase, onPhaseClick }) => {
  const { t } = useTranslation()
  const counts = {
    inception:
      (project?.personas?.length || 0) +
      (project?.journeys?.length || 0) +
      (project?.goal_sketches?.length || 0),
    storyDiscovery: project?.stories?.length || 0,
    refining:
      (project?.stories?.filter((s) => s.epic_id)?.length || 0) +
      (project?.business_rules?.length || 0) +
      (project?.usage_scenarios?.length || 0),
    modeling:
      (project?.crc_cards?.length || 0) +
      (project?.system_interfaces?.length || 0) +
      (project?.storyboards?.length || 0),
  }

  // SVG layout: 4 nodes at top/right/bottom/left, radius 70 around center (100,100)
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const r = 72
  const nodeR = 32

  const phases = [
    { key: 'inception', angle: -90, labelKey: 'project.phases.inception' },
    {
      key: 'storyDiscovery',
      angle: 0,
      labelKey: 'project.phases.story_discovery',
    },
    { key: 'refining', angle: 90, labelKey: 'project.phases.refining' },
    { key: 'modeling', angle: 180, labelKey: 'project.phases.modeling' },
  ]

  const pos = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[240px]"
        role="img"
        aria-label={t('dashboard.cycle_aria')}
      >
        {/* Dashed ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
        {/* Arrows between nodes */}
        {phases.map((p, i) => {
          const next = phases[(i + 1) % phases.length]
          const a = pos(p.angle)
          const b = pos(next.angle)
          return (
            <line
              key={`arrow-${p.key}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              className="text-muted-foreground"
            />
          )
        })}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
          fontWeight="600"
          style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          REACT-M
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="8"
        >
          {t('dashboard.cycle_center_hint')}
        </text>
        {/* Nodes */}
        {phases.map((p) => {
          const { x, y } = pos(p.angle)
          const isCurrent = currentPhase === p.key
          return (
            <g
              key={p.key}
              className="cursor-pointer"
              onClick={() => onPhaseClick(p.key)}
            >
              <circle
                cx={x}
                cy={y}
                r={nodeR}
                className={cn(
                  isCurrent
                    ? 'fill-primary stroke-primary'
                    : 'fill-card stroke-border',
                )}
                strokeWidth="2"
              />
              <text
                x={x}
                y={y - 4}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                className={cn(
                  isCurrent
                    ? 'fill-primary-foreground'
                    : 'fill-muted-foreground',
                )}
                style={{ textTransform: 'uppercase' }}
              >
                {t(p.labelKey)}
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                className={cn(
                  isCurrent ? 'fill-primary-foreground' : 'fill-foreground',
                )}
              >
                {counts[p.key]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const HealthCard = ({ icon: Icon, labelKey, count, tone, onClick }) => {
  const { t } = useTranslation()
  const bad = count > 0
  const toneClasses = bad
    ? {
        danger: 'border-destructive/40 text-destructive',
        warning: 'border-amber-500/40 text-amber-500',
      }[tone]
    : 'border-border text-muted-foreground'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-muted flex-1 min-w-[10rem]',
        toneClasses,
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium">
        <Icon className="size-4 shrink-0" />
        {t(labelKey)}
      </span>
      <span className="text-xl font-bold tabular-nums">{count}</span>
    </button>
  )
}

export const CeremonyCard = ({
  item,

  artifacts = [],
  amount = 0,
  className,
  onClick,
  delay = 0,
  project,
}) => {
  const { t } = useTranslation()
  const getArtifactKey = (artifactTitle) => {
    switch (artifactTitle) {
      case 'overallModel':
        return 'crc_cards'
      case 'businessRules':
        return 'business_rules'
      case 'usageScenarios':
        return 'usage_scenarios'
      case 'prioritizationMatrix':
        return 'prioritizations'
      case 'goals':
        return 'goal_sketches'
      case 'interfaces':
        return 'system_interfaces'
      case 'changeLog':
        return 'change_requests'
      default:
        return artifactTitle
    }
  }
  const getMessage = (artifactTitle, amount) => {
    if (amount > 0) return null

    switch (artifactTitle) {
      case 'prioritizationMatrix':
        return t('dashboard.missing_prioritization')

      default:
        return t('dashboard.pending_fill')
    }
  }
  const getProductCanvasAmount = (canvas) => {
    if (
      canvas.product_is &&
      canvas.product_is_not &&
      canvas.restrictions &&
      canvas.personas &&
      canvas.issues &&
      canvas.solutions
    )
      return 1
    else return 0
  }
  return (
    <Accordion
      collapsible
      type="single"
      className="w-full"
      defaultValue={item.title}
    >
      <AccordionItem
        value={item.title}
        className={cn(
          'group relative w-full overflow-hidden bg-background',
          'transition-all duration-300 ease-in-out ',
          'border-b', // O AccordionItem já tem uma borda por padrão
          className,
        )}
      >
        {/* HEADER (O QUE É CLICÁVEL) */}
        <AccordionTrigger
          // O padding p-2 do Card original foi movido para cá
          // hover:no-underline remove o sublinhado padrão do hover
          className="p-4 hover:no-underline"
        >
          <div className="flex w-full items-center gap-2">
            <SpanButton
              title={t('dashboard.go_to', { name: item.title })}
              onClick={onClick}
              variant="link"
            >
              {item.title}
              <ArrowRight className="size-3 ml-1" />
            </SpanButton>
          </div>
        </AccordionTrigger>

        {/* CONTEÚDO (O QUE ABRE E FECHA) */}
        <AccordionContent
          // Adiciona padding ao conteúdo, exceto no topo para ficar mais fluido
          className="px-2 pt-0 pb-2"
        >
          {/* Descrição (descomentada do seu código original) */}
          {item.description && (
            <p className="text-sm text-muted-foreground ">
              {item.description}{' '}
            </p>
          )}

          <div className="flex flex-wrap items-start gap-1 text-sm">
            {artifacts.map((artifact, index) => {
              const artifactKey = getArtifactKey(artifact.title)

              let artifactAmount
              if (artifact.title === 'productCanvas')
                artifactAmount = getProductCanvasAmount(project?.product_canvas)
              else if (artifact.title === 'epicStories')
                artifactAmount = project?.stories.filter(
                  (story) => story.epic_id,
                ).length
              else if (artifact.title === 'prioritizationMatrix') {
                const allStories = project?.stories || []
                const prioritizedStories = allStories.filter((story) =>
                  project?.prioritizations?.some(
                    (prioritization) => prioritization.story_id === story.id,
                  ),
                )
                artifactAmount = prioritizedStories.length
              } else artifactAmount = project?.[artifactKey]?.length || 0

              const message = getMessage(artifact.title, artifactAmount)

              return (
                <ButtonWithTooltip
                  variant="link"
                  title={t('dashboard.go_to', { name: artifact.label })}
                  key={artifact.title}
                  className="flex items-center gap-2"
                  onClick={() =>
                    router.get(
                      route('project.ceremony.show', {
                        project: project.id,
                        ceremony: item.link || 'inception',
                      }),
                      { artifact: artifact.title || '' },
                    )
                  }
                  tooltipContent={message}
                >
                  {artifact.label}
                  {artifactAmount > 0 ? (
                    <>
                      <CircleCheckBig className="size-4 text-green-600" />
                    </>
                  ) : (
                    <CircleAlert className="size-4 text-amber-600" />
                  )}
                </ButtonWithTooltip>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const Dashboard = ({ project, setProject }) => {
  const { t } = useTranslation()
  const { auth } = usePage().props
  const tooltipInfo = useTooltipInfo()
  const [interviewsOpen, setInterviewsOpen] = useState(false)

  const currentUserRole = useMemo(
    () =>
      project?.users?.find((u) => u.id === auth?.user?.id)?.pivot?.role ||
      null,
    [project, auth],
  )

  const health = useMemo(() => {
    const stories = project?.stories || []
    const changes = project?.change_requests || []
    const sprints = project?.sprints || []
    const activeSprint = sprints.find((s) => s.status === 'active')

    // Uma story é "priorizada" quando tem uma linha correspondente em
    // project.prioritizations (onde mora o priority_id e a position).
    // Os campos s.value/s.complexity são de outro contexto e ficavam null.
    const prioritizedIds = new Set(
      (project?.prioritizations || []).map((p) => p.story_id),
    )
    const unprioritized = stories.filter(
      (s) => !prioritizedIds.has(s.id),
    ).length

    const investNotOk = stories.filter((s) => {
      const st = investStatus(s.invest_card)
      return st === 'missing' || st === 'pending' || st === 'rejected'
    }).length

    const openChanges = changes.filter(
      (c) => c.status !== 'IMPLEMENTADA' && c.status !== 'REJEITADA',
    ).length

    const activeSprintStories = activeSprint?.stories || []
    const activeSprintDone = activeSprintStories.filter(
      (s) => s.pivot?.kanban_status === 'done',
    ).length

    return {
      unprioritized,
      investNotOk,
      openChanges,
      activeSprint,
      activeSprintTotal: activeSprintStories.length,
      activeSprintDone,
    }
  }, [project])

  const sprintProgress = useMemo(() => {
    if (!health.activeSprint) return null
    const { start_date, end_date } = health.activeSprint
    if (!start_date || !end_date) return { day: null, total: null }
    const start = new Date(start_date)
    const end = new Date(end_date)
    const today = new Date()
    const msDay = 1000 * 60 * 60 * 24
    const total = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / msDay) + 1,
    )
    const day = Math.min(
      total,
      Math.max(1, Math.round((today.getTime() - start.getTime()) / msDay) + 1),
    )
    return { day, total }
  }, [health.activeSprint])

  const { productBacklogStories, sprintBacklogStories, deliveredStories } =
    useMemo(() => {
      const stories = project?.stories || []
      const sprints = project?.sprints || []

      const productBacklog = stories
        .filter((story) => {
          const isInActiveSprint = sprints.some(
            (sprint) =>
              sprint.status === 'active' &&
              sprint.stories?.some(
                (sprintStory) => sprintStory.id === story.id,
              ),
          )

          return (
            (story.status === 'prioritized' || story.value !== null) &&
            !isInActiveSprint
          )
        })
        .sort((a, b) => {
          if (a.status === 'prioritized' && b.status !== 'prioritized')
            return -1
          if (b.status === 'prioritized' && a.status !== 'prioritized') return 1
          return (b.value ?? -1) - (a.value ?? -1)
        })

      const sprintBacklog = []
      const delivered = []

      sprints.forEach((sprint) => {
        if (sprint.status === 'active') {
          sprint.stories?.forEach((story) => {
            if (story.pivot?.kanban_status === 'done') {
              delivered.push({ ...story, sprint_name: sprint.name })
            } else {
              sprintBacklog.push({ ...story, sprint_name: sprint.name })
            }
          })
        }
      })

      return {
        productBacklogStories: productBacklog,
        sprintBacklogStories: sprintBacklog,
        deliveredStories: delivered,
      }
    }, [project])

  const ceremonies = [
    {
      title: 'inception',
      defaultArtifact: 'productCanvas',
      artifacts: [
        { label: 'Product Canvas', title: 'productCanvas' },
        { label: 'Personas', title: 'personas' },
        { label: 'Goals', title: 'goals' },
        { label: 'Journeys', title: 'journeys' },
      ],
    },
    {
      title: 'storyDiscovery',
      defaultArtifact: 'stories',
      artifacts: [
        { label: 'Stories', title: 'stories' },
        { label: 'Overall Model', title: 'overallModel' },
        { label: t('project.artifacts.prioritization_matrix'), title: 'prioritizationMatrix' },
        { label: 'Change Log', title: 'changeLog' },
      ],
    },
    {
      title: 'refining',
      defaultArtifact: 'epicStories',
      artifacts: [
        { label: 'Epic Stories', title: 'epicStories' },
        { label: 'Business Rules', title: 'businessRules' },
        { label: 'Usage Scenarios', title: 'usageScenarios' },
      ],
    },
    {
      title: 'modeling',
      defaultArtifact: 'overallModel',
      artifacts: [
        { label: 'Overall Model', title: 'overallModel' },
        { label: 'Interfaces', title: 'interfaces' },
        { label: 'Storyboards', title: 'storyboards' },
      ],
    },
    { title: 'productBacklog', amount: 3 },
    { title: 'sprint', amount: project?.sprints?.length },
  ]
  const currentPhase = useMemo(() => {
    const canvas = project?.product_canvas
    const canvasFilled =
      canvas &&
      (canvas.product_is || canvas.personas || canvas.issues || canvas.solutions)
    const personas = project?.personas?.length || 0
    const journeys = project?.journeys?.length || 0
    const stories = project?.stories?.length || 0
    const refiningStuff =
      (project?.business_rules?.length || 0) +
      (project?.usage_scenarios?.length || 0) +
      (project?.stories?.filter((s) => s.epic_id)?.length || 0)
    const modelingStuff =
      (project?.crc_cards?.length || 0) +
      (project?.system_interfaces?.length || 0) +
      (project?.storyboards?.length || 0)

    if (!canvasFilled && personas === 0 && journeys === 0) return 'inception'
    if (stories === 0) return 'storyDiscovery'
    if (refiningStuff === 0) return 'refining'
    if (modelingStuff === 0) return 'modeling'
    return 'modeling'
  }, [project])

  const nextAction = useMemo(() => {
    if (health.activeSprint) return null
    const stories = project?.stories || []
    const personas = project?.personas || []
    const journeys = project?.journeys || []
    const canvas = project?.product_canvas
    const canvasFilled =
      canvas &&
      (canvas.product_is ||
        canvas.personas ||
        canvas.issues ||
        canvas.solutions)

    if (personas.length === 0 && journeys.length === 0 && !canvasFilled) {
      return {
        key: 'inception',
        ceremony: 'inception',
        artifact: 'productCanvas',
      }
    }
    if (stories.length === 0) {
      return {
        key: 'write_stories',
        ceremony: 'storyDiscovery',
        artifact: 'stories',
      }
    }
    if (health.unprioritized > 0) {
      return {
        key: 'prioritize',
        ceremony: 'storyDiscovery',
        artifact: 'prioritizationMatrix',
        count: health.unprioritized,
      }
    }
    if (health.investNotOk > 0) {
      return {
        key: 'invest',
        ceremony: 'storyDiscovery',
        artifact: 'stories',
        count: health.investNotOk,
      }
    }
    if (productBacklogStories.length > 0) {
      return {
        key: 'create_sprint',
        ceremony: 'productBacklog',
        count: productBacklogStories.length,
      }
    }
    return { key: 'all_clear', ceremony: 'sprint' }
  }, [project, health, productBacklogStories])

  const goToPhase = (phase) =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: phase,
      }),
    )

  const goToSprintPage = (sprint) =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'sprint',
      }),
      { sprint: sprint.id },
    )

  const goToNextAction = () => {
    if (!nextAction) return
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: nextAction.ceremony,
      }),
      nextAction.artifact ? { artifact: nextAction.artifact } : {},
    )
  }

  const goToBacklog = () =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'productBacklog',
      }),
    )
  const goToSprint = () =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'sprint',
      }),
    )
  const goToPrioritization = () =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'storyDiscovery',
      }),
      { artifact: 'prioritizationMatrix' },
    )
  const goToChangeLog = () =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'storyDiscovery',
      }),
      { artifact: 'changeLog' },
    )
  const goToStories = () =>
    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'storyDiscovery',
      }),
      { artifact: 'stories' },
    )

  const interviewsCount = project?.interviews?.length || 0

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr),minmax(20rem,1fr)] gap-3 p-3 w-full">
      <Head title={project?.title || 'Project Title'} />

      <div className="flex flex-col gap-3 min-w-0">
        {/* Project header */}
        <section className="bg-card rounded-lg flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1 className="text-lg font-semibold text-foreground break-words">
                {project.title} {project.emoji}
              </h1>
              <Badge
                variant={project.active ? 'secondary' : 'destructive'}
              >
                {project.active
                  ? t('dashboard.active')
                  : t('dashboard.inactive')}
              </Badge>
              {currentUserRole && (
                <Badge
                  variant={roleBadgeVariant[currentUserRole] || 'outline'}
                  title={t('project_permissions.role')}
                >
                  {t(`project_permissions.roles.${currentUserRole}`)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ProjectPermissions project={project} />
              <ProjectSettings project={project} />
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>
          )}

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={14} />
            {project.updated_at
              ? new Date(project.updated_at).toLocaleString(currentIntlLocale())
              : t('dashboard.updated_never')}
          </span>
        </section>

        {/* HERO: where am I in the cycle */}
        {health.activeSprint ? (
          <button
            type="button"
            onClick={goToSprint}
            className="bg-card rounded-lg border-l-4 border-primary p-5 flex flex-col gap-3 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Rocket className="size-6 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    {t('dashboard.hero_active_sprint_eyebrow')}
                  </p>
                  <h2 className="text-xl font-bold text-foreground">
                    {health.activeSprint.name}
                  </h2>
                </div>
              </div>
              {sprintProgress?.day && sprintProgress?.total && (
                <Badge variant="outline" className="text-xs">
                  {t('dashboard.sprint_day_of', {
                    day: sprintProgress.day,
                    total: sprintProgress.total,
                  })}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Progress
                value={
                  health.activeSprintTotal > 0
                    ? (health.activeSprintDone / health.activeSprintTotal) *
                      100
                    : 0
                }
                className="flex-1 h-2"
              />
              <span className="text-sm font-medium text-foreground tabular-nums">
                {health.activeSprintDone}/{health.activeSprintTotal}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              {t('dashboard.hero_go_to_kanban')}
              <ArrowRight className="size-4" />
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextAction}
            className="bg-card rounded-lg border-l-4 border-amber-500 p-5 flex flex-col gap-3 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-6 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  {t('dashboard.hero_next_action_eyebrow')}
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  {t(`dashboard.next_action.${nextAction?.key}.title`)}
                </h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t(`dashboard.next_action.${nextAction?.key}.hint`, {
                count: nextAction?.count ?? 0,
              })}
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
              {t(`dashboard.next_action.${nextAction?.key}.cta`)}
              <ArrowRight className="size-4" />
            </div>
          </button>
        )}

        {/* Mini Domain Expert Kanban */}
        <section className="bg-card rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">
              {t('dashboard.domain_expert_kanban')}
            </h2>
            <SpanButton variant="link" onClick={goToBacklog}>
              {t('dashboard.open_backlog')}
              <ArrowRight className="size-3 ml-1" />
            </SpanButton>
          </div>
          <div className="flex gap-2 flex-wrap">
            <KanbanColumn
              titleKey="dashboard.kanban_product_backlog"
              stories={productBacklogStories}
              color="bg-amber-500"
              onClick={goToBacklog}
            />
            <KanbanColumn
              titleKey="dashboard.kanban_sprint_backlog"
              stories={sprintBacklogStories}
              color="bg-blue-500"
              onClick={goToSprint}
            />
            <KanbanColumn
              titleKey="dashboard.kanban_delivered"
              stories={deliveredStories}
              color="bg-emerald-500"
              onClick={goToSprint}
            />
          </div>
        </section>

        {/* Health panel */}
        <section className="bg-card rounded-lg p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            {t('dashboard.requirements_health')}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <HealthCard
              icon={FileWarning}
              labelKey="dashboard.health_unprioritized"
              count={health.unprioritized}
              tone="warning"
              onClick={goToPrioritization}
            />
            <HealthCard
              icon={ClipboardCheck}
              labelKey="dashboard.health_invest_pending"
              count={health.investNotOk}
              tone="warning"
              onClick={goToStories}
            />
            <HealthCard
              icon={GitPullRequest}
              labelKey="dashboard.health_open_changes"
              count={health.openChanges}
              tone="danger"
              onClick={goToChangeLog}
            />
          </div>
        </section>

        {/* Sprint timeline */}
        <section className="bg-card rounded-lg p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            {t('dashboard.sprint_timeline')}
          </h2>
          <SprintTimeline
            sprints={project?.sprints || []}
            onSelect={goToSprintPage}
          />
        </section>

        {/* Collapsible interviews */}
        <section className="bg-card rounded-lg">
          <button
            type="button"
            onClick={() => setInterviewsOpen((v) => !v)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/40 rounded-lg transition-colors"
          >
            <span className="text-sm font-semibold text-foreground">
              {t('interview.title')}{' '}
              <span className="text-muted-foreground">
                ({interviewsCount})
              </span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                interviewsOpen && 'rotate-180',
              )}
            />
          </button>
          {interviewsOpen && (
            <Interview
              className="border-0 !shadow-none !bg-transparent"
              projectId={project.id}
              interviews={project.interviews || []}
            />
          )}
        </section>
      </div>

      {/* ceremonies sidebar */}
      <section className="ceremonies flex flex-col items-stretch bg-card gap-2 p-2 rounded-lg lg:sticky lg:top-2 lg:self-start lg:max-h-[calc(100vh-1rem)] lg:overflow-y-auto">
        <ReactMCycle
          project={project}
          currentPhase={currentPhase}
          onPhaseClick={goToPhase}
        />
        {ceremonies.map((ceremony, index) => (
          <React.Fragment key={ceremony.title}>
            {ceremony.title === 'inception' && (
              <p className="text-xs font-semibold uppercase text-muted-foreground px-2 pt-1">
                {t('dashboard.ceremonies_section')}
              </p>
            )}
            <CeremonyCard
              project={project}
              item={tooltipInfo[ceremony.title]}
              amount={ceremony?.amount || 0}
              artifacts={ceremony.artifacts}
              delay={index * 1}
              onClick={() =>
                router.get(
                  route('project.ceremony.show', {
                    project: project.id,
                    ceremony: ceremony.title,
                  }),
                  { artifact: ceremony.defaultArtifact || null },
                )
              }
            />
          </React.Fragment>
        ))}
      </section>
    </main>
  )
}

Dashboard.layout = (page) => {
  return <MainLayout>{page}</MainLayout>
}

export default Dashboard
