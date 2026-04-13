import { router, useForm, usePage } from '@inertiajs/react'
import { cn, formatDate, isSprintActive, parseDateAsLocal } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  Trash2Icon as TrashIcon,
  ClipboardList,
  ExternalLink,
} from 'lucide-react'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import TableComponent from '@/Components/TableComponent'
import { toast } from 'sonner'
import {
  getSharedColumns,
  selectItems,
} from './components/sprintTableColumns'
import SprintTable from './components/SprintTable'

const ProductBacklog = ({ project, setProject }) => {
  const [localProject, setLocalProject] = useState(project)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default para 14 dias no futuro
  )
  const { data, setData, processing } = useForm({
    destination: 'Backlog',
  })
  const { errors } = usePage().props
  const [openDeleteForm, setOpenDeleteForm] = useState(false)
  const [open, setOpen] = useState(false)
  const [openEndForm, setOpenEndForm] = useState(null)
  const [sprintOperation, setSprintOperation] = useState(null)
  const [dialogContent, setDialogContent] = useState({ title: '', content: '' })
  const [selectedSprint, setSelectedSprint] = useState(null)
  const [selectedStories, setSelectedStories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  //
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])

  const removeFromSprint = (sprintId, storyIdsToMove = []) => {
    if (storyIdsToMove.length === 0) return
    if (!sprintId) {
      console.error('Sprint ID is required')
      return
    }
    router.delete(
      route('sprint-stories.destroy', {
        sprint: sprintId,
      }),

      {
        data: {
          story_ids: storyIdsToMove,
        },
        preserveScroll: true,
        onSuccess: (page) => {
          if (page.props.project) {
            setProject(page.props.project)
            setLocalProject(page.props.project)
          }
        },
        onError: () => {
          toast.error('Erro ao mover story para o Backlog')
        },
      },
    )
  }

  const moveToSprint = async (sprintId, storyIdsToMove = []) => {
    if (storyIdsToMove.length === 0) return
    if (!sprintId) {
      console.error('Sprint ID is required')
      return
    }

    setIsLoading(true)

    setLocalProject((prevProject) => {
      const updatedProject = { ...prevProject }
      const targetSprint = updatedProject.sprints.find((s) => s.id === sprintId)

      if (targetSprint) {
        // Adicionar stories selecionadas ao sprint
        const storiesToMove = updatedProject.stories.filter((s) =>
          storyIdsToMove.includes(s.id),
        )
        targetSprint.stories = [
          ...(targetSprint.stories || []),
          ...storiesToMove,
        ]
      }

      return updatedProject
    })
    router.post(
      route('sprint-stories.store', sprintId),
      {
        story_ids: storyIdsToMove,
      },
      {
        onSuccess: (page) => {
          setIsLoading(false)

          if (page.props.project) {
            setProject(page.props.project)
            setLocalProject(page.props.project)
          }
        },
        onError: (errors) => {
          setIsLoading(false)
          setError('Failed to move stories to sprint')
          console.error('Error:', errors)

          setLocalProject(project)
        },
      },
    )
  }

  useEffect(() => {
    setLocalProject(project)
  }, [project])

  useEffect(() => {
    selectItems(board.productBacklog, rowSelection, setSelectedStories)
  }, [rowSelection])

  useEffect(() => {
    setTimeout(() => {
      if (!open) setSprintOperation(null)
    }, 500)
  }, [open])

  useEffect(() => {
    if (sprintOperation === 'start' || sprintOperation === 'create')
      setStartDate(new Date())
    else setStartDate(parseDateAsLocal(selectedSprint?.start_date))

    setEndDate(
      parseDateAsLocal(selectedSprint?.end_date) ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    )
  }, [selectedSprint, sprintOperation])

  const { productBacklogStories, sprintBacklogStories, deliveredStories } =
    useMemo(() => {
      const stories = localProject?.stories || []
      const sprints = localProject?.sprints || []

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
    }, [localProject])

  const board = {
    productBacklog: productBacklogStories,
    sprintBacklog: sprintBacklogStories,
    delivered: deliveredStories,
  }

  const storyVariants = project?.system_colors?.stories || {}

  const handleMoveRequest = (sprintId, clickedStoryId) => {
    let idsToMove = []
    if (selectedStories.length > 0) {
      idsToMove = selectedStories
    } else {
      idsToMove = [clickedStoryId]
    }

    moveToSprint(sprintId, idsToMove).then(() => {
      setRowSelection({})
    })
  }

  const backlogColumns = useMemo(
    () =>
      getSharedColumns({
        storyVariants,
        project,
        onMoveRequest: handleMoveRequest,
        selectedStories,
      }),
    [storyVariants, project, handleMoveRequest, selectedStories],
  )

  const productBacklogTable = useReactTable({
    data: board.productBacklog,
    columns: backlogColumns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters,
      sorting,
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const sprintData = {
      name: formData.get('name'),
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      project_id: project.id,
      status: selectedSprint?.status || 'active',
    }

    if (selectedSprint) {
      router.patch(
        route('sprint.update', selectedSprint.id),
        {
          name: sprintData.name,
          start_date: sprintData.start_date.split('T')[0],
          end_date: sprintData.end_date.split('T')[0],
        },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setSelectedSprint(null)
            setOpen(false)
          },
        },
      )
    } else {
      router.post(
        route('sprint.store'),
        {
          name: sprintData.name,
          start_date: sprintData.start_date.split('T')[0],
          end_date: sprintData.end_date.split('T')[0],
          status: 'active',
          project_id: project.id,
        },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false)
            setSelectedSprint(null)
            setStartDate(new Date())
            setEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
          },
        },
      )
    }
  }

  const createSprint = (e) => {
    e.preventDefault()
    setOpen(!open)
    setSelectedSprint(null)
    setSprintOperation('create')
    setStartDate(new Date())
  }

  const deleteSprint = (e) => {
    e.preventDefault()
    if (!selectedSprint) {
      toast.error('Please select a sprint to delete')
      return
    }
    router.delete(route('sprint.destroy', selectedSprint.id))
    setSelectedSprint(null)
    setOpenDeleteForm(false)
  }
  const finishSprint = (e) => {
    e.preventDefault()
    if (!selectedSprint) {
      toast.error('Please select s sprint')
      return
    }

    let destination
    if (data.destination === 'Backlog') destination = null
    else destination = data.destination
    router.patch(
      route('sprint.finish', selectedSprint.id),
      {
        new_sprint_id: destination,
      },
      {
        onSuccess: () => {
          setSelectedSprint(null)
          setOpenEndForm(false)
        },
      },
    )
  }

  const openEditSprintForm = (sprint, startSprint = false) => {
    if (startSprint) {
      setStartDate(new Date())
      setSprintOperation('start')
    } else setSprintOperation('edit')

    setOpen(!open)
    setSelectedSprint(sprint)
  }
  const openDeleteSprintForm = (sprint) => {
    setOpenDeleteForm(!openDeleteForm)
    setSelectedSprint(sprint)
  }
  const openEndSprintForm = (sprint) => {
    setOpenEndForm(!openEndForm)
    setSelectedSprint(sprint)
  }

  const getAlertContents = () => {
    switch (sprintOperation) {
      case 'start':
        return {
          title: 'Iniciar Sprint',
          description: 'Define a data de inicio da sprint para hoje.',
        }

      case 'edit':
        return {
          title: 'Editar Sprint',
          description: 'Edite os detalhes da sprint.',
        }
      case 'create':
        return { title: 'Criar Sprint', description: 'Crie uma nova sprint.' }
      default:
        return { title: 'Operacao' }
    }
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 min-h-[500px]">
      {/* finalizar sprint*/}
      <AlertDialog open={openEndForm} onOpenChange={setOpenEndForm}>
        <AlertDialogContent>
          <form onSubmit={finishSprint}>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Sprint</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja finalizar essa sprint? <br />
                As estórias nao finalizadas presentes nela podem ir para a
                próxima sprint ou ao Backlog.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <section className="my-4">
              <Select
                defaultOpen
                value={data.destination} // O valor é controlado pelo 'data'
                onValueChange={(value) => setData('destination', value)} // Atualiza o 'data'
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Sprints</SelectLabel>
                    <SelectItem key="Backlog" value={'Backlog'}>
                      Backlog
                    </SelectItem>
                    {project?.sprints
                      ?.filter(
                        (sprint) =>
                          sprint.status === 'active' &&
                          sprint.id !== selectedSprint?.id,
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.created_at) - new Date(b.created_at),
                      )
                      .map(
                        (sprint, index) =>
                          index === 0 && (
                            <SelectItem
                              key={sprint.id}
                              value={String(sprint.id)}
                            >
                              {sprint.name}
                            </SelectItem>
                          ),
                      )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </section>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction type="submit">Finalizar</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      {/* deletar sprint*/}
      <AlertDialog open={openDeleteForm} onOpenChange={setOpenDeleteForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar essa sprint? As estórias contidas
              nela voltarão ao Backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSprint}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* editar sprint / iniciar / criar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>{getAlertContents().title}</DialogTitle>
            <DialogDescription>
              {getAlertContents().description} <br />
              Os campos obrigatórios estão marcados com um asterisco{' '}
              <span className="text-destructive">*</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 pb-2">
              <div className="grid gap-3">
                <Label htmlFor="name-1">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name-1"
                  name="name"
                  maxLength={30}
                  defaultValue={
                    selectedSprint?.name || 'Sprint 1 - Configuração Inicial'
                  }
                />
                <span className="text-destructive text-sm">{errors?.name}</span>
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-medium">
                  Data de início <span className="text-destructive">*</span>
                </label>
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
                        formatDate(startDate)
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
                </Popover>{' '}
                <span className="text-destructive text-sm">
                  {errors?.start_date}
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Data de término <span className="text-destructive">*</span>
                </label>
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
                        formatDate(endDate)
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
                <span className="text-destructive text-sm">
                  {errors?.end_date}
                </span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* product backlog*/}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue={
          productBacklogTable.getRowCount() > 0 ? 'Product Backlog' : ''
        }
      >
        <AccordionItem
          value={'Product Backlog'}
          className=" px-4 border border-accent"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex gap-4">
              <span className="hover:underline my-auto">
                Product Backlog ({productBacklogTable.getRowCount()} items)
              </span>

              <SpanButton variant="secondary" onClick={(e) => createSprint(e)}>
                Criar sprint
              </SpanButton>
              <SpanButton
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  router.get(
                    route('project.ceremony.show', {
                      project: project.id,
                      ceremony: 'storyDiscovery',
                    }),
                    { artifact: 'prioritizationMatrix' },
                  )
                }}
              >
                Ir para matriz
              </SpanButton>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {productBacklogTable.getRowCount() > 0 ? (
              <div className="overflow-hidden rounded-md border ">
                <TableComponent table={productBacklogTable} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[150px]">
                <ClipboardList
                  size={40}
                  className="mb-4 text-primary flex-shrink-0"
                  strokeWidth={1.5}
                />
                <p className="mb-2 font-medium text-foreground">
                  Product Backlog Vazio
                </p>
                <p className="text-sm text-center max-w-xs">
                  Nenhuma story foi priorizada. Vá para a Matriz de Priorização
                  para classificar suas stories.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    router.get(
                      route('project.ceremony.show', {
                        project: project.id,
                        ceremony: 'storyDiscovery',
                      }),
                      { artifact: 'prioritizationMatrix' },
                    )
                  }
                >
                  Ir para Matriz de Priorização
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {project.sprints
        ?.filter((sprint) => sprint.status === 'active')
        .sort((a, b) => a.id - b.id)
        .map((sprint) => (
          <SprintTable
            key={sprint.id}
            sprint={sprint}
            storyVariants={storyVariants}
            moveToSprint={moveToSprint}
            removeFromSprint={removeFromSprint}
            project={project}
            openEditSprintForm={openEditSprintForm}
            openDeleteSprintForm={openDeleteSprintForm}
            openEndSprintForm={openEndSprintForm}
          />
        ))}
      <Separator className="mt-12 mb-4" />

      {project.sprints
        ?.filter((sprint) => sprint.status === 'completed')
        .sort((a, b) => a.id - b.id)
        .map((sprint) => (
          <SprintTable
            key={sprint.id}
            sprint={sprint}
            storyVariants={storyVariants}
            moveToSprint={moveToSprint}
            removeFromSprint={removeFromSprint}
            project={project}
            openEditSprintForm={openEditSprintForm}
            openDeleteSprintForm={openDeleteSprintForm}
            openEndSprintForm={openEndSprintForm}
          />
        ))}
    </div>
  )
}

export default ProductBacklog
