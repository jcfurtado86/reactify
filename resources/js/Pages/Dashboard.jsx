import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import ProgressIcon from '@/Components/ProgressIcon'
import { ExpandableCard } from './projects/project-ceremonies/Inception/MainView'
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
import { cn } from '@/lib/utils'

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
  onClick, // IMPORTANTE: Esta prop agora é usada no botão "Ver mais"
  delay = 0,
  project,
}) => {
  const Icon = item?.icon
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
            {Icon && (
              <div className="flex-shrink-0">
                <Icon
                  className={cn(
                    'size-8 text-muted-foreground transition-colors duration-300',

                    'data-[state=open]:text-primary',
                  )}
                />
              </div>
            )}
            <div className="flex-grow">
              <div className="flex gap-2 ">
                <h3 className="text-md font-semibold text-foreground text-left">
                  {item.title}
                </h3>{' '}
                {/* {amount > 0 && <Badge variant="secondary">{amount}</Badge>}*/}
                <SpanButton title={`Ir até ${item.title}`} onClick={onClick}>
                  <ArrowRight className="size-3 ml-1" />
                </SpanButton>
              </div>
            </div>
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

          <div className="flex items-start gap-1 text-sm">
            {artifacts.map((artifact, index) => {
              const artifactKey = getArtifactKey(artifact.title)

              let artifactAmount
              if (artifact.title === 'productCanvas') artifactAmount = 1
              else if (artifact.title === 'epicStories')
                artifactAmount = project?.stories.filter(
                  (story) => story.epic_id,
                ).length
              else artifactAmount = project?.[artifactKey]?.length || 0

              return (
                <Button
                  variant="link"
                  title={`Ir até ${artifact.label}`}
                  key={index}
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
                >
                  {artifact.label}
                  {artifactAmount > 0 ? (
                    <>
                      {/* <Badge variant="secondary">{artifactAmount}</Badge>*/}
                      <CircleCheckBig className="size-4 text-green-400" />
                    </>
                  ) : (
                    <CircleAlert className="size-4 text-destructive" />
                  )}
                </Button>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const Dashboard = ({ project, setProject }) => {
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
      artifacts: [
        { label: 'Product Canvas', title: 'productCanvas' },
        { label: 'Personas', title: 'personas' },
        { label: 'Goals', title: 'goals' },
        { label: 'Journeys', title: 'journeys' },
      ],
    },
    {
      title: 'storyDiscovery',
      artifacts: [
        { label: 'Stories', title: 'stories' },
        { label: 'Overall Model', title: 'overallModel' },
        { label: 'Matriz de Priorização', title: 'prioritizationMatrix' },
        { label: 'Change Log', title: 'changeLog' },
      ],
    },
    {
      title: 'refining',
      artifacts: [
        { label: 'Epic Stories', title: 'epicStories' },
        { label: 'Business Rules', title: 'businessRules' },
        { label: 'Usage Scenarios', title: 'usageScenarios' },
      ],
    },
    {
      title: 'modeling',
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
    // console.clear();
    if (!date || !project.created_at) {
      // console.log(
      //   'PARADA: A data do deadline ou a data de criação do projeto não existem.',
      // )
      setProgress(0)
      return
    }

    const startDate = new Date(project.created_at)
    const endDate = new Date(date)
    const now = new Date()

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error(
        'ERRO CRÍTICO: A `startDate` ou `endDate` é inválida. Não é possível calcular.',
      )
      setProgress(0)
      return
    }
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)

    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsedDuration = now.getTime() - startDate.getTime()
    if (totalDuration <= 0) {
      const finalProgress = now.getTime() >= endDate.getTime() ? 100 : 0
      setProgress(finalProgress)
      return
    }

    const progressPercentage =
      (Math.max(0, elapsedDuration) / totalDuration) * 100
    setProgress(progressPercentage)
  }, [date, project.created_at])

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
              {project.active ? 'Active' : 'Inactive'}
            </Badge>
          </span>
          Progresso da Conclusão
          {date ? (
            <div className="flex items-center">
              <Progress value={progress} className="w-32 h-2 mr-2" />
              <span className="text-sm font-medium">{`${Math.round(progress)}%`}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Defina um prazo de conclusão para visualizar o progresso.
            </div>
          )}
          <div className="flex items-center">
            <Clock size={16} className="mr-3.5" />
            {project.updated_at ? (
              <span>
                Atualizado:{' '}
                {format(new Date(project.updated_at), 'dd/MM/yyyy HH:mm', {
                  locale: ptBR,
                })}
              </span>
            ) : (
              <span>Atualizado: -</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProgressIcon
            value={project?.stories?.length || 0}
            max={20}
            colorClass="text-primary"
            label="Stories"
            icon={List}
          />
          <ProgressIcon
            value={project?.sprints?.length || 0}
            max={10}
            colorClass="text-destructive"
            label="Sprints"
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
        title={project?.title || 'Project'}
        content={project?.description}
        col={1}
        variant="secondary"
        icon={List}
        editable={false}
        defaultExpanded={true}
        placeholder="Describe your project..."
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
            {ceremony.title === 'inception' && <p>Cerimônias</p>}
            {ceremony.title === 'productBacklog' && <p>Backlog</p>}
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
