import { router } from '@inertiajs/react'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import SprintList from './SprintList'
import KanbanBoard from './KanbanBoard'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import NewSprintForm from './NewSprintForm'

const getActiveSprint = (sprints) => {
  const now = new Date()
  return sprints.find((sprint) => {
    const startDate = new Date(sprint.start_date)
    const endDate = new Date(sprint.end_date)
    return startDate <= now && now <= endDate
  })
}

const Sprint = ({ project, setProject }) => {
  const [activeSprint, setActiveSprint] = useState(
    getActiveSprint(project?.sprints || []),
  )
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [view, setView] = useState('list')
  const sprints = project?.sprints || []

  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default para 14 dias no futuro
  )

  const handleCreateSprint = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const sprintData = {
      name: formData.get('name'),
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      project_id: project.id,
      status: 'planning',
    }

    router.post(route('sprint.store'), sprintData, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        setShowCreateForm(false)
        if (page.props.project) {
          setProject(page.props.project)
        }
        setStartDate(new Date())
        setEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
      },
      onError: (errors) => {
        console.error('Erro ao criar sprint:', errors)
        const mensagens = Object.values(errors || {})
        if (mensagens.length > 0) {
          toast.warning(mensagens.join('\n'))
        } else {
          toast.error('Erro ao criar a sprint. Tente novamente.')
        }
      },
    })
  }

  const updateProjectData = (updatedProject) => {
    setProject(updatedProject)
  }

  return (
    <div className="w-full space-y-6 p-4">
      {/* Header */}
      {/* <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Sprint Management</CardTitle>
            <div className="flex gap-2 items-center">
              <Tabs value={view} onValueChange={setView}>
                <TabsList>
                  <TabsTrigger value="list">Sprint List</TabsTrigger>
                  <TabsTrigger
                    value="kanban"
                    disabled={!activeSprint || activeSprint.status !== 'active'}
                  >
                    Kanban Board
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="w-4 h-4 mr-2" />
                New Sprint
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>*/}

      {/* Form de Criação de Sprint */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            {/* O formulário não precisa mais dos inputs de data */}
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sprint Name</label>
                <Input
                  type="text"
                  name="name"
                  defaultValue={`Sprint ${sprints.length + 1}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4 " />
                        {startDate ? (
                          format(startDate, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={{ before: new Date() }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={{ before: new Date() }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Sprint</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {/* <NewSprintForm project={project} setProject={setProject} />*/}
      {/* Content */}

      <KanbanBoard
        sprint={activeSprint}
        systemColors={project?.system_colors}
        setView={setView}
        updateProject={updateProjectData}
      />
    </div>
  )
}

export default Sprint
