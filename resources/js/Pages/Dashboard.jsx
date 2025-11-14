import { Head, router } from '@inertiajs/react'
import ProgressIcon from '@/Components/ProgressIcon'
import { ExpandableCard } from './projects/project-ceremonies/Inception/MainView'
import Interview from '@/Components/Interview'
import { tooltipInfo } from '@/lib/projectData'
import { ProjectPermissions } from '@/Components/ProjectPermissions'
import { ProjectSettings } from '@/Components/ProjectSettings'
import {
  Users,
  Target,
  GitBranch,
  List,
  Clock,
  ArrowRight,
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
const ceremonies = [
  'inception',
  'storyDiscovery',
  'refining',
  'modeling',
  'productBacklog',
  'sprint',
]

export const CeremonyCard = ({ item, className, onClick, delay = 0 }) => {
  const Icon = item?.icon

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative w-full p-6 overflow-hidden bg-background cursor-pointer',
        'transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="size-8 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
          </div>
        )}
        <div className="flex-grow">
          <div className="flex justify-between">
            <h3 className="text-md font-semibold text-foreground">
              {item.title}
            </h3>
            {/* SETA "VER MAIS" */}
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground
                         opacity-0 transition-all duration-300 ease-in-out
                         group-hover:opacity-100 "
            >
              <span>ver mais</span>
              <ArrowRight className="size-3" />
            </div>
          </div>
          {/* DESCRIÇÃO CONDICIONAL */}
          {/* Começa com altura máxima 0 e opacidade 0. */}
          {/* No hover do `group` (o card), a altura e opacidade aumentam. */}
          <div className="overflow-hidden transition-all duration-300 ease-in-out max-h-0 group-hover:max-h-80">
            <p className="pt-1 text-sm text-muted-foreground opacity-0 transition-opacity duration-300 delay-100 group-hover:opacity-100">
              {item.description}
            </p>
          </div>
        </div>
      </div>
      <BorderBeam
        borderWidth={2}
        size={70}
        delay={delay}
        colorTo={'var(--primary)'}
        colorFrom={'var(--secondary)'}
      />
    </Card>
  )
}

const Dashboard = ({ project, setProject }) => {
  const [date, setDate] = useState(getDateObject(project.due_date))
  const isInitialMount = useRef(true)
  const [progress, setProgress] = useState(0)

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
    <main className="grid md:grid-cols-[auto,auto] lg:grid-cols-[16rem,auto,auto] xl:grid-cols-[22rem,16rem,auto,auto] gap-4 p-4 w-full ">
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

      <div className="grid grid-cols-1  xl:row-start-1 xl:col-start-3 gap-2 items-center justify-center bg-card p-4 rounded-lg">
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
        {/* <ProgressIcon
          value={project?.goal_sketches?.length || 0}
          max={15}
          colorClass="text-info"
          label="Goals"
          icon={Target}
        />
        <ProgressIcon
          value={project?.journeys?.length || 0}
          max={10}
          colorClass="text-accent"
          label="Journeys"
          icon={GitBranch}
        />*/}
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
        className="xl:row-start-3 xl:col-span-3 min-w-full "
        // onContentUpdate={(content) => updateProject('description', content)}
      />
      <Interview
        className="xl:row-start-2 xl:col-span-3"
        projectId={project.id}
        interviews={project.interviews || []} // Passe a lista de entrevistas do seu projeto
      />
      {/* ceremonies*/}
      <section className="ceremonies xl:col-start-4 xl:row-span-3 flex flex-col justify-between min-w-72 items-center bg-card gap-2 p-2">
        <span>Cerimônias</span>
        {ceremonies.map((ceremony, index) => (
          <CeremonyCard
            key={ceremony}
            item={tooltipInfo[ceremony]}
            delay={index * 1}
            onClick={() =>
              router.get(
                route('project.ceremony.show', {
                  project: project.id,
                  ceremony: ceremony,
                }),
              )
            }
          />
        ))}
      </section>
    </main>
  )
}

Dashboard.layout = (page) => {
  return <MainLayout>{page}</MainLayout>
}

export default Dashboard
