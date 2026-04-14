import React from 'react'
import { Head, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import ProgressIcon from '@/Components/ProgressIcon'
import { ExpandableCard } from './projects/project-ceremonies/Inception/ProductCanvas'
import Interview from '@/Components/Interview'
import { tooltipInfo } from '@/lib/projectData'
import { ProjectPermissions } from '@/Components/ProjectPermissions'
import { ProjectSettings } from '@/Components/ProjectSettings'
import {
  Users,
  List,
  Clock,
  ArrowRight,
  CircleCheckBig,
  CircleAlert,
  Calendar as CalendarIcon,
} from 'lucide-react'
import SpanButton from '@/Components/SpanButton'
import MainLayout from '@/Layouts/MainLayout'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, completedStoriesCount } from '@/lib/utils'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'

const getDateObject = (dateInput) => {
  if (!dateInput) {
    return undefined
  }
  const dateOnlyString = dateInput.substring(0, 10)
  const date = new Date(`${dateOnlyString}T00:00:00`)

  if (isNaN(date.getTime())) {
    return undefined
  }
  return date
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
  const [date, setDate] = useState(getDateObject(project.due_date))
  const isInitialMount = useRef(true)
  const [progress, setProgress] = useState(0)

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
  useEffect(() => {
    const completedStories = completedStoriesCount(project.stories || [])
    const totalStories = project.stories?.length || 0
    if (totalStories < 1) {
      setProgress(0)
      return
    }
    const progressPercentage =
      (Math.max(0, completedStories) / totalStories) * 100
    setProgress(progressPercentage)
  }, [project.stories])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    router.patch(
      route('project.update', project.id),
      {
        due_date: date ? date.toISOString().split('T')[0] : null, // Envia a data no formato YYYY-MM-DD
      },
      {
        preserveScroll: true,
        onError: (errors) => {
          console.error('Failed to update deadline:', errors)
        },
      },
    )
  }, [date])

  return (
    <main className="grid md:grid-cols-[1fr,16rem] lg:grid-cols-[35%,16rem,1fr] grid-rows-[22rem,auto,auto] gap-2 p-2 w-full ">
      <Head title={project?.title || 'Project Title'} />
      {/* progresso de conclusao*/}
      <section className="bg-card rounded-lg flex flex-col justify-between text-muted-foreground p-2 gap-2 w-full h-full ">
        <div className=" flex flex-col gap-2 w-full">
          <span className=" flex-1 break-words text-lg text-foreground p-0 border-0 m-0 cursor-default z-10">
            {project.title} {project.emoji}
            <Badge
              className="ml-2"
              variant={`${project.active ? 'secondary' : 'destructive'}`}
            >
              {project.active ? t('dashboard.active') : t('dashboard.inactive')}
            </Badge>
          </span>
          {t('dashboard.progress_title')}
          <div className="flex items-center">
            <Progress value={progress} className="w-32 h-2 mr-2" />
            <span className="text-sm font-medium">
              {t('dashboard.stories_completed_pct', {
                pct: Math.round(progress),
              })}
            </span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-3.5" />
            {project.updated_at ? (
              <span>
                {t('dashboard.updated_at', {
                  date: format(
                    new Date(project.updated_at),
                    'dd/MM/yyyy HH:mm',
                    { locale: ptBR },
                  ),
                })}
              </span>
            ) : (
              <span>{t('dashboard.updated_never')}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProgressIcon
            value={project?.stories?.length || 0}
            max={20}
            colorClass="text-primary"
            label={t('dashboard.stories_label')}
            icon={List}
          />
          <ProgressIcon
            value={project?.sprints?.length || 0}
            max={10}
            colorClass="text-destructive"
            label={t('dashboard.sprints_label')}
            icon={Users}
          />
        </div>
        {/* opcoes*/}
        <div className="flex items-center justify-center gap-2">
          <ProjectPermissions project={project} />
          <ProjectSettings project={project} />
        </div>
      </section>

      <div className="flex bg-card mx-auto py-2 w-full rounded">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={{ before: new Date() }}
          initialFocus
          locale={ptBR}
          className="bg-card p-4 mx-auto"
        />
      </div>
      <ExpandableCard
        title={project?.title || t('nav.projects')}
        content={project?.description}
        col={1}
        variant="chart_1"
        icon={List}
        editable={false}
        defaultExpanded={true}
        placeholder={t('dashboard.describe_project_placeholder')}
        className="md:row-start-2 md:col-span-2 min-w-full "
      />
      <Interview
        className="md:col-span-2"
        projectId={project.id}
        interviews={project.interviews || []} // Passe a lista de entrevistas do seu projeto
      />
      {/* ceremonies*/}
      <section className="ceremonies lg:col-span-2 lg:col-start-3 lg:row-start-1 row-span-3 row-start-4 md:col-span-2 flex flex-col  items-center bg-card gap-2 p-2">
        {ceremonies.map((ceremony, index) => (
          <React.Fragment key={ceremony.title}>
            {ceremony.title === 'inception' && (
              <p>{t('dashboard.ceremonies_section')}</p>
            )}
            {ceremony.title === 'productBacklog' && (
              <p>{t('dashboard.backlog_section')}</p>
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
