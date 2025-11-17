import { Head, router } from '@inertiajs/react'
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

  // O Card foi substituído por um AccordionItem.
  // Ele precisa de uma prop "value" única. Usaremos item.title.
  return (
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
        className="p-2 hover:no-underline"
      >
        <div className="flex w-full items-center gap-2">
          {Icon && (
            <div className="flex-shrink-0">
              <Icon
                className={cn(
                  'size-8 text-muted-foreground transition-colors duration-300',
                  // Muda a cor quando o accordion está aberto (substitui o group-hover)
                  'data-[state=open]:text-primary',
                )}
              />
            </div>
          )}
          <div className="flex-grow">
            <div className="flex justify-between">
              {/* text-left alinha o título à esquerda (trigger centraliza por padrão) */}
              <h3 className="text-md font-semibold text-foreground text-left">
                {item.title}{' '}
                {amount > 0 && <Badge variant="secondary">{amount}</Badge>}
              </h3>

              {/* O "ver mais" com seta foi removido daqui.
                O AccordionTrigger já tem sua própria seta (chevron)
                e colocar outra ficaria visualmente confuso.
              */}
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
          <p className="pt-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}

        {/* Lista de Artefatos (lógica idêntica) */}
        {artifacts.length > 0 && (
          <p className="mt-4 mb-2 text-sm font-medium">Artefatos contidos:</p>
        )}
        <div className="flex flex-col gap-2 text-sm">
          {artifacts.map((artifact, index) => {
            const artifactAmount = project?.[artifact?.title]?.length || 0

            return (
              <div key={index} className="flex items-center gap-2">
                {artifact.label}{' '}
                {artifactAmount > 0 ? (
                  <>
                    {' '}
                    <Badge variant="secondary">{artifactAmount}</Badge>{' '}
                    <CircleCheckBig className="size-4 text-green-400" />
                  </>
                ) : (
                  <CircleAlert className="size-4 text-destructive" />
                )}
              </div>
            )
          })}
        </div>

        {/* BOTÃO "VER MAIS"
          A prop "onClick" original do Card foi movida para este botão.
          Isso segue o padrão de design do Accordion, onde o 'trigger'
          apenas expande, e as ações ficam dentro do conteúdo.
        */}
        {onClick && (
          <Button
            variant="link"
            size="sm"
            onClick={onClick}
            className="p-0 mt-4 text-primary" // Dando a cor primária
          >
            Ver mais
            <ArrowRight className="size-3 ml-1" />
          </Button>
        )}
      </AccordionContent>

      {/* BorderBeam (mantido no root do AccordionItem) */}
      {/* <BorderBeam
        borderWidth={2}
        size={70}
        delay={delay}
        colorTo={'var(--primary)'}
        colorFrom={'var(--secondary)'}
      />*/}
    </AccordionItem>
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
        { label: 'Goals', title: 'goal_sketches' },
        { label: 'Journeys', title: 'journeys' },
      ],
    },
    {
      title: 'storyDiscovery',
      artifacts: [
        { label: 'Stories', title: 'stories' },
        { label: 'Overall Model', title: 'crc_cards' },
        { label: 'Matriz de Priorização', title: 'prioritizations' },
        { label: 'Change Log', title: 'change_requests' },
      ],
    },
    {
      title: 'refining',
      artifacts: [
        { label: 'Epic Stories', title: 'Epic Stories' },
        { label: 'Business Rules', title: 'Business Rules' },
        { label: 'Usage Scenarios', title: 'usage_scenarios' },
      ],
    },
    {
      title: 'modeling',
      artifacts: [
        { label: 'Overall Model', title: 'crc_cards' },
        { label: 'Interfaces Internas e Externas', title: 'interfaces' },
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
    <main className="grid md:grid-cols-[1fr,1fr] lg:grid-cols-[1fr,1fr,1fr] xl:grid-cols-[1fr,1fr,1fr,1fr] gap-4 p-4 w-full ">
      <Head title={project.title || 'Project Title'} />
      {/* progresso de conclusao*/}
      <section className="bg-card rounded-lg flex flex-col text-muted-foreground p-2 gap-2 w-full h-full ">
        <div className=" flex flex-col gap-2 w-full">
          <span className=" flex-1 break-words text-lg text-foreground p-0 border-0 m-0 cursor-default z-10">
            {project.title}
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
        {/* opcoes*/}
        <div className="flex  gap-2">
          <ProjectPermissions project={project} />
          <ProjectSettings project={project} />
        </div>
      </section>

      {/* prazo*/}
      {/* <section className="col-span-1 bg-card rounded-lg flex flex-col items-center justify-start gap-2 cursor-pointer select-none">*/}
      {/* <p className="text-muted-foreground text-md m-0">Prazo</p>*/}
      {/* <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !date && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {date ? (
                format(date, 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                <span>Definir prazo</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">*/}

      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={{ before: new Date() }}
        initialFocus
        locale={ptBR}
        className="bg-card mx-auto xl:col-start-2 xl:row-start-1 w-full"
      />
      {/* </PopoverContent>
        </Popover>*/}
      {/* Progress Indicators */}

      <div className="flex lg:flex-col md:row-start-4 lg:row-start-2  lg:col-start-3 xl:row-start-1 xl:col-start-3 gap-2 items-center justify-center bg-card p-4 rounded-lg">
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
      <ExpandableCard
        title={project?.title || 'Project'}
        content={project?.description}
        col={1}
        variant="secondary"
        icon={List}
        editable={false}
        defaultExpanded={true}
        placeholder="Describe your project..."
        className="xl:row-start-3 md:col-span-2 xl:col-span-3 min-w-full "
        // onContentUpdate={(content) => updateProject('description', content)}
      />
      <Interview
        className="xl:row-start-2 md:col-span-2 xl:col-span-3"
        projectId={project.id}
        interviews={project.interviews || []} // Passe a lista de entrevistas do seu projeto
      />
      {/* ceremonies*/}
      <section className="ceremonies xl:col-start-4  lg:col-start-3 lg:row-start-1 xl:row-span-3 flex flex-col  justify-between items-center bg-card gap-2 p-2">
        <Accordion collapsible multiple className="w-full">
          {ceremonies.map((ceremony, index) => (
            <CeremonyCard
              project={project}
              key={ceremony.title}
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
          ))}
        </Accordion>
      </section>
    </main>
  )
}

Dashboard.layout = (page) => {
  return <MainLayout>{page}</MainLayout>
}

export default Dashboard
