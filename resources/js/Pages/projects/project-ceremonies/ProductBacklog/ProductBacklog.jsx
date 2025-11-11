import React, { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EllipsisVertical, Calendar as CalendarIcon } from 'lucide-react'
import { getStatusColor } from '@/lib/utils'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import TableComponent from '@/Components/TableComponent'
import NewSprintForm from '../Sprint/NewSprintForm'

const getSharedColumns = ({
  storyVariants,
  project,
  onMoveRequest,
  selectedStories,
}) => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => {
      const story = row.original
      const selectedVariant = storyVariants[story.type] || '#f97316'
      return (
        <Badge style={{ backgroundColor: selectedVariant }} variant="badge">
          {`${story.type === 'system' ? 'SS' : 'US'}${story.id}`.toUpperCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'title',
    header: 'Título',
    meta: { className: 'w-[80%]' },
    cell: ({ row }) => (
      <div className="flex items-center w-full !line-clamp-3">
        {row.getValue('title')}
      </div>
    ),
  },
  {
    accessorKey: 'pivot.kanban_status',
    header: 'Status',
    cell: ({ row }) => {
      const story = row.original
      const status = story?.pivot?.kanban_status || 'Backlog'

      return (
        <div className="flex items-center ">
          <Badge
            variant={'badge'}
            style={{ backgroundColor: getStatusColor(status) }}
          >
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const story = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title={'Options'}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem>
              {selectedStories.length > 1
                ? `${selectedStories.length} selected`
                : `1 selected`}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to sprint</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {project.sprints
                    .sort((a, b) => a.created_at - b.created_at)
                    .map((sprint) => (
                      <DropdownMenuItem
                        key={sprint.id}
                        onClick={() => onMoveRequest(sprint.id, story.id)}
                      >
                        {sprint.name}-{sprint.id}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const selectItems = (itemList, rowSelection, setItems) => {
  const currentItems = []
  itemList.forEach((item, index) => {
    if (rowSelection[index]) currentItems.push(item.id)
  })
  setItems(currentItems)
}

const SprintTable = ({
  sprint,
  moveToSprint,
  storyVariants,
  project,
  open,
  setOpen,
  setSelectedSprint,
}) => {
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedStories, setSelectedStories] = useState([])

  useEffect(() => {
    selectItems(sprint.stories, rowSelection, setSelectedStories)
  }, [rowSelection])

  const handleMoveRequest = useCallback(
    (sprintId, clickedStoryId) => {
      let idsToMove = []
      if (selectedStories.length > 0) {
        idsToMove = selectedStories
      } else {
        idsToMove = [clickedStoryId]
      }

      // Chama a função 'moveToSprint' (do pai)
      moveToSprint(sprintId, idsToMove).then(() => {
        setRowSelection({}) // Limpa o estado LOCAL
      })
    },
    [selectedStories, moveToSprint],
  )
  const columns = useMemo(
    () =>
      getSharedColumns({
        storyVariants,
        project,
        onMoveRequest: handleMoveRequest, // Passe o handler LOCAL
        selectedStories,
      }),
    [storyVariants, project, handleMoveRequest, selectedStories],
  )

  const table = useReactTable({
    data: sprint.stories || [],
    columns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters,
      sorting,
    },
  })
  const editSprint = (e, sprint) => {
    e.preventDefault()
    setOpen(!open)
    setSelectedSprint(sprint)
    console.log(sprint)
  }
  return (
    <Accordion
      defaultValue={sprint.stories.length > 0 ? sprint.name : ''}
      type="single"
      collapsible
    >
      <AccordionItem
        key={sprint.id}
        value={sprint.name}
        className=" px-4 border border-accent"
      >
        <AccordionTrigger>
          <div className="flex gap-4">
            <span className="font-bold">{sprint.name}</span>
            <span className="text-muted-foreground">
              {' '}
              {new Date(sprint.start_date).toLocaleDateString('pt-BR')} -{' '}
              {new Date(sprint.end_date).toLocaleDateString('pt-BR')} (
              {table.getRowCount()} items)
            </span>{' '}
            <span
              role="button"
              tabIndex={0}
              className="border border-border px-2 hover:bg-accent"
              onClick={(e) => editSprint(e, sprint)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editSprint(e, sprint)
                }
              }}
            >
              Editar sprint
            </span>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="overflow-hidden rounded-md border ">
            <TableComponent table={table} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const ProductBacklog = ({ project, setProject }) => {
  const [localProject, setLocalProject] = useState(project)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default para 14 dias no futuro
  )
  const [open, setOpen] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState(null)
  const [selectedStories, setSelectedStories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  //
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])

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
    console.log(sprintId)
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
    setStartDate(selectedSprint?.start_date || null)
    setEndDate(selectedSprint?.end_date || null)
  }, [selectedSprint])

  const { productBacklogStories, sprintBacklogStories, deliveredStories } =
    useMemo(() => {
      const stories = localProject?.stories || []
      const sprints = localProject?.sprints || []

      const productBacklog = stories
        .filter((story) => {
          const isInActiveSprint = sprints.some(
            (sprint) =>
              (sprint.status === 'planning' || sprint.status === 'active') &&
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
        if (sprint.status === 'planning' || sprint.status === 'active') {
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

  useEffect(() => {
    selectItems(board.productBacklog, rowSelection, setSelectedStories)
  }, [rowSelection])

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

  const createSprint = (e) => {
    e.preventDefault()
    setOpen(!open)
    setSelectedSprint(null)
    console.log()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const sprintData = {
      name: formData.get('name'),
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      project_id: project.id,
      status: selectedSprint?.status || 'planning',
    }
    console.log(sprintData)
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
        },
      )
      setOpen(false)
      setSelectedSprint(null)
    } else {
      router.post(
        route('sprint.store'),
        {
          name: sprintData.name,
          start_date: sprintData.start_date.split('T')[0],
          end_date: sprintData.end_date.split('T')[0],
          status: 'planning',
          project_id: project.id,
        },
        {
          preserveState: true,
          preserveScroll: true,
        },
      )
      setOpen(false)
      setSelectedSprint(null)
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
      {/* editar sprint */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSprint?.name ? 'Editar sprint' : 'Criar sprint'}
            </DialogTitle>
            <DialogDescription>
              {' '}
              {selectedSprint?.name
                ? 'Altere as informações da sprint.'
                : 'Preencha as informações da nova sprint.'}
              Clique para salvar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 pb-2">
              <div className="grid gap-3">
                <Label htmlFor="name-1">Nome</Label>
                <Input
                  id="name-1"
                  name="name"
                  defaultValue={
                    selectedSprint?.name || 'Sprint 1 - Configuração Inicial'
                  }
                />
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-medium">Data de início</label>
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
                <label className="text-sm font-medium">Data de término</label>
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
                <hr />
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
          <AccordionTrigger>
            <div className="flex gap-4">
              Product Backlog ({productBacklogTable.getRowCount()} items)
              <span
                role="button"
                tabIndex={0}
                className="border border-border px-2 hover:bg-accent"
                onClick={(e) => createSprint(e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createSprint(e)
                  }
                }}
              >
                Criar sprint
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-hidden rounded-md border ">
              <TableComponent table={productBacklogTable} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {project.sprints.map((sprint) => (
        <SprintTable
          key={sprint.id}
          sprint={sprint}
          storyVariants={storyVariants}
          moveToSprint={moveToSprint}
          project={project}
          open={open}
          setOpen={setOpen}
          setSelectedSprint={setSelectedSprint}
        />
      ))}
    </div>
  )
}

export default ProductBacklog
